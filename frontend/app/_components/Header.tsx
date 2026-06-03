import React from "react";

type HeaderProps = {
  title?: React.ReactNode;
  /** Optional explicit left node — overrides title when provided (e.g. breadcrumb) */
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export default function Header({ title, left, right }: HeaderProps) {
  return (
    <header className="h-[50px] border-b border-border bg-card px-8 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {left ?? (
          <h1 className="text-[13px] font-medium text-text-primary leading-none">
            {title}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
