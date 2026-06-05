import Link from "next/link";
import { Wordmark } from "./MarketingNav";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Global payroll", href: "/#product" },
      { label: "On-demand pay", href: "/#ondemand" },
      { label: "Coverage", href: "/#coverage" },
      { label: "How it works", href: "/#how" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Book a demo", href: "/demo" },
      { label: "Sign in", href: "/login" },
      { label: "Create a workspace", href: "/register" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-[1180px] px-6 py-[52px]">
        <div className="grid gap-[40px] md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="text-[13px] text-text-tertiary mt-[14px] max-w-[260px] leading-[1.6]">
              Global payroll and on-demand pay for distributed teams — settled
              across local rails in seconds.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="label mb-[14px]">{col.title}</div>
              <ul className="flex flex-col gap-[10px]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-[44px] pt-[22px] border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-[12px] text-text-quaternary">
            © {new Date().getFullYear()} Solvo. All rights reserved.
          </span>
          <span className="text-[12px] text-text-quaternary">
            Built for teams across Africa and beyond.
          </span>
        </div>
      </div>
    </footer>
  );
}
