# Backend gaps — what the frontend needs that the API doesn't provide

The frontend is wired in strict mode: every screen calls a documented endpoint
in `docs/FRONTEND_API_HANDOFF.md` and renders only the fields that endpoint
returns. This document lists the points where the screens want more than the
documented contract gives.

Flip `NEXT_PUBLIC_USE_MOCK=false` and point `NEXT_PUBLIC_API_URL` at the real
backend to integrate. The items below will either degrade gracefully ("—" or
hidden sections) or fall back to local fixtures (Disbursements only).

---

## 1. Missing endpoints

### 1.1 Disbursements list — `GET /api/v1/disbursements`
**Used by:** `/disbursements` (the "Live tracker" screen)

The dashboard spec describes a transfer-level view (rail, progress bar,
settlement time, retry counter). The API has no equivalent — the closest is
`GET /payroll/runs/{id}/entries` which returns PayrollEntry per employee but
without rail metadata, real-time status, or settlement timing.

**Suggested shape:**
```ts
interface Disbursement {
  id: string;
  payroll_entry_id: string;
  employee_id: string;
  employee_name: string;
  recipient_bank: string;          // "GTBank ····8821"
  rail: string;                    // "NIP", "M-Pesa", "EFT", "InstaPay"
  country: string;                 // ISO 2
  amount: number;
  currency: string;
  status: "queued" | "sending" | "settled" | "retrying" | "failed";
  progress_pct: number;            // 0-100
  retry_count: number;
  settlement_seconds: number | null;
  initiated_at: string;
  settled_at: string | null;
}

interface DisbursementSummary {
  median_settlement_seconds: number;
  p99_settlement_seconds: number;
  settled: number;
  in_flight: number;
  retrying: number;
}
```

**Status today:** `/disbursements` reads from a local fixture in the page file.
It will not change when the backend toggle flips. Decide whether to (a) add
this endpoint, (b) drop the screen, or (c) repurpose it to surface PayrollEntry
status from the existing endpoint.

---

### 1.2 Activity feed — `GET /api/v1/activity`
**Used by:** Overview (`/`)

The original Overview spec called for a recent-activity feed (settled,
advance approved, employee onboarded, retry triggered). The API has no
generic activity stream.

**Workaround in place:** The Overview now shows pending advances from
`GET /advances/?status_filter=pending` as the closest live feed.

**Suggested shape:**
```ts
interface ActivityEvent {
  id: string;
  kind: "payroll_settled" | "advance_approved" | "employee_onboarded" |
        "disbursement_retried" | "compliance_filed";
  actor_id: string | null;
  actor_name: string | null;
  subject_name: string | null;
  amount: number | null;
  currency: string | null;
  occurred_at: string;
}
```

---

### 1.3 Advance eligibility — `GET /api/v1/advances/eligibility`
**Used by:** `/me` (advance-available hero), `/advances/request` (eligible-amount hero)

The handoff says max advance = 50% of the employee's net salary, enforced
on `POST /advances/`. There's no read endpoint to ask "what am I eligible
for right now."

**Status today:** `/me` no longer renders the "Advance available" hero cell.
`/advances/request` no longer renders the eligibility hero. The form posts
the amount as the employee types it; the backend rejects with a 400 if it
exceeds 50%.

**Suggested shape:**
```ts
interface AdvanceEligibility {
  eligible_amount: number;
  currency: string;
  basis_period: string;            // "2026-05"
  basis_net_salary: number;
  cap_pct: number;                 // 50
  has_active_advance: boolean;
}
```

---

### 1.4 Funding sources — `GET /api/v1/funding-sources`
**Used by:** `/payroll/new` (Funding card)

The original spec showed a USD operating account with available balance.
The Company model has `kora_wallet_id` but no balance, name, or alternates.

**Status today:** The funding card was dropped from the slimmer
`/payroll/new` form. Only month / year / notes are collected.

---

## 2. Missing fields on existing endpoints

### 2.1 `Employee` schema
The screens for `/employees/[id]`, `/me`, and the Add-Employee form want
these but the schema does not include them:

