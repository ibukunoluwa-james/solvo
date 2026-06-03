import Header from "../_components/Header";
import { Avatar, Button, Card, Pill } from "../_components/ui";
import { PEOPLE } from "../_data/people";

const formatUsd = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0 });

export default function PeoplePage() {
  return (
    <>
      <Header
        title="People"
        right={
          <Button icon="ti-plus" variant="primary">
            Add person
          </Button>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="max-w-[1280px]">
          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-[18px]">
            <div className="relative w-full max-w-[280px]">
              <i className="ti ti-search absolute left-[10px] top-1/2 -translate-y-1/2 text-[13px] text-text-tertiary" />
              <input
                type="text"
                placeholder="Search by name or email"
                className="w-full bg-card border border-border rounded-[5px] pl-[30px] pr-3 py-[6px] text-[12px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-strong"
              />
            </div>

            <div className="flex items-center gap-1">
              <Chip active>
                All <span className="tabular text-text-tertiary ml-[2px]">40</span>
              </Chip>
              <Chip>
                Employees{" "}
                <span className="tabular text-text-tertiary/80 ml-[2px]">31</span>
              </Chip>
              <Chip>
                Contractors{" "}
                <span className="tabular text-text-tertiary/80 ml-[2px]">9</span>
              </Chip>
            </div>

            <div className="flex-1" />

            <Button variant="secondary" icon="ti-filter">
              Country
            </Button>
            <Button variant="secondary" icon="ti-adjustments">
              Filter
            </Button>
          </div>

          {/* People table */}
          <Card className="overflow-hidden">
            {/* Header row */}
            <div
              className="grid items-center bg-muted border-b border-border px-[22px] py-[11px] text-text-tertiary"
              style={{
                gridTemplateColumns: "2fr 1fr 1.4fr 1.1fr 80px",
                columnGap: "16px",
                fontSize: "10.5px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <div>Name</div>
              <div>Country</div>
              <div>Role</div>
              <div className="text-right">Salary</div>
              <div className="text-right">Status</div>
            </div>

            {/* Data rows */}
            {PEOPLE.map((p, i) => (
              <div
                key={p.email}
                className={`grid items-center px-[22px] py-[14px] ${
                  i < PEOPLE.length - 1 ? "border-b border-border-subtle" : ""
                }`}
                style={{
                  gridTemplateColumns: "2fr 1fr 1.4fr 1.1fr 80px",
                  columnGap: "16px",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={p.name} country={p.country} size={28} />
                  <div className="min-w-0">
                    <div className="text-[12.5px] text-text-primary truncate leading-tight">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-text-quaternary truncate leading-tight">
                      {p.email}
                    </div>
                  </div>
                </div>
                <div className="text-[12.5px] text-text-secondary">
                  {p.country}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[12.5px] text-text-secondary truncate">
                    {p.role}
                  </span>
                  {p.contractor && (
                    <span className="text-[10.5px] font-medium text-text-secondary bg-subtle rounded-[3px] px-[6px] py-[1px] leading-none">
                      Contractor
                    </span>
                  )}
                </div>
                <div className="text-[12.5px] tabular text-text-primary text-right">
                  {formatUsd(p.salaryUsd)}
                </div>
                <div className="flex justify-end">
                  <Pill tone={p.status.tone}>{p.status.label}</Pill>
                </div>
              </div>
            ))}
          </Card>

          {/* Pagination footer */}
          <div className="flex items-center justify-between mt-[14px]">
            <span className="text-[11.5px] text-text-tertiary tabular">
              Showing 8 of 40
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled
                className="px-[9px] py-[5px] rounded-[5px] text-text-quaternary cursor-not-allowed"
              >
                <i className="ti ti-chevron-left text-[14px]" />
              </button>
              <button className="px-[9px] py-[5px] rounded-[5px] text-text-secondary hover:bg-subtle">
                <i className="ti ti-chevron-right text-[14px]" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Chip({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`text-[12px] font-medium leading-none px-[10px] py-[6px] rounded-[5px] transition-colors ${
        active
          ? "text-text-primary border border-border bg-card"
          : "text-text-tertiary border border-transparent hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
