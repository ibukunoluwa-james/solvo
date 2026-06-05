import Header from "../../../_components/Header";
import { Button, Card } from "../../../_components/ui";
import { api } from "../../../_lib/api";
import type { PayrollEntryStatus } from "../../../_lib/types";

const fmtMoney = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " " + currency;

const STATUS_COLOR: Record<PayrollEntryStatus, string> = {
  settled: "#15803d",
  processing: "#1e40af",
  pending: "#1e40af",
  failed: "#b45309",
};

const STATUS_LABEL: Record<PayrollEntryStatus, string> = {
  settled: "Settled",
  processing: "Processing",
  pending: "Pending",
  failed: "Failed",
};

export default async function PayslipsPage() {
  const payslips = await api.employees.myPayslips();

  return (
    <>
      <Header
        title="Payslips"
        right={
          <Button variant="secondary" icon="ti-download">
            Download all
          </Button>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="max-w-[1080px]">
          <Card className="overflow-hidden">
            <div
              className="grid items-center bg-muted border-b border-border px-[22px] py-[11px] text-text-tertiary"
              style={{
                gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 100px",
                columnGap: "16px",
                fontSize: "10.5px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <div>Payslip</div>
              <div className="text-right">Gross</div>
              <div className="text-right">Tax</div>
              <div className="text-right">Net</div>
              <div>Status</div>
              <div />
            </div>

            {payslips.length === 0 && (
              <div className="px-[22px] py-[28px] text-center text-[12.5px] text-text-tertiary">
                Your first payslip will appear after the next pay run
              </div>
            )}

            {payslips.map((p, i) => (
              <div
                key={p.id}
                className={`grid items-center px-[22px] py-[14px] ${i < payslips.length - 1 ? "border-b border-border-subtle" : ""}`}
                style={{
                  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 100px",
                  columnGap: "16px",
                }}
              >
                <div className="text-[12.5px] text-text-primary tabular">{p.id}</div>
                <div className="text-[12.5px] tabular text-text-primary text-right">
                  {fmtMoney(p.gross_salary, p.currency)}
                </div>
                <div className="text-[12.5px] tabular text-text-tertiary text-right">
                  −{fmtMoney(p.paye_tax + p.nhf + p.pension_employee, p.currency)}
                </div>
                <div className="text-[12.5px] tabular text-text-primary font-medium text-right">
                  {fmtMoney(p.net_salary, p.currency)}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-[6px] h-[6px] rounded-full"
                    style={{ background: STATUS_COLOR[p.status] }}
                  />
                  <span className="text-[12px] text-text-secondary">{STATUS_LABEL[p.status]}</span>
                </div>
                <div className="flex items-center justify-end gap-[6px]">
                  <i className="ti ti-eye text-[15px] text-text-secondary cursor-pointer" />
                  <i className="ti ti-download text-[15px] text-text-secondary cursor-pointer" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </main>
    </>
  );
}
