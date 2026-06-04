import Link from "next/link";
import Header from "../../../_components/Header";
import { Avatar, Card, Pill } from "../../../_components/ui";

type Signal = { kind: "positive" | "flag"; title: string; detail: string };

const SIGNALS: Signal[] = [
  {
    kind: "flag",
    title: "Above 40% of net salary threshold",
    detail: "Auto-approval rule fires manual review at 40%+",
  },
  {
    kind: "positive",
    title: "14 months tenure · no prior default",
    detail: "Joined March 2025 · all 14 paychecks settled on time",
  },
  {
    kind: "positive",
    title: "2 prior advances · both repaid on time",
    detail: "₦450K in Oct 2025 · ₦680K in Feb 2026",
  },
  {
    kind: "positive",
    title: "Active contract · 22 months remaining",
    detail: "Repayment is fully covered by upcoming pay runs",
  },
];

type Schedule = {
  date: string;
  deducted: string;
  remaining: string;
  status: "scheduled" | "upcoming";
};

const SCHEDULE: Schedule[] = [
  { date: "Jun 1, 2026", deducted: "₦635,500", remaining: "₦1,271,000", status: "scheduled" },
  { date: "Jul 1, 2026", deducted: "₦635,500", remaining: "₦635,500", status: "upcoming" },
  { date: "Aug 1, 2026", deducted: "₦635,500", remaining: "₦0", status: "upcoming" },
];

