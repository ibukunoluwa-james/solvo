import Header from "../_components/Header";
import { Avatar, Button, Card, Pill, StatStrip } from "../_components/ui";

type Signal = { kind: "positive" | "concern"; text: string };

type Pending = {
  name: string;
  cityRole: string;
  country: string;
  amountUsd: number;
  monthlyNetUsd: number;
  pctOfNet: number;
  requestedAgo: string;
  signals: Signal[];
};

const PENDING: Pending[] = [
  {
    name: "Adaeze Okonkwo",
    cityRole: "Lagos, Nigeria · Engineer",
    country: "Nigeria",
    amountUsd: 1201,
    monthlyNetUsd: 2502,
    pctOfNet: 48,
    requestedAgo: "2 hours ago",
    signals: [
      { kind: "positive", text: "18 months tenure · 6 prior advances repaid" },
      { kind: "concern", text: "Requesting 48% of May net — above 40% threshold" },
      { kind: "positive", text: "No active garnishments or holds" },
    ],
  },
  {
    name: "Faith Mwangi",
    cityRole: "Nairobi, Kenya · Designer",
    country: "Kenya",
    amountUsd: 540,
    monthlyNetUsd: 1980,
    pctOfNet: 27,
    requestedAgo: "5 hours ago",
    signals: [
      { kind: "positive", text: "11 months tenure · 3 prior advances repaid" },
      { kind: "positive", text: "Within auto-rules but flagged: first request this quarter" },
      { kind: "positive", text: "Bank verified · last payout settled in 1.1s" },
    ],
  },
];

type AutoRow = {
  name: string;
  country: string;
  amountUsd: number;
  pctOfNet: number;
  time: string;
};

const AUTO: AutoRow[] = [
  { name: "Lerato Khumalo", country: "South Africa", amountUsd: 410, pctOfNet: 14, time: "2 days ago" },
  { name: "Mohamed Hassan", country: "Egypt", amountUsd: 620, pctOfNet: 22, time: "3 days ago" },
  { name: "Aisha Otieno", country: "Kenya", amountUsd: 380, pctOfNet: 18, time: "4 days ago" },
  { name: "Yusuf Adeyemi", country: "Nigeria", amountUsd: 720, pctOfNet: 19, time: "5 days ago" },
];

const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  });

export default function AdvancesPage() {
  return (
    <>
      <Header
        title="Advances"
        right={
          <Button variant="secondary" icon="ti-settings">
            Auto-approval rules
          </Button>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[20px] max-w-[1280px]">
          {/* Four-stat strip */}
          <StatStrip
            cells={[
              { label: "Advanced this month", value: "$8,420" },
              { label: "Auto-approved", value: "7 / 9" },
              { label: "Awaiting review", value: <span className="text-warning">2</span> },
              { label: "Default rate", value: "0.0 %" },
            ]}
          />

          {/* Status segments */}
          <div className="flex items-center gap-1 -mt-[6px] mb-[-6px]">
            <Chip active>
              Pending <span className="tabular text-text-tertiary ml-[2px]">2</span>
            </Chip>
            <Chip>
              Approved <span className="tabular text-text-tertiary/80 ml-[2px]">7</span>
            </Chip>
            <Chip>
              Repaying <span className="tabular text-text-tertiary/80 ml-[2px]">12</span>
            </Chip>
          </div>

          {/* Pending review cards */}
          <div
            className="grid"
            style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}
          >
            {PENDING.map((p) => (
              <PendingCard key={p.name} item={p} />
            ))}
          </div>

          {/* Recently auto-approved */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-[22px] py-[16px] border-b border-border">
              <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                Recently auto-approved
              </h3>
              <span className="text-[11px] text-text-tertiary leading-none">
                Within rules · no review needed
              </span>
            </div>

            {AUTO.map((r, i) => (
              <div
                key={r.name}
                className={`grid items-center px-[22px] py-[14px] ${
                  i < AUTO.length - 1 ? "border-b border-border-subtle" : ""
                }`}
                style={{
                  gridTemplateColumns: "2fr 1.2fr 1fr 1fr 80px",
                  columnGap: "16px",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={r.name} country={r.country} size={26} />
                  <span className="text-[12.5px] text-text-primary truncate">
                    {r.name}
                  </span>
                </div>
                <div className="text-[12.5px] text-text-secondary">
                  {r.country}
                </div>
                <div className="text-[12.5px] tabular text-text-primary text-right">
                  {fmtUsd(r.amountUsd)}
                </div>
                <div className="text-[12.5px] tabular text-text-tertiary text-right">
                  {r.pctOfNet}%
                </div>
                <div className="text-[12px] tabular text-text-tertiary text-right">
                  {r.time}
                </div>
              </div>
            ))}
          </Card>
        </div>
      </main>
    </>
  );
}

function PendingCard({ item }: { item: Pending }) {
  return (
    <Card className="overflow-hidden">
      {/* Header with warning-soft tint */}
      <div className="px-[20px] py-[14px] bg-warning-bg-soft border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={item.name} country={item.country} size={32} />
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-text-primary leading-tight truncate">
              {item.name}
            </div>
            <div className="text-[11px] text-text-tertiary leading-tight truncate">
              {item.cityRole}
            </div>
          </div>
        </div>
        <Pill tone="warning">Manual review</Pill>
      </div>

      {/* Amount block */}
      <div className="px-[20px] py-[18px] border-b border-border-subtle">
        <div className="flex items-center justify-between mb-[8px]">
          <span className="label">Requested</span>
          <span className="text-[11px] text-text-tertiary">{item.requestedAgo}</span>
        </div>
        <div
          className="text-[24px] font-medium text-text-primary tabular leading-none"
          style={{ letterSpacing: "-0.02em" }}
        >
          {fmtUsd(item.amountUsd)}
        </div>
        <div className="text-[12px] text-text-tertiary mt-[6px] tabular">
          {fmtUsd(item.monthlyNetUsd)} · {item.pctOfNet}% of May net salary
        </div>
      </div>

      {/* Risk signals */}
      <div className="px-[20px] py-[14px] border-b border-border-subtle">
        <div className="label mb-[10px]">Risk signals</div>
        <div className="flex flex-col gap-[8px]">
          {item.signals.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <i
                className={`ti ${
                  s.kind === "positive" ? "ti-circle-check text-success" : "ti-alert-circle text-warning"
                } text-[13px] mt-[2px]`}
              />
              <span className="text-[12px] text-text-primary leading-snug">
                {s.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-[20px] py-[14px] flex items-center gap-2">
        <Button variant="secondary" className="flex-1 justify-center">
          Decline
        </Button>
        <Button variant="primary" className="flex-1 justify-center">
          Approve
        </Button>
      </div>
    </Card>
  );
}

function Chip({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
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
