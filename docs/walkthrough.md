# Solvo Backend — Walkthrough

I have successfully completed the entire Solvo backend. It's a robust, async-first FastAPI application designed to handle the complexities of multi-jurisdiction payroll and compliance.

Here is a walkthrough of what was built, how it works, and where the critical business logic lives.

## 🏗️ Architecture Overview

The backend uses a **modular monolith** approach, making it easy to develop locally while being cleanly separated for a potential future split into microservices (Auth, Payroll, Compliance).

- **Framework:** FastAPI (async-first)
- **Database:** PostgreSQL + Async SQLAlchemy + Alembic migrations
- **Authentication:** JWT with role-based access control (Employer vs. Employee)
- **Validation:** Pydantic v2

## 🗄️ Domain Models

The database schema is designed for absolute financial integrity:

1. **[User](file:///C:/Users/HP/Desktop/kora_hackathon_work/solvo/backend/app/models/user.py)**: A single authentication table with a `role` discriminator (`employer` or `employee`).
2. **[Company](file:///C:/Users/HP/Desktop/kora_hackathon_work/solvo/backend/app/models/company.py) & [Employee](file:///C:/Users/HP/Desktop/kora_hackathon_work/solvo/backend/app/models/employee.py)**: Profiles that link back to the User. Employees contain Kora routing details (bank code/account) and tax IDs.
3. **[PayrollRun](file:///C:/Users/HP/Desktop/kora_hackathon_work/solvo/backend/app/models/payroll.py)**: The batch wrapper for a month's payroll. Contains denormalized totals for lightning-fast dashboard queries.
4. **[PayrollEntry](file:///C:/Users/HP/Desktop/kora_hackathon_work/solvo/backend/app/models/payroll.py)**: The individual employee payslip, detailing gross, taxes, and net salary.
5. **[TaxRemittance](file:///C:/Users/HP/Desktop/kora_hackathon_work/solvo/backend/app/models/tax_remittance.py)**: The audit trail. Every executed payroll generates remittance records grouped by jurisdiction and tax authority (e.g., FIRS, KRA).
6. **[AdvanceRequest](file:///C:/Users/HP/Desktop/kora_hackathon_work/solvo/backend/app/models/advance.py)**: Tracks the full lifecycle of emergency credit (request → approve → disburse).

## ⚙️ The Tax Engine

The most complex business logic lives in the **[Tax Engine](file:///C:/Users/HP/Desktop/kora_hackathon_work/solvo/backend/app/services/tax_engine.py)**. 

Instead of a massive `if/else` block, I used a **Factory Pattern**:
- `NigeriaTaxCalculator`: Implements CRA (Consolidated Relief Allowance), progressive PAYE bands, Pension, and NHF.
- `KenyaTaxCalculator`: Implements KRA PAYE bands, NHIF tiers, and NSSF (Tier 1 & 2).
- `GhanaTaxCalculator`: Implements GRA PAYE and SSNIT.

When payroll runs, the service simply calls `get_tax_calculator(emp.country).calculate(gross)` and receives a unified `TaxBreakdown` object.

## 💸 Kora API Integration

The **[KoraService](file:///C:/Users/HP/Desktop/kora_hackathon_work/solvo/backend/app/services/kora_service.py)** wraps the Kora API. 

> [!TIP]
> **Mock Mode is ENABLED by default.**
> Because this is a hackathon, `KORA_MOCK_MODE=true` is set in the `.env.example`. When enabled, the backend intercepts all payout requests and returns a simulated "success" response. This allows you to test the entire flow (creating runs, previewing taxes, executing payouts, and disbursing advances) locally without needing real Kora credentials.

## 🚀 Running the App

To run the backend locally, follow the instructions in the **[README.md](file:///C:/Users/HP/Desktop/kora_hackathon_work/solvo/backend/README.md)**:

1. Spin up the Postgres database via `docker-compose up -d`.
2. Start the API using `uvicorn app.main:app --reload`.
3. Open the Swagger UI at `http://localhost:8000/docs` to test the endpoints interactively. 

All tables will automatically create themselves on startup in development mode, so you don't even need to run Alembic migrations manually to get started!
