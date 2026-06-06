"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import Header from "../../../_components/Header";
import { Avatar, Button, Card, Pill } from "../../../_components/ui";
import { api, ApiError } from "../../../_lib/api";
import { useApi, PageStatus } from "../../../_lib/useApi";
import type { PayrollEntry, TaxSummaryItem } from "../../../_lib/types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CC_TO_NAME: Record<string, string> = {
  NG: "Nigeria", KE: "Kenya", ZA: "South Africa", EG: "Egypt", GH: "Ghana",
};

const fmtMoney = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " " + currency;

const fmtUsd = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const COUNTRY_COLOR: Record<string, string> = {
  NG: "#18181b", KE: "#52525b", ZA: "#a1a1aa", EG: "#d4d4d8",
};

export default function PayRunReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useApi(async () => {
    // Get the run first; only call /preview if the run is still a draft.
    // /preview is a mutation (draft → previewed) and 400s on completed /
    // processing / failed runs, so blindly calling it on every load breaks
    // the post-execute reload. Once a run has been previewed at least once,
    // entries + tax-summary are stable read endpoints that work in any state.
    let run = await api.payroll.getRun(id);
    if (run.status === "draft") {
      await api.payroll.previewRun(id);
      run = await api.payroll.getRun(id);
    }
    const [entries, taxSummary] = await Promise.all([
      api.payroll.getEntries(id),
      api.payroll.getTaxSummary(id),
    ]);
    return { run, entries, taxSummary };
  }, [id]);
  const [funding, setFunding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!data) return <PageStatus loading={loading} error={error} onRetry={reload} />;

  const { run, entries, taxSummary } = data;
  const canFund = run.status === "draft" || run.status === "previewed";

  async function approveAndFund() {
    setActionError(null);
    setFunding(true);
    try {
      await api.payroll.executeRun(id);
      reload();
    } catch (err) {
      setActionError(
        err instanceof ApiError && typeof err.detail === "string"
          ? err.detail
          : "Couldn’t fund this run. Please try again.",
      );
    } finally {
      setFunding(false);
    }
  }

  // Group entries by country
  const groups = new Map<string, PayrollEntry[]>();
  for (const e of entries) {
    const cc = e.employee_country ?? "??";
    if (!groups.has(cc)) groups.set(cc, []);
    groups.get(cc)!.push(e);
  }

  const periodLabel = `${MONTHS[run.period_month - 1]} ${run.period_year}`;

  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/payroll" className="text-[13px] text-text-tertiary hover:text-text-secondary">
              Pay runs
            </Link>
            <i className="ti ti-chevron-right text-[12px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">{periodLabel}</span>
            <Pill tone={run.status === "completed" ? "success" : "info"} className="ml-2">
              {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
            </Pill>
          </div>
        }
        right={
          <>
            <Button variant="secondary" href="/payroll">
              Back to runs
            </Button>
            {run.status === "completed" ? (
              <Button variant="secondary" icon="ti-check" disabled className="opacity-70">
                Funded
              </Button>
            ) : run.status === "processing" ? (
              <Button variant="secondary" disabled className="opacity-70">
                Processing…
              </Button>
            ) : run.status === "failed" ? (
              <Button variant="secondary" icon="ti-alert-triangle" disabled className="opacity-70">
                Funding failed
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={approveAndFund}
                disabled={funding || !canFund}
                className="disabled:opacity-60"
              >
                {funding ? "Funding…" : "Approve & fund"}
              </Button>
            )}
          </>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[20px] max-w-[1280px]">
          {actionError && (
            <div
              className="text-[11.5px] font-medium px-[12px] py-[8px] rounded-[5px]"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
            >
              {actionError}
            </div>
          )}

          {/* Summary card */}
          <Card className="px-[26px] py-[22px]">
            <div
              className="grid items-center"
              style={{
                gridTemplateColumns: "1.4fr 1px 1fr 1px 1fr 1px 1fr",
                columnGap: "20px",
              }}
            >
              <SummaryCell label="Total net" value={fmtUsd(run.total_net)} big />
              <Divider />
              <SummaryCell label="Taxes withheld" value={fmtUsd(run.total_tax)} />
              <Divider />
              <SummaryCell label="Pension" value={fmtUsd(run.total_pension)} />
              <Divider />
              <SummaryCell label="Total gross" value={fmtUsd(run.total_gross)} />
            </div>
          </Card>

          {/* Tax summary strip */}
          <Card>
            <div className="px-[22px] py-[16px] border-b border-border">
              <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                Tax summary by authority
              </h3>
            </div>
            <div className="px-[22px] py-[14px] flex flex-wrap gap-x-6 gap-y-3">
              {taxSummary.map((t: TaxSummaryItem, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <i className="ti ti-circle-check text-[14px] text-success" />
                  <span className="text-[12px] text-text-secondary">
                    {t.country} · {t.authority} · {t.tax_type}
                  </span>
                  <span className="text-[12px] tabular text-text-primary font-medium">
                    {fmtMoney(t.total_amount, t.currency)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Payroll lines */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-border">
              <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                Payroll lines
              </h3>
              <span className="text-[11.5px] text-text-tertiary leading-none">
                {entries.length} of {run.employee_count} loaded · grouped by country
              </span>
            </div>

            {Array.from(groups.entries()).map(([cc, rows]) => {
              const subtotalUsd = rows.reduce((s, r) => s + r.gross_salary, 0); // local currency totals — best we can show without FX
              const localCurrency = rows[0]?.currency ?? "";
              return (
                <div key={cc}>
                  <div className="bg-muted border-b border-border px-[24px] py-[11px] flex items-center gap-3">
                    <span
                      style={{
                        width: 5,
                        height: 14,
                        background: COUNTRY_COLOR[cc] ?? "#71717a",
                        display: "inline-block",
                        borderRadius: 1,
                      }}
                    />
                    <span className="text-[11.5px] font-medium text-text-primary">
                      {CC_TO_NAME[cc] ?? cc}
                    </span>
                    <span className="text-[11px] text-text-tertiary">· {rows.length} people</span>
                    <div className="flex-1" />
                    <span className="text-[11.5px] font-medium text-text-primary tabular ml-3">
                      {fmtMoney(subtotalUsd, localCurrency)}
                    </span>
                  </div>

                  <div
                    className="grid items-center px-[24px] py-[10px] border-b border-border text-text-tertiary"
                    style={{
                      gridTemplateColumns: "2fr 1.1fr 1.1fr 1.1fr 1.1fr",
                      columnGap: "16px",
                      fontSize: "10.5px",
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    <div>Employee</div>
                    <div className="text-right">Gross</div>
                    <div className="text-right">PAYE</div>
                    <div className="text-right">Pension</div>
                    <div className="text-right">Net</div>
                  </div>

                  {rows.map((r, i) => (
                    <div
                      key={r.id}
                      className={`grid items-center px-[24px] py-[13px] ${i < rows.length - 1 ? "border-b border-border-subtle" : ""}`}
                      style={{
                        gridTemplateColumns: "2fr 1.1fr 1.1fr 1.1fr 1.1fr",
                        columnGap: "16px",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={r.employee_name ?? "??"}
                          country={CC_TO_NAME[r.employee_country ?? ""] ?? ""}
                          size={26}
                        />
                        <span className="text-[12.5px] text-text-primary truncate">
                          {r.employee_name ?? r.employee_id}
                        </span>
                      </div>
                      <div className="text-[12.5px] tabular text-text-primary text-right">
                        {fmtMoney(r.gross_salary, r.currency)}
                      </div>
                      <div className="text-[12.5px] tabular text-text-tertiary text-right">
                        −{fmtMoney(r.paye_tax, r.currency)}
                      </div>
                      <div className="text-[12.5px] tabular text-text-tertiary text-right">
                        −{fmtMoney(r.pension_employee, r.currency)}
                      </div>
                      <div className="text-[12.5px] tabular font-medium text-text-primary text-right">
                        {fmtMoney(r.net_salary, r.currency)}
                      </div>
                    </div>
                  ))}
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
      style={{ width: "1px", height: "40px", justifySelf: "center" }}
    />
  );
}

function SummaryCell({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <div className="label mb-[8px]">{label}</div>
      <div
        className={`${big ? "text-[28px]" : "text-[18px]"} font-medium text-text-primary tabular leading-none`}
        style={{ letterSpacing: big ? "-0.02em" : "-0.015em" }}
      >
        {value}
      </div>
    </div>
  );
}
