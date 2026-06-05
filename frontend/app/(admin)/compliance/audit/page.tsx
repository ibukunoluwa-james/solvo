import Link from "next/link";
import Header from "../../../_components/Header";
import { Button, Card, Pill } from "../../../_components/ui";
import { api } from "../../../_lib/api";

const CC_TO_NAME: Record<string, string> = {
  NG: "Nigeria", KE: "Kenya", ZA: "South Africa", EG: "Egypt", GH: "Ghana",
};

const fmtMoney = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " " + currency;

const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default async function AuditTrailPage() {
  const audit = await api.compliance.auditTrail({ limit: 50 });

  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <Link href="/compliance" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              Compliance
            </Link>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">Audit trail</span>
          </div>
        }
        right={
          <Button variant="secondary" icon="ti-download">Export CSV</Button>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="max-w-[1280px] flex flex-col gap-[16px]">
          {audit.audit_trail.length === 0 && (
            <Card className="px-6 py-10 text-center text-[12.5px] text-text-tertiary">
              No completed pay runs yet
            </Card>
          )}

          {audit.audit_trail.map((entry) => (
            <Card key={entry.run_id} className="overflow-hidden">
              {/* Run header */}
              <div className="px-[22px] py-[16px] border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    href={`/payroll/${entry.run_id}`}
                    className="text-[13px] font-medium text-text-primary hover:underline"
                  >
                    {entry.period}
                  </Link>
                  <Pill tone={entry.status === "completed" ? "success" : "info"}>
                    {entry.status}
                  </Pill>
                </div>
                <div className="flex items-center gap-6 text-[11.5px] text-text-tertiary tabular">
                  <span>{entry.employee_count} employees</span>
                  <span>Initiated {fmtDateTime(entry.initiated_at)}</span>
                  <span>Completed {fmtDateTime(entry.completed_at)}</span>
                </div>
              </div>

              {/* Remittances table */}
              <div
                className="grid items-center bg-muted border-b border-border px-[22px] py-[10px] text-text-tertiary"
                style={{
                  gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr 1fr 1fr",
                  columnGap: "16px",
                  fontSize: "10.5px",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                <div>Country</div>
                <div>Authority</div>
                <div>Tax type</div>
                <div className="text-right">Amount</div>
                <div>Status</div>
                <div>Reference</div>
              </div>

              {entry.remittances.length === 0 && (
                <div className="px-[22px] py-[14px] text-[12px] text-text-tertiary">
                  No remittances for this run yet
                </div>
              )}

              {entry.remittances.map((r, i) => (
                <div
                  key={i}
                  className={`grid items-center px-[22px] py-[12px] ${i < entry.remittances.length - 1 ? "border-b border-border-subtle" : ""}`}
                  style={{
                    gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr 1fr 1fr",
                    columnGap: "16px",
                  }}
                >
                  <div className="text-[12.5px] text-text-primary">
                    {CC_TO_NAME[r.country] ?? r.country}
                  </div>
                  <div className="text-[12.5px] text-text-secondary">{r.authority}</div>
                  <div className="text-[12.5px] text-text-secondary">{r.tax_type}</div>
                  <div className="text-[12.5px] tabular text-text-primary text-right">
                    {fmtMoney(r.amount, r.currency)}
                  </div>
                  <div>
                    <Pill tone={r.status === "remitted" ? "success" : "info"}>{r.status}</Pill>
                  </div>
                  <div className="text-[11.5px] text-text-tertiary tabular truncate">
                    {r.reference ?? "—"}
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
