"use client";

import { useState } from "react";
import { Button, Card } from "../../_components/ui";
import { api, ApiError } from "../../_lib/api";
import type { Company } from "../../_lib/types";

export default function SettingsForm({ initial }: { initial: Company }) {
  const [name, setName] = useState(initial.name);
  const [industry, setIndustry] = useState(initial.industry ?? "");
  const [currency, setCurrency] = useState(initial.currency);
  const [koraWallet, setKoraWallet] = useState(initial.kora_wallet_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty =
    name !== initial.name ||
    (industry || null) !== initial.industry ||
    currency !== initial.currency ||
    (koraWallet || null) !== initial.kora_wallet_id;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await api.companies.updateMe({
        name,
        industry: industry || undefined,
        currency,
        kora_wallet_id: koraWallet || undefined,
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError && typeof err.detail === "string"
          ? err.detail
          : "Couldn't save settings"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[16px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[11.5px] text-success">Changes saved</span>
          )}
          {dirty && !saved && (
            <span className="text-[11.5px] text-warning">Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" type="button">
            Discard
          </Button>
          <button
            type="submit"
            disabled={saving || !dirty}
            className="inline-flex items-center gap-[6px] rounded-[5px] text-[12px] font-medium leading-none px-[14px] py-[7px] bg-text-primary text-white hover:bg-text-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="text-[11.5px] font-medium px-[12px] py-[8px] rounded-[5px]"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
        >
          {error}
        </div>
      )}

      <Card className="px-[26px] py-[24px]">
        <h2 className="text-[15px] font-medium text-text-primary" style={{ letterSpacing: "-0.01em" }}>
          Company profile
        </h2>
        <p className="text-[12px] text-text-tertiary mt-[4px]">
          Public name, industry, and base currency for reporting.
        </p>

        <div className="mt-[22px] grid gap-[14px]">
          <Field label="Display name" value={name} onChange={setName} />
          <div className="grid grid-cols-2 gap-[14px]">
            <Field label="Industry" value={industry} onChange={setIndustry} placeholder="Technology" />
            <Field
              label="Reporting currency"
              value={currency}
              onChange={(v) => setCurrency(v.toUpperCase().slice(0, 3))}
              tabular
            />
          </div>
          <Field
            label="Kora wallet ID"
            value={koraWallet}
            onChange={setKoraWallet}
            placeholder="kora_wallet_xxx"
            tabular
          />
        </div>
      </Card>

      <div className="bg-card rounded-[8px] px-[24px] py-[20px] flex items-center justify-between gap-4" style={{ border: "1px solid #fee2e2" }}>
        <div>
          <div className="text-[13px] font-medium" style={{ color: "#991b1b" }}>
            Close workspace
          </div>
          <p className="text-[12px] text-text-tertiary mt-[3px]">
            Permanently delete this workspace, employee records, and history. This can't be undone.
          </p>
        </div>
        <button
          type="button"
          className="text-[12px] font-medium px-[13px] py-[7px] rounded-[5px] whitespace-nowrap"
          style={{ background: "#fff", border: "1px solid #fecaca", color: "#991b1b" }}
        >
          Close workspace
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  tabular = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tabular?: boolean;
}) {
  return (
    <div>
      <label className="label block mb-[7px]">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-text-secondary ${tabular ? "tabular" : ""}`}
      />
    </div>
  );
}
