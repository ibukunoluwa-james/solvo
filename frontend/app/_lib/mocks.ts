/**
 * Mock backend responses. Every shape here is strict to the API contract in
 * docs/FRONTEND_API_HANDOFF.md — same fields, same names, same types. When
 * NEXT_PUBLIC_USE_MOCK=true, api.ts returns these objects via the same
 * function signatures it would use for real fetch calls, so swapping the
 * toggle requires zero code changes.
 *
 * IDs are deterministic slugs (not real UUIDs) so cross-screen navigation
 * works without a backend.
 */

import type {
  Advance,
  AuditTrailEntry,
  AuditTrailResponse,
  Company,
  DashboardSummary,
  Employee,
  PayrollEntry,
  PayrollPreview,
  PayrollRun,
  TaxSummaryItem,
  UserResponse,
} from "./types";

/* ─── Identity ──────────────────────────────────────────────────────── */

export const MOCK_USER_ADMIN: UserResponse = {
  id: "user-admin-sarah",
  email: "sarah@mavenly.com",
  full_name: "Sarah Chen",
  role: "employer",
  is_active: true,
  created_at: "2024-01-15T10:00:00Z",
};

export const MOCK_USER_EMPLOYEE: UserResponse = {
  id: "user-emp-adaeze",
  email: "adaeze@mavenly.co",
  full_name: "Adaeze Okeke",
  role: "employee",
  is_active: true,
  created_at: "2024-03-08T10:00:00Z",
};

/* ─── Company ───────────────────────────────────────────────────────── */

export const MOCK_COMPANY: Company = {
  id: "company-mavenly",
  name: "Mavenly Inc.",
  country_of_incorporation: "US",
  industry: "Technology",
  currency: "USD",
  kora_wallet_id: "kora_wallet_mavenly",
  created_at: "2024-01-15T10:00:00Z",
};

export const MOCK_DASHBOARD: DashboardSummary = {
  total_employees: 40,
  total_payroll_runs: 5,
  total_disbursed: 892140,
  total_tax_remitted: 210840,
  pending_advances: 2,
  countries_covered: ["NG", "KE", "ZA", "EG"],
  recent_payroll_status: "completed",
};

/* ─── Employees ─────────────────────────────────────────────────────── */

