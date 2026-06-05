"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "../../_lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [first, setFirst] = useState("Sarah");
  const [last, setLast] = useState("Chen");
  const [email, setEmail] = useState("sarah@mavenly.com");
  const [password, setPassword] = useState("StrongPass!12");
  const [companyName, setCompanyName] = useState("Mavenly Inc.");
  const [country, setCountry] = useState("US");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.auth.registerEmployer({
        email,
        password,
        full_name: `${first} ${last}`.trim(),
        company_name: companyName,
        country_of_incorporation: country,
      });
      // Auto-login the new account to streamline the demo.
      const t = await api.auth.login({ email, password });
      router.push(t.role === "employee" ? "/me" : "/");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? typeof err.detail === "string"
            ? err.detail
            : "Couldn't create workspace"
          : "Couldn't create workspace";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="w-full max-w-[460px] bg-card border border-border rounded-[8px] px-[36px] pt-[32px] pb-[32px]">
        <Stepper step={1} />

        <h1
          className="text-[22px] font-medium text-text-primary leading-tight mt-[22px]"
          style={{ letterSpacing: "-0.02em" }}
        >
          Create your workspace
        </h1>
        <p className="text-[13px] text-text-tertiary mt-[6px]">
          Start paying your global team in minutes
        </p>

        <form className="mt-[24px]" onSubmit={onSubmit}>
          {error && (
            <div
              className="text-[11.5px] font-medium mb-[14px] px-[12px] py-[8px] rounded-[5px]"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-[14px]">
            <Field label="First name" value={first} onChange={setFirst} />
            <Field label="Last name" value={last} onChange={setLast} />
          </div>

          <div className="mt-[14px]">
            <Field label="Work email" type="email" value={email} onChange={setEmail} />
          </div>

          <div className="mt-[14px]">
            <Field label="Company name" value={companyName} onChange={setCompanyName} />
          </div>

          <div className="mt-[14px]">
            <Field
              label="Country of incorporation"
              value={country}
              onChange={(v) => setCountry(v.toUpperCase().slice(0, 3))}
            />
          </div>

          <div className="mt-[14px]">
            <Field label="Password" type="password" value={password} onChange={setPassword} />
            <div className="mt-2 flex items-center gap-[4px]">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-[3px] flex-1 rounded-[2px] ${
                    i <= 3 ? "bg-success" : "bg-border"
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-text-tertiary mt-[6px]">
              Min 8 characters · number + special character required
            </p>
          </div>

          <label className="flex items-start gap-2 mt-[20px] mb-[20px] cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-[14px] h-[14px] mt-[2px] rounded-[3px] accent-text-primary"
            />
            <span className="text-[12px] text-text-secondary" style={{ lineHeight: 1.45 }}>
              I agree to Solvo's{" "}
              <Link href="/terms" className="text-info hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-info hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-text-primary text-white font-medium rounded-[5px] py-[10px] text-[13px] hover:bg-text-primary/90 transition-colors disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create workspace"}
          </button>
        </form>
      </div>

      <div className="mt-[22px] text-[12.5px] text-text-tertiary flex items-center gap-1">
        <span>Already have an account?</span>
        <Link href="/login" className="text-info hover:underline">
          Sign in
        </Link>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="label block mb-[7px]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-text-secondary"
      />
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Account" },
    { n: 2, label: "Company" },
    { n: 3, label: "Verify" },
  ];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const active = s.n === step;
        const done = s.n < step;
        return (
          <div key={s.n} className="flex items-center gap-2 flex-1 last:flex-none">
            <div
              className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-medium ${
                active
                  ? "bg-text-primary text-white"
                  : done
                    ? "bg-success text-white"
                    : "bg-subtle text-text-quaternary"
              }`}
            >
              {done ? <i className="ti ti-check text-[11px]" /> : s.n}
            </div>
            <span
              className={`text-[11.5px] ${
                active
                  ? "text-text-primary font-medium"
                  : done
                    ? "text-text-secondary"
                    : "text-text-quaternary"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
