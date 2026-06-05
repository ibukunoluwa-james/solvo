import Link from "next/link";
import type { Metadata } from "next";
import MarketingNav from "./_components/MarketingNav";
import MarketingFooter from "./_components/MarketingFooter";

export const metadata: Metadata = {
  title: "Solvo · Global payroll & on-demand pay",
  description:
    "Run multi-country payroll, disburse across local rails in seconds, and give your team earned pay before payday — with compliance and transparent fees built in.",
};

/* ─── Section primitives ─────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-[7px] text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">
      <span className="w-[14px] h-px bg-border-strong" />
      {children}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <MarketingNav />
      <Hero />
      <TrustStrip />
      <Stats />
      <Features />
      <Coverage />
      <OnDemand />
      <HowItWorks />
      <Testimonial />
      <FinalCta />
      <MarketingFooter />
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-[1180px] px-6 pt-[72px] pb-[60px]">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-[56px] items-center">
          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-[8px] bg-card border border-border rounded-full pl-[6px] pr-[12px] py-[5px] mb-[26px]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-white bg-text-primary rounded-full px-[8px] py-[3px]">
                New
              </span>
              <span className="text-[12.5px] text-text-secondary">
                Earned-wage access, now in every pay run
              </span>
            </div>

            <h1
              className="text-[44px] sm:text-[52px] font-medium text-text-primary"
              style={{ letterSpacing: "-0.03em", lineHeight: 1.04 }}
            >
              Payroll that settles
              <br />
              in seconds — anywhere
              <br />
              your team is.
            </h1>

            <p className="text-[16px] text-text-secondary mt-[22px] max-w-[480px] leading-[1.6]">
              Solvo runs multi-country payroll, disburses across local rails like
              NIP, M-Pesa and EFT, and lets your people draw earned pay before
              payday — with compliance and transparent fees built in.
            </p>

            <div className="flex flex-wrap items-center gap-[12px] mt-[32px]">
              <Link
                href="/demo"
                className="inline-flex items-center gap-[8px] text-[14px] font-medium text-white bg-text-primary hover:bg-text-primary/90 rounded-[7px] px-[20px] py-[12px] transition-colors"
              >
                Book a demo
                <i className="ti ti-arrow-right text-[16px]" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-[8px] text-[14px] font-medium text-text-secondary bg-card border border-border-strong hover:bg-subtle rounded-[7px] px-[20px] py-[12px] transition-colors"
              >
                Create a workspace
              </Link>
            </div>

            <div className="flex items-center gap-[8px] mt-[22px] text-[12.5px] text-text-tertiary">
              <i className="ti ti-circle-check-filled text-[15px] text-success" />
              No card required
              <span className="w-[3px] h-[3px] rounded-full bg-text-quaternary mx-[4px]" />
              Live in a day
              <span className="w-[3px] h-[3px] rounded-full bg-text-quaternary mx-[4px]" />
              Cancel anytime
            </div>
          </div>

          {/* Product preview */}
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

const PREVIEW_ROWS = [
  { name: "Amara Okafor", country: "Nigeria", rail: "NIP", amount: "₦1,480,000", tone: "settled" },
  { name: "David Mwangi", country: "Kenya", rail: "M-Pesa", amount: "KSh 312,000", tone: "settled" },
  { name: "Thandi Nkosi", country: "South Africa", rail: "EFT", amount: "R 86,400", tone: "sending" },
  { name: "Yara Hassan", country: "Egypt", rail: "InstaPay", amount: "E£ 94,200", tone: "queued" },
] as const;

