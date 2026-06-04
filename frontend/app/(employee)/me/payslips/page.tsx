import Header from "../../../_components/Header";
import { Button, Card } from "../../../_components/ui";

type Status = "paid" | "pending" | "retry";

type Payslip = {
  period: string;
  gross: string;
  tax: string;
  net: string;
  paid: { date: string; status: Status };
};

const PAYSLIPS: Payslip[] = [
  {
    period: "May 2026",
    gross: "₦8,700,000",
    tax: "−₦1,605,464",
    net: "₦7,094,536",
    paid: { date: "May 1", status: "paid" },
  },
  {
    period: "April 2026",
    gross: "₦8,700,000",
    tax: "−₦1,605,464",
    net: "₦7,094,536",
    paid: { date: "Apr 1", status: "paid" },
  },
  {
    period: "March 2026",
    gross: "₦8,700,000",
    tax: "−₦1,605,464",
    net: "₦7,094,536",
    paid: { date: "Mar 1", status: "paid" },
  },
  {
    period: "February 2026",
    gross: "₦8,700,000",
    tax: "−₦1,605,464",
    net: "₦7,094,536",
    paid: { date: "Feb 1", status: "paid" },
  },
  {
    period: "January 2026",
    gross: "₦8,700,000",
    tax: "−₦1,605,464",
    net: "₦7,094,536",
    paid: { date: "Jan 1", status: "paid" },
  },
];

const STATUS_COLOR: Record<Status, string> = {
  paid: "#15803d",
  pending: "#1e40af",
  retry: "#b45309",
};

export default function PayslipsPage() {
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
            {/* Header row */}
            <div
              className="grid items-center bg-muted border-b border-border px-[22px] py-[11px] text-text-tertiary"
              style={{
                gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 100px",
                columnGap: "16px",
                fontSize: "10.5px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <div>Period</div>
              <div className="text-right">Gross</div>
              <div className="text-right">Tax</div>
              <div className="text-right">Net</div>
              <div>Paid</div>
              <div />
            </div>

            {PAYSLIPS.map((p, i) => {
              const isMostRecent = i === 0;
              return (
                <div
                  key={p.period}
                  className={`grid items-center px-[22px] py-[14px] ${
                    i < PAYSLIPS.length - 1
                      ? "border-b border-border-subtle"
                      : ""
                  }`}
                  style={{
                    gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 100px",
                    columnGap: "16px",
                  }}
                >
                  <div
                    className={`text-[12.5px] text-text-primary ${isMostRecent ? "font-medium" : ""}`}
                  >
                    {p.period}
                  </div>
                  <div className="text-[12.5px] tabular text-text-primary text-right">
                    {p.gross}
                  </div>
                  <div className="text-[12.5px] tabular text-text-tertiary text-right">
                    {p.tax}
                  </div>
                  <div
                    className={`text-[12.5px] tabular text-text-primary text-right ${isMostRecent ? "font-medium" : ""}`}
                  >
                    {p.net}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-[6px] h-[6px] rounded-full"
                      style={{ background: STATUS_COLOR[p.paid.status] }}
                    />
                    <span className="text-[12px] text-text-secondary">
                      {p.paid.date}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-[6px]">
                    <i className="ti ti-eye text-[15px] text-text-secondary cursor-pointer" />
                    <i className="ti ti-download text-[15px] text-text-secondary cursor-pointer" />
                  </div>
                </div>
              );
            })}

            {/* Expander */}
            <div className="bg-muted px-[22px] py-[10px] flex items-center gap-2 cursor-pointer">
              <i className="ti ti-chevron-down text-[13px] text-text-tertiary" />
              <span className="text-[11px] text-text-tertiary">
                + 9 earlier payslips
              </span>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
