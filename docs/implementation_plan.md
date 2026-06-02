# Solvo Backend — Implementation Plan
## Background

Solvo is a **compliance-first global payroll engine** for African workforces, built on Kora's payment infrastructure. The backend must serve two user types — **Employers** (international HR teams) and **Employees** (African workers) — and power three product pillars:

1. **Global Bulk Payroll** — run multi-currency payroll across multiple African countries simultaneously
2. **Automated Tax Compliance** — per-jurisdiction PAYE, pension, and statutory deduction calculation + remittance
3. **Emergency Advance Credit** — employee-initiated salary advance requests with employer approval workflow

The frontend is a Next.js 16 + Tailwind app (currently a fresh scaffold). No API contract is locked in yet, giving us clean design freedom.

---

## Architecture Decisions & Reasoning

### ✅ Modular Monolith (not microservices)

For a hackathon MVP, a well-structured monolith with clear domain boundaries (routers per domain) is faster and still scalable. Domains can be extracted into services later.

### ✅ PostgreSQL + SQLAlchemy (async) + Alembic

Payroll is financial data — ACID transactions and relational integrity are non-negotiable. Async SQLAlchemy gives us non-blocking I/O for concurrent payroll runs. Alembic handles schema migrations cleanly.

### ✅ JWT Authentication with Role-Based Access Control

Two user types (`employer`, `employee`) with entirely different permission sets. JWT with a `role` claim in the token is clean — one auth system, dependency-injected role guards.

### ✅ Kora API Service Abstraction Layer

All Kora API calls are wrapped in `services/kora_service.py`. This makes the integration mockable for local dev and testable in isolation.

### ✅ Pluggable Tax Engine per Jurisdiction

Tax rules are hard-coded business logic, not API-driven. A `get_tax_calculator(country_code)` factory returns the right calculator for Nigeria (PAYE + Pension + NHF), Kenya (PAYE + NHIF + NSSF), Ghana, etc. Starting with Nigeria, Kenya, Ghana as Phase 1.

---

## Open Questions

> [!IMPORTANT]
> **Kora API credentials**: Do you already have a Kora API key and sandbox access? I'll build the integration layer using their documented bulk payout and transfer endpoints. If not, I'll build with a mock mode that simulates Kora responses.

> [!IMPORTANT]
> **Database hosting**: For local dev I'll configure PostgreSQL. Should this be Dockerized (e.g., `docker-compose.yml` with a Postgres container) or do you have a local Postgres instance already running?

> [!NOTE]
> **Phase 1 countries**: I'll implement full tax calculation logic for **Nigeria**, **Kenya**, and **Ghana** as the initial markets. Additional jurisdictions use a passthrough calculator. Is this the right starting set?

---

## Proposed Changes

### Backend Root Structure

```
solvo/
├── frontend/           (existing)
└── backend/            [NEW]
    ├── app/
    │   ├── main.py                  # FastAPI app factory
    │   ├── config.py                # Settings (Pydantic BaseSettings)
    │   ├── database.py              # Async SQLAlchemy engine + session
    │   ├── dependencies.py          # Auth dependencies (get_current_user, require_employer, etc.)
    │   │
    │   ├── models/                  # SQLAlchemy ORM models
    │   │   ├── __init__.py
    │   │   ├── user.py              # User (base for both employer & employee)
    │   │   ├── company.py           # Company / employer org
    │   │   ├── employee.py          # Employee profile + bank details
    │   │   ├── payroll.py           # PayrollRun + PayrollEntry (per-employee payslip)
    │   │   ├── advance.py           # AdvanceRequest (salary advance credit)
    │   │   └── tax_remittance.py    # TaxRemittance records per run
    │   │
    │   ├── schemas/                 # Pydantic v2 request/response schemas
    │   │   ├── __init__.py
    │   │   ├── auth.py
    │   │   ├── company.py
    │   │   ├── employee.py
    │   │   ├── payroll.py
    │   │   └── advance.py
    │   │
    │   ├── routers/                 # Domain-based FastAPI routers
    │   │   ├── __init__.py
    │   │   ├── auth.py              # /auth/register, /auth/login, /auth/refresh
    │   │   ├── companies.py         # /companies/* (employer onboarding + management)
    │   │   ├── employees.py         # /employees/* (employee CRUD + profile)
    │   │   ├── payroll.py           # /payroll/* (run management, execution)
    │   │   ├── advances.py          # /advances/* (request, approve, disburse)
    │   │   └── compliance.py        # /compliance/* (tax reports, audit trail)
    │   │
    │   └── services/               # Business logic + external integrations
    │       ├── __init__.py
    │       ├── kora_service.py      # Kora API client (bulk payouts, transfers)
    │       ├── tax_engine.py        # Tax calculation factory + jurisdiction rules
    │       ├── payroll_service.py   # Payroll run orchestration logic
    │       └── advance_service.py   # Advance eligibility + disbursement logic
    │
    ├── alembic/                     # DB migrations
    │   ├── env.py
    │   └── versions/
    ├── alembic.ini
    ├── requirements.txt
    ├── .env.example
    └── README.md
```

