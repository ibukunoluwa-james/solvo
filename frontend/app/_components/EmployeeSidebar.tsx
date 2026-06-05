"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../_lib/api";
import { initials } from "./ui";

const NAV = [
  { href: "/me", label: "My profile", icon: "ti-user" },
  { href: "/me/payslips", label: "Payslips", icon: "ti-receipt" },
  { href: "/me/advances", label: "Advances", icon: "ti-hand-finger" },
  { href: "/me/settings", label: "Settings", icon: "ti-settings" },
];

export default function EmployeeSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<{ name: string; subtitle: string } | null>(null);

  useEffect(() => {
    let alive = true;
    api.employees
      .myProfile()
      .then((p) => {
        if (alive)
          setProfile({
            name: p.full_name,
            subtitle: p.employment_type === "contractor" ? "Contractor" : "Employee",
          });
      })
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
    if (href === "/me") return pathname === "/me";
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

      {/* Section label */}
      <div
        className="px-4 mb-2 text-text-quaternary"
        style={{
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        My workspace
      </div>

      {/* Nav */}
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
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto" />

      {/* User block */}
      <div className="border-t border-border px-[10px] py-[10px] flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-avatar-amber-bg text-avatar-amber-fg text-[9px] font-semibold flex items-center justify-center shrink-0">
          {profile ? initials(profile.name) : "·"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] font-medium text-text-primary leading-tight truncate">
            {profile?.name ?? "—"}
          </div>
          <div className="text-[10px] text-text-quaternary leading-tight truncate">
            {profile?.subtitle ?? ""}
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
