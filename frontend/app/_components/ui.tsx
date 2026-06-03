import React from "react";
import Link from "next/link";

/* ─── Button ─────────────────────────────────────────────────────────── */

type ButtonVariant = "primary" | "secondary" | "tertiary";

type CommonButtonProps = {
  variant?: ButtonVariant;
  icon?: string;
  iconRight?: string;
  className?: string;
  children?: React.ReactNode;
};

type ButtonAsButton = CommonButtonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonButtonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonButtonProps & {
  href: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const BUTTON_BASE =
  "inline-flex items-center gap-[6px] rounded-[5px] text-[12px] font-medium leading-none transition-colors whitespace-nowrap";
const BUTTON_SIZING = "px-[14px] py-[7px]";
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-text-primary text-white hover:bg-text-primary/90 border border-transparent",
  secondary:
    "bg-card text-text-secondary border border-border-strong hover:bg-subtle",
  tertiary:
    "bg-transparent text-text-tertiary border border-transparent hover:text-text-primary hover:border-border",
};

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    icon,
    iconRight,
    className = "",
    children,
  } = props;

  const classes = `${BUTTON_BASE} ${BUTTON_SIZING} ${BUTTON_VARIANTS[variant]} ${className}`;
  const content = (
    <>
      {icon && <i className={`ti ${icon} text-[14px]`} />}
      {children}
      {iconRight && <i className={`ti ${iconRight} text-[14px]`} />}
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  const { variant: _v, icon: _i, iconRight: _ir, className: _c, ...rest } =
    props as ButtonAsButton;
  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}

/* ─── Card ───────────────────────────────────────────────────────────── */

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  hero?: boolean;
};

export function Card({
  hero = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-[8px] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ─── Pill / Badge ───────────────────────────────────────────────────── */

type PillTone = "success" | "warning" | "info" | "neutral";

const PILL_TONES: Record<PillTone, string> = {
  success: "bg-success-bg border-success-border text-success",
  warning: "bg-warning-bg-soft border-warning-border text-warning",
  info: "bg-info-bg border-info-border text-info",
  neutral: "bg-subtle border-border text-text-secondary",
};

export function Pill({
  tone = "neutral",
  children,
  className = "",
  dot = false,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-[5px] text-[10.5px] font-medium leading-none px-[7px] py-[2.5px] rounded-[10px] border ${PILL_TONES[tone]} ${className}`}
    >
      {dot && (
        <span
          className={`w-[5px] h-[5px] rounded-full ${
            tone === "success"
              ? "bg-success"
              : tone === "warning"
                ? "bg-warning"
                : tone === "info"
                  ? "bg-info"
                  : "bg-text-tertiary"
          }`}
        />
      )}
      {children}
    </span>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────────── */

type AvatarKey = "amber" | "blue" | "rose" | "indigo";

const AVATAR_STYLES: Record<AvatarKey, string> = {
  amber: "bg-avatar-amber-bg text-avatar-amber-fg",
  blue: "bg-avatar-blue-bg text-avatar-blue-fg",
  rose: "bg-avatar-rose-bg text-avatar-rose-fg",
  indigo: "bg-avatar-indigo-bg text-avatar-indigo-fg",
};

/** Deterministic color per country so the same person is always the same color */
const COUNTRY_AVATAR: Record<string, AvatarKey> = {
  Nigeria: "amber",
  Kenya: "blue",
  "South Africa": "rose",
  Egypt: "indigo",
};

export function avatarKeyForCountry(country?: string): AvatarKey {
  if (country && COUNTRY_AVATAR[country]) return COUNTRY_AVATAR[country];
  // fallback hash on country string
  const keys: AvatarKey[] = ["amber", "blue", "rose", "indigo"];
  const s = country ?? "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return keys[h % keys.length];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

export function Avatar({
  name,
  country,
  size = 28,
}: {
  name: string;
  country?: string;
  size?: number;
}) {
  const key = avatarKeyForCountry(country);
  const fontSize = size <= 24 ? 9.5 : size <= 28 ? 10.5 : 11.5;
  return (
    <div
      className={`rounded-full flex items-center justify-center font-medium shrink-0 ${AVATAR_STYLES[key]}`}
      style={{ width: size, height: size, fontSize }}
    >
      {initials(name)}
    </div>
  );
}

/* ─── Progress bar ───────────────────────────────────────────────────── */

type ProgressTone = "success" | "info" | "warning";

const PROGRESS_FILL: Record<ProgressTone, string> = {
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
};

const PROGRESS_LABEL: Record<ProgressTone, string> = {
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
};

export function ProgressBar({
  percent,
  tone,
  label,
}: {
  percent: number;
  tone: ProgressTone;
  label: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-[3px] bg-subtle rounded-full overflow-hidden">
        <div
          className={`h-full ${PROGRESS_FILL[tone]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span
        className={`text-[11px] font-medium leading-none min-w-[58px] ${PROGRESS_LABEL[tone]}`}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── Stat strip ────────────────────────────────────────────────────── */

export type StatCell = {
  label: string;
  /** Primary value, e.g. "$184,250" */
  value: React.ReactNode;
  /** Optional tiny meta line under value */
  meta?: React.ReactNode;
};

export function StatStrip({
  cells,
  cols,
}: {
  cells: StatCell[];
  /** CSS grid-template-columns string; defaults to equal columns. */
  cols?: string;
}) {
  const template = cols ?? `repeat(${cells.length}, minmax(0, 1fr))`;
  return (
    <Card className="grid divide-x divide-border" style={{ gridTemplateColumns: template }}>
      {cells.map((c, i) => (
        <div key={i} className="px-6 py-[22px]">
          <div className="label mb-[10px]">{c.label}</div>
          <div className="text-[22px] font-medium tabular leading-none" style={{ letterSpacing: "-0.02em" }}>
            {c.value}
          </div>
          {c.meta && (
            <div className="text-[11.5px] text-text-tertiary mt-[4px] tabular">
              {c.meta}
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}
