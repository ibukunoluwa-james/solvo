import Link from "next/link";

export default function RegisterPage() {
  return (
    <>
      <div className="w-full max-w-[460px] bg-card border border-border rounded-[8px] px-[36px] pt-[32px] pb-[32px]">
        {/* Step indicator */}
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

        <form className="mt-[24px]">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-[14px]">
            <div>
              <label className="label block mb-[7px]">First name</label>
              <input
                type="text"
                className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary focus:outline-none focus:border-text-secondary"
              />
            </div>
            <div>
              <label className="label block mb-[7px]">Last name</label>
              <input
                type="text"
                className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary focus:outline-none focus:border-text-secondary"
              />
            </div>
          </div>

          {/* Email */}
          <div className="mt-[14px]">
            <label className="label block mb-[7px]">Work email</label>
            <input
              type="email"
              placeholder="you@company.com"
              className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-text-secondary"
            />
          </div>

          {/* Password */}
          <div className="mt-[14px]">
            <label className="label block mb-[7px]">Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="At least 8 characters"
                defaultValue="StrongPass!12"
                className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] pr-[36px] text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-text-secondary"
              />
              <i className="ti ti-eye absolute right-[12px] top-1/2 -translate-y-1/2 text-[14px] text-text-quaternary cursor-pointer" />
            </div>
            {/* Strength bar */}
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
              Strong · add a symbol for extra security
            </p>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 mt-[20px] mb-[20px] cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-[14px] h-[14px] mt-[2px] rounded-[3px] accent-text-primary"
            />
            <span
              className="text-[12px] text-text-secondary"
              style={{ lineHeight: 1.45 }}
            >
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
            className="w-full bg-text-primary text-white font-medium rounded-[5px] py-[10px] text-[13px] hover:bg-text-primary/90 transition-colors"
          >
            Continue
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
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}
