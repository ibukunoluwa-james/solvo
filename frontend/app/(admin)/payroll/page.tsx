import Link from "next/link";
import Header from "../../_components/Header";
import { Button, Card, Pill, StatStrip } from "../../_components/ui";

type Status = "draft" | "completed" | "scheduled" | "disbursing";

type Run = {
  slug: string;
  period: string;
  sub: string;
  people: number;
  gross: string;
  cost: string;
  status: Status;
};

const RUNS: Run[] = [
  {
    slug: "june-2026",
    period: "June 2026",
    sub: "Jun 1 · in 5 days",
    people: 40,
    gross: "$184,250",
    cost: "$186,832",
    status: "draft",
  },
  {
    slug: "may-2026",
    period: "May 2026",
    sub: "Paid May 1 · 40/40 settled",
    people: 40,
    gross: "$176,840",
    cost: "$179,402",
    status: "completed",
  },
  {
    slug: "apr-2026",
    period: "April 2026",
    sub: "Paid Apr 1 · 39/39 settled",
    people: 39,
    gross: "$171,200",
    cost: "$173,718",
    status: "completed",
  },
  {
    slug: "mar-2026",
    period: "March 2026",
    sub: "Paid Mar 1 · 38/38 settled",
    people: 38,
    gross: "$167,540",
    cost: "$170,012",
    status: "completed",
  },
];

const PILL_TONE: Record<Status, "info" | "success" | "warning" | "neutral"> = {
  draft: "info",
  completed: "success",
  scheduled: "info",
  disbursing: "info",
};

const PILL_LABEL: Record<Status, string> = {
  draft: "Draft",
  completed: "Completed",
  scheduled: "Scheduled",
  disbursing: "Disbursing",
};

export default function PayrollListPage() {
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
          {/* Stats */}
          <StatStrip
            cells={[
              { label: "YTD payroll", value: "$892,140" },
              { label: "Avg run", value: "$178,428" },
              { label: "Solvo fees YTD", value: "$5,376" },
              { label: "Next scheduled", value: "Jun 1" },
            ]}
          />

          {/* Runs table */}
          <Card className="overflow-hidden">
            {/* Header row */}
            <div
              className="grid items-center bg-muted border-b border-border px-[22px] py-[11px] text-text-tertiary"
              style={{
                gridTemplateColumns: "1.4fr 1fr 1fr 1.1fr 1fr 90px",
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
              <div className="text-right">Total cost</div>
              <div className="text-right">Status</div>
              <div />
            </div>

            {RUNS.map((r, i) => (
              <Link
                key={r.slug}
                href={`/payroll/${r.slug}`}
                className={`grid items-center px-[22px] py-[14px] hover:bg-canvas transition-colors ${
                  i < RUNS.length - 1 ? "border-b border-border-subtle" : ""
                }`}
                style={{
                  gridTemplateColumns: "1.4fr 1fr 1fr 1.1fr 1fr 90px",
                  columnGap: "16px",
                }}
              >
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-text-primary leading-tight">
                    {r.period}
                  </div>
                  <div className="text-[11px] text-text-tertiary leading-tight tabular mt-[2px]">
                    {r.sub}
                  </div>
                </div>
                <div className="text-[12.5px] tabular text-text-secondary">
                  {r.people}
                </div>
                <div className="text-[12.5px] tabular text-text-primary text-right">
                  {r.gross}
                </div>
                <div className="text-[12.5px] tabular text-text-primary text-right">
                  {r.cost}
                </div>
                <div className="flex justify-end">
                  <Pill tone={PILL_TONE[r.status]}>{PILL_LABEL[r.status]}</Pill>
                </div>
                <div className="text-right">
                  {r.status === "draft" ? (
                    <span className="text-[11.5px] text-info">Review →</span>
                  ) : (
                    <span className="text-[11.5px] text-text-secondary">View</span>
                  )}
                </div>
              </Link>
            ))}
          </Card>
        </div>
      </main>
    </>
  );
}
