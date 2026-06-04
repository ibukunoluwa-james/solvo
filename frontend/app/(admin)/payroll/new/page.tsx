import Link from "next/link";
import Header from "../../../_components/Header";
import { Button, Card } from "../../../_components/ui";

const COUNTRIES = [
  { name: "Nigeria", count: 18 },
  { name: "Kenya", count: 11 },
  { name: "South Africa", count: 7 },
  { name: "Egypt", count: 4 },
];

export default function NewPayrollPage() {
  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <Link href="/payroll" className="text-[12px] text-text-tertiary hover:text-text-secondary">
              Pay runs
            </Link>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">
              New pay run
            </span>
          </div>
        }
        right={
          <>
            <Button variant="secondary" href="/payroll">
              Cancel
            </Button>
            <Button variant="primary">Create draft</Button>
          </>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div
          className="grid max-w-[1280px]"
          style={{ gridTemplateColumns: "1fr 320px", gap: "20px" }}
        >
          {/* Left column */}
          <div className="flex flex-col gap-[16px]">
            {/* Pay period */}
            <Card className="px-[26px] py-[24px]">
              <CardHeader title="Pay period" subtitle="When this run covers" />
              <div className="mt-[18px] grid grid-cols-3 gap-[12px]">
                <Field label="Month" value="June 2026" trailingIcon="ti-chevron-down" />
                <Field label="Pay date" value="1 Jun 2026" trailingIcon="ti-calendar" />
                <Field label="Cadence" value="Monthly" trailingIcon="ti-chevron-down" />
              </div>
            </Card>

            {/* Who's included */}
            <Card className="px-[26px] py-[24px]">
              <div className="flex items-end justify-between">
                <CardHeader
                  title="Who's included"
                  subtitle="40 of 40 active employees"
                />
                <Button variant="secondary">Manage</Button>
              </div>
              <div className="mt-[18px] grid grid-cols-4 gap-[10px]">
                {COUNTRIES.map((c) => (
                  <div
                    key={c.name}
                    className="bg-canvas border border-border rounded-[6px] px-[14px] py-[12px]"
                  >
                    <div className="text-[11px] text-text-tertiary">{c.name}</div>
                    <div
                      className="text-[16px] font-medium text-text-primary tabular mt-[4px] leading-none"
                    >
                      {c.count}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Funding */}
            <Card className="px-[26px] py-[24px]">
              <CardHeader title="Funding" subtitle="Where the money comes from" />

              <div className="mt-[18px] border border-border rounded-[6px] px-[16px] py-[14px] flex items-center gap-3">
                <div className="w-[30px] h-[30px] bg-subtle rounded-[5px] flex items-center justify-center">
                  <i className="ti ti-building-bank text-[14px] text-text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-text-primary leading-tight">
                    USD operating
                  </div>
                  <div className="text-[11.5px] text-text-tertiary leading-tight tabular mt-[2px]">
                    $412,830.16 available · Chase ····2284
                  </div>
                </div>
                <i className="ti ti-chevron-down text-[14px] text-text-tertiary" />
              </div>

              {/* Sufficiency check */}
              <div className="mt-3 bg-success-bg border border-success-border rounded-[6px] px-[14px] py-[12px] flex items-center gap-3">
                <i className="ti ti-circle-check text-[16px] text-success" />
                <span className="text-[12px]" style={{ color: "#14532d" }}>
                  Sufficient balance to cover this run
                </span>
              </div>
            </Card>
          </div>

          {/* Right column: Sticky preview */}
          <div>
            <Card
              className="px-[24px] py-[22px]"
              style={{ position: "sticky", top: "20px" }}
            >
              <div className="label mb-[14px]">Preview</div>

              <div
                className="text-[28px] font-medium text-text-primary tabular leading-none"
                style={{ letterSpacing: "-0.025em" }}
              >
                $184,250
              </div>
              <div className="text-[12px] text-text-tertiary mt-[6px]">
                Estimated total payroll
              </div>

              <div className="mt-[22px] pb-[16px] border-b border-border flex flex-col gap-[11px]">
                <PreviewRow label="Gross salaries" value="$184,250" />
                <PreviewRow label="Est. taxes withheld" value="−$42,180" tertiary />
                <PreviewRow label="Est. FX cost" value="$1,476" />
                <PreviewRow label="Solvo fee · 0.6%" value="$1,106" />
              </div>

              <div className="pt-[14px] flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-text-primary">
                  Total cost
                </span>
                <span className="text-[14px] font-medium text-text-primary tabular">
                  $186,832
                </span>
              </div>

              <button className="w-full mt-[20px] bg-text-primary text-white font-medium rounded-[5px] py-[9px] text-[12.5px] hover:bg-text-primary/90 transition-colors">
                Create &amp; review
              </button>
              <p className="text-[11px] text-text-tertiary text-center mt-[10px]">
                You'll review line-by-line before approving
              </p>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-[15px] font-medium text-text-primary" style={{ letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      <p className="text-[12px] text-text-tertiary mt-[4px]">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  value,
  trailingIcon,
}: {
  label: string;
  value: string;
  trailingIcon?: string;
}) {
  return (
    <div>
      <label className="label block mb-[7px]">{label}</label>
      <div className="relative">
        <input
          type="text"
          defaultValue={value}
          readOnly
          className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[9px] pr-[36px] text-[13px] text-text-primary focus:outline-none focus:border-text-secondary cursor-pointer"
        />
        {trailingIcon && (
          <i className={`ti ${trailingIcon} absolute right-[12px] top-1/2 -translate-y-1/2 text-[14px] text-text-quaternary`} />
        )}
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  tertiary = false,
}: {
  label: string;
  value: string;
  tertiary?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-text-tertiary">{label}</span>
      <span
        className={`text-[12.5px] tabular ${
          tertiary ? "text-text-tertiary" : "text-text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
