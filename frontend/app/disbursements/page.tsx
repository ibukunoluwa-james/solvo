import Header from "../_components/Header";
import {
  Avatar,
  Button,
  Card,
  Pill,
  ProgressBar,
} from "../_components/ui";

type Status = "settled" | "sending" | "queued" | "retrying";

type Transfer = {
  name: string;
  bank: string;
  country: string;
  rail: string;
  amount: string;
  status: Status;
  percent: number;
  time: string;
};

const TRANSFERS: Transfer[] = [
  {
    name: "Adaeze Okonkwo",
    bank: "GTBank · ****4821",
    country: "Nigeria",
    rail: "NIP · Nigeria",
    amount: "₦7,675,920",
    status: "settled",
    percent: 100,
    time: "1.4s",
  },
  {
    name: "Faith Mwangi",
    bank: "M-Pesa · ****7102",
    country: "Kenya",
    rail: "M-Pesa · Kenya",
    amount: "KSh 559,008",
    status: "settled",
    percent: 100,
    time: "0.9s",
  },
  {
    name: "Lerato Khumalo",
    bank: "FNB · ****3390",
    country: "South Africa",
    rail: "EFT · South Africa",
    amount: "R 71,400",
    status: "settled",
    percent: 100,
    time: "2.1s",
  },
  {
    name: "Thabo Dlamini",
    bank: "Standard Bank · ****1145",
    country: "South Africa",
    rail: "EFT · South Africa",
    amount: "R 65,820",
    status: "retrying",
    percent: 33,
    time: "3h",
  },
  {
    name: "Aisha Otieno",
    bank: "Equity · ****2244",
    country: "Kenya",
    rail: "RTGS · Kenya",
    amount: "KSh 507,232",
    status: "sending",
    percent: 65,
    time: "2s",
  },
  {
    name: "Mohamed Hassan",
    bank: "CIB · ****8810",
    country: "Egypt",
    rail: "InstaPay · Egypt",
    amount: "E£ 187,200",
    status: "queued",
    percent: 35,
    time: "—",
  },
  {
    name: "Yusuf Adeyemi",
    bank: "Access · ****6612",
    country: "Nigeria",
    rail: "NIP · Nigeria",
    amount: "₦7,180,320",
    status: "settled",
    percent: 100,
    time: "1.6s",
  },
];

const PROGRESS_MAP: Record<
  Status,
  { tone: "success" | "info" | "warning"; label: string }
> = {
  settled: { tone: "success", label: "Settled" },
  sending: { tone: "info", label: "Sending" },
  queued: { tone: "info", label: "Queued" },
  retrying: { tone: "warning", label: "Retry 1/3" },
};

export default function DisbursementsPage() {
  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-3">
            <h1 className="text-[13px] font-medium text-text-primary leading-none">
              Disbursements
            </h1>
            <Pill tone="success" dot>
              Live
            </Pill>
          </div>
        }
        right={
          <Button variant="secondary" icon="ti-download">
            Export
          </Button>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[20px] max-w-[1280px]">
          {/* Five-stat strip */}
          <Card
            className="grid divide-x divide-border"
            style={{
              gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr",
            }}
          >
            <StatCellSimple label="May run" value="$176,840" meta="40 transfers" />
            <StatCellSimple
              label="Settled"
              value={
                <>
                  37{" "}
                  <span className="text-[13px] text-text-tertiary font-normal">
                    / 40
                  </span>
                </>
              }
              meta={<span className="text-success">92%</span>}
            />
            <StatCellSimple label="In flight" value="2" meta="processing" />
            <StatCellSimple
              label="Retrying"
              value={<span className="text-warning">1</span>}
              meta={<span className="text-warning">bank rejected</span>}
            />
            <StatCellSimple label="Median time" value="1.8 sec" meta="p99 · 4.2 sec" />
          </Card>

          {/* Transfers table */}
          <Card className="overflow-hidden">
            {/* Header */}
            <div
              className="grid items-center bg-muted border-b border-border px-[22px] py-[11px] text-text-tertiary"
              style={{
                gridTemplateColumns: "2fr 1.2fr 1.2fr 1.4fr 70px",
                columnGap: "16px",
                fontSize: "10.5px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <div>Recipient</div>
              <div>Rail</div>
              <div className="text-right">Amount</div>
              <div>Progress</div>
              <div className="text-right">Time</div>
            </div>

            {TRANSFERS.map((t, i) => {
              const isRetry = t.status === "retrying";
              const progress = PROGRESS_MAP[t.status];
              const isLast = i === TRANSFERS.length - 1;
              const timeColor = isRetry
                ? "text-warning"
                : t.status === "settled"
                  ? "text-text-tertiary"
                  : "text-text-secondary";
              return (
                <div
                  key={t.name}
                  className={`grid items-center px-[22px] py-[14px] ${
                    isRetry ? "bg-warning-bg-soft" : ""
                  } ${!isLast ? "border-b border-border-subtle" : ""}`}
                  style={{
                    gridTemplateColumns: "2fr 1.2fr 1.2fr 1.4fr 70px",
                    columnGap: "16px",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={t.name} country={t.country} size={26} />
                    <div className="min-w-0">
                      <div className="text-[12.5px] text-text-primary truncate leading-tight">
                        {t.name}
                      </div>
                      <div className="text-[10.5px] text-text-quaternary truncate leading-tight tabular">
                        {t.bank}
                      </div>
                    </div>
                  </div>
                  <div className="text-[12px] text-text-secondary truncate">
                    {t.rail}
                  </div>
                  <div className="text-[12.5px] tabular text-text-primary text-right">
                    {t.amount}
                  </div>
                  <div>
                    <ProgressBar
                      percent={t.percent}
                      tone={progress.tone}
                      label={progress.label}
                    />
                  </div>
                  <div
                    className={`text-[12px] tabular text-right ${timeColor}`}
                  >
                    {t.time}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </main>
    </>
  );
}

function StatCellSimple({
  label,
  value,
  meta,
}: {
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="px-[22px] py-[18px]">
      <div className="label mb-[10px]">{label}</div>
      <div
        className="text-[22px] font-medium tabular leading-none text-text-primary"
        style={{ letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      {meta && (
        <div className="text-[11.5px] text-text-tertiary mt-[4px] tabular">
          {meta}
        </div>
      )}
    </div>
  );
}
