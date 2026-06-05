/**
 * Solvo API client.
 *
 * Single entry point for every backend call. Switches between mock fixtures
 * and real `fetch()` calls based on `NEXT_PUBLIC_USE_MOCK`. Same function
 * signatures and return types in both modes — flipping the env var requires
 * zero changes in calling code.
 *
 * Endpoint paths and shapes are strict to docs/FRONTEND_API_HANDOFF.md.
 *
 * Token storage:
 *   - Mock mode: a fake token is set on login; calls don't depend on it.
 *   - Real mode: tokens live in localStorage. Every call attaches a Bearer
 *     header. A 401 triggers /auth/refresh once; if that fails the client
 *     clears tokens (the caller decides whether to redirect to /login).
 */

import * as mocks from "./mocks";
import type {
  Advance,
  AdvanceApprovalRequest,
  AdvanceCreateRequest,
  AdvanceListResponse,
  AdvanceRejectionRequest,
  AdvanceStatus,
  AuditTrailResponse,
  Company,
  CompanyUpdate,
  DashboardSummary,
  Employee,
  EmployeeCreateRequest,
  EmployeeListResponse,
  EmployeeUpdateRequest,
  EmployerRegisterRequest,
  LoginRequest,
  PayrollEntry,
  PayrollPreview,
  PayrollRun,
  PayrollRunCreateRequest,
  PayrollRunListResponse,
  RefreshRequest,
  Role,
  TaxSummaryItem,
  TokenResponse,
  UserResponse,
} from "./types";

/* ─── Mode + config ─────────────────────────────────────────────────── */

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const API_PREFIX = "/api/v1";

const MOCK_LATENCY_MS = 150;

const wait = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));

/* ─── Token storage (real mode) ────────────────────────────────────── */

const ACCESS_KEY = "solvo.access_token";
const REFRESH_KEY = "solvo.refresh_token";
const ROLE_KEY = "solvo.role";
const USER_KEY = "solvo.user_id";

const hasWindow = () => typeof window !== "undefined";

export function getAccessToken(): string | null {
  return hasWindow() ? window.localStorage.getItem(ACCESS_KEY) : null;
}

function getRefreshToken(): string | null {
  return hasWindow() ? window.localStorage.getItem(REFRESH_KEY) : null;
}

export function getStoredRole(): Role | null {
  if (!hasWindow()) return null;
  const v = window.localStorage.getItem(ROLE_KEY);
  return v === "employer" || v === "employee" ? v : null;
}

export function getStoredUserId(): string | null {
  return hasWindow() ? window.localStorage.getItem(USER_KEY) : null;
}

function setSession(t: TokenResponse) {
  if (!hasWindow()) return;
  window.localStorage.setItem(ACCESS_KEY, t.access_token);
  window.localStorage.setItem(REFRESH_KEY, t.refresh_token);
  window.localStorage.setItem(ROLE_KEY, t.role);
  window.localStorage.setItem(USER_KEY, t.user_id);
}

export function clearSession() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  window.localStorage.removeItem(USER_KEY);
}

/* ─── Errors ───────────────────────────────────────────────────────── */

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown, message?: string) {
    super(message ?? (typeof detail === "string" ? detail : `HTTP ${status}`));
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/* ─── Real-mode fetch wrapper ──────────────────────────────────────── */

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Skip Authorization header even if a token is present. */
  anonymous?: boolean;
  /** Internal — prevents infinite refresh loops. */
  _retry?: boolean;
}

async function rawFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}${API_PREFIX}${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!opts.anonymous) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  if (res.status === 401 && !opts.anonymous && !opts._retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return rawFetch<T>(path, { ...opts, _retry: true });
    clearSession();
    throw new ApiError(401, "Session expired");
  }

  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // body might be empty / non-JSON
  }

  if (!res.ok) {
    const detail =
      body && typeof body === "object" && body !== null && "detail" in body
        ? (body as { detail: unknown }).detail
        : body;
    throw new ApiError(res.status, detail);
  }

  return body as T;
}

async function tryRefresh(): Promise<boolean> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return false;
  try {
    const t = await rawFetch<TokenResponse>("/auth/refresh", {
      method: "POST",
      body: { refresh_token },
      anonymous: true,
      _retry: true,
    });
    setSession(t);
    return true;
  } catch {
    return false;
  }
}

/* ─── Mock / real picker ───────────────────────────────────────────── */

function whenMock<T>(value: T): Promise<T> {
  return wait(value);
}

/* ─── API surface ──────────────────────────────────────────────────── */

