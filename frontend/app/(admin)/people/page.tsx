"use client";

import Link from "next/link";
import Header from "../../_components/Header";
import { Avatar, Button, Card } from "../../_components/ui";
import { api } from "../../_lib/api";
import { useApi, PageStatus } from "../../_lib/useApi";

const CC_TO_NAME: Record<string, string> = {
  NG: "Nigeria",
  KE: "Kenya",
  ZA: "South Africa",
  EG: "Egypt",
  GH: "Ghana",
  RW: "Rwanda",
  UG: "Uganda",
  TZ: "Tanzania",
  US: "United States",
};

const fmtSalary = (n: number, currency: string) =>
  `${currency} ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function PeoplePage() {
  const { data, loading, error, reload } = useApi(() => api.employees.list({ limit: 50 }));
  if (!data) return <PageStatus loading={loading} error={error} onRetry={reload} />;

  const { employees, total } = data;
  const empCount = employees.filter((e) => e.employment_type === "full_time").length;
  const ctrCount = employees.filter((e) => e.employment_type === "contractor").length;

  return (
    <>
      <Header
        title="People"
        right={
          <Button icon="ti-plus" variant="primary" href="/employees/add">
            Add person
          </Button>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="max-w-[1280px]">
          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-[18px]">
            <div className="relative w-full max-w-[280px]">
              <i className="ti ti-search absolute left-[10px] top-1/2 -translate-y-1/2 text-[13px] text-text-tertiary" />
              <input
                type="text"
                placeholder="Search by name"
                className="w-full bg-card border border-border rounded-[5px] pl-[30px] pr-3 py-[6px] text-[12px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-strong"
              />
            </div>

            <div className="flex items-center gap-1">
              <Chip active>
                All <span className="tabular text-text-tertiary ml-[2px]">{total}</span>
              </Chip>
              <Chip>
                Employees <span className="tabular text-text-tertiary/80 ml-[2px]">{empCount}</span>
              </Chip>
              <Chip>
                Contractors <span className="tabular text-text-tertiary/80 ml-[2px]">{ctrCount}</span>
              </Chip>
            </div>

            <div className="flex-1" />

            <Button variant="secondary" icon="ti-filter">Country</Button>
            <Button variant="secondary" icon="ti-adjustments">Filter</Button>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div
              className="grid items-center bg-muted border-b border-border px-[22px] py-[11px] text-text-tertiary"
              style={{
                gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr 110px",
                columnGap: "16px",
                fontSize: "10.5px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <div>Name</div>
              <div>Country</div>
              <div>Type</div>
              <div className="text-right">Gross salary</div>
              <div className="text-right">Bank</div>
            </div>

            {employees.map((p, i) => (
              <Link
                key={p.id}
                href={`/employees/${p.id}`}
                className={`grid items-center px-[22px] py-[14px] hover:bg-canvas transition-colors ${
                  i < employees.length - 1 ? "border-b border-border-subtle" : ""
                }`}
                style={{
                  gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr 110px",
                  columnGap: "16px",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={p.full_name} country={CC_TO_NAME[p.country] ?? p.country} size={28} />
                  <div className="min-w-0">
                    <div className="text-[12.5px] text-text-primary truncate leading-tight">
                      {p.full_name}
                    </div>
                    <div className="text-[11px] text-text-quaternary truncate leading-tight tabular">
                      {p.tax_id ? `Tax ID ${p.tax_id}` : "—"}
                    </div>
                  </div>
                </div>
                <div className="text-[12.5px] text-text-secondary">
                  {CC_TO_NAME[p.country] ?? p.country}
                </div>
                <div className="text-[12.5px] text-text-secondary">
                  {p.employment_type === "contractor" ? "Contractor" : "Employee"}
                </div>
                <div className="text-[12.5px] tabular text-text-primary text-right">
                  {fmtSalary(p.gross_salary, p.currency)}
                </div>
                <div className="text-[11.5px] text-text-tertiary text-right tabular truncate">
                  {p.bank_name ? `${p.bank_name} ····${(p.bank_account_number ?? "").slice(-4)}` : "—"}
                </div>
              </Link>
            ))}
          </Card>

          {/* Pagination footer */}
          <div className="flex items-center justify-between mt-[14px]">
            <span className="text-[11.5px] text-text-tertiary tabular">
              Showing {employees.length} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled
                className="px-[9px] py-[5px] rounded-[5px] text-text-quaternary cursor-not-allowed"
              >
                <i className="ti ti-chevron-left text-[14px]" />
              </button>
              <button className="px-[9px] py-[5px] rounded-[5px] text-text-secondary hover:bg-subtle">
                <i className="ti ti-chevron-right text-[14px]" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Chip({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      className={`text-[12px] font-medium leading-none px-[10px] py-[6px] rounded-[5px] transition-colors ${
        active
          ? "text-text-primary border border-border bg-card"
          : "text-text-tertiary border border-transparent hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
