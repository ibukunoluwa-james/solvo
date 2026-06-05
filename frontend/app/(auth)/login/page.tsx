"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "../../_lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("sarah@mavenly.com");
  const [password, setPassword] = useState("StrongPass!12");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const t = await api.auth.login({ email, password });
      router.push(t.role === "employee" ? "/me" : "/overview");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? typeof err.detail === "string"
            ? err.detail
            : "Couldn't sign in"
          : "Couldn't sign in";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="w-full max-w-[380px] bg-card border border-border rounded-[8px] px-[36px] pt-[36px] pb-[32px]">
        <h1
          className="text-[22px] font-medium text-text-primary leading-tight"
          style={{ letterSpacing: "-0.02em" }}
        >
          Welcome back
        </h1>
        <p className="text-[13px] text-text-tertiary mt-[6px]">
          Sign in to your Solvo workspace
        </p>

        <form className="mt-4" onSubmit={onSubmit}>
          {error && (
            <div
              className="text-[11.5px] font-medium mb-[14px] px-[12px] py-[8px] rounded-[5px]"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mt-[16px]">
            <label className="label block mb-[7px]">Work email</label>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-text-secondary"
            />
          </div>

          {/* Password */}
          <div className="mt-[16px]">
            <div className="flex items-center justify-between mb-[7px]">
              <label className="label">Password</label>
              <Link
                href="/forgot-password"
                className="text-[11.5px] text-info hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] pr-[36px] text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-text-secondary"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-[12px] top-1/2 -translate-y-1/2 text-text-quaternary hover:text-text-secondary"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                <i className={`ti ${showPwd ? "ti-eye-off" : "ti-eye"} text-[14px]`} />
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2 mt-[18px] mb-[22px] cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-[14px] h-[14px] rounded-[3px] accent-text-primary"
            />
            <span className="text-[12px] text-text-secondary">
              Keep me signed in for 30 days
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-text-primary text-white font-medium rounded-[5px] py-[10px] text-[13px] hover:bg-text-primary/90 transition-colors disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-[22px]">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-text-quaternary">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google SSO */}
          <button
            type="button"
            className="w-full bg-card text-text-secondary border border-border-strong font-medium rounded-[5px] py-[10px] text-[13px] hover:bg-subtle transition-colors flex items-center justify-center gap-2"
          >
            <GoogleG />
            Continue with Google
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-[22px] text-[12.5px] text-text-tertiary flex items-center gap-1">
        <span>New to Solvo?</span>
        <Link href="/register" className="text-info hover:underline">
          Create a workspace
        </Link>
      </div>
    </>
  );
}

function GoogleG() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M45 24.5c0-1.6-.1-3.1-.4-4.5H24v9h11.8c-.5 2.7-2 5-4.3 6.6v5.5h7c4.1-3.8 6.5-9.4 6.5-16.6z" />
      <path fill="#34A853" d="M24 46c5.8 0 10.7-1.9 14.3-5.2l-7-5.5c-1.9 1.3-4.4 2.1-7.3 2.1-5.6 0-10.4-3.8-12.1-8.9H4.7v5.6C8.3 41.2 15.6 46 24 46z" />
      <path fill="#FBBC05" d="M11.9 28.5c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.6H4.7C3.2 17.6 2.3 20.7 2.3 24s.9 6.4 2.4 9.3l7.2-4.8z" />
      <path fill="#EA4335" d="M24 9.5c3.2 0 6 1.1 8.3 3.2l6.2-6.2C34.7 3.1 29.8 1 24 1 15.6 1 8.3 5.8 4.7 13l7.2 5.6C13.6 13.3 18.4 9.5 24 9.5z" />
    </svg>
  );
}
