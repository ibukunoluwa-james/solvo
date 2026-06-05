import Header from "../../_components/Header";
import { Avatar, Button, Card, Pill } from "../../_components/ui";
import { api } from "../../_lib/api";

const CC_TO_NAME: Record<string, string> = {
  NG: "Nigeria", KE: "Kenya", ZA: "South Africa", EG: "Egypt", GH: "Ghana",
};

const fmtMoney = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " " + currency;

const formatJoined = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default async function EmployeeProfilePage() {
  const me = await api.employees.myProfile();
  const payslips = await api.employees.myPayslips();

  const countryName = CC_TO_NAME[me.country] ?? me.country;
  const ytd = payslips.reduce(
    (acc, p) => ({
      gross: acc.gross + p.gross_salary,
      tax: acc.tax + p.paye_tax + p.nhf,
      pension: acc.pension + p.pension_employee,
      net: acc.net + p.net_salary,
    }),
    { gross: 0, tax: 0, pension: 0, net: 0 }
  );

  return (
    <>
      <Header
        title="My profile"
        right={<Button variant="secondary">Edit details</Button>}
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[16px] max-w-[1080px]">
          {/* Hero */}
          <Card className="px-[28px] py-[24px] flex items-center gap-6">
            <Avatar name={me.full_name} country={countryName} size={56} />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-[4px]">
                <h2
                  className="text-[19px] font-medium text-text-primary"
                  style={{ letterSpacing: "-0.015em" }}
                >
                  {me.full_name}
                </h2>
                <Pill tone="success">Active</Pill>
              </div>
              <div className="text-[12.5px] text-text-tertiary tabular">
                {me.employment_type === "contractor" ? "Contractor" : "Employee"} · {countryName} · Joined {formatJoined(me.created_at)}
              </div>
            </div>
            <Button variant="primary" href="/advances/request">
              Request advance
            </Button>
          </Card>

          {/* Two-column */}
          <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: "16px" }}>
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
                <Detail label="Full name" value={me.full_name} />
                <Detail label="Country" value={countryName} />
                <Detail label="Type" value={me.employment_type === "contractor" ? "Contractor" : "Full-time"} />
                <Detail label="Currency" value={me.currency} />
                <Detail label="Tax ID" value={me.tax_id ?? "—"} />
                <Detail label="Pension ID" value={me.pension_id ?? "—"} />
              </dl>

              <div className="mt-[22px] pt-[18px] border-t border-border">
                <div className="label mb-4">Where you get paid</div>
                {me.bank_account_number ? (
                  <div className="bg-canvas border border-border rounded-[6px] px-[16px] py-[14px] flex items-center gap-3">
                    <div className="w-[30px] h-[30px] bg-card border border-border rounded-[5px] flex items-center justify-center">
                      <i className="ti ti-building-bank text-[14px] text-text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium text-text-primary leading-tight">
                        {me.bank_name ?? "Bank"}
                      </div>
                      <div className="text-[11px] text-text-tertiary leading-tight mt-[2px] tabular">
                        Account ····{me.bank_account_number.slice(-4)}
                      </div>
                    </div>
                    <Pill tone="success">Active</Pill>
                  </div>
                ) : (
                  <div className="text-[12px] text-text-tertiary">No bank on file</div>
                )}
              </div>
            </Card>

            {/* YTD */}
            <Card className="px-[26px] py-[22px]">
              <div className="label mb-4">Year to date</div>
              <div
                className="text-[24px] font-medium text-text-primary tabular leading-none"
                style={{ letterSpacing: "-0.02em" }}
              >
                {fmtMoney(ytd.net, me.currency)}
              </div>
              <div className="text-[11.5px] text-text-tertiary mt-[4px]">
                Across {payslips.length} payslip{payslips.length === 1 ? "" : "s"}
              </div>

              <div className="mt-[22px] flex flex-col gap-[14px]">
                <Bar label="Gross" value={fmtMoney(ytd.gross, me.currency)} pct={100} color="#18181b" />
                {ytd.gross > 0 && (
                  <>
                    <Bar
                      label="Tax"
                      value={fmtMoney(ytd.tax, me.currency)}
                      pct={Math.round((ytd.tax / ytd.gross) * 100)}
                      color="#b45309"
                    />
                    <Bar
                      label="Pension"
                      value={fmtMoney(ytd.pension, me.currency)}
                      pct={Math.round((ytd.pension / ytd.gross) * 100)}
                      color="#1e40af"
                    />
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
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
        <div className="h-full rounded-[2px]" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
