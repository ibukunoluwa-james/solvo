import Link from "next/link";

/** Solvo wordmark — shared across the marketing surface. */
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-[9px]">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="8" fill="#18181b" />
        <path
          d="M13 25.5c1.4 1.4 3.6 2.2 6 2.2 3.5 0 5.5-1.6 5.5-3.7 0-2-1.6-3-4.6-3.6l-2-.4c-3.7-.7-6-2.6-6-5.6 0-3.4 3-5.6 7-5.6 2.7 0 4.8.8 6.4 2.2l-1.7 2c-1.3-1.1-2.9-1.7-4.8-1.7-2.4 0-4 1.2-4 3 0 1.7 1.4 2.7 4.2 3.2l2 .4c4 .8 6.3 2.6 6.3 5.9 0 3.7-3 6.1-8.4 6.1-3 0-5.6-1-7.4-2.6l1.5-1.8z"
          fill="#fafaf8"
        />
      </svg>
      <span
        className="text-[16px] font-semibold text-text-primary"
        style={{ letterSpacing: "-0.01em" }}
      >
        Solvo
      </span>
    </Link>
  );
}

const NAV_LINKS = [
  { href: "/#product", label: "Product" },
  { href: "/#coverage", label: "Coverage" },
  { href: "/#ondemand", label: "On-demand pay" },
  { href: "/#how", label: "How it works" },
];

export default function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1180px] px-6 h-[58px] flex items-center justify-between">
        <Wordmark />

        <nav className="hidden md:flex items-center gap-[26px]">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-[10px]">
          <Link
            href="/login"
            className="text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors px-[10px] py-[7px]"
          >
            Sign in
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-[6px] text-[13px] font-medium text-white bg-text-primary hover:bg-text-primary/90 rounded-[6px] px-[14px] py-[8px] transition-colors"
          >
            Book a demo
          </Link>
        </div>
      </div>
    </header>
  );
}
