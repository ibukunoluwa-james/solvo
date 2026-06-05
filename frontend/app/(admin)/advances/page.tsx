import Link from "next/link";
import Header from "../../_components/Header";
import { Avatar, Button, Card, Pill, StatStrip } from "../../_components/ui";
import { api } from "../../_lib/api";
import type { Advance } from "../../_lib/types";

const fmtMoney = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " " + currency;

const relTime = (iso: string) => {
  const d = new Date(iso).getTime();
  const now = new Date("2026-06-04T00:00:00Z").getTime();
  const min = Math.round((now - d) / 60000);
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.round(h / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export default async function AdvancesPage() {
  const [allResp, pendingResp, approvedResp, disbursedResp] = await Promise.all([
    api.advances.list({ limit: 50 }),
    api.advances.list({ status_filter: "pending", limit: 20 }),
    api.advances.list({ status_filter: "approved", limit: 20 }),
    api.advances.list({ status_filter: "disbursed", limit: 20 }),
  ]);

  const monthSum = allResp.advances.reduce((s, a) => s + a.amount, 0);
  // Show sum in any one currency for the demo — choose USD-ish stand-in
  const display = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

  return (
    <>
      <Header
        title="Advances"
        right={
          <Button variant="secondary" icon="ti-settings">
            Auto-approval rules
          </Button>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[20px] max-w-[1280px]">
          <StatStrip
            cells={[
              { label: "All requests", value: allResp.total },
              { label: "Pending", value: <span className="text-warning">{pendingResp.total}</span> },
              { label: "Approved", value: approvedResp.total },
              { label: "Disbursed", value: disbursedResp.total },
            ]}
          />

          {/* Status segments */}
          <div className="flex items-center gap-1 -mt-[6px] mb-[-6px]">
            <Chip active>
              Pending <span className="tabular text-text-tertiary ml-[2px]">{pendingResp.total}</span>
            </Chip>
            <Chip>
              Approved <span className="tabular text-text-tertiary/80 ml-[2px]">{approvedResp.total}</span>
            </Chip>
            <Chip>
              Disbursed <span className="tabular text-text-tertiary/80 ml-[2px]">{disbursedResp.total}</span>
            </Chip>
          </div>

          {/* Pending cards */}
          {pendingResp.advances.length > 0 && (
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {pendingResp.advances.slice(0, 4).map((a) => (
                <PendingCard key={a.id} item={a} />
              ))}
            </div>
          )}

          {/* Disbursed table */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-[22px] py-[16px] border-b border-border">
              <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                Recently disbursed
              </h3>
              <span className="text-[11px] text-text-tertiary leading-none">
                {disbursedResp.total} total
              </span>
            </div>
            {disbursedResp.advances.length === 0 ? (
              <div className="px-[22px] py-[20px] text-[12px] text-text-tertiary">
                No disbursed advances yet
              </div>
            ) : (
              disbursedResp.advances.map((a, i, arr) => (
                <Link
                  key={a.id}
                  href={`/advances/${a.id}`}
                  className={`grid items-center px-[22px] py-[14px] hover:bg-canvas transition-colors ${i < arr.length - 1 ? "border-b border-border-subtle" : ""}`}
                  style={{
                    gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr 100px",
                    columnGap: "16px",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={a.employee_name ?? ""} size={26} />
                    <span className="text-[12.5px] text-text-primary truncate">
                      {a.employee_name ?? a.employee_id}
                    </span>
                  </div>
                  <div className="text-[12.5px] text-text-secondary capitalize">{a.reason}</div>
                  <div className="text-[12.5px] tabular text-text-primary text-right">
                    {fmtMoney(a.amount, a.currency)}
                  </div>
                  <div className="text-[12.5px] tabular text-text-tertiary text-right">
                    Fee {fmtMoney(a.fee_amount, a.currency)}
                  </div>
                  <div className="text-[12px] tabular text-text-tertiary text-right">
                    {a.disbursed_at ? relTime(a.disbursed_at) : "—"}
                  </div>
                </Link>
              ))
            )}
          </Card>
        </div>
      </main>
    </>
  );
}

function PendingCard({ item }: { item: Advance }) {
  return (
    <Link href={`/advances/${item.id}`} className="block focus:outline-none">
      <Card className="overflow-hidden">
        <div className="px-[20px] py-[14px] bg-warning-bg-soft border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={item.employee_name ?? ""} size={32} />
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-text-primary leading-tight truncate">
                {item.employee_name ?? item.employee_id}
              </div>
              <div className="text-[11px] text-text-tertiary leading-tight truncate capitalize">
                {item.reason} · {relTime(item.requested_at)}
              </div>
            </div>
          </div>
          <Pill tone="warning">Pending</Pill>
        </div>

        <div className="px-[20px] py-[18px] border-b border-border-subtle">
          <div className="label mb-[8px]">Requested</div>
          <div
            className="text-[24px] font-medium text-text-primary tabular leading-none"
            style={{ letterSpacing: "-0.02em" }}
          >
            {fmtMoney(item.amount, item.currency)}
          </div>
          <div className="text-[12px] text-text-tertiary mt-[6px] tabular">
            Fee {item.fee_percentage}% · {fmtMoney(item.fee_amount, item.currency)}
          </div>
        </div>

        {item.description && (
          <div className="px-[20px] py-[14px] border-b border-border-subtle">
            <div className="label mb-[8px]">Reason</div>
            <p className="text-[12px] text-text-secondary italic" style={{ lineHeight: 1.5 }}>
              "{item.description}"
            </p>
          </div>
        )}

        <div className="px-[20px] py-[14px] text-[11.5px] text-text-tertiary text-right">
          Review →
        </div>
      </Card>
    </Link>
  );
}

function Chip({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      className={`text-[12px] font-medium leading-none px-[10px] py-[6px] rounded-[5px] transition-colors ${
        active
          ? "text-text-primary border border-border bg-card"
          : "text-text-tertiary border border-transparent hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
