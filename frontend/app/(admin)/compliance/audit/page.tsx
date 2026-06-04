import Link from "next/link";
import Header from "../../../_components/Header";
import { Button, Card } from "../../../_components/ui";

type DotColor = "green" | "blue" | "neutral" | "amber" | "red";
type ActorType = "user" | "system" | "api";

type Event = {
  time: string;
  action: string;
  dot: DotColor;
  actor: string;
  actorType: ActorType;
  entity: string;
  ip: string;
};

const EVENTS: Event[] = [
  {
    time: "May 27 · 14:32",
    action: "Pay run approved · June 2026",
    dot: "green",
    actor: "Sarah Chen",
    actorType: "user",
    entity: "payroll/jun-2026",
    ip: "12.4.··.42",
  },
  {
    time: "May 27 · 14:30",
    action: "Compliance filing prepared · Nigeria PAYE",
    dot: "green",
    actor: "System",
    actorType: "system",
    entity: "compliance/ng-paye-may",
    ip: "—",
  },
  {
    time: "May 27 · 11:18",
    action: "Advance auto-approved · Faith Mwangi",
    dot: "blue",
    actor: "System",
    actorType: "system",
    entity: "advances/adv_8821",
    ip: "—",
  },
  {
    time: "May 27 · 09:02",
    action: "Disbursement retry triggered · Thabo Dlamini",
    dot: "amber",
    actor: "System",
    actorType: "system",
    entity: "disbursements/dsb_4421",
    ip: "—",
  },
  {
    time: "May 26 · 17:44",
    action: "Employee onboarded · Yusuf Adeyemi",
    dot: "neutral",
    actor: "Sarah Chen",
    actorType: "user",
    entity: "employees/emp_4421",
    ip: "12.4.··.42",
  },
  {
    time: "May 26 · 11:01",
    action: "Salary updated · Faith Mwangi · +$500 monthly",
    dot: "neutral",
    actor: "Sarah Chen",
    actorType: "user",
    entity: "employees/emp_2210",
    ip: "12.4.··.42",
  },
  {
    time: "May 26 · 09:00",
    action: "Sign-in · Sarah Chen",
    dot: "neutral",
    actor: "Sarah Chen",
    actorType: "user",
    entity: "auth/session_9982",
    ip: "12.4.··.42",
  },
  {
    time: "May 25 · 16:30",
    action: "API key created · Reporting integration",
    dot: "neutral",
    actor: "API",
    actorType: "api",
    entity: "settings/api_keys/ak_2208",
    ip: "12.4.··.42",
  },
  {
    time: "May 24 · 22:11",
    action: "Employee offboarded · Sara Naguib",
    dot: "red",
    actor: "Sarah Chen",
    actorType: "user",
    entity: "employees/emp_3320",
    ip: "12.4.··.42",
  },
];

const DOT_COLORS: Record<DotColor, string> = {
  green: "#15803d",
  blue: "#1e40af",
  neutral: "#71717a",
  amber: "#b45309",
  red: "#991b1b",
};

export default function AuditTrailPage() {
  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <Link
              href="/compliance"
              className="text-[12px] text-text-tertiary hover:text-text-secondary"
            >
              Compliance
            </Link>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">
              Audit trail
            </span>
          </div>
        }
        right={
          <Button variant="secondary" icon="ti-download">
            Export CSV
          </Button>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="max-w-[1280px]">
          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-[18px]">
            <div className="relative w-full max-w-[280px]">
              <i className="ti ti-search absolute left-[10px] top-1/2 -translate-y-1/2 text-[13px] text-text-quaternary" />
              <input
                type="text"
                placeholder="Search by user, action, or entity"
                className="w-full bg-card border border-border rounded-[5px] pl-[30px] pr-3 py-[6px] text-[12px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-strong"
              />
            </div>
            <FilterChip>Last 30 days</FilterChip>
            <FilterChip>All actions</FilterChip>
            <FilterChip>All users</FilterChip>
          </div>

          <Card className="overflow-hidden">
            {/* Header row */}
            <div
              className="grid items-center bg-muted border-b border-border px-[22px] py-[11px] text-text-tertiary"
              style={{
                gridTemplateColumns: "140px 1.8fr 1fr 1.4fr 100px",
                columnGap: "16px",
                fontSize: "10.5px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <div>Time</div>
              <div>Action</div>
              <div>Actor</div>
              <div>Entity</div>
              <div>IP</div>
            </div>

            {EVENTS.map((e, i) => (
              <div
                key={i}
                className={`grid items-center px-[22px] py-[12px] ${
                  i < EVENTS.length - 1 ? "border-b border-border-subtle" : ""
                }`}
                style={{
                  gridTemplateColumns: "140px 1.8fr 1fr 1.4fr 100px",
                  columnGap: "16px",
                }}
              >
                <div className="text-[11.5px] text-text-tertiary tabular">
                  {e.time}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ background: DOT_COLORS[e.dot] }}
                  />
                  <span className="text-[12.5px] text-text-primary truncate">
                    {e.action}
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <ActorAvatar type={e.actorType} name={e.actor} />
                  <span className="text-[11.5px] text-text-primary truncate">
                    {e.actor}
                  </span>
                </div>
                <div className="text-[11.5px] text-text-secondary tabular truncate">
                  {e.entity}
                </div>
                <div
                  className="text-[11px] tabular text-text-tertiary"
                  style={{ fontFamily: "SF Mono, Consolas, monospace" }}
                >
                  {e.ip}
                </div>
              </div>
            ))}
          </Card>
        </div>
      </main>
    </>
  );
}

function FilterChip({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="bg-card text-text-secondary border border-border-strong text-[11.5px] font-medium rounded-[5px] px-[11px] py-[6px] hover:bg-subtle transition-colors flex items-center gap-1"
    >
      {children}
      <i className="ti ti-chevron-down text-[11px] text-text-quaternary" />
    </button>
  );
}

function ActorAvatar({ type, name }: { type: ActorType; name: string }) {
  const initial = name.charAt(0);
  if (type === "system") {
    return (
      <div className="w-[20px] h-[20px] rounded-full bg-subtle flex items-center justify-center text-text-secondary">
        <i className="ti ti-settings text-[10px]" />
      </div>
    );
  }
  if (type === "api") {
    return (
      <div className="w-[20px] h-[20px] rounded-full bg-info-bg text-info text-[8px] font-semibold flex items-center justify-center">
        API
      </div>
    );
  }
  return (
    <div className="w-[20px] h-[20px] rounded-full bg-text-primary text-white text-[9px] font-medium flex items-center justify-center">
      {initial}
    </div>
  );
}
