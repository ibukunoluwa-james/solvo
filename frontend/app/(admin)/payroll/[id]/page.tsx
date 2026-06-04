import Link from "next/link";
import Header from "../../../_components/Header";
import { Avatar, Button, Card, Pill } from "../../../_components/ui";

type Row = {
  name: string;
  grossUsd: number;
  withholdingUsd: number;
  netLocal: string;
  costUsd: number;
};

type Group = {
  country: string;
  color: string;
  people: number;
  fxLine: string;
  subtotal: string;
  rows: Row[];
};

const GROUPS: Group[] = [
  {
    country: "Nigeria",
    color: "#18181b",
    people: 18,
    fxLine: "1 USD = 1,548 NGN",
    subtotal: "$76,420",
    rows: [
      {
        name: "Adaeze Okonkwo",
        grossUsd: 6200,
        withholdingUsd: 1240,
        netLocal: "₦7,675,920",
        costUsd: 5147,
      },
      {
        name: "Yusuf Adeyemi",
        grossUsd: 5800,
        withholdingUsd: 1160,
        netLocal: "₦7,180,320",
        costUsd: 4814,
      },
      {
        name: "Chiamaka Eze",
        grossUsd: 5100,
        withholdingUsd: 1020,
        netLocal: "₦6,313,680",
        costUsd: 4230,
      },
    ],
  },
  {
    country: "Kenya",
    color: "#52525b",
    people: 12,
    fxLine: "1 USD = 129.4 KES",
    subtotal: "$54,180",
    rows: [
      {
        name: "Faith Mwangi",
        grossUsd: 5400,
        withholdingUsd: 1080,
        netLocal: "KSh 559,008",
        costUsd: 4476,
      },
      {
        name: "Aisha Otieno",
        grossUsd: 4900,
        withholdingUsd: 980,
        netLocal: "KSh 507,232",
        costUsd: 4062,
      },
    ],
  },
];

const fmtUsd = (n: number, opts: Intl.NumberFormatOptions = {}) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...opts,
  });

export default function PayRunReviewPage() {
  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/payroll"
              className="text-[13px] text-text-tertiary hover:text-text-secondary"
            >
              Pay runs
            </Link>
            <i className="ti ti-chevron-right text-[12px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">
              June 2026 · Run #6
            </span>
            <Pill tone="info" className="ml-2">
              Draft
            </Pill>
          </div>
        }
        right={
          <>
            <Button variant="secondary">Save draft</Button>
            <Button variant="primary">Approve &amp; fund</Button>
          </>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="flex flex-col gap-[20px] max-w-[1280px]">
          {/* Summary card */}
          <Card className="px-[26px] py-[22px]">
            <div
              className="grid items-center"
              style={{
                gridTemplateColumns: "1.4fr 1px 1fr 1px 1fr 1px 1fr",
                columnGap: "20px",
              }}
            >
              <SummaryCell label="Total to disburse" value="$184,250.00" big />
              <Divider />
              <SummaryCell label="Taxes withheld" value="$42,180" />
              <Divider />
              <SummaryCell label="FX cost" value="$1,476" />
              <Divider />
              <SummaryCell label="Solvo fee" value="$1,106" />
            </div>
          </Card>

          {/* Compliance checks */}
          <Card
            className="grid divide-x divide-border"
            style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}
          >
            <ComplianceCheck
              title="Compliance"
              subtitle="All withholdings calculated."
            />
            <ComplianceCheck
              title="FX rates locked"
              subtitle="Valid until disbursement."
            />
            <ComplianceCheck
              title="Bank details"
              subtitle="40 of 40 verified."
            />
          </Card>

          {/* Payroll lines */}
          <Card className="overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-border">
              <h3 className="text-[12.5px] font-medium text-text-primary leading-none">
                Payroll lines
              </h3>
              <span className="text-[11.5px] text-text-tertiary leading-none">
                Grouped by country
              </span>
            </div>

            {GROUPS.map((g) => (
              <CountryGroup key={g.country} group={g} />
            ))}

            {/* Collapsed groups */}
            <div className="px-[24px] py-[10px] bg-muted border-t border-border flex items-center gap-2">
              <i className="ti ti-chevron-down text-[12px] text-text-tertiary" />
              <span className="text-[11px] text-text-tertiary">
                + 9 more · South Africa · Egypt
              </span>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}

