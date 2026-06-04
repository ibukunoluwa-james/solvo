import Link from "next/link";
import Header from "../../../_components/Header";
import { Button, Card } from "../../../_components/ui";

const STEPS = [
  { n: 1, label: "Identity", icon: "ti-circle-dot", state: "active" as const },
  { n: 2, label: "Contract", icon: "ti-circle", state: "upcoming" as const },
  { n: 3, label: "Compensation", icon: "ti-circle", state: "upcoming" as const },
  { n: 4, label: "Tax & statutory", icon: "ti-circle", state: "upcoming" as const },
  { n: 5, label: "Bank / wallet", icon: "ti-circle", state: "upcoming" as const },
];

export default function AddEmployeePage() {
  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <Link href="/people" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              People
            </Link>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">
              Add person
            </span>
          </div>
        }
        right={
          <>
            <Button variant="secondary" href="/people">
              Cancel
            </Button>
            <Button variant="primary">Save &amp; invite</Button>
          </>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div
          className="grid max-w-[980px]"
          style={{ gridTemplateColumns: "200px 1fr", gap: "32px" }}
        >
          {/* Step rail */}
          <aside>
            <div className="label mb-2">Steps</div>
            <div className="flex flex-col">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className={`flex items-center gap-2 px-[10px] py-[8px] rounded-[5px] ${
                    s.state === "active"
                      ? "bg-subtle text-text-primary font-medium"
                      : "text-text-tertiary"
                  }`}
                >
                  <i
                    className={`ti ${s.icon} text-[14px] ${
                      s.state === "active"
                        ? "text-text-primary"
                        : "text-text-quaternary"
                    }`}
                  />
                  <span className="text-[12.5px]">{s.label}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Form card */}
          <Card className="px-[32px] py-[28px]">
            <div>
              <h2
                className="text-[17px] font-medium text-text-primary"
                style={{ letterSpacing: "-0.015em" }}
              >
                Identity
              </h2>
              <p className="text-[12.5px] text-text-tertiary mt-[6px]">
                Basic information about the person you're adding
              </p>
            </div>

            <div className="mt-[24px] flex flex-col gap-[16px]">
              <div className="grid grid-cols-2 gap-[14px]">
                <Field label="First name" />
                <Field label="Last name" />
              </div>

              <Field
                label="Personal email"
                type="email"
                helper="We'll send their invite here"
              />

              <div className="grid grid-cols-2 gap-[14px]">
                <Field label="Country of residence" trailingIcon="ti-chevron-down" />
                <Field label="Date of birth" trailingIcon="ti-calendar" />
              </div>

              <Field
                label="National ID / Tax ID"
                helper="Needed for tax filings — we'll verify with the local tax authority"
                tabular
              />
            </div>

            {/* Step footer */}
            <div className="mt-[26px] pt-[22px] border-t border-border flex items-center justify-between">
              <span className="text-[11.5px] text-text-tertiary">Step 1 of 5</span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" disabled>
                  Back
                </Button>
                <Button variant="primary">Continue</Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}

function Field({
  label,
  type = "text",
  helper,
  trailingIcon,
  tabular = false,
}: {
  label: string;
  type?: string;
  helper?: string;
  trailingIcon?: string;
  tabular?: boolean;
}) {
  return (
    <div>
      <label className="label block mb-[7px]">{label}</label>
      <div className="relative">
        <input
          type={type}
          className={`w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-text-secondary ${tabular ? "tabular" : ""} ${trailingIcon ? "pr-[36px]" : ""}`}
        />
        {trailingIcon && (
          <i className={`ti ${trailingIcon} absolute right-[12px] top-1/2 -translate-y-1/2 text-[14px] text-text-quaternary`} />
        )}
      </div>
      {helper && (
        <p className="text-[11.5px] text-text-tertiary mt-[6px]">{helper}</p>
      )}
    </div>
  );
}