function HeroPreview() {
  return (
    <div className="relative">
      {/* soft backdrop */}
      <div
        className="absolute -inset-6 rounded-[20px] -z-10"
        style={{
          background:
            "radial-gradient(120% 120% at 70% 0%, rgba(24,24,27,0.06), transparent 60%)",
        }}
      />
      <div className="bg-card border border-border rounded-[12px] shadow-[0_24px_60px_-30px_rgba(24,24,27,0.28)] overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center justify-between px-[18px] py-[13px] border-b border-border-subtle">
          <div className="flex items-center gap-[10px]">
            <span className="label">Pay run</span>
            <span className="text-[11px] text-text-tertiary tabular">June 2026</span>
          </div>
          <span className="inline-flex items-center gap-[5px] text-[10.5px] font-medium text-success bg-success-bg border border-success-border rounded-[10px] px-[7px] py-[2.5px]">
            <span className="w-[5px] h-[5px] rounded-full bg-success" />
            Disbursing
          </span>
        </div>

        {/* total */}
        <div className="px-[18px] pt-[18px] pb-[14px] border-b border-border-subtle">
          <div className="label mb-[8px]">Total this run</div>
          <div
            className="text-[30px] font-medium tabular text-text-primary"
            style={{ letterSpacing: "-0.025em", lineHeight: 1 }}
          >
            $184,250
          </div>
          <div className="mt-[14px] flex items-center gap-3">
            <div className="flex-1 h-[4px] bg-subtle rounded-full overflow-hidden">
              <div className="h-full bg-success" style={{ width: "72%" }} />
            </div>
            <span className="text-[11px] font-medium text-success tabular">72% settled</span>
          </div>
        </div>

        {/* rows */}
        <div>
          {PREVIEW_ROWS.map((r, i) => (
            <div
              key={r.name}
              className={`grid items-center px-[18px] py-[12px] ${
                i < PREVIEW_ROWS.length - 1 ? "border-b border-border-subtle" : ""
              }`}
              style={{ gridTemplateColumns: "1fr auto", columnGap: "12px" }}
            >
              <div className="flex items-center gap-[11px] min-w-0">
                <div className="w-[28px] h-[28px] rounded-full bg-subtle flex items-center justify-center text-[10.5px] font-medium text-text-secondary shrink-0">
                  {r.name.split(" ").map((p) => p[0]).join("")}
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] text-text-primary truncate leading-tight">
                    {r.name}
                  </div>
                  <div className="text-[11px] text-text-tertiary leading-tight">
                    {r.country} · {r.rail}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-[12px]">
                <span className="text-[12.5px] tabular text-text-primary">{r.amount}</span>
                <PreviewStatus tone={r.tone} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewStatus({ tone }: { tone: "settled" | "sending" | "queued" }) {
  if (tone === "settled")
    return (
      <span className="w-[64px] inline-flex items-center justify-end gap-[5px] text-[11px] font-medium text-success">
        <i className="ti ti-check text-[13px]" /> Settled
      </span>
    );
  if (tone === "sending")
    return (
      <span className="w-[64px] inline-flex items-center justify-end gap-[5px] text-[11px] font-medium text-info">
        <i className="ti ti-loader-2 text-[13px]" /> Sending
      </span>
    );
  return (
    <span className="w-[64px] inline-flex items-center justify-end gap-[5px] text-[11px] font-medium text-text-quaternary">
      <i className="ti ti-clock text-[13px]" /> Queued
    </span>
  );
}

/* ─── Trust strip ────────────────────────────────────────────────────── */

const RAILS = ["NIP", "M-Pesa", "EFT", "InstaPay", "Pesalink", "MoMo", "RTGS"];

function TrustStrip() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-[1180px] px-6 py-[26px]">
        <div className="flex flex-col sm:flex-row items-center gap-[20px] sm:gap-[40px]">
          <span className="text-[11.5px] font-medium uppercase tracking-[0.05em] text-text-quaternary whitespace-nowrap">
            Pays into every local rail
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-[28px] gap-y-[12px]">
            {RAILS.map((r) => (
              <span
                key={r}
                className="text-[15px] font-semibold text-text-tertiary/80"
                style={{ letterSpacing: "-0.01em" }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats band ─────────────────────────────────────────────────────── */

const STATS = [
  { value: "8 sec", label: "Median settlement time" },
  { value: "12+", label: "Countries covered" },
  { value: "40+", label: "Local payout rails" },
  { value: "0.0%", label: "Hidden FX markup" },
];

function Stats() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 py-[64px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-[12px] overflow-hidden">
        {STATS.map((s) => (
          <div key={s.label} className="bg-card px-[26px] py-[28px]">
            <div
              className="text-[34px] font-medium tabular text-text-primary"
              style={{ letterSpacing: "-0.03em", lineHeight: 1 }}
            >
              {s.value}
            </div>
            <div className="text-[12.5px] text-text-tertiary mt-[10px]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Features ───────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: "ti-cash",
    title: "Multi-country payroll",
    body: "Run one pay cycle across every country and currency your team works in. Gross-to-net, taxes and deductions calculated automatically.",
  },
  {
    icon: "ti-arrow-narrow-right",
    title: "Instant disbursements",
    body: "Money lands on local rails — NIP, M-Pesa, EFT, InstaPay — and settles in seconds. Track every transfer with live status and retries.",
  },
  {
    icon: "ti-hand-finger",
    title: "On-demand pay",
    body: "Let employees draw up to 50% of earned net salary before payday. Repaid automatically from the next run — no interest, no friction.",
  },
  {
    icon: "ti-shield-check",
    title: "Compliance & remittances",
    body: "Statutory deductions and remittances are filed per country, with a complete, exportable audit trail for every pay run.",
  },
  {
    icon: "ti-wallet",
    title: "Multi-currency wallets",
    body: "Hold and move USD and local currencies from one operating balance. Transparent FX with no markup buried in the rate.",
  },
  {
    icon: "ti-users",
    title: "Employee self-service",
    body: "Your team gets payslips, payment history and advance requests in a clean portal — so finance answers fewer one-off questions.",
  },
];

function Features() {
  return (
    <section id="product" className="mx-auto max-w-[1180px] px-6 py-[64px] scroll-mt-[70px]">
      <div className="max-w-[640px] mb-[44px]">
        <Eyebrow>The platform</Eyebrow>
        <h2
          className="text-[34px] font-medium text-text-primary mt-[16px]"
          style={{ letterSpacing: "-0.025em", lineHeight: 1.1 }}
        >
          Everything it takes to pay a global team
        </h2>
        <p className="text-[15px] text-text-secondary mt-[14px] leading-[1.6]">
          Payroll, payouts, advances and compliance in one system — so you stop
          stitching together banks, spreadsheets and local providers.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="bg-card border border-border rounded-[10px] p-[24px] hover:border-border-strong transition-colors"
          >
            <div className="w-[36px] h-[36px] rounded-[8px] bg-subtle flex items-center justify-center mb-[18px]">
              <i className={`ti ${f.icon} text-[18px] text-text-primary`} />
            </div>
            <h3 className="text-[15px] font-medium text-text-primary mb-[8px]">
              {f.title}
            </h3>
            <p className="text-[13px] text-text-tertiary leading-[1.6]">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Coverage ───────────────────────────────────────────────────────── */

const COUNTRIES = [
  { name: "Nigeria", code: "NG", rail: "NIP · instant transfer" },
  { name: "Kenya", code: "KE", rail: "M-Pesa · Pesalink" },
  { name: "South Africa", code: "ZA", rail: "EFT · RTGS" },
  { name: "Egypt", code: "EG", rail: "InstaPay" },
  { name: "Ghana", code: "GH", rail: "MoMo · GIP" },
  { name: "Rwanda", code: "RW", rail: "MoMo · RTGS" },
];

function Coverage() {
  return (
    <section id="coverage" className="border-y border-border bg-card scroll-mt-[58px]">
      <div className="mx-auto max-w-[1180px] px-6 py-[64px]">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-[48px] items-start">
          <div className="lg:sticky lg:top-[80px]">
            <Eyebrow>Coverage</Eyebrow>
            <h2
              className="text-[34px] font-medium text-text-primary mt-[16px]"
              style={{ letterSpacing: "-0.025em", lineHeight: 1.1 }}
            >
              Local rails, not international wires
            </h2>
            <p className="text-[15px] text-text-secondary mt-[14px] leading-[1.6] max-w-[420px]">
              Every payout goes out on the same rail your people already use — so
              it arrives in seconds at the real exchange rate, not in three days
              minus a chain of correspondent-bank fees.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-[7px] text-[13.5px] font-medium text-text-primary mt-[22px] hover:gap-[10px] transition-all"
            >
              See coverage for your team
              <i className="ti ti-arrow-right text-[15px]" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-px bg-border border border-border rounded-[10px] overflow-hidden">
            {COUNTRIES.map((c) => (
              <div key={c.code} className="bg-card px-[20px] py-[20px] flex items-center gap-[14px]">
                <div className="w-[34px] h-[34px] rounded-[7px] bg-subtle flex items-center justify-center text-[11px] font-semibold text-text-secondary shrink-0">
                  {c.code}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-text-primary leading-tight">
                    {c.name}
                  </div>
                  <div className="text-[12px] text-text-tertiary leading-tight mt-[3px]">
                    {c.rail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── On-demand pay ──────────────────────────────────────────────────── */

function OnDemand() {
  return (
    <section id="ondemand" className="mx-auto max-w-[1180px] px-6 py-[72px] scroll-mt-[70px]">
      <div className="grid lg:grid-cols-[1fr_0.9fr] gap-[56px] items-center">
        <div>
          <Eyebrow>On-demand pay</Eyebrow>
          <h2
            className="text-[34px] font-medium text-text-primary mt-[16px]"
            style={{ letterSpacing: "-0.025em", lineHeight: 1.1 }}
          >
            Payday, whenever they’ve earned it
          </h2>
          <p className="text-[15px] text-text-secondary mt-[14px] leading-[1.6] max-w-[460px]">
            Give your team a financial cushion without lending or fees. Employees
            request a slice of pay they’ve already earned; Solvo disburses
            instantly and settles it from the next run.
          </p>

          <ul className="mt-[26px] flex flex-col gap-[16px]">
            {[
              ["Up to 50% of earned net salary", "Caps and eligibility are enforced automatically per employee."],
              ["Disbursed on the same instant rail", "The advance lands in seconds, just like payroll."],
              ["Repaid from the next pay run", "No interest, no collections — it nets out on schedule."],
            ].map(([t, b]) => (
              <li key={t} className="flex gap-[13px]">
                <i className="ti ti-circle-check-filled text-[18px] text-success mt-[1px] shrink-0" />
                <div>
                  <div className="text-[14px] font-medium text-text-primary">{t}</div>
                  <div className="text-[13px] text-text-tertiary mt-[2px] leading-[1.55]">{b}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* advance card mock */}
        <div className="bg-card border border-border rounded-[12px] shadow-[0_24px_60px_-34px_rgba(24,24,27,0.25)] p-[24px]">
          <div className="flex items-center justify-between mb-[20px]">
            <span className="label">Advance available</span>
            <span className="inline-flex items-center gap-[5px] text-[10.5px] font-medium text-success bg-success-bg border border-success-border rounded-[10px] px-[7px] py-[2.5px]">
              Eligible
            </span>
          </div>
          <div
            className="text-[34px] font-medium tabular text-text-primary"
            style={{ letterSpacing: "-0.03em", lineHeight: 1 }}
          >
            ₦740,000
          </div>
          <div className="text-[12.5px] text-text-tertiary mt-[8px]">
            50% of ₦1,480,000 earned this period
          </div>

          <div className="mt-[20px] mb-[8px] flex items-center gap-3">
            <div className="flex-1 h-[6px] bg-subtle rounded-full overflow-hidden">
              <div className="h-full bg-text-primary" style={{ width: "50%" }} />
            </div>
            <span className="text-[11px] font-medium text-text-secondary tabular">50%</span>
          </div>

          <div className="mt-[18px] grid grid-cols-2 gap-[10px]">
            <div className="bg-subtle rounded-[8px] px-[14px] py-[12px]">
              <div className="text-[11px] text-text-tertiary">Settles in</div>
              <div className="text-[15px] font-medium tabular text-text-primary mt-[3px]">~8 sec</div>
            </div>
            <div className="bg-subtle rounded-[8px] px-[14px] py-[12px]">
              <div className="text-[11px] text-text-tertiary">Fee</div>
              <div className="text-[15px] font-medium tabular text-text-primary mt-[3px]">₦0</div>
            </div>
          </div>

          <button
            type="button"
            className="w-full mt-[18px] bg-text-primary text-white text-[13px] font-medium rounded-[7px] py-[11px]"
          >
            Request advance
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ───────────────────────────────────────────────────── */

const STEPS = [
  {
    n: "01",
    title: "Add your team",
    body: "Onboard employees and contractors with their country, currency and pay details. Import in minutes.",
  },
  {
    n: "02",
    title: "Run payroll",
    body: "Review the gross-to-net breakdown for every country in one draft, then approve with a single click.",
  },
  {
    n: "03",
    title: "Money moves",
    body: "Solvo disburses across local rails, files remittances, and shows you each transfer settling in real time.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="border-t border-border bg-card scroll-mt-[58px]">
      <div className="mx-auto max-w-[1180px] px-6 py-[64px]">
        <div className="max-w-[600px] mb-[44px]">
          <Eyebrow>How it works</Eyebrow>
          <h2
            className="text-[34px] font-medium text-text-primary mt-[16px]"
            style={{ letterSpacing: "-0.025em", lineHeight: 1.1 }}
          >
            From new hire to paid in three steps
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-[18px]">
          {STEPS.map((s) => (
            <div key={s.n} className="relative bg-canvas border border-border rounded-[10px] p-[24px]">
              <div className="text-[13px] font-semibold tabular text-text-quaternary mb-[16px]">
                {s.n}
              </div>
              <h3 className="text-[16px] font-medium text-text-primary mb-[8px]">
                {s.title}
              </h3>
              <p className="text-[13px] text-text-tertiary leading-[1.6]">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonial ────────────────────────────────────────────────────── */

function Testimonial() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 py-[72px]">
      <figure className="max-w-[760px] mx-auto text-center">
        <blockquote
          className="text-[26px] sm:text-[30px] font-medium text-text-primary"
          style={{ letterSpacing: "-0.02em", lineHeight: 1.32 }}
        >
          “We went from three providers and a spreadsheet to one pay run.
          Everyone across four countries is paid in seconds, and finance closes
          the month a week earlier.”
        </blockquote>
        <figcaption className="mt-[26px] flex items-center justify-center gap-[12px]">
          <div className="w-[36px] h-[36px] rounded-full bg-subtle flex items-center justify-center text-[12px] font-medium text-text-secondary">
            SC
          </div>
          <div className="text-left">
            <div className="text-[13.5px] font-medium text-text-primary leading-tight">
              Sarah Chen
            </div>
            <div className="text-[12.5px] text-text-tertiary leading-tight">
              Head of People, Mavenly
            </div>
          </div>
        </figcaption>
      </figure>
    </section>
  );
}

/* ─── Final CTA ──────────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 pb-[80px]">
      <div className="relative overflow-hidden rounded-[16px] bg-text-primary px-[40px] py-[56px] sm:px-[56px]">
        <div
          className="absolute inset-0 -z-0 opacity-[0.5]"
          style={{
            background:
              "radial-gradient(80% 120% at 100% 0%, rgba(255,255,255,0.10), transparent 55%)",
          }}
        />
        <div className="relative max-w-[560px]">
          <h2
            className="text-[34px] sm:text-[38px] font-medium text-white"
            style={{ letterSpacing: "-0.03em", lineHeight: 1.08 }}
          >
            See Solvo run your payroll
          </h2>
          <p className="text-[15px] text-white/70 mt-[16px] leading-[1.6]">
            Book a 20-minute demo and we’ll show you a live pay run for your
            countries — settlement times, fees and all. Or spin up a workspace
            and try it yourself.
          </p>
          <div className="flex flex-wrap items-center gap-[12px] mt-[30px]">
            <Link
              href="/demo"
              className="inline-flex items-center gap-[8px] text-[14px] font-medium text-text-primary bg-white hover:bg-white/90 rounded-[7px] px-[20px] py-[12px] transition-colors"
            >
              Book a demo
              <i className="ti ti-arrow-right text-[16px]" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-[8px] text-[14px] font-medium text-white border border-white/25 hover:bg-white/10 rounded-[7px] px-[20px] py-[12px] transition-colors"
            >
              Create a workspace
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
