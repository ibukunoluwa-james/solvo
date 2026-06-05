import Link from "next/link";
import Header from "../../_components/Header";
import { Button, Card } from "../../_components/ui";
import { api } from "../../_lib/api";

const CC_TO_NAME: Record<string, string> = {
  NG: "Nigeria", KE: "Kenya", ZA: "South Africa", EG: "Egypt", GH: "Ghana",
};

const fmtMoney = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " " + currency;

const fmtUsd = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default async function CompliancePage() {
  const audit = await api.compliance.auditTrail({ limit: 50 });

  // Aggregate per country across all runs
  type CountrySummary = {
    country: string;
    taxTypes: Set<string>;
    totalRemitted: Record<string, number>; // by currency
    filingCount: number;
    latestPeriod: string | null;
    latestRunStatus: string | null;
  };

  const byCountry = new Map<string, CountrySummary>();
  for (const run of audit.audit_trail) {
    for (const r of run.remittances) {
      if (!byCountry.has(r.country)) {
        byCountry.set(r.country, {
          country: r.country,
          taxTypes: new Set(),
          totalRemitted: {},
          filingCount: 0,
          latestPeriod: null,
          latestRunStatus: null,
        });
      }
      const c = byCountry.get(r.country)!;
      c.taxTypes.add(r.tax_type);
      c.totalRemitted[r.currency] = (c.totalRemitted[r.currency] ?? 0) + r.amount;
      c.filingCount += 1;
      if (!c.latestPeriod || run.period > c.latestPeriod) {
        c.latestPeriod = run.period;
        c.latestRunStatus = run.status;
      }
    }
  }
  const countries = Array.from(byCountry.values());

  const totalRunsFiled = audit.audit_trail.length;
  const totalRemittances = audit.audit_trail.reduce((s, r) => s + r.remittances.length, 0);

  return (
    <>
      <Header
        title="Compliance"
        right={
          <>
            <Button variant="secondary" href="/compliance/audit">Audit trail</Button>
            <Button variant="primary" icon="ti-download">Export filings</Button>
          </>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[16px] max-w-[1280px]">
          <Card
            className="px-[26px] py-[22px] grid items-center"
            style={{ gridTemplateColumns: "1.4fr 1px 1fr 1px 1fr", columnGap: "20px" }}
          >
            <div>
              <div className="flex items-center gap-2">
                <i className="ti ti-shield-check text-[18px] text-success" />
                <span className="label">Active jurisdictions</span>
              </div>
              <div
                className="text-[22px] font-medium text-text-primary tabular mt-[8px] leading-none"
                style={{ letterSpacing: "-0.02em" }}
              >
                {countries.length}
              </div>
              <div className="text-[12px] text-text-tertiary mt-[4px] tabular">
                {countries.map((c) => CC_TO_NAME[c.country] ?? c.country).join(" · ")}
              </div>
            </div>
            <Divider />
            <SmallStat label="Runs with filings" value={String(totalRunsFiled)} />
            <Divider />
            <SmallStat label="Remittances filed" value={String(totalRemittances)} />
          </Card>

          {/* By-country */}
          <Card className="overflow-hidden">
            <div className="px-[22px] py-[14px] border-b border-border">
              <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                By country
              </h3>
            </div>

            {countries.map((c, i) => {
              const sumStrings = Object.entries(c.totalRemitted).map(([cur, amt]) =>
                fmtMoney(amt, cur)
              );
              return (
                <div
                  key={c.country}
                  className={`grid items-center px-[22px] py-[18px] ${i < countries.length - 1 ? "border-b border-border-subtle" : ""}`}
                  style={{
                    gridTemplateColumns: "32px 2fr 1.4fr 1.4fr 90px",
                    columnGap: "16px",
                  }}
                >
                  <div className="flex justify-center">
                    <span className="w-[8px] h-[8px] rounded-full bg-success" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-text-primary leading-tight">
                      {CC_TO_NAME[c.country] ?? c.country}
                    </div>
                    <div className="text-[11px] text-text-tertiary leading-tight mt-[2px] truncate">
                      {Array.from(c.taxTypes).join(" · ")}
                    </div>
                  </div>
                  <div>
                    <div className="label">Latest period</div>
                    <div className="text-[12.5px] text-text-primary tabular mt-[2px]">
                      {c.latestPeriod ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="label">Remitted</div>
                    <div className="text-[12.5px] text-text-primary tabular mt-[2px]">
                      {sumStrings.join(" · ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <Link href="/compliance/audit" className="text-[11.5px] text-text-secondary cursor-pointer">
                      View →
                    </Link>
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
    <div className="bg-border" style={{ width: "1px", height: "50px", justifySelf: "center" }} />
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
