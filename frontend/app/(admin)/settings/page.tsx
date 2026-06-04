import Header from "../../_components/Header";
import { Button, Card, Pill } from "../../_components/ui";

type NavItem = { icon: string; label: string; active?: boolean };

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Workspace",
    items: [
      { icon: "ti-building", label: "Company profile", active: true },
      { icon: "ti-credit-card", label: "Billing & funding" },
      { icon: "ti-users-group", label: "Team & roles" },
      { icon: "ti-bell", label: "Notifications" },
    ],
  },
  {
    group: "Developer",
    items: [
      { icon: "ti-key", label: "API keys" },
      { icon: "ti-plug", label: "Integrations" },
      { icon: "ti-webhook", label: "Webhooks" },
    ],
  },
  {
    group: "Security",
    items: [
      { icon: "ti-lock", label: "Authentication" },
      { icon: "ti-shield", label: "SSO & SCIM" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-text-tertiary">Settings</span>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">
              Company profile
            </span>
            <Pill tone="warning" className="ml-2">
              Unsaved changes
            </Pill>
          </div>
        }
        right={
          <>
            <Button variant="secondary">Discard</Button>
            <Button variant="primary">Save changes</Button>
          </>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div
          className="grid max-w-[1080px]"
          style={{ gridTemplateColumns: "196px 1fr", gap: "28px" }}
        >
          {/* Sub-nav */}
          <aside>
            {NAV.map((g) => (
              <div key={g.group} className="mb-4">
                <div className="label px-[10px] mb-[8px]">{g.group}</div>
                <div className="flex flex-col">
                  {g.items.map((it) => (
                    <button
                      key={it.label}
                      type="button"
                      className={`flex items-center gap-[9px] px-[10px] py-[7px] rounded-[5px] text-left ${
                        it.active
                          ? "bg-subtle text-text-primary font-medium"
                          : "text-text-secondary hover:bg-subtle/60"
                      }`}
                    >
                      <i className={`ti ${it.icon} text-[14px]`} />
                      <span className="text-[12.5px]">{it.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          {/* Form */}
          <div className="flex flex-col gap-[16px]">
            {/* Brand */}
            <Card className="px-[26px] py-[24px]">
              <SectionHeader
                title="Brand"
                sub="How your company appears in Solvo and on payslips"
              />
              <div
                className="mt-[22px] grid items-center"
                style={{ gridTemplateColumns: "auto 1fr", gap: "20px" }}
              >
                <div className="w-[64px] h-[64px] bg-text-primary rounded-[8px] flex items-center justify-center text-white font-semibold text-[24px]">
                  M
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary">Upload new logo</Button>
                    <button className="text-text-tertiary text-[12px] font-medium hover:text-text-primary px-[10px] py-[7px]">
                      Remove
                    </button>
                  </div>
                  <p className="text-[11px] text-text-tertiary mt-2">
                    PNG or SVG · square · max 2MB
                  </p>
                </div>
              </div>
            </Card>

            {/* Identity */}
            <Card className="px-[26px] py-[24px]">
              <SectionHeader
                title="Identity"
                sub="The legal information we use for compliance and contracts"
              />
              <div className="mt-[22px] flex flex-col gap-[14px]">
                <div className="grid grid-cols-2 gap-[14px]">
                  <Field label="Display name" value="Mavenly" dirty />
                  <Field label="Legal name" value="Mavenly Inc." />
                </div>
                <div className="grid grid-cols-3 gap-[14px]">
                  <Field label="Country of incorp." value="United States" trailingIcon="ti-chevron-down" />
                  <Field label="EIN / Tax ID" value="84-2293041" tabular />
                  <Field label="Industry" value="Technology" trailingIcon="ti-chevron-down" />
                </div>
                <Field
                  label="Headquarters address"
                  value="350 Mission St, San Francisco, CA 94105"
                />
              </div>
            </Card>

            {/* Contact */}
            <Card className="px-[26px] py-[24px]">
              <SectionHeader
                title="Contact"
                sub="Where we send invoices, alerts, and compliance notices"
              />
              <div className="mt-[22px] flex flex-col gap-[14px]">
                <div className="grid grid-cols-2 gap-[14px]">
                  <Field
                    label="Primary admin"
                    value="Sarah Chen · sarah@mavenly.com"
                    readOnly
                  />
                  <Field label="Billing email" value="billing@mavenly.com" />
                </div>
                <div className="grid grid-cols-2 gap-[14px]">
                  <Field
                    label="Time zone"
                    value="America/Los_Angeles · GMT−7"
                    trailingIcon="ti-chevron-down"
                  />
                  <Field
                    label="Reporting currency"
                    value="USD · US dollar"
                    trailingIcon="ti-chevron-down"
                  />
                </div>
              </div>
            </Card>

            {/* Danger zone */}
            <div className="mt-3 bg-card rounded-[8px] px-[24px] py-[20px] flex items-center justify-between gap-4" style={{ border: "1px solid #fee2e2" }}>
              <div>
                <div className="text-[13px] font-medium" style={{ color: "#991b1b" }}>
                  Close workspace
                </div>
                <p className="text-[12px] text-text-tertiary mt-[3px]">
                  Permanently delete Mavenly's workspace, employee records, and history. This can't be undone.
                </p>
              </div>
              <button
                className="text-[12px] font-medium px-[13px] py-[7px] rounded-[5px] whitespace-nowrap"
                style={{ background: "#fff", border: "1px solid #fecaca", color: "#991b1b" }}
              >
                Close workspace
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2
        className="text-[15px] font-medium text-text-primary"
        style={{ letterSpacing: "-0.01em" }}
      >
        {title}
      </h2>
      <p className="text-[12px] text-text-tertiary mt-[4px]">{sub}</p>
    </div>
  );
}

function Field({
  label,
  value,
  dirty = false,
  readOnly = false,
  trailingIcon,
  tabular = false,
}: {
  label: string;
  value: string;
  dirty?: boolean;
  readOnly?: boolean;
  trailingIcon?: string;
  tabular?: boolean;
}) {
  return (
    <div>
      <label className="label block mb-[7px]">{label}</label>
      <div className="relative">
        <input
          type="text"
          defaultValue={value}
          readOnly={readOnly}
          className={`w-full bg-card rounded-[5px] px-[12px] py-[9px] text-[13px] text-text-primary focus:outline-none ${
            dirty
              ? "border border-text-primary"
              : "border border-border focus:border-text-secondary"
          } ${tabular ? "tabular" : ""} ${trailingIcon ? "pr-[36px]" : ""}`}
        />
        {trailingIcon && (
          <i
            className={`ti ${trailingIcon} absolute right-[12px] top-1/2 -translate-y-1/2 text-[14px] text-text-quaternary`}
          />
        )}
      </div>
    </div>
  );
}