---

### Database Schema (Key Tables)

#### `users`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | str unique | |
| hashed_password | str | bcrypt |
| role | enum | `employer` / `employee` |
| is_active | bool | |
| created_at | timestamp | |

#### `companies`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | FK → users | Employer owner |
| name | str | Company name |
| country_of_incorporation | str | |
| kora_wallet_id | str | Kora funding wallet |
| currency | str | Base currency (USD/GBP/EUR) |
| created_at | timestamp | |

#### `employees`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | FK → users | Worker's login |
| company_id | FK → companies | Employer |
| full_name | str | |
| country | str | `NG`, `KE`, `GH`, etc. |
| currency | str | Local currency |
| gross_salary | Decimal | Monthly gross |
| bank_account_number | str | |
| bank_code | str | For Kora routing |
| mobile_wallet | str | Optional M-Pesa, etc. |
| employment_type | enum | `full_time` / `contractor` |
| tax_id | str | NIN, KRA PIN, etc. |
| pension_id | str | |

#### `payroll_runs`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| company_id | FK → companies | |
| period_month | int | 1–12 |
| period_year | int | |
| status | enum | `draft` → `processing` → `completed` / `failed` |
| total_gross | Decimal | |
| total_net | Decimal | |
| total_tax | Decimal | |
| kora_batch_id | str | From Kora bulk payout response |
| initiated_at | timestamp | |
| completed_at | timestamp | |

#### `payroll_entries`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| payroll_run_id | FK → payroll_runs | |
| employee_id | FK → employees | |
| gross_salary | Decimal | |
| paye_tax | Decimal | |
| pension | Decimal | |
| other_deductions | Decimal | |
| net_salary | Decimal | |
| currency | str | |
| kora_transfer_id | str | Individual transfer ref |
| status | enum | `pending` / `processing` / `settled` / `failed` |

#### `advance_requests`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| employee_id | FK → employees | |
| amount | Decimal | Requested amount |
| currency | str | |
| reason | str | Medical / equipment / other |
| status | enum | `pending` → `approved` / `rejected` → `disbursed` |
| employer_note | str | Optional rejection reason |
| kora_transfer_id | str | On disbursement |
| fee_amount | Decimal | 2–3% flat fee |
| requested_at | timestamp | |
| resolved_at | timestamp | |

#### `tax_remittances`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| payroll_run_id | FK → payroll_runs | |
| country | str | |
| authority | str | e.g. FIRS, KRA |
| tax_type | str | PAYE / Pension / NHF |
| amount | Decimal | |
| currency | str | |
| status | enum | `pending` / `remitted` / `failed` |
| reference | str | Revenue authority ref |

---

### API Endpoints

#### Auth — `/api/v1/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register/employer` | Register company + employer user |
| POST | `/register/employee` | Register employee (by employer or self) |
| POST | `/login` | JWT login (returns access + refresh tokens) |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Invalidate refresh token |

#### Companies — `/api/v1/companies`
| Method | Path | Description | Role |
|---|---|---|---|
| GET | `/me` | Get own company profile | employer |
| PUT | `/me` | Update company settings | employer |
| GET | `/me/employees` | List all employees | employer |
| GET | `/me/dashboard` | Dashboard summary stats | employer |

#### Employees — `/api/v1/employees`
| Method | Path | Description | Role |
|---|---|---|---|
| POST | `/` | Add new employee | employer |
| GET | `/{employee_id}` | Get employee detail | employer / self |
| PUT | `/{employee_id}` | Update employee info | employer |
| DELETE | `/{employee_id}` | Offboard employee | employer |
| GET | `/me/payslips` | Employee's own payslip history | employee |
| GET | `/me/profile` | Employee self-serve profile | employee |

#### Payroll — `/api/v1/payroll`
| Method | Path | Description | Role |
|---|---|---|---|
| POST | `/runs` | Create a payroll run (draft) | employer |
| GET | `/runs` | List all runs for company | employer |
| GET | `/runs/{run_id}` | Get payroll run detail + entries | employer |
| POST | `/runs/{run_id}/preview` | Preview: compute all taxes, net salaries | employer |
| POST | `/runs/{run_id}/execute` | Execute: trigger Kora bulk payout | employer |
| GET | `/runs/{run_id}/entries` | All employee payslip entries | employer |
| GET | `/runs/{run_id}/tax-summary` | Tax remittance breakdown | employer |

