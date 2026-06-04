import Link from "next/link";
import Header from "../../../_components/Header";
import { Avatar, Button, Card, Pill } from "../../../_components/ui";

const TABS = [
  { key: "profile", label: "Profile", active: true },
  { key: "contract", label: "Contract" },
  { key: "compensation", label: "Compensation" },
  { key: "payslips", label: "Payslips", count: 14 },
  { key: "advances", label: "Advances", count: 2 },
  { key: "documents", label: "Documents" },
] as const;

const DETAILS: { label: string; value: string }[] = [
  { label: "Personal email", value: "adaeze.okeke@gmail.com" },
  { label: "Work email", value: "adaeze@mavenly.co" },
  { label: "Phone", value: "+234 803 ··· 4421" },
  { label: "Date of birth", value: "8 Aug 1991" },
  { label: "Country", value: "Nigeria" },
  { label: "Address", value: "14 Adeola Odeku Street\nVictoria Island, Lagos 101241" },
  { label: "Tax ID", value: "NIN 88241004721" },
];

export default function EmployeeDetailPage() {
  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <Link href="/people" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              People
            </Link>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">
              Adaeze Okeke
            </span>
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
              <Avatar name="Adaeze Okeke" country="Nigeria" size={56} />
              <div>
                <div className="flex items-center gap-3 mb-[4px]">
                  <h2
                    className="text-[19px] font-medium text-text-primary"
                    style={{ letterSpacing: "-0.015em" }}
                  >
                    Adaeze Okeke
                  </h2>
                  <Pill tone="success">Active</Pill>
                </div>
                <div className="text-[12.5px] text-text-tertiary tabular">
                  Senior Engineer · Nigeria · Joined Mar 2024
                </div>
              </div>
              <div className="text-right">
                <div className="label mb-[4px]">Monthly</div>
                <div
                  className="text-[20px] font-medium text-text-primary tabular leading-none"
                  style={{ letterSpacing: "-0.015em" }}
                >
                  $5,800
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs + panel */}
          <div>
            {/* Tab bar */}
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
                  {"count" in t && t.count && (
                    <span className="text-text-quaternary tabular text-[11px] ml-[2px]">
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab panel — Profile */}
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
                  {DETAILS.map((d) => (
                    <PreservedRow key={d.label} {...d} />
                  ))}
                </dl>
              </div>

              {/* Divider */}
              <div className="bg-border" />

              {/* Right: Payout */}
              <div className="px-[26px] py-[22px]">
                <div className="label mb-4">Payout</div>

                <div className="bg-canvas border border-border rounded-[6px] px-[16px] py-[14px] flex items-center gap-3">
                  <div className="w-[30px] h-[30px] bg-card border border-border rounded-[5px] flex items-center justify-center">
                    <i className="ti ti-building-bank text-[14px] text-text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium text-text-primary leading-tight">
                      GTBank
                    </div>
                    <div className="text-[11px] text-text-tertiary leading-tight tabular">
                      Account ····8821
                    </div>
                  </div>
                  <Pill tone="success">Verified</Pill>
                </div>
                <p className="text-[11px] text-text-tertiary mt-[8px] tabular">
                  NIP · last paid 2 days ago
                </p>

                <div className="mt-[14px]">
                  <Button variant="secondary" icon="ti-plus">
                    Add backup
                  </Button>
                </div>

                <div className="mt-[22px]">
                  <div className="label mb-[14px]">Latest payslip</div>
                  <div className="border border-border rounded-[6px] px-[16px] py-[14px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-medium text-text-primary">
                        May 2026
                      </span>
                      <i className="ti ti-download text-[14px] text-text-secondary cursor-pointer" />
                    </div>
                    <div className="text-[12px] text-text-tertiary mt-[6px] tabular">
                      Net ₦7,094,536 · Settled 2 days ago
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function PreservedRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[12px] text-text-tertiary">{label}</dt>
      <dd
        className="text-[12.5px] text-text-primary tabular"
        style={{ whiteSpace: "pre-line" }}
      >
        {value}
      </dd>
    </>
  );
}
