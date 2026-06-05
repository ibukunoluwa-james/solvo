import Header from "../../_components/Header";
import { Button, Card, StatStrip } from "../../_components/ui";
import { api } from "../../_lib/api";
import type { PayrollRun } from "../../_lib/types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const periodLabel = (r: PayrollRun) => `${MONTHS[r.period_month - 1]} 1, ${r.period_year}`;

const fmtUsd = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const CC_TO_NAME: Record<string, string> = {
  NG: "Nigeria",
  KE: "Kenya",
  ZA: "South Africa",
  EG: "Egypt",
  GH: "Ghana",
  RW: "Rwanda",
  UG: "Uganda",
  TZ: "Tanzania",
};

export default async function OverviewPage() {
  const [dashboard, runsResp, pendingAdvances] = await Promise.all([
    api.companies.getDashboard(),
    api.payroll.listRuns({ limit: 20 }),
    api.advances.list({ status_filter: "pending", limit: 10 }),
  ]);

  const draftRun = runsResp.runs.find((r) => r.status === "draft");

  // By-country: aggregate gross_salary from /employees per country.
  const empList = await api.employees.list({ limit: 200 });
  const byCountry = new Map<string, number>();
  for (const e of empList.employees) {
    byCountry.set(e.country, (byCountry.get(e.country) ?? 0) + e.gross_salary);
  }
  const countries = Array.from(byCountry.entries())
    .map(([code, sum]) => ({ code, name: CC_TO_NAME[code] ?? code, sum }))
    .sort((a, b) => b.sum - a.sum);
  const maxSum = countries[0]?.sum ?? 1;
  const COUNTRY_COLORS = ["#18181b", "#52525b", "#a1a1aa", "#d4d4d8"];

  return (
    <>
      <Header
        title="Overview"
        right={
          <Button icon="ti-plus" variant="primary" href="/payroll/new">
            New pay run
          </Button>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[20px] max-w-[1280px]">
          {/* Next-pay-run hero */}
          <Card className="px-[32px] py-[28px]">
            <div className="flex items-center gap-2 mb-[18px]">
              <span className="label">Next pay run</span>
              {draftRun && (
                <>
                  <span className="w-[3px] h-[3px] rounded-full bg-text-quaternary" />
                  <span className="text-[11px] font-medium text-text-tertiary">
                    {periodLabel(draftRun)}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-end justify-between gap-6">
              <div>
                <div
                  className="text-[36px] font-medium tabular text-text-primary"
                  style={{ letterSpacing: "-0.025em", lineHeight: 1 }}
                >
                  {draftRun ? fmtUsd(draftRun.total_gross) : "—"}
                </div>
                <div className="text-[12.5px] text-text-tertiary mt-[10px] tabular">
                  {dashboard.total_employees} people · {dashboard.countries_covered.length} countries
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" href="/payroll">
                  Edit
                </Button>
                {draftRun && (
                  <Button variant="primary" href={`/payroll/${draftRun.id}`}>
                    Review &amp; approve
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Stats */}
          <StatStrip
            cells={[
              { label: "Paid YTD", value: fmtUsd(dashboard.total_disbursed) },
              { label: "Headcount", value: dashboard.total_employees },
              { label: "Pending advances", value: dashboard.pending_advances },
            ]}
          />

          {/* Two-column row */}
          <div className="grid gap-[20px]" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
            {/* Pending advances feed (closest live data) */}
            <Card>
              <div className="px-[22px] py-[18px] border-b border-border-subtle flex items-center justify-between">
                <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                  Pending advances
                </h3>
                <span className="text-[11px] text-text-tertiary">
                  {pendingAdvances.total} awaiting review
                </span>
              </div>
              {pendingAdvances.advances.length === 0 ? (
                <div className="px-[22px] py-[28px] text-[12px] text-text-tertiary text-center">
                  No pending advances
                </div>
              ) : (
                pendingAdvances.advances.slice(0, 4).map((a, i, arr) => (
                  <div
                    key={a.id}
                    className={`grid items-center px-[22px] py-[16px] ${i < arr.length - 1 ? "border-b border-border-subtle" : ""}`}
                    style={{ gridTemplateColumns: "16px 1fr auto", columnGap: "12px" }}
                  >
                    <i className="ti ti-arrow-up-right text-[16px] text-text-secondary" />
                    <div className="text-[12.5px] text-text-primary truncate">
                      Advance requested — {a.employee_name ?? a.employee_id}
                    </div>
                    <div className="text-[12.5px] tabular text-text-tertiary">
                      {a.currency} {a.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                ))
              )}
            </Card>

            {/* By-country — derived from /employees */}
            <Card>
              <div className="px-[22px] py-[18px] border-b border-border-subtle">
                <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                  By country
                </h3>
              </div>
              <div className="px-[22px] py-[18px] flex flex-col gap-[14px]">
                {countries.map((c, i) => {
                  const height = Math.max(6, Math.round((c.sum / maxSum) * 18));
                  const color = COUNTRY_COLORS[Math.min(i, COUNTRY_COLORS.length - 1)];
                  return (
                    <div
                      key={c.code}
                      className="grid items-center"
                      style={{ gridTemplateColumns: "1fr auto", columnGap: "12px" }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          style={{
                            width: 5,
                            height,
                            background: color,
                            display: "inline-block",
                            borderRadius: 1,
                          }}
                        />
                        <span className="text-[12.5px] text-text-primary">{c.name}</span>
                      </div>
                      <span className="text-[12.5px] tabular text-text-tertiary">
                        {c.code}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