export default function AdvanceDetailPage() {
  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <Link href="/advances" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              Advances
            </Link>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">
              Folake Adekunle
            </span>
            <Pill tone="warning" className="ml-2">
              Manual review
            </Pill>
          </div>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div
          className="grid max-w-[1280px]"
          style={{ gridTemplateColumns: "1fr 320px", gap: "20px" }}
        >
          {/* Left column */}
          <div className="flex flex-col gap-[16px]">
            {/* Request summary */}
            <Card className="px-[26px] py-[24px]">
              <div className="flex items-start justify-between gap-4 mb-[22px]">
                <div className="flex items-center gap-[14px]">
                  <Avatar name="Folake Adekunle" country="Nigeria" size={44} />
                  <div>
                    <div className="text-[15px] font-medium text-text-primary leading-tight">
                      Folake Adekunle
                    </div>
                    <div className="text-[12px] text-text-tertiary mt-[2px]">
                      Engineer · Lagos, Nigeria · 14 months tenure
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="label">Requested</div>
                  <div
                    className="text-[26px] font-medium text-text-primary tabular leading-none mt-[4px]"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    ₦1,860,000
                  </div>
                  <div className="text-[11.5px] text-text-tertiary mt-[4px] tabular">
                    $1,201 · 2 hours ago
                  </div>
                </div>
              </div>

              <div
                className="grid items-center pt-[18px] border-t border-border"
                style={{
                  gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
                  columnGap: "18px",
                }}
              >
                <Metric label="% of net salary" value="48%" />
                <Divider />
                <Metric label="Fee · 2.5%" value="₦46,500" />
                <Divider />
                <Metric label="Repayment" value="3 installments" />
              </div>
            </Card>

            {/* Risk signals */}
            <Card>
              <div className="px-[22px] py-[16px] border-b border-border flex items-center justify-between">
                <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                  Risk signals
                </h3>
                <span className="text-[11px] text-text-tertiary leading-none">
                  Underwriting summary
                </span>
              </div>
              {SIGNALS.map((s, i) => (
                <div
                  key={i}
                  className={`grid items-start px-[22px] py-[14px] ${
                    i < SIGNALS.length - 1 ? "border-b border-border-subtle" : ""
                  }`}
                  style={{
                    gridTemplateColumns: "16px 1fr auto",
                    columnGap: "14px",
                  }}
                >
                  <i
                    className={`ti ${
                      s.kind === "flag" ? "ti-alert-circle text-warning" : "ti-circle-check text-success"
                    } text-[16px] mt-[1px]`}
                  />
                  <div className="min-w-0">
                    <div className="text-[12.5px] text-text-primary leading-snug">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-[2px] tabular">
                      {s.detail}
                    </div>
                  </div>
                  <Pill tone={s.kind === "flag" ? "warning" : "success"}>
                    {s.kind === "flag" ? "Flag" : "Positive"}
                  </Pill>
                </div>
              ))}
            </Card>

            {/* Repayment schedule */}
            <Card>
              <div className="px-[22px] py-[16px] border-b border-border">
                <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                  Repayment schedule
                </h3>
              </div>
              <div
                className="grid bg-muted border-b border-border px-[22px] py-[11px] text-text-tertiary"
                style={{
                  gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr",
                  columnGap: "16px",
                  fontSize: "10.5px",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                <div>Pay date</div>
                <div className="text-right">Deducted</div>
                <div className="text-right">Remaining</div>
                <div className="text-right">Status</div>
              </div>
              {SCHEDULE.map((s, i) => (
                <div
                  key={s.date}
                  className={`grid items-center px-[22px] py-[13px] ${
                    i < SCHEDULE.length - 1 ? "border-b border-border-subtle" : ""
                  }`}
                  style={{
                    gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr",
                    columnGap: "16px",
                  }}
                >
                  <div className="text-[12.5px] text-text-primary tabular">{s.date}</div>
                  <div className="text-[12.5px] tabular text-text-primary text-right">
                    {s.deducted}
                  </div>
                  <div className="text-[12.5px] tabular text-text-tertiary text-right">
                    {s.remaining}
                  </div>
                  <div className="flex justify-end">
                    {s.status === "scheduled" ? (
                      <Pill tone="info">Scheduled</Pill>
                    ) : (
                      <span className="bg-subtle text-text-tertiary text-[10.5px] font-medium px-[7px] py-[2.5px] rounded-[10px]">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Decision sidebar */}
          <div>
            <Card
              className="px-[24px] py-[22px]"
              style={{ position: "sticky", top: "20px" }}
            >
              <div className="label mb-[14px]">Decision</div>
              <p
                className="text-[12.5px] text-text-secondary mb-[18px]"
                style={{ lineHeight: 1.5 }}
              >
                3 of 4 risk signals are positive. Tenure and repayment history
                support approval despite the 48% threshold breach.
              </p>

              <div className="flex flex-col gap-2">
                <button className="w-full bg-text-primary text-white font-medium rounded-[5px] py-[10px] text-[13px] hover:bg-text-primary/90 transition-colors">
                  Approve &amp; disburse
                </button>
                <button className="w-full bg-card text-text-secondary border border-border-strong font-medium rounded-[5px] py-[10px] text-[13px] hover:bg-subtle transition-colors">
                  Decline
                </button>
              </div>

              <div className="mt-[22px] pt-[18px] border-t border-border">
                <div className="label mb-[12px]">Stated reason</div>
                <p
                  className="text-[12px] text-text-secondary italic"
                  style={{ lineHeight: 1.5 }}
                >
                  "Need to cover urgent medical expenses for a family member.
                  Will repay over 3 months."
                </p>
              </div>

              <div className="mt-[18px] pt-[18px] border-t border-border">
                <div className="label mb-[12px]">Disbursement</div>
                <div className="flex items-center gap-3">
                  <div className="w-[28px] h-[28px] bg-subtle rounded-[4px] flex items-center justify-center">
                    <i className="ti ti-building-bank text-[13px] text-text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-text-primary leading-tight tabular">
                      GTBank ····2207
                    </div>
                    <div className="text-[11px] text-text-tertiary leading-tight mt-[2px]">
                      Folake's primary · NIP
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label mb-[6px]">{label}</div>
      <div className="text-[17px] font-medium text-text-primary tabular leading-none">
        {value}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="bg-border"
      style={{ width: "1px", height: "32px", justifySelf: "center" }}
    />
  );
}
