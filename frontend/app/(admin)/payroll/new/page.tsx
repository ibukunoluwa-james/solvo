"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "../../../_components/Header";
import { Button, Card } from "../../../_components/ui";
import { api, ApiError } from "../../../_lib/api";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function NewPayrollPage() {
  const router = useRouter();
  const now = { month: 6, year: 2026 };
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const run = await api.payroll.createRun({
        period_month: month,
        period_year: year,
        notes: notes || undefined,
      });
      router.push(`/payroll/${run.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError && typeof err.detail === "string"
          ? err.detail
          : "Couldn't create pay run"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <Link href="/payroll" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              Pay runs
            </Link>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">New pay run</span>
          </div>
        }
        right={
          <>
            <Button variant="secondary" href="/payroll">Cancel</Button>
            <button
              type="submit"
              form="new-payrun-form"
              disabled={submitting}
              className="inline-flex items-center gap-[6px] rounded-[5px] text-[12px] font-medium leading-none px-[14px] py-[7px] bg-text-primary text-white hover:bg-text-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create draft"}
            </button>
          </>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <form id="new-payrun-form" onSubmit={onSubmit} className="max-w-[680px]">
          {error && (
            <div
              className="text-[11.5px] font-medium mb-4 px-[12px] py-[8px] rounded-[5px]"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
            >
              {error}
            </div>
          )}

          <Card className="px-[26px] py-[24px]">
            <div>
              <h2 className="text-[15px] font-medium text-text-primary" style={{ letterSpacing: "-0.01em" }}>
                Pay period
              </h2>
              <p className="text-[12px] text-text-tertiary mt-[4px]">
                When this run covers. Solvo calculates net + tax during preview.
              </p>
            </div>

            <div className="mt-[18px] grid grid-cols-2 gap-[12px]">
              <div>
                <label className="label block mb-[7px]">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary focus:outline-none focus:border-text-secondary"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label block mb-[7px]">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary focus:outline-none focus:border-text-secondary"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-[18px]">
              <label className="label block mb-[7px]">Notes (optional)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[10px] text-[13px] text-text-primary focus:outline-none focus:border-text-secondary resize-none"
              />
            </div>
          </Card>

          <p className="text-[11.5px] text-text-tertiary mt-3">
            After creating the draft you'll review every payslip line before approving.
          </p>
        </form>
      </main>
    </>
  );
}
