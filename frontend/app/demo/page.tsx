"use client";

import Link from "next/link";
import { useState } from "react";
import MarketingNav from "../_components/MarketingNav";
import MarketingFooter from "../_components/MarketingFooter";

const TEAM_SIZES = ["1–25", "26–100", "101–500", "500+"];

const HIGHLIGHTS = [
  ["ti-bolt", "A live pay run", "We’ll disburse to your real countries and rails so you can watch it settle."],
  ["ti-receipt", "Your true cost", "Transparent FX and fees for your team — no markup buried in the rate."],
  ["ti-clock", "20 minutes", "Tailored to your countries, currencies and headcount."],
] as const;

export default function DemoPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    size: TEAM_SIZES[1],
    countries: "",
    notes: "",
  });

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Prototype: there is no demo-booking endpoint yet, so we confirm locally.
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <MarketingNav />

      <main className="flex-1">
        <div className="mx-auto max-w-[1180px] px-6 py-[56px]">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-[56px] items-start">
            {/* Left — pitch */}
            <div className="lg:pt-[8px]">
              <div className="inline-flex items-center gap-[7px] text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary mb-[18px]">
                <span className="w-[14px] h-px bg-border-strong" />
                Book a demo
              </div>
              <h1
                className="text-[38px] font-medium text-text-primary"
                style={{ letterSpacing: "-0.03em", lineHeight: 1.08 }}
              >
                See a pay run for your team
              </h1>
              <p className="text-[15px] text-text-secondary mt-[16px] max-w-[420px] leading-[1.6]">
                Tell us where your people are and we’ll walk you through Solvo
                with your countries, currencies and rails — live.
              </p>

              <ul className="mt-[34px] flex flex-col gap-[20px]">
                {HIGHLIGHTS.map(([icon, title, body]) => (
                  <li key={title} className="flex gap-[14px]">
                    <div className="w-[34px] h-[34px] rounded-[8px] bg-card border border-border flex items-center justify-center shrink-0">
                      <i className={`ti ${icon} text-[17px] text-text-primary`} />
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-text-primary">{title}</div>
                      <div className="text-[13px] text-text-tertiary mt-[2px] leading-[1.55] max-w-[360px]">
                        {body}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-[34px] text-[13px] text-text-tertiary">
                Prefer to explore on your own?{" "}
                <Link href="/register" className="text-info hover:underline">
                  Create a workspace
                </Link>
              </div>
            </div>

            {/* Right — form / confirmation */}
            <div className="bg-card border border-border rounded-[12px] px-[32px] py-[30px] shadow-[0_24px_60px_-38px_rgba(24,24,27,0.25)]">
              {sent ? (
                <Confirmation name={form.name} email={form.email} />
              ) : (
                <form onSubmit={onSubmit}>
                  <h2
                    className="text-[18px] font-medium text-text-primary"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    Request your demo
                  </h2>
                  <p className="text-[12.5px] text-text-tertiary mt-[5px] mb-[22px]">
                    We’ll reach out within one business day.
                  </p>

                  <div className="grid grid-cols-2 gap-[14px]">
                    <Field label="Full name" value={form.name} onChange={set("name")} required placeholder="Sarah Chen" />
                    <Field label="Work email" type="email" value={form.email} onChange={set("email")} required placeholder="you@company.com" />
                  </div>

                  <div className="mt-[14px]">
                    <Field label="Company" value={form.company} onChange={set("company")} required placeholder="Mavenly Inc." />
                  </div>

                  <div className="mt-[14px]">
                    <label className="label block mb-[8px]">Team size</label>
                    <div className="grid grid-cols-4 gap-[8px]">
                      {TEAM_SIZES.map((s) => {
                        const active = form.size === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => set("size")(s)}
                            className={`text-[12.5px] font-medium tabular rounded-[6px] py-[8px] border transition-colors ${
                              active
                                ? "bg-text-primary text-white border-text-primary"
                                : "bg-card text-text-secondary border-border hover:bg-subtle"
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-[14px]">
                    <Field
                      label="Where is your team?"
                      value={form.countries}
                      onChange={set("countries")}
                      placeholder="Nigeria, Kenya, South Africa…"
                    />
                  </div>

                  <div className="mt-[14px]">
                    <label className="label block mb-[8px]">Anything else? (optional)</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => set("notes")(e.target.value)}
                      rows={3}
                      placeholder="What are you hoping to solve?"
                      className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-text-secondary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-[22px] bg-text-primary text-white font-medium rounded-[6px] py-[11px] text-[13px] hover:bg-text-primary/90 transition-colors"
                  >
                    Book my demo
                  </button>
                  <p className="text-[11px] text-text-quaternary mt-[12px] text-center leading-[1.5]">
                    By requesting a demo you agree to Solvo’s{" "}
                    <Link href="/terms" className="hover:underline">Terms</Link> and{" "}
                    <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

function Confirmation({ name, email }: { name: string; email: string }) {
  const first = name.trim().split(/\s+/)[0];
  return (
    <div className="py-[24px] text-center">
      <div className="w-[48px] h-[48px] rounded-full bg-success-bg border border-success-border flex items-center justify-center mx-auto mb-[20px]">
        <i className="ti ti-check text-[22px] text-success" />
      </div>
      <h2
        className="text-[20px] font-medium text-text-primary"
        style={{ letterSpacing: "-0.01em" }}
      >
        {first ? `Thanks, ${first}` : "Thanks"} — request received
      </h2>
      <p className="text-[13px] text-text-tertiary mt-[10px] max-w-[320px] mx-auto leading-[1.6]">
        We’ll send a calendar link{email ? <> to <span className="text-text-secondary">{email}</span></> : ""} within
        one business day to schedule your live pay run.
      </p>
      <div className="flex items-center justify-center gap-[10px] mt-[26px]">
        <Link
          href="/"
          className="text-[13px] font-medium text-text-secondary bg-card border border-border-strong hover:bg-subtle rounded-[6px] px-[16px] py-[9px] transition-colors"
        >
          Back to home
        </Link>
        <Link
          href="/register"
          className="text-[13px] font-medium text-white bg-text-primary hover:bg-text-primary/90 rounded-[6px] px-[16px] py-[9px] transition-colors"
        >
          Create a workspace
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label block mb-[8px]">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-text-secondary"
      />
    </div>
  );
}
