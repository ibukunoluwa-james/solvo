import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-canvas px-4 py-10">
      {/* Brand block */}
      <Link
        href="/"
        className="flex items-center gap-[10px] mb-[40px] mt-[20px]"
      >
        <svg
          width="28"
          height="28"
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
          className="text-[18px] font-semibold text-text-primary"
          style={{ letterSpacing: "-0.01em" }}
        >
          Solvo
        </span>
      </Link>

      {children}
    </div>
  );
}
