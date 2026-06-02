# Solvo Production Handbook

This document serves as the technical operations manual for the Solvo backend. It details the architecture, deployment strategies, security models, and extensibility patterns required to maintain and scale this application in a production environment.

---

## 1. System Architecture & Concurrency

The backend is an **async-first Modular Monolith** built on FastAPI.

*   **Concurrency Model:** FastAPI leverages `starlette` and `asyncio` under the hood. All I/O-bound operations (database queries, Kora API calls) use `await` to yield control back to the event loop. This is critical for bulk payroll execution, ensuring that 1,000 HTTP requests to Kora do not block the thread pool.
*   **Web Server:** In production, do not run `uvicorn` directly as the primary process manager. Use `gunicorn` with `uvicorn.workers.UvicornWorker` classes to manage multiple worker processes. 
    *   *Example:* `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`
*   **Dependency Injection:** FastAPI's `Depends()` is heavily utilized for database session management and authentication guards (`require_employer`, `require_employee`). This enforces a strict separation of concerns and guarantees that unauthenticated requests fail before reaching business logic.

---

## 2. Database Operations & Alembic Migrations

The database is PostgreSQL, accessed via SQLAlchemy 2.0 with the `asyncpg` driver.

### Connection Pooling
*   **Pre-ping:** The async engine is configured with `pool_pre_ping=True`. This tests connections before leasing them from the pool, preventing "server closed the connection unexpectedly" errors caused by idle connection timeouts in production (e.g., if using AWS RDS Proxy or PgBouncer).
*   **Session Lifecycle:** Sessions are injected per-request. They auto-commit on success and auto-rollback if an unhandled exception bubbles up.

### Migration Strategy (Alembic)
In development, `app/main.py` uses `Base.metadata.create_all` to automatically create tables. **This must be disabled in production.**
1.  **Generate Migration:** When models change, run `alembic revision --autogenerate -m "description"`.
2.  **Review Migration:** Autogenerate is not infallible. Always review the generated script in `alembic/versions/`. Specifically, check for dropped columns or unintended data type changes.
3.  **Apply Migration:** Run `alembic upgrade head` as part of your CI/CD deployment pipeline (e.g., via GitHub Actions) *before* the new application code spins up.

---

## 3. Security & Authentication

### JWT Strategy
*   **Stateless Auth:** We use stateless JSON Web Tokens (JWT). The token contains the `sub` (User UUID) and `role` (`employer` or `employee`).
*   **Key Rotation:** Ensure the `SECRET_KEY` in production is a high-entropy string (e.g., generated via `openssl rand -hex 32`). If a key is compromised, changing it invalidates all current sessions.
*   **Refresh Tokens:** Access tokens have a short lifespan (e.g., 30 mins). Refresh tokens live longer (e.g., 7 days) and are used at the `/api/v1/auth/refresh` endpoint. In a hardened production environment, consider storing refresh token hashes in the database to allow for explicit session revocation.

### Password Hashing
*   Passwords are hashed using `passlib` with the `bcrypt` algorithm. The work factor (rounds) is dynamically handled by passlib, but monitor bcrypt validation times. If logins become a CPU bottleneck under load, you may need to offload authentication or adjust the work factor.

---

## 4. The Tax Engine (Extensibility)

The tax engine (`app/services/tax_engine.py`) uses a **Factory Pattern** mapped to ISO 3166-1 alpha-2 country codes.

### Adding a New Jurisdiction (e.g., South Africa - ZA)
To add a new country, you must:
1.  Create a class inheriting from `BaseTaxCalculator`.
2.  Define `country_code` and `authority_name` (e.g., `SARS`).
3.  Implement the `calculate(self, monthly_gross: Decimal) -> TaxBreakdown` method. Use the `_d()` helper to ensure all floating-point math is quantized to two decimal places (rounding `ROUND_HALF_UP`) to prevent floating-point drift in financial ledgers.
4.  Register the class in the `_CALCULATORS` dictionary.

*Production Warning:* Tax brackets change annually. In a mature production system, hardcoded brackets in the class should be abstracted into a database table (`tax_brackets`) or a version-controlled JSON configuration so that historical payroll runs can be recalculated using the brackets active at that time.

---

## 5. Third-Party Integration: Kora API

The `KoraService` (`app/services/kora_service.py`) abstracts the external API.

### Mock Mode vs. Production
*   **MOCK_MODE:** Controlled via `KORA_MOCK_MODE` environment variable. Ensure this is explicitly set to `false` in your production environment.
*   **Bulk Execution limits:** Currently, `initiate_bulk_payout` loops over transfers and fires HTTP POSTs concurrently. Kora likely has a rate limit (e.g., X requests per second). 
    *   *Production Fix needed at scale:* Implement `asyncio.gather` with a semaphore to throttle concurrent outbound requests, or implement Kora's true batch endpoint if they provide one.

### Idempotency and Fault Tolerance
*   **Kora Transfer ID:** When Kora processes a payment, we store the `kora_transfer_id`. 
*   **Failure States:** If the HTTP request to Kora times out, the entry status is marked as `failed`. 
*   *Production Fix needed:* Implement a Celery or ARQ background task queue. Payroll execution should not happen inside the synchronous HTTP request cycle. It should trigger a background job, which polls Kora for status updates and utilizes webhook callbacks to update the `PayrollEntry` to `settled`.

---

## 6. Observability & Troubleshooting

### Logging
*   The application currently logs to `stdout`. In production, ensure these logs are ingested by an aggregator (DataDog, AWS CloudWatch, ELK stack).
*   Set `APP_ENV=production` to ensure SQLAlchemy query echoing is disabled, as logging raw SQL in production is a massive performance drain and a security risk (PII leakage).

### Financial Auditing
*   The `PayrollRun` entity maintains denormalized totals (`total_gross`, `total_net`) for fast dashboard reads. 
*   If you ever need to debug a discrepancy, the source of truth is the aggregation of `PayrollEntry` rows. You can query: 
    `SELECT sum(net_salary) FROM payroll_entries WHERE payroll_run_id = 'uuid';`
    and compare it to the denormalized `PayrollRun.total_net`.

### Dealing with Failed Payroll Runs
If a payroll run fails mid-execution:
1.  Identify which `PayrollEntry` records have `status='failed'`.
2.  Do not re-execute the entire run, or you risk double-paying employees who succeeded.
3.  *Future Feature:* You will need to implement a `/runs/{run_id}/retry-failed` endpoint that filters entries by `status='failed'` and only re-initiates those specific transfers.