| Field                | Used by                          |
| -------------------- | -------------------------------- |
| `email`              | `/people` rows, `/employees/[id]`|
| `phone`              | `/employees/[id]`, `/me`         |
| `date_of_birth`      | `/employees/[id]`                |
| `address`            | `/employees/[id]`                |
| `job_title`          | `/employees/[id]`                |
| `manager_id`         | `/employees/[id]`                |
| `start_date`         | `/employees/[id]`, hero "Joined" |
| `contract_end_date`  | `/employees/[id]` (contractors)  |
| `is_active`          | `/employees/[id]` Active pill    |

**Status today:** all dropped from the UI; pages show `—` where the field used
to live. The Add-Employee form only collects what `EmployeeCreateRequest`
accepts.

### 2.2 `PayrollRun` / `PayrollPreview`
| Field           | Used by                          |
| --------------- | -------------------------------- |
| `solvo_fee`     | `/payroll/[id]` summary card     |
| `fx_cost`       | `/payroll/[id]` summary card     |
| `pay_date`      | `/payroll/new` form              |
| `cadence`       | `/payroll/new` form              |

**Status today:** Solvo fee + FX cost cells dropped from the pay-run summary.
The `/payroll/new` form no longer asks for pay_date / cadence.

### 2.3 `Advance` schema
| Field                | Used by                          |
| -------------------- | -------------------------------- |
| `risk_signals[]`     | `/advances/[id]` (4 signal rows) |
| `repayment_schedule` | `/advances/[id]` (3-row table)   |
| `pct_of_net`         | `/advances/[id]` metric strip    |

**Status today:** Risk-signals block and Repayment schedule block dropped
from `/advances/[id]`. The detail page now shows the request, fee, decision
actions, and a Kora transfer timeline.

### 2.4 `Company` schema (Settings form)
The original Settings spec had fields the API doesn't store:
`legal_name`, `ein_tax_id`, `headquarters_address`, `billing_email`,
`time_zone`, `primary_admin`, `logo_url`.

**Status today:** Settings form only edits the four `CompanyUpdate` fields
(`name`, `industry`, `currency`, `kora_wallet_id`). The sub-nav rail
(Billing, Team, API keys, Webhooks, SSO) is decorative — there are no
endpoints behind it.

---

## 3. Shape mismatches

### 3.1 `/compliance/audit` vs `GET /compliance/audit-trail`
The endpoint returns **run-level** audit (each run with its remittances). The
original spec described an **event-stream** UI (sign-ins, employee changes,
API key creation, IP addresses).

**Status today:** the screen now renders the run-level shape the endpoint
returns (period → run header → remittances table). The fake event stream is
gone.

### 3.2 Business-rule mismatch — advance threshold
| Source                       | Threshold |
| ---------------------------- | --------- |
| Original `/advances/request` | 40% of net salary |
| API enforcement              | 50% of net salary |

**Status today:** the slider/eligibility hero has been removed (see §1.3),
so this is moot until §1.3 is decided.

---

## 4. Auth on server components — RESOLVED (option b)

The data-fetching pages used to be server components that called `api.*` at
render time. In mock mode that worked immediately, but with
`NEXT_PUBLIC_USE_MOCK=false` the `Authorization: Bearer <token>` header is read
from `localStorage`, which only exists on the client.

**What was done:** the data-fetch pages were converted to **client components**
(option b) that fetch through the shared `useApi` hook
(`app/_lib/useApi.tsx`). This matches the api client's documented design
(tokens in localStorage, Bearer header per call, refresh-on-401) and works
because the backend sends permissive CORS headers for browser calls. The hook
renders loading / error states and redirects to `/login` on a missing session
or a 401.

The alternative (a) — migrating tokens to **httpOnly cookies** read on the
server via `next/headers` `cookies()` — remains the cleaner SSR idiom if the
app later needs server-rendered authenticated pages, but it would require
server-side refresh handling (the access token lives 30 min) and was not needed
here.