function Divider() {
  return (
    <div
      className="bg-border"
      style={{ width: "1px", height: "40px", justifySelf: "center" }}
    />
  );
}

function SummaryCell({
  label,
  value,
  big = false,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div>
      <div className="label mb-[8px]">{label}</div>
      <div
        className={`${
          big ? "text-[28px]" : "text-[18px]"
        } font-medium text-text-primary tabular leading-none`}
        style={{ letterSpacing: big ? "-0.02em" : "-0.015em" }}
      >
        {value}
      </div>
    </div>
  );
}

function ComplianceCheck({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-[11px] px-[22px] py-[16px]">
      <i className="ti ti-circle-check text-[18px] text-success mt-[1px]" />
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium text-text-primary leading-tight">
          {title}
        </div>
        <div className="text-[11.5px] text-text-tertiary leading-tight mt-[3px]">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function CountryGroup({ group }: { group: Group }) {
  return (
    <div>
      {/* Country group header */}
      <div className="bg-muted border-b border-border px-[24px] py-[11px] flex items-center gap-3">
        <span
          style={{
            width: 5,
            height: 14,
            background: group.color,
            display: "inline-block",
            borderRadius: 1,
          }}
        />
        <span className="text-[11.5px] font-medium text-text-primary">
          {group.country}
        </span>
        <span className="text-[11px] text-text-tertiary">
          · {group.people} people
        </span>
        <div className="flex-1" />
        <span className="text-[11px] text-text-tertiary tabular">
          {group.fxLine}
        </span>
        <span className="text-[11.5px] font-medium text-text-primary tabular ml-3">
          {group.subtotal}
        </span>
      </div>

      {/* Sub-header */}
      <div
        className="grid items-center px-[24px] py-[10px] border-b border-border text-text-tertiary"
        style={{
          gridTemplateColumns: "2fr 1.1fr 1.1fr 1.3fr 1fr",
          columnGap: "16px",
          fontSize: "10.5px",
          fontWeight: 500,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        <div>Employee</div>
        <div className="text-right">Gross (USD)</div>
        <div className="text-right">Withholding</div>
        <div className="text-right">Net (local)</div>
        <div className="text-right">Cost (USD)</div>
      </div>

      {/* Data rows */}
      {group.rows.map((r, i) => (
        <div
          key={r.name}
          className={`grid items-center px-[24px] py-[13px] ${
            i < group.rows.length - 1 ? "border-b border-border-subtle" : ""
          }`}
          style={{
            gridTemplateColumns: "2fr 1.1fr 1.1fr 1.3fr 1fr",
            columnGap: "16px",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={r.name} country={group.country} size={26} />
            <span className="text-[12.5px] text-text-primary truncate">
              {r.name}
            </span>
          </div>
          <div className="text-[12.5px] tabular text-text-primary text-right">
            {fmtUsd(r.grossUsd)}
          </div>
          <div className="text-[12.5px] tabular text-text-tertiary text-right">
            {fmtUsd(r.withholdingUsd)}
          </div>
          <div className="text-[12.5px] tabular text-text-primary text-right">
            {r.netLocal}
          </div>
          <div className="text-[12.5px] tabular font-medium text-text-primary text-right">
            {fmtUsd(r.costUsd)}
          </div>
        </div>
      ))}

      {/* Collapsed-in-group indicator */}
      <div className="px-[24px] py-[10px] bg-muted border-b border-border flex items-center gap-2">
        <i className="ti ti-chevron-down text-[12px] text-text-tertiary" />
        <span className="text-[11px] text-text-tertiary">
          + {group.people - group.rows.length} more
        </span>
      </div>
    </div>
  );
}