export const api = {
  /* AUTH ───────────────────────────────────────────────────────── */
  auth: {
    async login(req: LoginRequest): Promise<TokenResponse> {
      if (USE_MOCK) {
        const isEmployee = req.email.toLowerCase().includes("employee");
        const token = isEmployee ? mocks.MOCK_TOKEN_EMPLOYEE : mocks.MOCK_TOKEN_ADMIN;
        setSession(token);
        return whenMock(token);
      }
      const t = await rawFetch<TokenResponse>("/auth/login", {
        method: "POST",
        body: req,
        anonymous: true,
      });
      setSession(t);
      return t;
    },

    async registerEmployer(req: EmployerRegisterRequest): Promise<UserResponse> {
      if (USE_MOCK) return whenMock(mocks.MOCK_USER_ADMIN);
      return rawFetch<UserResponse>("/auth/register/employer", {
        method: "POST",
        body: req,
        anonymous: true,
      });
    },

    async refresh(req: RefreshRequest): Promise<TokenResponse> {
      if (USE_MOCK) return whenMock(mocks.MOCK_TOKEN_ADMIN);
      const t = await rawFetch<TokenResponse>("/auth/refresh", {
        method: "POST",
        body: req,
        anonymous: true,
      });
      setSession(t);
      return t;
    },

    async logout(): Promise<void> {
      const refresh_token = getRefreshToken();
      if (!USE_MOCK && refresh_token) {
        try {
          await rawFetch<void>("/auth/logout", {
            method: "POST",
            body: { refresh_token },
          });
        } catch {
          // best-effort
        }
      }
      clearSession();
    },
  },

  /* COMPANIES ──────────────────────────────────────────────────── */
  companies: {
    async getMe(): Promise<Company> {
      if (USE_MOCK) return whenMock(mocks.MOCK_COMPANY);
      return rawFetch<Company>("/companies/me");
    },

    async updateMe(req: CompanyUpdate): Promise<Company> {
      if (USE_MOCK) return whenMock({ ...mocks.MOCK_COMPANY, ...req });
      return rawFetch<Company>("/companies/me", { method: "PUT", body: req });
    },

    async getDashboard(): Promise<DashboardSummary> {
      if (USE_MOCK) return whenMock(mocks.MOCK_DASHBOARD);
      return rawFetch<DashboardSummary>("/companies/me/dashboard");
    },
  },

  /* EMPLOYEES ──────────────────────────────────────────────────── */
  employees: {
    async list(params?: { skip?: number; limit?: number }): Promise<EmployeeListResponse> {
      if (USE_MOCK) {
        return whenMock({ employees: mocks.MOCK_EMPLOYEES, total: mocks.MOCK_EMPLOYEES.length });
      }
      const qs = new URLSearchParams();
      if (params?.skip !== undefined) qs.set("skip", String(params.skip));
      if (params?.limit !== undefined) qs.set("limit", String(params.limit));
      const path = "/employees" + (qs.toString() ? `/?${qs}` : "/");
      return rawFetch<EmployeeListResponse>(path);
    },

    async get(id: string): Promise<Employee> {
      if (USE_MOCK) {
        const e = mocks.MOCK_EMPLOYEES.find((x) => x.id === id) ?? mocks.MOCK_EMPLOYEES[0];
        return whenMock(e);
      }
      return rawFetch<Employee>(`/employees/${id}`);
    },

    async create(req: EmployeeCreateRequest): Promise<Employee> {
      if (USE_MOCK) {
        const stub: Employee = {
          id: `emp-${Date.now()}`,
          user_id: `user-${Date.now()}`,
          company_id: mocks.MOCK_COMPANY.id,
          full_name: req.full_name,
          country: req.country,
          employment_type: (req.employment_type as Employee["employment_type"]) ?? "full_time",
          gross_salary: req.gross_salary,
          currency: req.currency,
          bank_account_number: req.bank_account_number ?? null,
          bank_code: req.bank_code ?? null,
          bank_name: req.bank_name ?? null,
          mobile_wallet: req.mobile_wallet ?? null,
          tax_id: req.tax_id ?? null,
          pension_id: req.pension_id ?? null,
          created_at: new Date().toISOString(),
        };
        return whenMock(stub);
      }
      return rawFetch<Employee>("/employees/", { method: "POST", body: req });
    },

    async update(id: string, req: EmployeeUpdateRequest): Promise<Employee> {
      if (USE_MOCK) {
        const existing = mocks.MOCK_EMPLOYEES.find((x) => x.id === id) ?? mocks.MOCK_EMPLOYEES[0];
        return whenMock({ ...existing, ...req } as Employee);
      }
      return rawFetch<Employee>(`/employees/${id}`, { method: "PUT", body: req });
    },

    async remove(id: string): Promise<void> {
      if (USE_MOCK) return whenMock(undefined);
      return rawFetch<void>(`/employees/${id}`, { method: "DELETE" });
    },

    async myProfile(): Promise<Employee> {
      if (USE_MOCK) return whenMock(mocks.MOCK_EMPLOYEES[0]);
      return rawFetch<Employee>("/employees/me/profile");
    },

    async myPayslips(): Promise<PayrollEntry[]> {
      if (USE_MOCK) {
        const slips: PayrollEntry[] = mocks.MOCK_RUNS
          .filter((r) => r.status === "completed")
          .map((r, i) => ({
            id: `pe-me-${r.id}`,
            employee_id: mocks.MOCK_EMPLOYEES[0].id,
            employee_name: mocks.MOCK_EMPLOYEES[0].full_name,
            employee_country: mocks.MOCK_EMPLOYEES[0].country,
            gross_salary: 9596000,
            paye_tax: 1919200,
            pension_employee: 767680,
            pension_employer: 959600,
            nhf: 239900,
            other_deductions: 0,
            net_salary: 6669220,
            currency: "NGN",
            kora_transfer_id: `kora_xfer_me_${i}`,
            status: "settled",
          }));
        return whenMock(slips);
      }
      return rawFetch<PayrollEntry[]>("/employees/me/payslips");
    },
  },

  /* PAYROLL ────────────────────────────────────────────────────── */
  payroll: {
    async listRuns(params?: { skip?: number; limit?: number }): Promise<PayrollRunListResponse> {
      if (USE_MOCK) {
        return whenMock({ runs: mocks.MOCK_RUNS, total: mocks.MOCK_RUNS.length });
      }
      const qs = new URLSearchParams();
      if (params?.skip !== undefined) qs.set("skip", String(params.skip));
      if (params?.limit !== undefined) qs.set("limit", String(params.limit));
      const path = "/payroll/runs" + (qs.toString() ? `?${qs}` : "");
      return rawFetch<PayrollRunListResponse>(path);
    },

    async createRun(req: PayrollRunCreateRequest): Promise<PayrollRun> {
      if (USE_MOCK) {
        const stub: PayrollRun = {
          id: `run-${req.period_year}-${req.period_month}`,
          company_id: mocks.MOCK_COMPANY.id,
          period_month: req.period_month,
          period_year: req.period_year,
          status: "draft",
          total_gross: 0,
          total_net: 0,
          total_tax: 0,
          total_pension: 0,
          employee_count: 0,
          kora_batch_id: null,
          notes: req.notes ?? null,
          initiated_at: new Date().toISOString(),
          completed_at: null,
        };
        return whenMock(stub);
      }
      return rawFetch<PayrollRun>("/payroll/runs", { method: "POST", body: req });
    },

    async getRun(id: string): Promise<PayrollRun> {
      if (USE_MOCK) {
        const run = mocks.MOCK_RUNS.find((r) => r.id === id) ?? mocks.MOCK_RUNS[0];
        return whenMock(run);
      }
      return rawFetch<PayrollRun>(`/payroll/runs/${id}`);
    },

    async previewRun(id: string): Promise<PayrollPreview> {
      if (USE_MOCK) {
        const preview =
          mocks.MOCK_PREVIEW_BY_RUN[id] ?? mocks.MOCK_PREVIEW_BY_RUN["run-june-2026"];
        return whenMock(preview);
      }
      return rawFetch<PayrollPreview>(`/payroll/runs/${id}/preview`, { method: "POST" });
    },

    async executeRun(id: string): Promise<PayrollRun> {
      if (USE_MOCK) {
        const run = mocks.MOCK_RUNS.find((r) => r.id === id) ?? mocks.MOCK_RUNS[0];
        return whenMock({ ...run, status: "processing" });
      }
      return rawFetch<PayrollRun>(`/payroll/runs/${id}/execute`, { method: "POST" });
    },

    async getEntries(id: string): Promise<PayrollEntry[]> {
      if (USE_MOCK) {
        const preview = mocks.MOCK_PREVIEW_BY_RUN[id] ?? mocks.MOCK_PREVIEW_BY_RUN["run-june-2026"];
        return whenMock(preview.entries);
      }
      return rawFetch<PayrollEntry[]>(`/payroll/runs/${id}/entries`);
    },

    async getTaxSummary(id: string): Promise<TaxSummaryItem[]> {
      if (USE_MOCK) {
        const preview = mocks.MOCK_PREVIEW_BY_RUN[id] ?? mocks.MOCK_PREVIEW_BY_RUN["run-june-2026"];
        return whenMock(preview.tax_summary);
      }
      return rawFetch<TaxSummaryItem[]>(`/payroll/runs/${id}/tax-summary`);
    },
  },

  /* ADVANCES ───────────────────────────────────────────────────── */
  advances: {
    async list(params?: {
      skip?: number;
      limit?: number;
      status_filter?: AdvanceStatus;
    }): Promise<AdvanceListResponse> {
      if (USE_MOCK) {
        const filtered = params?.status_filter
          ? mocks.MOCK_ADVANCES.filter((a) => a.status === params.status_filter)
          : mocks.MOCK_ADVANCES;
        return whenMock({ advances: filtered, total: filtered.length });
      }
      const qs = new URLSearchParams();
      if (params?.skip !== undefined) qs.set("skip", String(params.skip));
      if (params?.limit !== undefined) qs.set("limit", String(params.limit));
      if (params?.status_filter) qs.set("status_filter", params.status_filter);
      const path = "/advances" + (qs.toString() ? `/?${qs}` : "/");
      return rawFetch<AdvanceListResponse>(path);
    },

    async get(id: string): Promise<Advance> {
      if (USE_MOCK) {
        const a = mocks.MOCK_ADVANCES.find((x) => x.id === id) ?? mocks.MOCK_ADVANCES[0];
        return whenMock(a);
      }
      return rawFetch<Advance>(`/advances/${id}`);
    },

    async create(req: AdvanceCreateRequest): Promise<Advance> {
      if (USE_MOCK) {
        const stub: Advance = {
          id: `adv-${Date.now()}`,
          employee_id: mocks.MOCK_EMPLOYEES[0].id,
          employee_name: mocks.MOCK_EMPLOYEES[0].full_name,
          amount: req.amount,
          currency: req.currency,
          reason: req.reason,
          description: req.description ?? null,
          status: "pending",
          employer_note: null,
          approved_amount: null,
          fee_percentage: 2.5,
          fee_amount: req.amount * 0.025,
          kora_transfer_id: null,
          requested_at: new Date().toISOString(),
          resolved_at: null,
          disbursed_at: null,
        };
        return whenMock(stub);
      }
      return rawFetch<Advance>("/advances/", { method: "POST", body: req });
    },

    async approve(id: string, req: AdvanceApprovalRequest = {}): Promise<Advance> {
      if (USE_MOCK) {
        const a = mocks.MOCK_ADVANCES.find((x) => x.id === id) ?? mocks.MOCK_ADVANCES[0];
        const approved_amount = req.approved_amount ?? a.amount;
        return whenMock({
          ...a,
          status: "approved",
          approved_amount,
          fee_amount: approved_amount * (a.fee_percentage / 100),
          employer_note: req.employer_note ?? null,
          resolved_at: new Date().toISOString(),
        });
      }
      return rawFetch<Advance>(`/advances/${id}/approve`, { method: "PUT", body: req });
    },

    async reject(id: string, req: AdvanceRejectionRequest): Promise<Advance> {
      if (USE_MOCK) {
        const a = mocks.MOCK_ADVANCES.find((x) => x.id === id) ?? mocks.MOCK_ADVANCES[0];
        return whenMock({
          ...a,
          status: "rejected",
          employer_note: req.employer_note,
          resolved_at: new Date().toISOString(),
        });
      }
      return rawFetch<Advance>(`/advances/${id}/reject`, { method: "PUT", body: req });
    },

    async disburse(id: string): Promise<Advance> {
      if (USE_MOCK) {
        const a = mocks.MOCK_ADVANCES.find((x) => x.id === id) ?? mocks.MOCK_ADVANCES[0];
        return whenMock({
          ...a,
          status: "disbursed",
          kora_transfer_id: `kora_xfer_${Date.now()}`,
          disbursed_at: new Date().toISOString(),
        });
      }
      return rawFetch<Advance>(`/advances/${id}/disburse`, { method: "POST" });
    },
  },

  /* COMPLIANCE ─────────────────────────────────────────────────── */
  compliance: {
    async listReports(): Promise<PayrollRun[]> {
      if (USE_MOCK) return whenMock(mocks.MOCK_COMPLIANCE_REPORTS);
      return rawFetch<PayrollRun[]>("/compliance/reports");
    },

    async getReport(id: string): Promise<TaxSummaryItem[]> {
      if (USE_MOCK) {
        const preview = mocks.MOCK_PREVIEW_BY_RUN[id] ?? mocks.MOCK_PREVIEW_BY_RUN["run-june-2026"];
        return whenMock(preview.tax_summary);
      }
      return rawFetch<TaxSummaryItem[]>(`/compliance/reports/${id}`);
    },

    async auditTrail(params?: { skip?: number; limit?: number }): Promise<AuditTrailResponse> {
      if (USE_MOCK) return whenMock(mocks.MOCK_AUDIT_TRAIL);
      const qs = new URLSearchParams();
      if (params?.skip !== undefined) qs.set("skip", String(params.skip));
      if (params?.limit !== undefined) qs.set("limit", String(params.limit));
      const path = "/compliance/audit-trail" + (qs.toString() ? `?${qs}` : "");
      return rawFetch<AuditTrailResponse>(path);
    },
  },
};

/* ─── Convenience flag for debugging ────────────────────────────────── */

export const apiMode = USE_MOCK ? "mock" : "real";
export const apiBaseUrl = `${API_BASE}${API_PREFIX}`;
