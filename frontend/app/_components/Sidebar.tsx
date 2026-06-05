"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../_lib/api";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: string;
};

const NAV: NavItem[] = [
  { href: "/overview", label: "Overview", icon: "ti-layout-grid" },
  { href: "/people", label: "People", icon: "ti-users", badge: "40" },
  { href: "/payroll", label: "Pay runs", icon: "ti-cash" },
  {
    href: "/disbursements",
    label: "Disbursements",
    icon: "ti-arrow-narrow-right",
  },
  { href: "/advances", label: "Advances", icon: "ti-hand-finger", badge: "2" },
  { href: "/compliance", label: "Compliance", icon: "ti-shield-check" },
  { href: "/wallets", label: "Wallets", icon: "ti-wallet" },
  { href: "/reports", label: "Reports", icon: "ti-file-text" },
];

const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: "ti-settings",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [company, setCompany] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.companies
      .getMe()
      .then((c) => alive && setCompany(c.name))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function logout() {
    await api.auth.logout();
    router.replace("/login");
  }

  const isActive = (href: string) => {
    // Treat /pay-runs/* as active for Pay runs
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className="w-[196px] shrink-0 bg-card border-r border-border flex flex-col"
      style={{ minHeight: "100vh" }}
    >
      {/* Logo block */}
      <div className="px-4 pt-5 pb-[22px] flex items-center gap-2">
        <svg
          width="20"
          height="20"
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
          className="text-[14px] font-semibold text-text-primary"
          style={{ letterSpacing: "-0.01em" }}
        >
          Solvo
        </span>
      </div>

      {/* Workspace switcher */}
      <div className="px-3 mb-4">
        <button
          type="button"
          className="w-full flex items-center gap-2 px-2 py-[7px] border border-border rounded-[5px] bg-card hover:bg-subtle transition-colors"
        >
          <div className="w-[18px] h-[18px] rounded-[3px] bg-text-primary text-white flex items-center justify-center text-[10px] font-semibold shrink-0">
            {company ? company.charAt(0).toUpperCase() : "·"}
          </div>
          <span className="text-[12px] font-medium text-text-primary truncate flex-1 text-left">
            {company ?? "Your workspace"}
          </span>
          <i className="ti ti-selector text-[14px] text-text-tertiary" />
        </button>
      </div>

      {/* Primary nav */}
      <nav className="px-3 flex flex-col gap-[2px]">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-[9px] px-[9px] py-[7px] rounded-[5px] transition-colors ${
                active
                  ? "bg-subtle text-text-primary"
                  : "text-text-secondary hover:bg-subtle/60"
              }`}
            >
              <i className={`ti ${item.icon} text-[15px] shrink-0`} />
              <span className="text-[12.5px] font-medium flex-1 leading-none">
                {item.label}
              </span>
              {item.badge && (
                <span className="tabular text-[10px] font-medium bg-border text-text-secondary px-[5px] py-[1px] rounded-[3px] leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings (separated by a 1px divider per spec) */}
      <div className="px-3 mt-3 pt-3 border-t border-border">
        {(() => {
          const active = isActive(SETTINGS_ITEM.href);
          return (
            <Link
              href={SETTINGS_ITEM.href}
              className={`flex items-center gap-[9px] px-[9px] py-[7px] rounded-[5px] transition-colors ${
                active
                  ? "bg-subtle text-text-primary"
                  : "text-text-secondary hover:bg-subtle/60"
              }`}
            >
              <i className={`ti ${SETTINGS_ITEM.icon} text-[15px] shrink-0`} />
              <span className="text-[12.5px] font-medium flex-1 leading-none">
                {SETTINGS_ITEM.label}
              </span>
            </Link>
          );
        })()}
      </div>

      {/* Spacer */}
      <div className="mt-auto" />

      {/* User block */}
      <div className="border-t border-border px-[10px] py-[10px] flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-[10px] font-semibold text-text-primary shrink-0">
          {company ? company.charAt(0).toUpperCase() : "·"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] font-medium text-text-primary leading-tight truncate">
            {company ?? "—"}
          </div>
          <div className="text-[10px] text-text-quaternary leading-tight truncate">
            Admin
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out"
          className="w-6 h-6 flex items-center justify-center rounded-[5px] text-text-tertiary hover:text-text-primary hover:bg-subtle transition-colors"
        >
          <i className="ti ti-logout text-[14px]" />
        </button>
      </div>
    </aside>
  );
}
