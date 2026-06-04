import Header from "../_components/Header";
import { Button, Card, StatStrip } from "../_components/ui";

type ActivityIcon = "settled" | "advance" | "onboard" | "retry";

const ACTIVITY: {
  icon: ActivityIcon;
  text: string;
  amount: string;
}[] = [
  {
    icon: "settled",
    text: "Payroll settled — Adaeze Okonkwo",
    amount: "₦1,420,000",
  },
  {
    icon: "advance",
    text: "Advance approved — Faith Mwangi",
    amount: "KSh 42,000",
  },
  { icon: "onboard", text: "New hire onboarded — Yusuf Adeyemi", amount: "—" },
  {
    icon: "retry",
    text: "Bank rejected, retrying — Thabo Dlamini",
    amount: "R 18,200",
  },
];

const ACTIVITY_ICON: Record<ActivityIcon, { icon: string; color: string }> = {
  settled: { icon: "ti-circle-check", color: "text-success" },
  advance: { icon: "ti-arrow-up-right", color: "text-text-secondary" },
  onboard: { icon: "ti-user-plus", color: "text-text-secondary" },
  retry: { icon: "ti-alert-circle", color: "text-warning" },
};

const COUNTRIES: {
  name: string;
  height: number;
  color: string;
  amount: string;
}[] = [
  { name: "Nigeria", height: 18, color: "#18181b", amount: "$76,420" },
  { name: "Kenya", height: 14, color: "#52525b", amount: "$54,180" },
  { name: "South Africa", height: 11, color: "#a1a1aa", amount: "$32,910" },
  { name: "Egypt", height: 7, color: "#d4d4d8", amount: "$20,740" },
];

export default function OverviewPage() {
  return (
    <>
      <Header
        title="Overview"
        right={
          <Button icon="ti-plus" variant="primary">
            New pay run
          </Button>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[20px] max-w-[1280px]">
          {/* Next-pay-run hero card */}
          <Card className="px-[32px] py-[28px]">
            <div className="flex items-center gap-2 mb-[18px]">
              <span className="label">Next pay run</span>
              <span className="w-[3px] h-[3px] rounded-full bg-text-quaternary" />
              <span className="text-[11px] font-medium text-text-tertiary">
                Jun 1
              </span>
            </div>
            <div className="flex items-end justify-between gap-6">
              <div>
                <div
                  className="text-[36px] font-medium tabular text-text-primary"
                  style={{ letterSpacing: "-0.025em", lineHeight: 1 }}
                >
                  $184,250
                </div>
                <div className="text-[12.5px] text-text-tertiary mt-[10px] tabular">
                  40 people · 4 countries
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary">Edit</Button>
                <Button variant="primary" href="/payroll/june-2026">
                  Review &amp; approve
                </Button>
              </div>
            </div>
          </Card>

          {/* Three-stat strip */}
          <StatStrip
            cells={[
              { label: "Paid YTD", value: "$892,140" },
              { label: "Headcount", value: "40" },
              {
                label: "Settlement",
                value: (
                  <>
                    1.8{" "}
                    <span className="text-[13px] text-text-tertiary font-normal">
                      sec
                    </span>
                  </>
                ),
              },
            ]}
          />

          {/* Two-column row */}
          <div
            className="grid gap-[20px]"
            style={{ gridTemplateColumns: "1.5fr 1fr" }}
          >
            {/* Recent activity */}
            <Card>
              <div className="px-[22px] py-[18px] border-b border-border-subtle">
                <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                  Recent activity
                </h3>
              </div>
              <div>
                {ACTIVITY.map((row, i) => {
                  const meta = ACTIVITY_ICON[row.icon];
                  return (
                    <div
                      key={i}
                      className={`grid items-center px-[22px] py-[16px] ${
                        i < ACTIVITY.length - 1
                          ? "border-b border-border-subtle"
                          : ""
                      }`}
                      style={{
                        gridTemplateColumns: "16px 1fr auto",
                        columnGap: "12px",
                      }}
                    >
                      <i
                        className={`ti ${meta.icon} text-[16px] ${meta.color}`}
                      />
                      <div className="text-[12.5px] text-text-primary truncate">
                        {row.text}
                      </div>
                      <div className="text-[12.5px] tabular text-text-tertiary">
                        {row.amount}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* By country */}
            <Card>
              <div className="px-[22px] py-[18px] border-b border-border-subtle">
                <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                  By country
                </h3>
              </div>
              <div className="px-[22px] py-[18px] flex flex-col gap-[14px]">
                {COUNTRIES.map((c) => (
                  <div
                    key={c.name}
                    className="grid items-center"
                    style={{ gridTemplateColumns: "1fr auto", columnGap: "12px" }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        style={{
                          width: 5,
                          height: c.height,
                          background: c.color,
                          display: "inline-block",
                          borderRadius: 1,
                        }}
                      />
                      <span className="text-[12.5px] text-text-primary">
                        {c.name}
                      </span>
                    </div>
                    <span className="text-[12.5px] tabular text-text-primary">
                      {c.amount}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
