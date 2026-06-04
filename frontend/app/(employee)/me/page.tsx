import Header from "../../_components/Header";
import { Button, Card, Pill } from "../../_components/ui";

const DETAILS: { label: string; value: string }[] = [
  { label: "Full name", value: "Adaeze Okeke" },
  { label: "Role", value: "Senior Engineer at Mavenly" },
  { label: "Joined", value: "March 2024 · 27 months" },
  { label: "Country", value: "Nigeria" },
  { label: "Email", value: "adaeze@mavenly.co" },
  { label: "Phone", value: "+234 803 ··· 4421" },
];

export default function EmployeeProfilePage() {
  return (
    <>
      <Header
        title="My profile"
        right={<Button variant="secondary">Edit details</Button>}
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[16px] max-w-[1080px]">
          {/* Top hero */}
          <Card
            className="px-[28px] py-[24px] grid items-center"
            style={{
              gridTemplateColumns: "1.2fr 1px 1fr",
              columnGap: "24px",
            }}
          >
            {/* Next paycheck */}
            <div>
              <div className="label mb-[8px]">Next paycheck · Jun 1</div>
              <div
                className="text-[30px] font-medium text-text-primary tabular leading-none"
                style={{ letterSpacing: "-0.025em" }}
              >
                ₦7,094,536
              </div>
              <div className="text-[12.5px] text-text-tertiary mt-[6px] tabular">
                Net of tax · expected in your GTBank ····8821 in ~2 seconds
              </div>
            </div>

            <div
              className="bg-border"
              style={{ width: "1px", height: "56px", justifySelf: "center" }}
            />

            {/* Advance available */}
            <div>
              <div className="label mb-[8px]">Advance available</div>
              <div
                className="text-[22px] font-medium text-text-primary tabular leading-none mb-[8px]"
                style={{ letterSpacing: "-0.02em" }}
              >
                ₦2,838,000
              </div>
              <Button variant="primary" href="/advances/request">
                Request advance
              </Button>
            </div>
          </Card>

          {/* Two-column row */}
          <div
            className="grid"
            style={{ gridTemplateColumns: "1.4fr 1fr", gap: "16px" }}
          >
            {/* About me */}
            <Card className="px-[26px] py-[22px]">
              <div className="label mb-4">About me</div>
              <dl
                className="grid"
                style={{
                  gridTemplateColumns: "130px 1fr",
                  rowGap: "12px",
                  columnGap: "16px",
                }}
              >
                {DETAILS.map((d) => (
                  <DetailRow key={d.label} {...d} />
                ))}
              </dl>

              <div className="mt-[22px] pt-[18px] border-t border-border">
                <div className="label mb-4">Where you get paid</div>
                <div className="bg-canvas border border-border rounded-[6px] px-[16px] py-[14px] flex items-center gap-3">
                  <div className="w-[30px] h-[30px] bg-card border border-border rounded-[5px] flex items-center justify-center">
                    <i className="ti ti-building-bank text-[14px] text-text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium text-text-primary leading-tight">
                      GTBank
                    </div>
                    <div className="text-[11px] text-text-tertiary leading-tight mt-[2px] tabular">
                      Account ····8821 · NIP
                    </div>
                  </div>
                  <Pill tone="success">Active</Pill>
                </div>
              </div>
            </Card>

            {/* YTD earnings */}
            <Card className="px-[26px] py-[22px]">
              <div className="label mb-4">YTD earnings</div>
              <div
                className="text-[24px] font-medium text-text-primary tabular leading-none"
                style={{ letterSpacing: "-0.02em" }}
              >
                ₦35,472,680
              </div>
              <div className="text-[11.5px] text-text-tertiary mt-[4px]">
                Across 5 payslips
              </div>

              <div className="mt-[22px] flex flex-col gap-[14px]">
                <Bar label="Gross" value="₦43,500,000" pct={100} color="#18181b" />
                <Bar label="Tax (PAYE)" value="₦7,420,000" pct={17} color="#b45309" />
                <Bar label="Pension" value="₦607,320" pct={2} color="#1e40af" />
              </div>

              <div className="mt-[18px] pt-[14px] border-t border-border">
                <a className="text-[11.5px] text-info cursor-pointer">
                  View tax statement →
                </a>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[12px] text-text-tertiary">{label}</dt>
      <dd className="text-[12.5px] text-text-primary tabular">{value}</dd>
    </>
  );
}

function Bar({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-[6px]">
        <span className="text-[12px] text-text-tertiary">{label}</span>
        <span className="text-[12px] text-text-primary tabular">{value}</span>
      </div>
      <div className="h-[4px] bg-border rounded-[2px] overflow-hidden">
        <div
          className="h-full rounded-[2px]"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
