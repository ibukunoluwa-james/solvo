import Link from "next/link";
import Header from "../../../_components/Header";
import { Avatar, Button, Card, Pill } from "../../../_components/ui";
import { api } from "../../../_lib/api";

const CC_TO_NAME: Record<string, string> = {
  NG: "Nigeria",
  KE: "Kenya",
  ZA: "South Africa",
  EG: "Egypt",
  GH: "Ghana",
  US: "United States",
};

const formatJoined = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const formatSalary = (n: number, currency: string) =>
  `${currency} ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const TABS = [
  { key: "profile", label: "Profile", active: true },
  { key: "contract", label: "Contract" },
  { key: "compensation", label: "Compensation" },
  { key: "payslips", label: "Payslips" },
  { key: "advances", label: "Advances" },
] as const;

type PageProps = { params: Promise<{ id: string }> };

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const e = await api.employees.get(id);

  const countryName = CC_TO_NAME[e.country] ?? e.country;
  const joined = formatJoined(e.created_at);

  // Employee schema doesn't expose is_active or contract dates — we render
  // "Active" by convention since this endpoint returns only live employees.

  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <Link href="/people" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              People
            </Link>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">{e.full_name}</span>
          </div>
        }
        right={
          <>
            <button className="w-[32px] h-[32px] flex items-center justify-center rounded-[5px] border border-border-strong text-text-secondary hover:bg-subtle">
              <i className="ti ti-dots text-[14px]" />
            </button>
            <Button variant="primary">Edit profile</Button>
          </>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[20px] max-w-[1200px]">
          {/* Profile header card */}
          <Card className="px-[26px] py-[24px]">
            <div
              className="grid items-center"
              style={{ gridTemplateColumns: "auto 1fr auto", gap: "22px" }}
            >
              <Avatar name={e.full_name} country={countryName} size={56} />
              <div>
                <div className="flex items-center gap-3 mb-[4px]">
                  <h2
                    className="text-[19px] font-medium text-text-primary"
                    style={{ letterSpacing: "-0.015em" }}
                  >
                    {e.full_name}
                  </h2>
                  <Pill tone="success">Active</Pill>
                </div>
                <div className="text-[12.5px] text-text-tertiary tabular">
                  {e.employment_type === "contractor" ? "Contractor" : "Employee"} · {countryName} · Joined {joined}
                </div>
              </div>
              <div className="text-right">
                <div className="label mb-[4px]">Monthly gross</div>
                <div
                  className="text-[20px] font-medium text-text-primary tabular leading-none"
                  style={{ letterSpacing: "-0.015em" }}
                >
                  {formatSalary(e.gross_salary, e.currency)}
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs + panel */}
          <div>
            <div className="bg-card border border-border border-b-0 rounded-t-[8px] px-[22px] flex items-center gap-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`flex items-center gap-1 px-[14px] py-[12px] text-[12.5px] border-b-2 transition-colors ${
                    t.active
                      ? "border-text-primary text-text-primary font-medium"
                      : "border-transparent text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div
              className="bg-card border border-border rounded-b-[8px] grid"
              style={{ gridTemplateColumns: "1.4fr 1px 1fr" }}
            >
              {/* Left: Personal info */}
              <div className="px-[26px] py-[22px]">
                <div className="label mb-4">Personal</div>
                <dl
                  className="grid"
                  style={{
                    gridTemplateColumns: "130px 1fr",
                    rowGap: "12px",
                    columnGap: "16px",
                  }}
                >
                  <Detail label="Full name" value={e.full_name} />
                  <Detail label="Country" value={countryName} />
                  <Detail label="Employment" value={e.employment_type === "contractor" ? "Contractor" : "Full-time"} />
                  <Detail label="Currency" value={e.currency} />
                  <Detail label="Tax ID" value={e.tax_id ?? "—"} />
                  <Detail label="Pension ID" value={e.pension_id ?? "—"} />
                  <Detail label="Joined" value={joined} />
                </dl>
              </div>

              <div className="bg-border" />

              {/* Right: Payout */}
              <div className="px-[26px] py-[22px]">
                <div className="label mb-4">Payout</div>

                {e.bank_account_number ? (
                  <div className="bg-canvas border border-border rounded-[6px] px-[16px] py-[14px] flex items-center gap-3">
                    <div className="w-[30px] h-[30px] bg-card border border-border rounded-[5px] flex items-center justify-center">
                      <i className="ti ti-building-bank text-[14px] text-text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-medium text-text-primary leading-tight">
                        {e.bank_name ?? "Bank"}
                      </div>
                      <div className="text-[11px] text-text-tertiary leading-tight tabular">
                        Account ····{e.bank_account_number.slice(-4)}
                      </div>
                    </div>
                    <Pill tone="success">On file</Pill>
                  </div>
                ) : (
                  <div className="text-[12px] text-text-tertiary">No bank on file</div>
                )}

                {e.mobile_wallet && (
                  <div className="mt-3 bg-canvas border border-border rounded-[6px] px-[16px] py-[14px] flex items-center gap-3">
                    <div className="w-[30px] h-[30px] bg-card border border-border rounded-[5px] flex items-center justify-center">
                      <i className="ti ti-device-mobile text-[14px] text-text-primary" />
                    </div>
                    <div className="text-[12px] text-text-primary tabular">
                      {e.mobile_wallet}
                    </div>
                  </div>
                )}

                <div className="mt-[14px]">
                  <Button variant="secondary" icon="ti-plus">Add backup</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[12px] text-text-tertiary">{label}</dt>
      <dd className="text-[12.5px] text-text-primary tabular">{value}</dd>
    </>
  );
}
