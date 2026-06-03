# Solvo — Frontend Developer Handoff Document

> **Project**: Solvo — Global payroll engine with tax compliance & emergency salary advances for African workforces  
> **Backend**: FastAPI (Python) — fully built, audited, and bug-fixed  
> **Frontend Stack**: Next.js 16 + TypeScript + Tailwind CSS v4  
> **Last Updated**: 2026-06-03

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication Flow](#2-authentication-flow)
3. [API Reference — All Endpoints](#3-api-reference--all-endpoints)
4. [TypeScript Interfaces](#4-typescript-interfaces)
5. [Page-by-Page Implementation Spec](#5-page-by-page-implementation-spec)
6. [Role-Based Access Control](#6-role-based-access-control)
7. [Error Handling](#7-error-handling)
8. [Environment & Deployment Config](#8-environment--deployment-config)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │ Dashboard│  │ Payroll  │  │ Advances │   │
│  │  Pages   │  │          │  │ Pages    │  │ Pages    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │         │
│       └──────────────┴──────────────┴──────────────┘         │
│                           │                                  │
│                  ┌────────▼────────┐                         │
│                  │  API Client     │ ← Centralized fetch     │
│                  │  (lib/api.ts)   │   wrapper with JWT      │
│                  └────────┬────────┘                         │
│                  ┌────────▼────────┐                         │
│                  │  Auth Context   │ ← Token storage         │
│                  │  (context/auth) │   & role management     │
│                  └────────┬────────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP + Bearer Token
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)                     │
│                                                             │
│  /api/v1/auth          ← Authentication                     │
│  /api/v1/companies     ← Company profile + dashboard        │
│  /api/v1/employees     ← Employee CRUD + self-serve         │
│  /api/v1/payroll       ← Payroll run lifecycle              │
│  /api/v1/advances      ← Salary advance lifecycle           │
│  /api/v1/compliance    ← Tax reports + audit trail          │
│  /api/v1/webhooks      ← Kora payment callbacks             │
└─────────────────────────────────────────────────────────────┘
```

**Backend base URL**: `http://localhost:8000` (dev) — configurable via `NEXT_PUBLIC_API_URL`.

**CORS**: Already configured in backend to accept `http://localhost:3000`.

---

## 2. Authentication Flow

### 2.1 How Auth Works

The backend uses **JWT Bearer tokens** via the `Authorization` header.

```
Authorization: Bearer <access_token>
```

| Token | Lifetime | Purpose |
|---|---|---|
| Access Token | 30 minutes | Sent with every API request |
| Refresh Token | 7 days | Used to get a new access token when the current one expires |

### 2.2 Login Flow

```
1. User submits email + password
2. POST /api/v1/auth/login → returns { access_token, refresh_token, role, user_id }
3. Store both tokens in localStorage (or httpOnly cookie)
4. Redirect based on role:
   - "employer" → /dashboard
   - "employee" → /me
```

### 2.3 Token Refresh Flow

```
1. API request returns 401 Unauthorized
2. POST /api/v1/auth/refresh with { refresh_token }
3. If success → store new tokens, retry original request
4. If refresh also fails → redirect to /login (session expired)
```

### 2.4 Logout Flow

```
1. POST /api/v1/auth/logout with { refresh_token }
   (requires access token in Authorization header)
2. Clear localStorage
3. Redirect to /login
```

### 2.5 Recommended API Client Pattern

```typescript
// lib/api.ts — Suggested implementation

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token');
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Auto-refresh on 401
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry with new token
      return apiFetch<T>(path, options);
    }
    // Refresh failed — redirect to login
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'API request failed');
  }

  // 204 No Content (e.g., DELETE responses)
  if (res.status === 204) return undefined as T;
  
  return res.json();
}

// Convenience methods
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) =>
    apiFetch<void>(path, { method: 'DELETE' }),
};
```

---

## 3. API Reference — All Endpoints

### 3.1 Authentication (`/api/v1/auth`)

---

#### `POST /api/v1/auth/register/employer`

Register a new employer user and their company.

**Auth Required**: ❌ No

**Request Body**:
```json
{
  "email": "boss@company.com",
  "password": "Str0ng!Pass",
  "full_name": "Adaora Nnamdi",
  "company_name": "TechAfrica Ltd",
  "country_of_incorporation": "NG",
  "industry": "Technology",
  "currency": "NGN"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string (email) | ✅ | Valid email format |
| `password` | string | ✅ | 8-128 chars, must contain a number AND a special character |
| `full_name` | string | ✅ | 1-255 chars |
| `company_name` | string | ✅ | 1-255 chars |
| `country_of_incorporation` | string | ✅ | 2-3 char ISO country code |
| `industry` | string | ❌ | Optional |
| `currency` | string | ❌ | 3 chars, defaults to "USD" |

**Success Response** (`201 Created`):
```json
{
  "id": "a1b2c3d4-...",
  "email": "boss@company.com",
  "full_name": "Adaora Nnamdi",
  "role": "employer",
  "is_active": true,
  "created_at": "2026-06-03T10:30:00Z"
}
```

**Error Responses**:
| Status | Detail |
|---|---|
| `409` | "Email already registered" |
| `422` | Validation error (password too short, missing fields, etc.) |

---

#### `POST /api/v1/auth/register/employee`

Register a new employee (can be self-registration or employer-initiated).

**Auth Required**: ❌ No

**Request Body**:
```json
{
  "email": "worker@email.com",
  "password": "Str0ng!Pass",
  "full_name": "Chidi Okafor",
  "company_id": "uuid-of-company",
  "country": "NG",
  "employment_type": "full_time",
  "gross_salary": 500000.00,
  "currency": "NGN",
  "bank_account_number": "0123456789",
  "bank_code": "058",
  "bank_name": "GTBank",
  "mobile_wallet": null,
  "tax_id": "NIN12345",
  "pension_id": "PFA67890"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | |
| `password` | string | ✅ | Same rules as employer |
| `full_name` | string | ✅ | |
| `company_id` | UUID | ✅ | Must be an existing company |
| `country` | string | ✅ | 2-3 char ISO code |
| `employment_type` | string | ❌ | "full_time" (default) or "contractor" |
| `gross_salary` | float | ✅ | Must be > 0 |
| `currency` | string | ✅ | 3 char ISO currency |
| `bank_account_number` | string | ❌ | |
| `bank_code` | string | ❌ | |
| `bank_name` | string | ❌ | |
| `mobile_wallet` | string | ❌ | |
| `tax_id` | string | ❌ | |
| `pension_id` | string | ❌ | |

**Success Response** (`201 Created`): Same as employer registration (UserResponse).

**Error Responses**:
| Status | Detail |
|---|---|
| `404` | "Company not found" |
| `409` | "Email already registered" |

---

#### `POST /api/v1/auth/login`

Authenticate and receive JWT tokens.

**Auth Required**: ❌ No

**Rate Limit**: 5 requests per minute per IP

**Request Body**:
```json
{
  "email": "boss@company.com",
  "password": "Str0ng!Pass"
}
```

**Success Response** (`200 OK`):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "role": "employer",
  "user_id": "a1b2c3d4-..."
}
```

**Error Responses**:
| Status | Detail |
|---|---|
| `401` | "Invalid email or password" |
| `403` | "Account is deactivated" |
| `429` | Rate limit exceeded |

> **⚠️ IMPORTANT**: The `role` field in the response determines which UI to show. Store it alongside the tokens.

---

#### `POST /api/v1/auth/refresh`

Get a new access token using a refresh token.

**Auth Required**: ❌ No (the refresh token IS the auth)

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response** (`200 OK`): Same as login (new `TokenResponse`).

**Error Responses**:
| Status | Detail |
|---|---|
| `401` | "Invalid or expired refresh token" / "Token has been revoked" / "Invalid token type" |

---

#### `POST /api/v1/auth/logout`

Blacklist the refresh token (server-side invalidation).

**Auth Required**: ✅ Yes (access token in header)

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response** (`204 No Content`): Empty body.

---

### 3.2 Companies (`/api/v1/companies`)

All endpoints require **employer** role.

---

#### `GET /api/v1/companies/me`

Get the authenticated employer's company profile.

**Auth Required**: ✅ Employer only

**Success Response** (`200 OK`):
```json
{
  "id": "c1d2e3f4-...",
  "name": "TechAfrica Ltd",
  "country_of_incorporation": "NG",
  "industry": "Technology",
  "currency": "NGN",
  "kora_wallet_id": null,
  "created_at": "2026-01-15T10:30:00Z"
}
```

---

#### `PUT /api/v1/companies/me`

Update company settings. All fields are optional — only send what's changing.

**Auth Required**: ✅ Employer only

**Request Body** (all optional):
```json
{
  "name": "TechAfrica Global",
  "industry": "FinTech",
  "currency": "USD",
  "kora_wallet_id": "kora_wallet_abc123"
}
```

**Success Response** (`200 OK`): Updated `CompanyResponse`.

---

#### `GET /api/v1/companies/me/dashboard`

Dashboard summary with key business metrics.

**Auth Required**: ✅ Employer only

**Success Response** (`200 OK`):
```json
{
  "total_employees": 12,
  "total_payroll_runs": 3,
  "total_disbursed": 4500000.00,
  "total_tax_remitted": 675000.00,
  "pending_advances": 2,
  "countries_covered": ["NG", "KE", "GH"],
  "recent_payroll_status": "completed"
}
```

| Field | Type | Notes |
|---|---|---|
| `total_employees` | int | Active employees in company |
| `total_payroll_runs` | int | All runs (any status) |
| `total_disbursed` | float | Sum of net from completed runs |
| `total_tax_remitted` | float | Sum of remitted tax amounts |
| `pending_advances` | int | Advances waiting for employer action |
| `countries_covered` | string[] | Unique employee countries |
| `recent_payroll_status` | string \| null | Status of most recent run |

> **💡 TIP**: Use this for the main dashboard page. Each field maps to a stat card.

---

### 3.3 Employees (`/api/v1/employees`)

---

#### `POST /api/v1/employees/`

Employer adds a new employee (creates user account + employee profile).

**Auth Required**: ✅ Employer only

**Request Body**:
```json
{
  "email": "new.hire@email.com",
  "password": "Temp0rary!",
  "full_name": "Amina Yusuf",
  "country": "NG",
  "employment_type": "full_time",
  "gross_salary": 350000.00,
  "currency": "NGN",
  "bank_account_number": "0123456789",
  "bank_code": "058",
  "bank_name": "GTBank"
}
```

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `password` | string | ✅ (min 8 chars) |
| `full_name` | string | ✅ |
| `country` | string | ✅ (2-3 char ISO) |
| `employment_type` | string | ❌ (default: "full_time") |
| `gross_salary` | float | ✅ (> 0) |
| `currency` | string | ✅ (3 chars) |
| `bank_account_number` | string | ❌ |
| `bank_code` | string | ❌ |
| `bank_name` | string | ❌ |
| `mobile_wallet` | string | ❌ |
| `tax_id` | string | ❌ |
| `pension_id` | string | ❌ |

**Success Response** (`201 Created`):
```json
{
  "id": "emp-uuid-...",
  "user_id": "user-uuid-...",
  "company_id": "company-uuid-...",
  "full_name": "Amina Yusuf",
  "country": "NG",
  "employment_type": "full_time",
  "gross_salary": 350000.00,
  "currency": "NGN",
  "bank_account_number": "0123456789",
  "bank_code": "058",
  "bank_name": "GTBank",
  "mobile_wallet": null,
  "tax_id": null,
  "pension_id": null,
  "created_at": "2026-06-03T10:30:00Z"
}
```

**Error Responses**:
| Status | Detail |
|---|---|
| `404` | "No company found" |
| `409` | "Email already registered" |

> **⚠️ WARNING**: Bank details (`bank_account_number` + `bank_code`) are required for payroll disbursement. Employees without bank details will be skipped during payroll execution.

---

#### `GET /api/v1/employees/?skip=0&limit=50`

List all employees in the employer's company.

**Auth Required**: ✅ Employer only

**Query Parameters**:
| Param | Type | Default | Notes |
|---|---|---|---|
| `skip` | int | 0 | Pagination offset |
| `limit` | int | 50 | Max results per page |

**Success Response** (`200 OK`):
```json
{
  "employees": [
    { /* EmployeeResponse */ },
    { /* EmployeeResponse */ }
  ],
  "total": 12
}
```

---

#### `GET /api/v1/employees/{employee_id}`

Get a specific employee's full details.

**Auth Required**: ✅ Employer only

**Success Response** (`200 OK`): `EmployeeResponse`

**Error**: `404` if not found or doesn't belong to employer's company.

---

#### `PUT /api/v1/employees/{employee_id}`

Update an employee's details. All fields optional — only send what's changing.

**Auth Required**: ✅ Employer only

**Request Body** (all optional):
```json
{
  "full_name": "Amina Yusuf-Ibrahim",
  "gross_salary": 400000.00,
  "employment_type": "contractor",
  "bank_account_number": "9876543210"
}
```

**Success Response** (`200 OK`): Updated `EmployeeResponse`.

---

#### `DELETE /api/v1/employees/{employee_id}`

Offboard an employee (soft-deletes by deactivating their user account).

**Auth Required**: ✅ Employer only

**Success Response** (`204 No Content`): Empty body.

> **ℹ️ NOTE**: This is a soft delete — the employee's user account `is_active` is set to false. They can no longer log in, but their data remains for audit/compliance purposes.

---

#### `GET /api/v1/employees/me/profile`

Employee views their own profile.

**Auth Required**: ✅ Employee only

**Success Response** (`200 OK`): `EmployeeResponse`

---

#### `GET /api/v1/employees/me/payslips`

Employee views their own payslip history.

**Auth Required**: ✅ Employee only

**Success Response** (`200 OK`):
```json
[
  {
    "id": "entry-uuid",
    "employee_id": "emp-uuid",
    "gross_salary": 500000.00,
    "paye_tax": 62500.00,
    "pension_employee": 40000.00,
    "pension_employer": 50000.00,
    "nhf": 7500.00,
    "other_deductions": 0.00,
    "net_salary": 390000.00,
    "currency": "NGN",
    "kora_transfer_id": "kora_ref_abc123",
    "status": "settled"
  }
]
```

---

### 3.4 Payroll (`/api/v1/payroll`)

All endpoints require **employer** role.

---

#### `POST /api/v1/payroll/runs`

Create a new payroll run in **draft** status.

**Auth Required**: ✅ Employer only

**Request Body**:
```json
{
  "period_month": 6,
  "period_year": 2026,
  "notes": "June 2026 payroll"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `period_month` | int | ✅ | 1-12 |
| `period_year` | int | ✅ | 2020-2030 |
| `notes` | string | ❌ | |

**Success Response** (`201 Created`):
```json
{
  "id": "run-uuid",
  "company_id": "company-uuid",
  "period_month": 6,
  "period_year": 2026,
  "status": "draft",
  "total_gross": 0.00,
  "total_net": 0.00,
  "total_tax": 0.00,
  "total_pension": 0.00,
  "employee_count": 0,
  "kora_batch_id": null,
  "notes": "June 2026 payroll",
  "initiated_at": "2026-06-03T10:30:00Z",
  "completed_at": null
}
```

**Error Responses**:
| Status | Detail |
|---|---|
| `400` | "Payroll run already exists for 2026-06" |
| `400` | "No employees found for this company" |

---

#### `GET /api/v1/payroll/runs?skip=0&limit=20`

List all payroll runs for the company.

**Auth Required**: ✅ Employer only

**Success Response** (`200 OK`):
```json
{
  "runs": [ /* PayrollRunResponse[] */ ],
  "total": 5
}
```

---

#### `GET /api/v1/payroll/runs/{run_id}`

Get a specific payroll run.

**Auth Required**: ✅ Employer only

**Success Response** (`200 OK`): `PayrollRunResponse`

---

#### `POST /api/v1/payroll/runs/{run_id}/preview`

Calculate taxes for ALL employees and create payroll entries. **Does NOT trigger payouts** — this is a preview for employer review.

**Auth Required**: ✅ Employer only

**Request Body**: None

**Success Response** (`200 OK`):
```json
{
  "run_id": "run-uuid",
  "period": "2026-06",
  "total_gross": 3500000.00,
  "total_net": 2800000.00,
  "total_tax": 450000.00,
  "total_pension": 250000.00,
  "employee_count": 7,
  "entries": [
    {
      "id": "entry-uuid",
      "employee_id": "emp-uuid",
      "employee_name": "Ada Obi",
      "employee_country": "NG",
      "gross_salary": 500000.00,
      "paye_tax": 62500.00,
      "pension_employee": 40000.00,
      "pension_employer": 50000.00,
      "nhf": 7500.00,
      "other_deductions": 0.00,
      "net_salary": 390000.00,
      "currency": "NGN",
      "kora_transfer_id": null,
      "status": "pending"
    }
  ],
  "tax_summary": [
    {
      "country": "NG",
      "authority": "FIRS",
      "tax_type": "PAYE",
      "total_amount": 450000.00,
      "currency": "NGN"
    },
    {
      "country": "NG",
      "authority": "FIRS",
      "tax_type": "Pension",
      "total_amount": 250000.00,
      "currency": "NGN"
    }
  ]
}
```

> **⚠️ IMPORTANT**: Can be called multiple times on the same run (re-previewing clears old entries and recalculates). Only works on `draft` or `previewed` status runs.

---

#### `POST /api/v1/payroll/runs/{run_id}/execute`

**Execute the payroll — triggers real bank transfers via Kora. THIS IS IRREVERSIBLE.**

**Auth Required**: ✅ Employer only

**Request Body**: None

**Precondition**: Run must be in `previewed` status (preview must happen first).

**Success Response** (`200 OK`): `PayrollRunResponse` with `status` = `"completed"` or `"processing"`.

**Error Responses**:
| Status | Detail |
|---|---|
| `400` | "Can only execute a previewed run" |
| `400` | "No valid employees to pay (all missing bank details)" |

> **🚨 CAUTION**: Show a confirmation dialog with the total amount before allowing execution. Money will move.

---

#### `GET /api/v1/payroll/runs/{run_id}/entries`

Get all payslip entries for a specific payroll run.

**Auth Required**: ✅ Employer only

**Success Response** (`200 OK`): `PayrollEntryResponse[]`

---

#### `GET /api/v1/payroll/runs/{run_id}/tax-summary`

Get tax remittance breakdown for a payroll run.

**Auth Required**: ✅ Employer only

**Success Response** (`200 OK`): `TaxSummaryItem[]`

---

### 3.5 Advances (`/api/v1/advances`)

---

#### `POST /api/v1/advances/`

Employee requests a salary advance.

**Auth Required**: ✅ Employee only

**Request Body**:
```json
{
  "amount": 150000.00,
  "currency": "NGN",
  "reason": "medical",
  "description": "Emergency hospital bill"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `amount` | float | ✅ | Must be > 0, max 50% of net salary |
| `currency` | string | ✅ | 3 chars |
| `reason` | string | ✅ | Max 50 chars. Values: "medical", "equipment", "emergency", "rent", "other" |
| `description` | string | ❌ | |

**Business Rules**:
- Max advance = 50% of employee's estimated net salary
- Only ONE pending or approved advance allowed at a time

**Error Responses**:
| Status | Detail |
|---|---|
| `400` | "Requested amount exceeds 50% of net salary" |
| `400` | "You already have a pending or approved advance" |

**Success Response** (`201 Created`):
```json
{
  "id": "adv-uuid",
  "employee_id": "emp-uuid",
  "employee_name": null,
  "amount": 150000.00,
  "currency": "NGN",
  "reason": "medical",
  "description": "Emergency hospital bill",
  "status": "pending",
  "employer_note": null,
  "approved_amount": null,
  "fee_percentage": 2.50,
  "fee_amount": 0.00,
  "kora_transfer_id": null,
  "requested_at": "2026-06-03T10:30:00Z",
  "resolved_at": null,
  "disbursed_at": null
}
```

---

#### `GET /api/v1/advances/?skip=0&limit=20&status_filter=pending`

List advances. **Role-aware**: employers see all company advances, employees see only their own.

**Auth Required**: ✅ Any authenticated user

**Query Parameters**:
| Param | Type | Default | Notes |
|---|---|---|---|
| `skip` | int | 0 | Pagination offset |
| `limit` | int | 20 | Max results |
| `status_filter` | string | none | Filter: "pending", "approved", "rejected", "disbursed", "repaid" |

**Success Response** (`200 OK`):
```json
{
  "advances": [ /* AdvanceResponse[] */ ],
  "total": 5
}
```

---

#### `GET /api/v1/advances/{advance_id}`

Get advance detail (for employer or the requesting employee).

**Auth Required**: ✅ Any authenticated user (scoped to own data)

**Success Response** (`200 OK`): `AdvanceResponse`

---

#### `PUT /api/v1/advances/{advance_id}/approve`

Employer approves an advance (optionally with a partial amount).

**Auth Required**: ✅ Employer only

**Request Body**:
```json
{
  "approved_amount": 100000.00,
  "employer_note": "Approved up to 100k"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `approved_amount` | float | ❌ | If null, approves the full requested amount. Must be > 0 if provided. |
| `employer_note` | string | ❌ | |

**Success Response** (`200 OK`): Updated `AdvanceResponse` with `status` = `"approved"`.

> **ℹ️ NOTE**: The fee (2.5% flat) is calculated at approval time. `fee_amount` will be populated in the response.

---

#### `PUT /api/v1/advances/{advance_id}/reject`

Employer rejects an advance with a required explanation.

**Auth Required**: ✅ Employer only

**Request Body**:
```json
{
  "employer_note": "Budget constraints this month"
}
```

| Field | Type | Required |
|---|---|---|
| `employer_note` | string | ✅ (min 1 char) |

**Success Response** (`200 OK`): Updated `AdvanceResponse` with `status` = `"rejected"`.

---

#### `POST /api/v1/advances/{advance_id}/disburse`

Trigger Kora bank transfer for an approved advance.

**Auth Required**: ✅ Employer only

**Request Body**: None

**Precondition**: Advance must be in `approved` status and employee must have bank details.

**Success Response** (`200 OK`): Updated `AdvanceResponse` with `status` = `"disbursed"`.

**Error Responses**:
| Status | Detail |
|---|---|
| `400` | "Can only disburse an approved advance" |
| `400` | "Employee has no bank details configured" |

---

### 3.6 Compliance (`/api/v1/compliance`)

All endpoints require **employer** role.

---

#### `GET /api/v1/compliance/reports`

List all payroll runs that have tax data (completed or previewed runs).

**Auth Required**: ✅ Employer only

**Success Response** (`200 OK`): `PayrollRunResponse[]`

---

#### `GET /api/v1/compliance/reports/{run_id}`

Full tax remittance report for a specific payroll run.

**Auth Required**: ✅ Employer only

**Success Response** (`200 OK`): `TaxSummaryItem[]`

---

#### `GET /api/v1/compliance/audit-trail?skip=0&limit=50`

Full audit trail: all payroll runs with nested tax remittance records.

**Auth Required**: ✅ Employer only

**Success Response** (`200 OK`):
```json
{
  "audit_trail": [
    {
      "run_id": "uuid",
      "period": "2026-06",
      "status": "completed",
      "total_gross": 3500000.00,
      "total_net": 2800000.00,
      "total_tax": 450000.00,
      "employee_count": 7,
      "initiated_at": "2026-06-01T00:00:00Z",
      "completed_at": "2026-06-01T01:00:00Z",
      "remittances": [
        {
          "country": "NG",
          "authority": "FIRS",
          "tax_type": "PAYE",
          "amount": 450000.00,
          "currency": "NGN",
          "status": "pending",
          "reference": null
        }
      ]
    }
  ],
  "total": 3
}
```

---

### 3.7 Webhooks (`/api/v1/webhooks`)

#### `POST /api/v1/webhooks/kora`

> **ℹ️ NOTE**: This is NOT called by the frontend. It's a server-to-server callback from Kora when a transfer status changes. **No frontend implementation needed.**

---

## 4. TypeScript Interfaces

Copy these into `lib/types.ts`:

```typescript
// ── Auth ──

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: 'employer' | 'employee';
  user_id: string;
}

export interface EmployerRegisterRequest {
  email: string;
  password: string;
  full_name: string;
  company_name: string;
  country_of_incorporation: string;
  industry?: string;
  currency?: string;  // defaults to "USD"
}

export interface EmployeeRegisterRequest {
  email: string;
  password: string;
  full_name: string;
  company_id: string;
  country: string;
  employment_type?: string;  // "full_time" | "contractor"
  gross_salary: number;
  currency: string;
  bank_account_number?: string;
  bank_code?: string;
  bank_name?: string;
  mobile_wallet?: string;
  tax_id?: string;
  pension_id?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

// ── Company ──

export interface Company {
  id: string;
  name: string;
  country_of_incorporation: string;
  industry: string | null;
  currency: string;
  kora_wallet_id: string | null;
  created_at: string;
}

export interface CompanyUpdate {
  name?: string;
  industry?: string;
  currency?: string;
  kora_wallet_id?: string;
}

export interface DashboardSummary {
  total_employees: number;
  total_payroll_runs: number;
  total_disbursed: number;
  total_tax_remitted: number;
  pending_advances: number;
  countries_covered: string[];
  recent_payroll_status: string | null;
}

// ── Employee ──

export interface Employee {
  id: string;
  user_id: string;
  company_id: string;
  full_name: string;
  country: string;
  employment_type: string;
  gross_salary: number;
  currency: string;
  bank_account_number: string | null;
  bank_code: string | null;
  bank_name: string | null;
  mobile_wallet: string | null;
  tax_id: string | null;
  pension_id: string | null;
  created_at: string;
}

export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
}

export interface EmployeeCreateRequest {
  email: string;
  password: string;
  full_name: string;
  country: string;
  employment_type?: string;
  gross_salary: number;
  currency: string;
  bank_account_number?: string;
  bank_code?: string;
  bank_name?: string;
  mobile_wallet?: string;
  tax_id?: string;
  pension_id?: string;
}

export interface EmployeeUpdateRequest {
  full_name?: string;
  country?: string;
  employment_type?: string;
  gross_salary?: number;
  currency?: string;
  bank_account_number?: string;
  bank_code?: string;
  bank_name?: string;
  mobile_wallet?: string;
  tax_id?: string;
  pension_id?: string;
}

// ── Payroll ──

export interface PayrollRun {
  id: string;
  company_id: string;
  period_month: number;
  period_year: number;
  status: 'draft' | 'previewed' | 'processing' | 'completed' | 'failed';
  total_gross: number;
  total_net: number;
  total_tax: number;
  total_pension: number;
  employee_count: number;
  kora_batch_id: string | null;
  notes: string | null;
  initiated_at: string;
  completed_at: string | null;
}

export interface PayrollRunListResponse {
  runs: PayrollRun[];
  total: number;
}

export interface PayrollRunCreateRequest {
  period_month: number;  // 1-12
  period_year: number;   // 2020-2030
  notes?: string;
}

export interface PayrollEntry {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_country?: string;
  gross_salary: number;
  paye_tax: number;
  pension_employee: number;
  pension_employer: number;
  nhf: number;
  other_deductions: number;
  net_salary: number;
  currency: string;
  kora_transfer_id: string | null;
  status: 'pending' | 'processing' | 'settled' | 'failed';
}

export interface PayrollPreview {
  run_id: string;
  period: string;
  total_gross: number;
  total_net: number;
  total_tax: number;
  total_pension: number;
  employee_count: number;
  entries: PayrollEntry[];
  tax_summary: TaxSummaryItem[];
}

export interface TaxSummaryItem {
  country: string;
  authority: string;
  tax_type: string;
  total_amount: number;
  currency: string;
}

// ── Advances ──

export interface Advance {
  id: string;
  employee_id: string;
  employee_name: string | null;
  amount: number;
  currency: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid';
  employer_note: string | null;
  approved_amount: number | null;
  fee_percentage: number;
  fee_amount: number;
  kora_transfer_id: string | null;
  requested_at: string;
  resolved_at: string | null;
  disbursed_at: string | null;
}

export interface AdvanceListResponse {
  advances: Advance[];
  total: number;
}

export interface AdvanceCreateRequest {
  amount: number;
  currency: string;
  reason: string;  // "medical" | "equipment" | "emergency" | "rent" | "other"
  description?: string;
}

export interface AdvanceApprovalRequest {
  approved_amount?: number;  // null = approve full amount
  employer_note?: string;
}

export interface AdvanceRejectionRequest {
  employer_note: string;  // required
}

// ── Compliance ──

export interface AuditTrailEntry {
  run_id: string;
  period: string;
  status: string;
  total_gross: number;
  total_net: number;
  total_tax: number;
  employee_count: number;
  initiated_at: string | null;
  completed_at: string | null;
  remittances: AuditRemittance[];
}

export interface AuditRemittance {
  country: string;
  authority: string;
  tax_type: string;
  amount: number;
  currency: string;
  status: string;
  reference: string | null;
}

export interface AuditTrailResponse {
  audit_trail: AuditTrailEntry[];
  total: number;
}
```

---

## 5. Page-by-Page Implementation Spec

### Recommended Pages & Their Endpoints

| Page Route | Role | Primary Endpoint(s) | Purpose |
|---|---|---|---|
| `/login` | Public | `POST /auth/login` | Email + password form |
| `/register` | Public | `POST /auth/register/employer` | Employer + company registration |
| `/dashboard` | Employer | `GET /companies/me/dashboard` | Stat cards with key metrics |
| `/settings` | Employer | `GET /companies/me`, `PUT /companies/me` | Company profile editor |
| `/employees` | Employer | `GET /employees/` | Employee table with pagination |
| `/employees/add` | Employer | `POST /employees/` | Add employee form |
| `/employees/[id]` | Employer | `GET /employees/{id}`, `PUT /employees/{id}`, `DELETE /employees/{id}` | View/edit/offboard |
| `/payroll` | Employer | `GET /payroll/runs` | Payroll runs table |
| `/payroll/new` | Employer | `POST /payroll/runs` | Month/year picker |
| `/payroll/[id]` | Employer | `GET /payroll/runs/{id}`, `POST .../preview`, `POST .../execute`, `GET .../entries`, `GET .../tax-summary` | Run detail with preview → execute flow |
| `/advances` | Both | `GET /advances/` | Advances list (filtered by role) |
| `/advances/request` | Employee | `POST /advances/` | Request form |
| `/advances/[id]` | Both | `GET /advances/{id}`, `PUT .../approve`, `PUT .../reject`, `POST .../disburse` | Detail + employer actions |
| `/compliance` | Employer | `GET /compliance/reports` | Reports list |
| `/compliance/audit` | Employer | `GET /compliance/audit-trail` | Full audit trail |
| `/me` | Employee | `GET /employees/me/profile` | Own profile view |
| `/me/payslips` | Employee | `GET /employees/me/payslips` | Payslip history |

All endpoint paths should be prefixed with `/api/v1`.

---

## 6. Role-Based Access Control

### Sidebar Navigation

**Employer sees:**
| Label | Route | Icon suggestion |
|---|---|---|
| Dashboard | `/dashboard` | 📊 |
| Employees | `/employees` | 👥 |
| Payroll | `/payroll` | 💰 |
| Advances | `/advances` | 🏦 |
| Compliance | `/compliance` | 📋 |
| Settings | `/settings` | ⚙️ |

**Employee sees:**
| Label | Route | Icon suggestion |
|---|---|---|
| My Profile | `/me` | 👤 |
| My Payslips | `/me/payslips` | 📄 |
| My Advances | `/advances` | 🏦 |

### Route Protection Matrix

| Route | Unauthenticated | Employer | Employee |
|---|---|---|---|
| `/login` | ✅ | Redirect to `/dashboard` | Redirect to `/me` |
| `/register` | ✅ | Redirect to `/dashboard` | Redirect to `/me` |
| `/dashboard` | Redirect to `/login` | ✅ | ❌ 403 |
| `/employees/*` | Redirect to `/login` | ✅ | ❌ 403 |
| `/payroll/*` | Redirect to `/login` | ✅ | ❌ 403 |
| `/advances` | Redirect to `/login` | ✅ (sees all company) | ✅ (sees own only) |
| `/advances/request` | Redirect to `/login` | ❌ 403 | ✅ |
| `/compliance/*` | Redirect to `/login` | ✅ | ❌ 403 |
| `/settings` | Redirect to `/login` | ✅ | ❌ 403 |
| `/me` | Redirect to `/login` | ❌ 403 | ✅ |
| `/me/payslips` | Redirect to `/login` | ❌ 403 | ✅ |

---

## 7. Error Handling

### Standard Error Response Format

All API errors return:
```json
{
  "detail": "Human-readable error message"
}
```

### Common Status Codes

| Code | Meaning | Frontend Action |
|---|---|---|
| `200` | Success | Display data |
| `201` | Created | Display success toast, navigate |
| `204` | Deleted (no content) | Display success toast, navigate back |
| `400` | Bad request / Business rule violation | Show `detail` as error message |
| `401` | Unauthorized (token expired/invalid) | Attempt token refresh, else redirect to `/login` |
| `403` | Forbidden (wrong role) | Show "access denied" |
| `404` | Not found | Show "not found" state |
| `409` | Conflict (duplicate email, etc.) | Show `detail` as form error |
| `422` | Validation error | Show field-level errors |
| `429` | Rate limited | Show "too many attempts" |

### Validation Error Format (`422`)

```json
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "Password must contain at least one number and one special character",
      "type": "value_error"
    }
  ]
}
```

The `detail` field for 422 errors is an **array** of objects. Each has `loc` (field path), `msg` (error text), and `type`.

---

## 8. Environment & Deployment Config

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Frontend `.env.production`
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

### Backend CORS (already configured)

The backend already allows requests from `http://localhost:3000` (Next.js dev). For production, update `CORS_ORIGINS` in the backend `.env`:

```
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
```

### Supported Tax Jurisdictions

The backend tax engine currently supports:
| Country Code | Currency | Authority | Tax Types |
|---|---|---|---|
| `NG` (Nigeria) | NGN | FIRS | PAYE, Pension (8% employee / 10% employer), NHF (2.5% of basic) |
| `KE` (Kenya) | KES | KRA | PAYE, NSSF (Tier I + II), NHIF |
| `GH` (Ghana) | GHS | GRA | PAYE, SSNIT (5.5% employee / 13% employer) |
| Any other | Any | N/A | Passthrough (0% deductions) with a warning |

---

> **💡 Quick start**: Build the login page first, then the dashboard. Those two pages alone will validate that auth and API connectivity work correctly. Then build outward from there.
