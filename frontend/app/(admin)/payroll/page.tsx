import Link from "next/link";
import Header from "../../_components/Header";
import { Button, Card, Pill, StatStrip } from "../../_components/ui";
import { api } from "../../_lib/api";
import type { PayrollRun, PayrollStatus } from "../../_lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const periodLabel = (r: PayrollRun) =>
  `${["January","February","March","April","May","June","July","August","September","October","November","December"][r.period_month - 1]} ${r.period_year}`;

const sublabel = (r: PayrollRun) => {
  const d = MONTHS[r.period_month - 1];
  if (r.status === "completed") return `Paid ${d} 1 · ${r.employee_count} employees`;
  if (r.status === "processing") return `Processing · ${r.employee_count} transfers`;
  if (r.status === "failed") return "Failed — review errors";
  if (r.status === "previewed") return `Previewed · ${r.employee_count} employees`;
  return `Draft · ${r.employee_count} employees`;
};

const PILL_TONE: Record<PayrollStatus, "info" | "success" | "warning" | "neutral"> = {
  draft: "info",
  previewed: "info",
  processing: "info",
  completed: "success",
  failed: "warning",
};

const PILL_LABEL: Record<PayrollStatus, string> = {
  draft: "Draft",
  previewed: "Previewed",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

const fmtUsd = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default async function PayrollListPage() {
  const { runs } = await api.payroll.listRuns({ limit: 50 });
  const dashboard = await api.companies.getDashboard();

  const completed = runs.filter((r) => r.status === "completed");
  const avgRun = completed.length
    ? Math.round(completed.reduce((s, r) => s + r.total_gross, 0) / completed.length)
    : 0;
  const nextDraft = runs.find((r) => r.status === "draft");

  return (
    <>
      <Header
        title="Pay runs"
        right={
          <Button icon="ti-plus" variant="primary" href="/payroll/new">
            New pay run
          </Button>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[20px] max-w-[1280px]">
          <StatStrip
            cells={[
              { label: "YTD payroll", value: fmtUsd(dashboard.total_disbursed) },
              { label: "Avg run", value: avgRun ? fmtUsd(avgRun) : "—" },
              { label: "Total runs", value: dashboard.total_payroll_runs },
              {
                label: "Next scheduled",
                value: nextDraft ? `${MONTHS[nextDraft.period_month - 1]} ${nextDraft.period_year}` : "—",
              },
            ]}
          />

          <Card className="overflow-hidden">
            <div
              className="grid items-center bg-muted border-b border-border px-[22px] py-[11px] text-text-tertiary"
              style={{
                gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 90px",
                columnGap: "16px",
                fontSize: "10.5px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <div>Period</div>
              <div>People</div>
              <div className="text-right">Gross</div>
              <div className="text-right">Net</div>
              <div className="text-right">Status</div>
              <div />
            </div>

            {runs.map((r, i) => (
              <Link
                key={r.id}
                href={`/payroll/${r.id}`}
                className={`grid items-center px-[22px] py-[14px] hover:bg-canvas transition-colors ${
                  i < runs.length - 1 ? "border-b border-border-subtle" : ""
                }`}
                style={{
                  gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 90px",
                  columnGap: "16px",
                }}
              >
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-text-primary leading-tight">
                    {periodLabel(r)}
                  </div>
                  <div className="text-[11px] text-text-tertiary leading-tight mt-[2px]">
                    {sublabel(r)}
                  </div>
                </div>
                <div className="text-[12.5px] tabular text-text-secondary">{r.employee_count}</div>
                <div className="text-[12.5px] tabular text-text-primary text-right">
                  {fmtUsd(r.total_gross)}
                </div>
                <div className="text-[12.5px] tabular text-text-primary text-right">
                  {fmtUsd(r.total_net)}
                </div>
                <div className="flex justify-end">
                  <Pill tone={PILL_TONE[r.status]}>{PILL_LABEL[r.status]}</Pill>
                </div>
                <div className="text-right">
                  <span className={`text-[11.5px] ${r.status === "draft" ? "text-info" : "text-text-secondary"}`}>
                    {r.status === "draft" ? "Review →" : "View"}
                  </span>
                </div>
              </Link>
            ))}
          </Card>
        </div>
      </main>
    </>
  );
}
