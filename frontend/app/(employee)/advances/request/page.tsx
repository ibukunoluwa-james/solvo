"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "../../../_components/Header";
import { Card } from "../../../_components/ui";
import { api, ApiError } from "../../../_lib/api";
import type { AdvanceCreateRequest } from "../../../_lib/types";

type Reason = AdvanceCreateRequest["reason"];

const REASONS: { value: Reason; label: string }[] = [
  { value: "medical", label: "Medical" },
  { value: "equipment", label: "Equipment" },
  { value: "emergency", label: "Emergency" },
  { value: "rent", label: "Rent" },
  { value: "other", label: "Other" },
];

const FEE_PCT = 2.5;

export default function AdvanceRequestPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(150000);
  const [currency, setCurrency] = useState("NGN");
  const [reason, setReason] = useState<Reason>("medical");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fee = amount * (FEE_PCT / 100);
  const receive = amount - fee;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await api.advances.create({
        amount,
        currency,
        reason,
        description: description || undefined,
      });
      router.push(`/me`); // employees view their submitted advance via /me area
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      created.id;
    } catch (err) {
      setError(
        err instanceof ApiError && typeof err.detail === "string"
          ? err.detail
          : "Couldn't submit request"
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
            <Link href="/me" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              My profile
            </Link>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">Request advance</span>
          </div>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <form onSubmit={onSubmit} className="max-w-[720px] mx-auto">
          {error && (
            <div
              className="text-[11.5px] font-medium mb-4 px-[12px] py-[8px] rounded-[5px]"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
            >
              {error}
            </div>
          )}

          <Card className="px-[32px] py-[28px]">
            <h2
              className="text-[16px] font-medium text-text-primary mb-[24px]"
              style={{ letterSpacing: "-0.015em" }}
            >
              How much do you need?
            </h2>

            {/* Amount + currency */}
            <div className="grid grid-cols-3 gap-[12px]">
              <div className="col-span-2">
                <label className="label block mb-[7px]">Amount</label>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[20px] font-medium text-text-primary tabular focus:outline-none focus:border-text-secondary"
                  style={{ letterSpacing: "-0.02em" }}
                />
              </div>
              <div>
                <label className="label block mb-[7px]">Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
                  className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[12px] text-[14px] font-medium text-text-primary tabular focus:outline-none focus:border-text-secondary"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="mt-[20px]">
              <label className="label block mb-[7px]">Reason</label>
              <div className="flex flex-wrap gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={`text-[12px] font-medium leading-none px-[12px] py-[7px] rounded-[5px] border transition-colors ${
                      reason === r.value
                        ? "bg-text-primary text-white border-text-primary"
                        : "bg-card text-text-secondary border-border-strong hover:bg-subtle"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mt-[20px]">
              <label className="label block mb-[7px]">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Tell your employer why — helps speed up approval"
                className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[10px] text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-text-secondary resize-none"
              />
            </div>

            {/* Preview */}
            <div className="mt-[22px] bg-canvas border border-border rounded-[6px] px-[20px] py-[18px]">
              <div className="label mb-[14px]">Preview</div>
              <PreviewRow
                label="You receive"
                value={`${receive.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`}
                bold
              />
              <PreviewRow
                label={`Fee · ${FEE_PCT}%`}
                value={`−${fee.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`}
                tertiary
              />
              <div className="pt-[10px] mt-[10px] border-t border-border">
                <PreviewRow
                  label="Total repayment"
                  value={`${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`}
                  bold
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-[22px] flex items-center gap-[10px]">
              <Link
                href="/me"
                className="flex-1 bg-card text-text-secondary border border-border-strong font-medium rounded-[5px] py-[10px] text-[13px] text-center hover:bg-subtle transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || amount <= 0}
                className="bg-text-primary text-white font-medium rounded-[5px] py-[10px] text-[13px] hover:bg-text-primary/90 transition-colors disabled:opacity-60"
                style={{ flex: 2 }}
              >
                {submitting
                  ? "Submitting…"
                  : `Request ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`}
              </button>
            </div>
          </Card>
        </form>
      </main>
    </>
  );
}

function PreviewRow({
  label,
  value,
  bold = false,
  tertiary = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tertiary?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-[5px]">
      <span className={`text-[12.5px] ${tertiary ? "text-text-tertiary" : "text-text-secondary"}`}>
        {label}
      </span>
      <span
        className={`tabular text-[13px] ${bold ? "font-medium" : ""} ${tertiary ? "text-text-tertiary" : "text-text-primary"}`}
      >
        {value}
      </span>
    </div>
  );
}