#### Advances — `/api/v1/advances`
| Method | Path | Description | Role |
|---|---|---|---|
| POST | `/` | Employee requests advance | employee |
| GET | `/` | List advances (employer: company-wide; employee: own) | both |
| GET | `/{advance_id}` | Get advance detail | both |
| PUT | `/{advance_id}/approve` | Approve advance | employer |
| PUT | `/{advance_id}/reject` | Reject advance with note | employer |
| POST | `/{advance_id}/disburse` | Trigger Kora transfer for advance | employer |

#### Compliance — `/api/v1/compliance`
| Method | Path | Description | Role |
|---|---|---|---|
| GET | `/reports` | List compliance reports | employer |
| GET | `/reports/{run_id}` | Full tax report for a payroll run | employer |
| GET | `/audit-trail` | Full audit trail (all payroll actions) | employer |

---

### Key Services

#### `kora_service.py`
Wraps the Kora API:
- `initiate_bulk_payout(transfers: list[KoraTransfer]) → KoraBatchResponse`
- `get_batch_status(batch_id: str) → KoraBatchStatus`
- `initiate_single_transfer(transfer: KoraTransfer) → KoraTransferResponse`
- `get_transfer_status(transfer_id: str) → KoraTransferStatus`

#### `tax_engine.py`
```python
def get_tax_calculator(country_code: str) -> BaseTaxCalculator:
    calculators = {
        "NG": NigeriaTaxCalculator(),
        "KE": KenyaTaxCalculator(),
        "GH": GhanaTaxCalculator(),
    }
    return calculators.get(country_code, PassthroughTaxCalculator())
```

**Nigeria calculator implements:**
- PAYE (progressive bands: 7%–24%)
- Pension (employee 8% + employer 10%)
- NHF (2.5% of basic)
- NSITF (1% employer)

**Kenya calculator implements:**
- PAYE (progressive KRA bands)
- NHIF (health insurance, tiered)
- NSSF (Tier I + Tier II)

#### `payroll_service.py`
Orchestrates a full payroll run:
1. Fetch all active employees for company
2. For each employee → `tax_engine.calculate(gross_salary, country)`
3. Build `PayrollEntry` records with net salaries
4. Create `TaxRemittance` records per jurisdiction
5. Call `kora_service.initiate_bulk_payout()` with all transfers
6. Update run status to `processing`
7. Webhook handler updates individual entry statuses as Kora confirms

---

## File Creation Order (Dependencies First)

1. `requirements.txt` + `.env.example`
2. `app/config.py` (Settings)
3. `app/database.py` (SQLAlchemy async engine)
4. `app/models/` (all ORM models)
5. Alembic setup + initial migration
6. `app/schemas/` (Pydantic schemas)
7. `app/services/tax_engine.py`
8. `app/services/kora_service.py`
9. `app/services/payroll_service.py`
10. `app/services/advance_service.py`
11. `app/dependencies.py` (JWT auth guards)
12. `app/routers/auth.py`
13. `app/routers/companies.py`
14. `app/routers/employees.py`
15. `app/routers/payroll.py`
16. `app/routers/advances.py`
17. `app/routers/compliance.py`
18. `app/main.py` (app factory, register routers, CORS)
19. `backend/README.md`

---

## Verification Plan

### Automated
- `pytest` with `httpx.AsyncClient` for all API routes (auth, payroll, advances)
- Tax engine unit tests with known salary figures against official tax tables
- Mock Kora service for disbursement tests

### Manual Verification
- Run `uvicorn app.main:app --reload` and open `/docs` (Swagger UI)
- Walk through full flow: Register employer → Add employees → Create payroll run → Preview taxes → Execute → Check entries
- Test advance request flow end-to-end

---

## Tech Stack Summary

| Layer | Choice | Reason |
|---|---|---|
| Framework | FastAPI | Async, auto-docs, Pydantic native |
| ORM | SQLAlchemy 2.x async | Async I/O, powerful, Alembic support |
| DB | PostgreSQL | ACID, relational integrity for financial data |
| Migrations | Alembic | Versioned schema management |
| Auth | python-jose + passlib[bcrypt] | JWT + secure password hashing |
| HTTP client | httpx (async) | For Kora API calls |
| Validation | Pydantic v2 | FastAPI native, fast |
| Environment | python-dotenv + pydantic-settings | 12-factor config |
