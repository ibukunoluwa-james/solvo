import Link from "next/link";
import Header from "../../../_components/Header";
import { Card } from "../../../_components/ui";

export default function AdvanceRequestPage() {
  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <Link
              href="/me"
              className="text-[12px] text-text-tertiary hover:text-text-secondary"
            >
              Advances
            </Link>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">
              Request advance
            </span>
          </div>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="max-w-[720px] mx-auto">
          {/* Eligibility hero */}
          <Card className="px-[32px] py-[28px] mb-4">
            <div className="label mb-[6px]">Eligible amount</div>
            <div
              className="text-[30px] font-medium text-text-primary tabular leading-none"
              style={{ letterSpacing: "-0.025em" }}
            >
              ₦2,838,000
            </div>
            <div className="text-[12.5px] text-text-tertiary mt-[6px] tabular">
              Up to 40% of your May net salary · ₦7,094,536
            </div>
          </Card>

          {/* Request form */}
          <Card className="px-[32px] py-[28px]">
            <h2
              className="text-[16px] font-medium text-text-primary mb-[24px]"
              style={{ letterSpacing: "-0.015em" }}
            >
              How much do you need?
            </h2>

            {/* Amount input */}
            <div className="flex items-baseline gap-2 mb-[14px]">
              <span className="text-[13px] text-text-tertiary">₦</span>
              <input
                type="text"
                defaultValue="1,500,000"
                className="bg-transparent border-none w-[220px] text-[34px] font-medium text-text-primary tabular focus:outline-none p-0"
                style={{ letterSpacing: "-0.025em" }}
              />
            </div>

            {/* Slider */}
            <div className="relative h-[4px] bg-border rounded-[2px]">
              <div
                className="absolute left-0 top-0 h-full bg-text-primary rounded-[2px]"
                style={{ width: "53%" }}
              />
              <div
                className="absolute w-[16px] h-[16px] bg-card border-2 border-text-primary rounded-full"
                style={{ left: "calc(53% - 8px)", top: "-6px" }}
              />
            </div>
            <div className="flex items-center justify-between mt-[6px]">
              <span className="text-[11px] text-text-tertiary tabular">
                ₦100,000
              </span>
              <span className="text-[11px] text-text-tertiary tabular">
                ₦2,838,000
              </span>
            </div>

            {/* Reason */}
            <div className="mt-[24px]">
              <label className="label block mb-[7px]">Reason (optional)</label>
              <textarea
                placeholder="Tell your employer why — helps speed up approval"
                rows={3}
                className="w-full bg-card border border-border rounded-[5px] px-[12px] py-[10px] text-[13px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-text-secondary resize-none"
              />
            </div>

            {/* Preview */}
            <div className="mt-[22px] bg-canvas border border-border rounded-[6px] px-[20px] py-[18px]">
              <div className="label mb-[14px]">Preview</div>
              <div className="flex flex-col gap-[10px]">
                <PreviewRow
                  label="You receive"
                  value="₦1,462,500"
                  bold
                  size="lg"
                />
                <PreviewRow label="Fee · 2.5%" value="−₦37,500" tertiary />
                <div className="pt-[10px] border-t border-border flex flex-col gap-[10px]">
                  <PreviewRow
                    label="Total repayment"
                    value="₦1,500,000"
                    bold
                    size="lg"
                  />
                  <PreviewRow
                    label="Deducted over"
                    value="3 pay runs · ₦500,000 each"
                  />
                </div>
              </div>
            </div>

            {/* Auto-approval hint */}
            <div className="mt-[22px] bg-success-bg border border-success-border rounded-[6px] px-[14px] py-[12px] flex items-center gap-3">
              <i className="ti ti-bolt text-[16px] text-success" />
              <div>
                <div
                  className="text-[12.5px] font-medium"
                  style={{ color: "#14532d" }}
                >
                  Likely auto-approved
                </div>
                <div className="text-[11.5px] text-success">
                  21% of net salary · within auto-approval threshold
                </div>
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
                className="bg-text-primary text-white font-medium rounded-[5px] py-[10px] text-[13px] hover:bg-text-primary/90 transition-colors"
                style={{ flex: 2 }}
              >
                Request ₦1,500,000
              </button>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}

function PreviewRow({
  label,
  value,
  bold = false,
  tertiary = false,
  size = "md",
}: {
  label: string;
  value: string;
  bold?: boolean;
  tertiary?: boolean;
  size?: "md" | "lg";
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={`text-[12.5px] ${tertiary ? "text-text-tertiary" : "text-text-secondary"}`}>
        {label}
      </span>
      <span
        className={`tabular ${size === "lg" ? "text-[13.5px]" : "text-[12.5px]"} ${
          bold ? "font-medium" : ""
        } ${tertiary ? "text-text-tertiary" : "text-text-primary"}`}
      >
        {value}
      </span>
    </div>
  );
}
