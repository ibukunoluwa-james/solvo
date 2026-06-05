import Link from "next/link";
import Header from "../../../_components/Header";
import { Avatar, Card, Pill } from "../../../_components/ui";
import { api } from "../../../_lib/api";
import type { AdvanceStatus } from "../../../_lib/types";
import AdvanceActions from "./AdvanceActions";

const STATUS_PILL: Record<AdvanceStatus, { tone: "success" | "warning" | "info"; label: string }> = {
  pending: { tone: "warning", label: "Pending" },
  approved: { tone: "info", label: "Approved" },
  rejected: { tone: "warning", label: "Rejected" },
  disbursed: { tone: "success", label: "Disbursed" },
  repaid: { tone: "success", label: "Repaid" },
};

const fmtMoney = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " " + currency;

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

type PageProps = { params: Promise<{ id: string }> };

export default async function AdvanceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const a = await api.advances.get(id);
  const employee = await api.employees.get(a.employee_id).catch(() => null);
  const pill = STATUS_PILL[a.status];

  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <Link href="/advances" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              Advances
            </Link>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">
              {a.employee_name ?? a.employee_id}
            </span>
            <Pill tone={pill.tone} className="ml-2">{pill.label}</Pill>
          </div>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="grid max-w-[1280px]" style={{ gridTemplateColumns: "1fr 320px", gap: "20px" }}>
          {/* Left column */}
          <div className="flex flex-col gap-[16px]">
            <Card className="px-[26px] py-[24px]">
              <div className="flex items-start justify-between gap-4 mb-[22px]">
                <div className="flex items-center gap-[14px]">
                  <Avatar name={a.employee_name ?? ""} size={44} />
                  <div>
                    <div className="text-[15px] font-medium text-text-primary leading-tight">
                      {a.employee_name ?? a.employee_id}
                    </div>
                    <div className="text-[12px] text-text-tertiary mt-[2px]">
                      {employee
                        ? `${employee.employment_type === "contractor" ? "Contractor" : "Employee"} · ${employee.country}`
                        : "—"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="label">Requested</div>
                  <div
                    className="text-[26px] font-medium text-text-primary tabular leading-none mt-[4px]"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {fmtMoney(a.amount, a.currency)}
                  </div>
                  <div className="text-[11.5px] text-text-tertiary mt-[4px] tabular">
                    {fmtDateTime(a.requested_at)}
                  </div>
                </div>
              </div>

              <div
                className="grid items-center pt-[18px] border-t border-border"
                style={{
                  gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
                  columnGap: "18px",
                }}
              >
                <Metric label="Reason" value={a.reason} />
                <Divider />
                <Metric
                  label={`Fee · ${a.fee_percentage}%`}
                  value={fmtMoney(a.fee_amount, a.currency)}
                />
                <Divider />
                <Metric
                  label="Approved"
                  value={a.approved_amount !== null ? fmtMoney(a.approved_amount, a.currency) : "—"}
                />
              </div>
            </Card>

            {/* Description */}
            {a.description && (
              <Card className="px-[26px] py-[20px]">
                <div className="label mb-[8px]">Employee note</div>
                <p className="text-[12.5px] text-text-secondary italic" style={{ lineHeight: 1.5 }}>
                  "{a.description}"
                </p>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <div className="px-[22px] py-[16px] border-b border-border">
                <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                  Timeline
                </h3>
              </div>
              <div className="px-[22px] py-[16px] flex flex-col gap-[10px]">
                <TimelineRow icon="ti-circle-check" color="success" label="Requested" when={fmtDateTime(a.requested_at)} />
                {a.resolved_at && (
                  <TimelineRow
                    icon={a.status === "rejected" ? "ti-x" : "ti-circle-check"}
                    color={a.status === "rejected" ? "warning" : "success"}
                    label={a.status === "rejected" ? "Rejected" : "Approved"}
                    when={fmtDateTime(a.resolved_at)}
                  />
                )}
                {a.disbursed_at && (
                  <TimelineRow icon="ti-circle-check" color="success" label="Disbursed" when={fmtDateTime(a.disbursed_at)} />
                )}
                {a.kora_transfer_id && (
                  <div className="text-[11.5px] text-text-tertiary tabular">
                    Kora ref: {a.kora_transfer_id}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Decision sidebar */}
          <Card className="px-[24px] py-[22px]" style={{ position: "sticky", top: "20px", height: "fit-content" }}>
            <div className="label mb-[14px]">Decision</div>
            <AdvanceActions advance={a} />

            {employee?.bank_account_number && (
              <div className="mt-[22px] pt-[18px] border-t border-border">
                <div className="label mb-[12px]">Disbursement target</div>
                <div className="flex items-center gap-3">
                  <div className="w-[28px] h-[28px] bg-subtle rounded-[4px] flex items-center justify-center">
                    <i className="ti ti-building-bank text-[13px] text-text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-text-primary leading-tight tabular">
                      {employee.bank_name ?? "Bank"} ····{employee.bank_account_number.slice(-4)}
                    </div>
                    <div className="text-[11px] text-text-tertiary leading-tight mt-[2px]">
                      {employee.country}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label mb-[6px]">{label}</div>
      <div className="text-[17px] font-medium text-text-primary tabular leading-none capitalize">{value}</div>
    </div>
  );
}

function Divider() {
  return (
    <div className="bg-border" style={{ width: "1px", height: "32px", justifySelf: "center" }} />
  );
}

function TimelineRow({
  icon,
  color,
  label,
  when,
}: {
  icon: string;
  color: "success" | "warning";
  label: string;
  when: string;
}) {
  const colorClass = color === "success" ? "text-success" : "text-warning";
  return (
    <div className="flex items-center gap-2">
      <i className={`ti ${icon} text-[14px] ${colorClass}`} />
      <span className="text-[12.5px] text-text-primary flex-1">{label}</span>
      <span className="text-[11.5px] text-text-tertiary tabular">{when}</span>
    </div>
  );
}
