import Link from "next/link";
import { Wordmark } from "./MarketingNav";

/**
 * Placeholder shown for routes that are linked in the UI but not built yet.
 * Fills the remaining height of its parent (a chrome layout's flex column),
 * so inside the admin/employee shells it sits under the <Header>.
 */
export function UnderConstruction({
  title,
  description = "This page isn’t ready yet — we’re still building it. Check back soon.",
  backHref,
  backLabel = "Go back",
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="text-center max-w-[420px]">
        <div className="w-[56px] h-[56px] rounded-[14px] bg-subtle border border-border flex items-center justify-center mx-auto mb-[20px]">
          <i className="ti ti-tools text-[26px] text-text-secondary" />
        </div>

        <div className="inline-flex items-center gap-[6px] mb-[14px]">
          <span className="w-[6px] h-[6px] rounded-full bg-warning" />
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">
            Under construction
          </span>
        </div>

        <h1
          className="text-[24px] font-medium text-text-primary"
          style={{ letterSpacing: "-0.02em" }}
        >
          {title}
        </h1>
        <p className="text-[13.5px] text-text-tertiary mt-[10px] leading-[1.6]">
          {description}
        </p>

        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-[7px] mt-[24px] text-[13px] font-medium text-text-secondary bg-card border border-border-strong hover:bg-subtle rounded-[7px] px-[16px] py-[9px] transition-colors"
          >
            <i className="ti ti-arrow-left text-[15px]" />
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Full-screen variant for standalone routes that have no app chrome
 * (e.g. /terms, /privacy, /forgot-password). Adds a branded top bar.
 */
export function UnderConstructionScreen(props: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="h-[58px] border-b border-border flex items-center px-6">
        <Wordmark />
      </header>
      <UnderConstruction {...props} />
    </div>
  );
}