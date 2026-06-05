"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "../../../_components/Header";
import { Button, Card } from "../../../_components/ui";
import { api, ApiError } from "../../../_lib/api";

export default function AddEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "Temp0rary!",
    country: "NG",
    employment_type: "full_time" as "full_time" | "contractor",
    gross_salary: "",
    currency: "NGN",
    bank_name: "",
    bank_account_number: "",
    bank_code: "",
    tax_id: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await api.employees.create({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        country: form.country,
        employment_type: form.employment_type,
        gross_salary: Number(form.gross_salary),
        currency: form.currency,
        bank_name: form.bank_name || undefined,
        bank_account_number: form.bank_account_number || undefined,
        bank_code: form.bank_code || undefined,
        tax_id: form.tax_id || undefined,
      });
      router.push(`/employees/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError && typeof err.detail === "string" ? err.detail : "Couldn't save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <Link href="/people" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              People
            </Link>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">Add person</span>
          </div>
        }
        right={
          <>
            <Button variant="secondary" href="/people">Cancel</Button>
            <button
              type="submit"
              form="add-employee-form"
              disabled={submitting}
              className="inline-flex items-center gap-[6px] rounded-[5px] text-[12px] font-medium leading-none px-[14px] py-[7px] bg-text-primary text-white hover:bg-text-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save & invite"}
            </button>
          </>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <form id="add-employee-form" onSubmit={onSubmit} className="max-w-[680px]">
          {error && (
            <div
              className="text-[11.5px] font-medium mb-4 px-[12px] py-[8px] rounded-[5px]"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
            >
              {error}
            </div>
          )}

          <Card className="px-[32px] py-[28px]">
            <h2 className="text-[17px] font-medium text-text-primary" style={{ letterSpacing: "-0.015em" }}>
              Identity
            </h2>
            <p className="text-[12.5px] text-text-tertiary mt-[6px]">
              Basic information about the person you're adding
            </p>

            <div className="mt-[24px] flex flex-col gap-[16px]">
              <Field label="Full name" value={form.full_name} onChange={set("full_name")} required />
              <Field label="Personal email" type="email" value={form.email} onChange={set("email")} required />

              <div className="grid grid-cols-2 gap-[14px]">
                <Field label="Country (ISO)" value={form.country} onChange={(v) => set("country")(v.toUpperCase().slice(0, 3))} required />
                <div>
                  <label className="label block mb-[7px]">Employment type</label>
                  <select
                    value={form.employment_type}
                    onChange={(e) => set("employment_type")(e.target.value)}
                    className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary focus:outline-none focus:border-text-secondary"
                  >
                    <option value="full_time">Full-time</option>
                    <option value="contractor">Contractor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[14px]">
                <Field label="Gross salary" type="number" value={form.gross_salary} onChange={set("gross_salary")} required />
                <Field label="Currency" value={form.currency} onChange={(v) => set("currency")(v.toUpperCase().slice(0, 3))} required />
              </div>

              <Field label="National ID / Tax ID" value={form.tax_id} onChange={set("tax_id")} />

              <hr className="border-border" />

              <Field label="Bank name" value={form.bank_name} onChange={set("bank_name")} />
              <div className="grid grid-cols-2 gap-[14px]">
                <Field label="Bank code" value={form.bank_code} onChange={set("bank_code")} />
                <Field label="Account number" value={form.bank_account_number} onChange={set("bank_account_number")} tabular />
              </div>
            </div>
          </Card>
        </form>
      </main>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  tabular = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  tabular?: boolean;
}) {
  return (
    <div>
      <label className="label block mb-[7px]">
        {label}
        {required && <span className="text-warning ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-text-secondary ${tabular ? "tabular" : ""}`}
      />
    </div>
  );
}