const baseEmp = (overrides: Partial<Employee>): Employee => ({
  id: "",
  user_id: "",
  company_id: "company-mavenly",
  full_name: "",
  country: "NG",
  employment_type: "full_time",
  gross_salary: 0,
  currency: "NGN",
  bank_account_number: null,
  bank_code: null,
  bank_name: null,
  mobile_wallet: null,
  tax_id: null,
  pension_id: null,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const MOCK_EMPLOYEES: Employee[] = [
  baseEmp({
    id: "emp-adaeze-okonkwo",
    user_id: "user-emp-adaeze",
    full_name: "Adaeze Okonkwo",
    country: "NG",
    gross_salary: 8700000,
    currency: "NGN",
    bank_account_number: "0123458821",
    bank_code: "058",
    bank_name: "GTBank",
    tax_id: "88241004721",
    created_at: "2024-03-08T10:00:00Z",
  }),
  baseEmp({
    id: "emp-faith-mwangi",
    user_id: "user-emp-faith",
    full_name: "Faith Mwangi",
    country: "KE",
    gross_salary: 698760,
    currency: "KES",
    bank_account_number: "1100007102",
    bank_code: "M-PESA",
    bank_name: "M-Pesa",
    created_at: "2024-05-12T10:00:00Z",
  }),
  baseEmp({
    id: "emp-mohamed-hassan",
    user_id: "user-emp-mohamed",
    full_name: "Mohamed Hassan",
    country: "EG",
    gross_salary: 187200,
    currency: "EGP",
    bank_account_number: "00118810",
    bank_code: "CIB",
    bank_name: "CIB",
    created_at: "2024-06-04T10:00:00Z",
  }),
  baseEmp({
    id: "emp-thabo-dlamini",
    user_id: "user-emp-thabo",
    full_name: "Thabo Dlamini",
    country: "ZA",
    employment_type: "contractor",
    gross_salary: 71400,
    currency: "ZAR",
    bank_account_number: "001145",
    bank_code: "SBSA",
    bank_name: "Standard Bank",
    created_at: "2024-07-10T10:00:00Z",
  }),
  baseEmp({
    id: "emp-yusuf-adeyemi",
    user_id: "user-emp-yusuf",
    full_name: "Yusuf Adeyemi",
    country: "NG",
    gross_salary: 8120000,
    currency: "NGN",
    bank_account_number: "0066612000",
    bank_code: "044",
    bank_name: "Access Bank",
    created_at: "2026-05-26T10:00:00Z",
  }),
  baseEmp({
    id: "emp-aisha-otieno",
    user_id: "user-emp-aisha",
    full_name: "Aisha Otieno",
    country: "KE",
    gross_salary: 634000,
    currency: "KES",
    bank_account_number: "0022440000",
    bank_code: "EQTY",
    bank_name: "Equity Bank",
    created_at: "2024-09-01T10:00:00Z",
  }),
  baseEmp({
    id: "emp-sara-naguib",
    user_id: "user-emp-sara",
    full_name: "Sara Naguib",
    country: "EG",
    employment_type: "contractor",
    gross_salary: 158000,
    currency: "EGP",
    bank_account_number: "00882244",
    bank_code: "CIB",
    bank_name: "CIB",
    created_at: "2024-10-15T10:00:00Z",
  }),
  baseEmp({
    id: "emp-lerato-khumalo",
    user_id: "user-emp-lerato",
    full_name: "Lerato Khumalo",
    country: "ZA",
    gross_salary: 76400,
    currency: "ZAR",
    bank_account_number: "00333900",
    bank_code: "FNB",
    bank_name: "FNB",
    created_at: "2024-11-20T10:00:00Z",
  }),
];

/* ─── Payroll runs ──────────────────────────────────────────────────── */

const baseRun = (overrides: Partial<PayrollRun>): PayrollRun => ({
  id: "",
  company_id: "company-mavenly",
  period_month: 6,
  period_year: 2026,
  status: "draft",
  total_gross: 0,
  total_net: 0,
  total_tax: 0,
  total_pension: 0,
  employee_count: 40,
  kora_batch_id: null,
  notes: null,
  initiated_at: "2026-05-27T10:00:00Z",
  completed_at: null,
  ...overrides,
});

export const MOCK_RUNS: PayrollRun[] = [
  baseRun({
    id: "run-june-2026",
    period_month: 6,
    period_year: 2026,
    status: "draft",
    total_gross: 184250,
    total_net: 140964,
    total_tax: 42180,
    total_pension: 9450,
    employee_count: 40,
    notes: "June 2026 payroll",
    initiated_at: "2026-05-27T10:00:00Z",
  }),
  baseRun({
    id: "run-may-2026",
    period_month: 5,
    period_year: 2026,
    status: "completed",
    total_gross: 176840,
    total_net: 135280,
    total_tax: 40460,
    total_pension: 9100,
    employee_count: 40,
    kora_batch_id: "kora_batch_may",
    initiated_at: "2026-05-01T00:00:00Z",
    completed_at: "2026-05-01T00:02:30Z",
  }),
  baseRun({
    id: "run-apr-2026",
    period_month: 4,
    period_year: 2026,
    status: "completed",
    total_gross: 171200,
    total_net: 131120,
    total_tax: 39120,
    total_pension: 8960,
    employee_count: 39,
    kora_batch_id: "kora_batch_apr",
    initiated_at: "2026-04-01T00:00:00Z",
    completed_at: "2026-04-01T00:02:14Z",
  }),
  baseRun({
    id: "run-mar-2026",
    period_month: 3,
    period_year: 2026,
    status: "completed",
    total_gross: 167540,
    total_net: 128400,
    total_tax: 38380,
    total_pension: 8760,
    employee_count: 38,
    kora_batch_id: "kora_batch_mar",
    initiated_at: "2026-03-01T00:00:00Z",
    completed_at: "2026-03-01T00:01:55Z",
  }),
];

/* ─── Payroll preview + entries ─────────────────────────────────────── */

const baseEntry = (overrides: Partial<PayrollEntry>): PayrollEntry => ({
  id: "",
  employee_id: "",
  gross_salary: 0,
  paye_tax: 0,
  pension_employee: 0,
  pension_employer: 0,
  nhf: 0,
  other_deductions: 0,
  net_salary: 0,
  currency: "NGN",
  kora_transfer_id: null,
  status: "pending",
  ...overrides,
});

const JUNE_ENTRIES: PayrollEntry[] = [
  baseEntry({
    id: "pe-adaeze-jun",
    employee_id: "emp-adaeze-okonkwo",
    employee_name: "Adaeze Okonkwo",
    employee_country: "NG",
    gross_salary: 9596000,
    paye_tax: 1919200,
    pension_employee: 767680,
    pension_employer: 959600,
    nhf: 239900,
    net_salary: 6669220,
    currency: "NGN",
  }),
  baseEntry({
    id: "pe-yusuf-jun",
    employee_id: "emp-yusuf-adeyemi",
    employee_name: "Yusuf Adeyemi",
    employee_country: "NG",
    gross_salary: 8978400,
    paye_tax: 1795680,
    pension_employee: 718272,
    pension_employer: 897840,
    nhf: 224460,
    net_salary: 6239988,
    currency: "NGN",
  }),
  baseEntry({
    id: "pe-faith-jun",
    employee_id: "emp-faith-mwangi",
    employee_name: "Faith Mwangi",
    employee_country: "KE",
    gross_salary: 698760,
    paye_tax: 139752,
    pension_employee: 41926,
    pension_employer: 41926,
    nhf: 0,
    net_salary: 517082,
    currency: "KES",
  }),
  baseEntry({
    id: "pe-aisha-jun",
    employee_id: "emp-aisha-otieno",
    employee_name: "Aisha Otieno",
    employee_country: "KE",
    gross_salary: 634000,
    paye_tax: 126800,
    pension_employee: 38040,
    pension_employer: 38040,
    nhf: 0,
    net_salary: 469160,
    currency: "KES",
  }),
];

const JUNE_TAX_SUMMARY: TaxSummaryItem[] = [
  { country: "NG", authority: "FIRS", tax_type: "PAYE", total_amount: 3714880, currency: "NGN" },
  { country: "NG", authority: "FIRS", tax_type: "Pension", total_amount: 1485952, currency: "NGN" },
  { country: "NG", authority: "FIRS", tax_type: "NHF", total_amount: 464360, currency: "NGN" },
  { country: "KE", authority: "KRA", tax_type: "PAYE", total_amount: 266552, currency: "KES" },
  { country: "KE", authority: "KRA", tax_type: "NSSF", total_amount: 79966, currency: "KES" },
];

const MAY_TAX_SUMMARY: TaxSummaryItem[] = [
  { country: "NG", authority: "FIRS", tax_type: "PAYE", total_amount: 3562420, currency: "NGN" },
  { country: "NG", authority: "FIRS", tax_type: "Pension", total_amount: 1424968, currency: "NGN" },
  { country: "KE", authority: "KRA", tax_type: "PAYE", total_amount: 252840, currency: "KES" },
];

export const MOCK_PREVIEW_BY_RUN: Record<string, PayrollPreview> = {
  "run-june-2026": {
    run_id: "run-june-2026",
    period: "2026-06",
    total_gross: 184250,
    total_net: 140964,
    total_tax: 42180,
    total_pension: 9450,
    employee_count: 40,
    entries: JUNE_ENTRIES,
    tax_summary: JUNE_TAX_SUMMARY,
  },
};

/* ─── Advances ──────────────────────────────────────────────────────── */

const baseAdv = (overrides: Partial<Advance>): Advance => ({
  id: "",
  employee_id: "",
  employee_name: null,
  amount: 0,
  currency: "NGN",
  reason: "other",
  description: null,
  status: "pending",
  employer_note: null,
  approved_amount: null,
  fee_percentage: 2.5,
  fee_amount: 0,
  kora_transfer_id: null,
  requested_at: "2026-06-03T12:00:00Z",
  resolved_at: null,
  disbursed_at: null,
  ...overrides,
});

export const MOCK_ADVANCES: Advance[] = [
  baseAdv({
    id: "adv-folake-adekunle",
    employee_id: "emp-adaeze-okonkwo",
    employee_name: "Folake Adekunle",
    amount: 1860000,
    currency: "NGN",
    reason: "medical",
    description: "Need to cover urgent medical expenses for a family member.",
    status: "pending",
    fee_amount: 46500,
    requested_at: "2026-06-03T10:30:00Z",
  }),
  baseAdv({
    id: "adv-faith-jun",
    employee_id: "emp-faith-mwangi",
    employee_name: "Faith Mwangi",
    amount: 70200,
    currency: "KES",
    reason: "rent",
    description: "Q3 rent payment",
    status: "pending",
    fee_amount: 1755,
    requested_at: "2026-06-03T07:15:00Z",
  }),
  baseAdv({
    id: "adv-lerato-may",
    employee_id: "emp-lerato-khumalo",
    employee_name: "Lerato Khumalo",
    amount: 5330,
    currency: "ZAR",
    reason: "emergency",
    status: "disbursed",
    approved_amount: 5330,
    fee_amount: 133,
    kora_transfer_id: "kora_xfer_lerato",
    requested_at: "2026-06-01T09:00:00Z",
    resolved_at: "2026-06-01T09:01:12Z",
    disbursed_at: "2026-06-01T09:01:30Z",
  }),
  baseAdv({
    id: "adv-mohamed-may",
    employee_id: "emp-mohamed-hassan",
    employee_name: "Mohamed Hassan",
    amount: 31000,
    currency: "EGP",
    reason: "equipment",
    description: "New laptop for remote work",
    status: "disbursed",
    approved_amount: 31000,
    fee_amount: 775,
    kora_transfer_id: "kora_xfer_mohamed",
    requested_at: "2026-05-31T11:00:00Z",
    resolved_at: "2026-05-31T11:00:42Z",
    disbursed_at: "2026-05-31T11:00:58Z",
  }),
];

/* ─── Compliance: audit trail ──────────────────────────────────────── */

const remit = (
  country: string,
  authority: string,
  tax_type: string,
  amount: number,
  currency: string,
  status: string = "remitted",
  reference: string | null = null
): AuditTrailEntry["remittances"][number] => ({
  country,
  authority,
  tax_type,
  amount,
  currency,
  status,
  reference,
});

const AUDIT_ENTRIES: AuditTrailEntry[] = [
  {
    run_id: "run-may-2026",
    period: "2026-05",
    status: "completed",
    total_gross: 176840,
    total_net: 135280,
    total_tax: 40460,
    employee_count: 40,
    initiated_at: "2026-05-01T00:00:00Z",
    completed_at: "2026-05-01T00:02:30Z",
    remittances: [
      remit("NG", "FIRS", "PAYE", 3562420, "NGN", "remitted", "FIRS-2026-05-PAYE"),
      remit("NG", "FIRS", "Pension", 1424968, "NGN", "remitted", "PFA-2026-05"),
      remit("KE", "KRA", "PAYE", 252840, "KES", "remitted", "KRA-2026-05-PAYE"),
      remit("KE", "KRA", "NSSF", 75852, "KES", "remitted", "NSSF-2026-05"),
      remit("ZA", "SARS", "PAYE", 8470, "ZAR", "remitted", "SARS-2026-05"),
      remit("EG", "ETA", "Income tax", 3960, "EGP", "remitted", "ETA-2026-05"),
    ],
  },
  {
    run_id: "run-apr-2026",
    period: "2026-04",
    status: "completed",
    total_gross: 171200,
    total_net: 131120,
    total_tax: 39120,
    employee_count: 39,
    initiated_at: "2026-04-01T00:00:00Z",
    completed_at: "2026-04-01T00:02:14Z",
    remittances: [
      remit("NG", "FIRS", "PAYE", 3448900, "NGN"),
      remit("KE", "KRA", "PAYE", 244018, "KES"),
    ],
  },
  {
    run_id: "run-mar-2026",
    period: "2026-03",
    status: "completed",
    total_gross: 167540,
    total_net: 128400,
    total_tax: 38380,
    employee_count: 38,
    initiated_at: "2026-03-01T00:00:00Z",
    completed_at: "2026-03-01T00:01:55Z",
    remittances: [
      remit("NG", "FIRS", "PAYE", 3380560, "NGN"),
      remit("KE", "KRA", "PAYE", 239100, "KES"),
    ],
  },
];

export const MOCK_AUDIT_TRAIL: AuditTrailResponse = {
  audit_trail: AUDIT_ENTRIES,
  total: AUDIT_ENTRIES.length,
};

/* ─── Compliance reports = list of runs with tax data ──────────────── */

export const MOCK_COMPLIANCE_REPORTS: PayrollRun[] = MOCK_RUNS.filter(
  (r) => r.status === "completed" || r.status === "previewed"
);

/* ─── Tokens (mock) ─────────────────────────────────────────────────── */

export const MOCK_TOKEN_ADMIN = {
  access_token: "mock.admin.access.token",
  refresh_token: "mock.admin.refresh.token",
  token_type: "bearer",
  role: "employer" as const,
  user_id: MOCK_USER_ADMIN.id,
};

export const MOCK_TOKEN_EMPLOYEE = {
  access_token: "mock.employee.access.token",
  refresh_token: "mock.employee.refresh.token",
  token_type: "bearer",
  role: "employee" as const,
  user_id: MOCK_USER_EMPLOYEE.id,
};
