/**
 * TypeScript interfaces mirroring the Solvo backend API contract.
 * Source of truth: docs/FRONTEND_API_HANDOFF.md §4.
 *
 * Strict mode: every field here exists in the documented API response.
 * If a screen needs a field that is NOT here, it cannot come from the backend
 * — see BACKEND_GAPS.md.
 */

/* ─── Auth ──────────────────────────────────────────────────────────── */

export interface LoginRequest {
  email: string;
  password: string;
}

export type Role = "employer" | "employee";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: Role;
  user_id: string;
}

export interface EmployerRegisterRequest {
  email: string;
  password: string;
  full_name: string;
  company_name: string;
  country_of_incorporation: string;
  industry?: string;
  currency?: string;
}

export interface EmployeeRegisterRequest {
  email: string;
  password: string;
  full_name: string;
  company_id: string;
  country: string;
  employment_type?: "full_time" | "contractor";
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
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

/* ─── Company ───────────────────────────────────────────────────────── */

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

/* ─── Employee ──────────────────────────────────────────────────────── */

export interface Employee {
  id: string;
  user_id: string;
  company_id: string;
  full_name: string;
  country: string;
  employment_type: "full_time" | "contractor";
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
  employment_type?: "full_time" | "contractor";
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
  employment_type?: "full_time" | "contractor";
  gross_salary?: number;
  currency?: string;
  bank_account_number?: string;
  bank_code?: string;
  bank_name?: string;
  mobile_wallet?: string;
  tax_id?: string;
  pension_id?: string;
}

/* ─── Payroll ───────────────────────────────────────────────────────── */

export type PayrollStatus =
  | "draft"
  | "previewed"
  | "processing"
  | "completed"
  | "failed";

export interface PayrollRun {
  id: string;
  company_id: string;
  period_month: number;
  period_year: number;
  status: PayrollStatus;
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
  period_month: number;
  period_year: number;
  notes?: string;
}

export type PayrollEntryStatus =
  | "pending"
  | "processing"
  | "settled"
  | "failed";

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
  status: PayrollEntryStatus;
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

/* ─── Advances ──────────────────────────────────────────────────────── */

export type AdvanceStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "disbursed"
  | "repaid";

export interface Advance {
  id: string;
  employee_id: string;
  employee_name: string | null;
  amount: number;
  currency: string;
  reason: string;
  description: string | null;
  status: AdvanceStatus;
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
  reason: "medical" | "equipment" | "emergency" | "rent" | "other";
  description?: string;
}

export interface AdvanceApprovalRequest {
  approved_amount?: number;
  employer_note?: string;
}

export interface AdvanceRejectionRequest {
  employer_note: string;
}

/* ─── Compliance ────────────────────────────────────────────────────── */

export interface AuditRemittance {
  country: string;
  authority: string;
  tax_type: string;
  amount: number;
  currency: string;
  status: string;
  reference: string | null;
}

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

export interface AuditTrailResponse {
  audit_trail: AuditTrailEntry[];
  total: number;
}
