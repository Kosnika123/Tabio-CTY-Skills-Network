// Shared brand mark for TCSN Network.
// `variant="dark"` is for use on dark backgrounds (footer, sidebars with dark chrome).
// `showWordmark={false}` renders just the icon, useful for tight spaces like collapsed sidebars.

export function LogoMark({ className = "h-9 w-9" }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="#061A4B" />
      <path
        d="M11 15.6h9.6M15.8 15.6v9.4"
        stroke="#F3FBEF"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M22.6 22.3c.2 1.5 1.4 2.4 3 2.4 1.5 0 2.4-.7 2.4-1.7 0-.9-.6-1.4-2-1.7l-1.4-.3c-2-.4-3.1-1.5-3.1-3.2 0-2 1.8-3.4 4.1-3.4s4 1.3 4.2 3.3h-2.4c-.2-1-1-1.6-1.9-1.6s-1.7.5-1.7 1.4c0 .8.6 1.2 1.8 1.5l1.4.3c2.3.5 3.4 1.6 3.4 3.4 0 2.1-1.8 3.6-4.5 3.6-2.7 0-4.6-1.4-4.8-3.7h2.5z"
        fill="#F3FBEF"
      />
      <circle cx="29.5" cy="10.5" r="2.4" fill="#61B630" />
    </svg>
  );
}

export default function Logo({
  variant = "light",
  showWordmark = true,
  iconClassName = "h-9 w-9",
  textClassName = "text-xl",
}) {
  const baseText = variant === "dark" ? "text-white" : "text-slate-950";

  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={iconClassName} />

      {showWordmark && (
        <span
          className={`font-[var(--font-display)] font-bold tracking-tight ${baseText} ${textClassName}`}
        >
          TCS<span className="text-green-500">N</span>
        </span>
      )}
    </span>
  );
}
