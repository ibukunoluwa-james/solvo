import Header from "../../_components/Header";
import { Button, Card, Pill } from "../../_components/ui";

type Status = "up-to-date" | "due-soon" | "overdue";

type Row = {
  country: string;
  flag: string;
  filings: string;
  lastFiled: string;
  nextDue: string;
  nextDueWarning?: boolean;
  status: Status;
};

const ROWS: Row[] = [
  {
    country: "Nigeria",
    flag: "🇳🇬",
    filings: "PAYE · Pension · NHF · ITF",
    lastFiled: "May 10 · ₦3.84M",
    nextDue: "Jun 10",
    status: "up-to-date",
  },
  {
    country: "Kenya",
    flag: "🇰🇪",
    filings: "PAYE · NHIF · NSSF · Housing levy",
    lastFiled: "Apr 9 · KSh 2.1M",
    nextDue: "in 6 days",
    nextDueWarning: true,
    status: "due-soon",
  },
  {
    country: "South Africa",
    flag: "🇿🇦",
    filings: "PAYE · UIF · SDL",
    lastFiled: "May 7 · R 412K",
    nextDue: "Jun 7",
    status: "up-to-date",
  },
  {
    country: "Egypt",
    flag: "🇪🇬",
    filings: "Income tax · Social insurance",
    lastFiled: "May 5 · E£ 198K",
    nextDue: "Jun 5",
    status: "up-to-date",
  },
];

export default function CompliancePage() {
  return (
    <>
      <Header
        title="Compliance"
        right={
          <>
            <Button variant="secondary" href="/compliance/audit">
              Audit trail
            </Button>
            <Button variant="primary" icon="ti-download">
              Export filings
            </Button>
          </>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[16px] max-w-[1280px]">
          {/* Overall status */}
          <Card
            className="px-[26px] py-[22px] grid items-center"
            style={{
              gridTemplateColumns: "1.4fr 1px 1fr 1px 1fr 1px 1fr",
              columnGap: "20px",
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <i className="ti ti-shield-check text-[18px] text-success" />
                <span className="label">Overall status</span>
              </div>
              <div
                className="text-[22px] font-medium text-text-primary tabular mt-[8px] leading-none"
                style={{ letterSpacing: "-0.02em" }}
              >
                3 of 4 up to date
              </div>
              <div className="text-[12px] text-text-tertiary mt-[4px] tabular">
                1 filing due in 6 days
              </div>
            </div>
            <Divider />
            <SmallStat label="Taxes YTD" value="$42,180" />
            <Divider />
            <SmallStat label="Filings YTD" value="24" />
            <Divider />
            <SmallStat label="Auto-filed" value="100%" />
          </Card>

          {/* By-country table */}
          <Card className="overflow-hidden">
            <div className="px-[22px] py-[14px] border-b border-border">
              <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                By country
              </h3>
            </div>

            {ROWS.map((r, i) => {
              const tint =
                r.status === "due-soon"
                  ? "bg-warning-bg-soft"
                  : r.status === "overdue"
                    ? ""
                    : "";
              return (
                <div
                  key={r.country}
                  className={`grid items-center px-[22px] py-[18px] ${tint} ${
                    i < ROWS.length - 1 ? "border-b border-border-subtle" : ""
                  }`}
                  style={{
                    gridTemplateColumns: "32px 2fr 1.4fr 1.2fr 1fr 90px",
                    columnGap: "16px",
                  }}
                >
                  <div className="flex justify-center">
                    <span
                      className="w-[8px] h-[8px] rounded-full"
                      style={{
                        background:
                          r.status === "up-to-date"
                            ? "#15803d"
                            : r.status === "due-soon"
                              ? "#b45309"
                              : "#dc2626",
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-text-primary leading-tight">
                      {r.flag} {r.country}
                    </div>
                    <div className="text-[11px] text-text-tertiary leading-tight mt-[2px] truncate">
                      {r.filings}
                    </div>
                  </div>
                  <div>
                    <div className="label">Last filed</div>
                    <div className="text-[12.5px] text-text-primary tabular mt-[2px]">
                      {r.lastFiled}
                    </div>
                  </div>
                  <div>
                    <div className="label">Next due</div>
                    <div
                      className={`text-[12.5px] tabular mt-[2px] ${
                        r.nextDueWarning
                          ? "text-warning font-medium"
                          : "text-text-primary"
                      }`}
                    >
                      {r.nextDue}
                    </div>
                  </div>
                  <div>
                    <Pill
                      tone={
                        r.status === "up-to-date"
                          ? "success"
                          : r.status === "due-soon"
                            ? "warning"
                            : "warning"
                      }
                    >
                      {r.status === "up-to-date"
                        ? "Up to date"
                        : r.status === "due-soon"
                          ? "Due soon"
                          : "Overdue"}
                    </Pill>
                  </div>
                  <div className="text-right">
                    <span className="text-[11.5px] text-text-secondary cursor-pointer">
                      View →
                    </span>
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

function Divider() {
  return (
    <div
      className="bg-border"
      style={{ width: "1px", height: "50px", justifySelf: "center" }}
    />
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label mb-[8px]">{label}</div>
      <div
        className="text-[19px] font-medium text-text-primary tabular leading-none"
        style={{ letterSpacing: "-0.015em" }}
      >
        {value}
      </div>
    </div>
  );
}
