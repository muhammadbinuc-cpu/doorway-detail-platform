import Image from "next/image";

const gold = "#C9A227";

type BrandMarkProps = {
  className?: string;
  variant?: "light" | "dark";
};

// Logo PNG cropped dimensions (see scripts-process.mjs output)
const LOGO_W = 808;
const LOGO_H = 499;

export function BrandMark({ className = "", variant = "light" }: BrandMarkProps) {
  if (variant === "dark") {
    // Dark-background variant (footer) — inline SVG so DOORWAY can render in
    // currentColor (white via parent text-white) while DETAIL stays gold.
    return (
      <span className={`inline-flex items-center ${className}`}>
        <svg
          viewBox="0 0 230 64"
          role="img"
          aria-label="Doorway Detail"
          className="h-[2.6em] w-auto overflow-visible"
        >
          <g>
            <path
              d="M 4 46 L 24 14 L 44 46"
              stroke="currentColor"
              strokeWidth="3.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 22 46 L 40 22 L 56 46"
              stroke="currentColor"
              strokeWidth="3.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="46" y="22" width="3.2" height="7" fill="currentColor" />
            <path d="M 8 22 L 10 27 L 15 29 L 10 31 L 8 36 L 6 31 L 1 29 L 6 27 Z" fill="currentColor" />
            <path d="M 16 12 l 1 2.4 l 2.4 1 l -2.4 1 l -1 2.4 l -1 -2.4 l -2.4 -1 l 2.4 -1 z" fill="currentColor" />
            <path d="M 53 7 L 55 12 L 60 14 L 55 16 L 53 21 L 51 16 L 46 14 L 51 12 Z" fill="currentColor" />
            <path d="M 62 18 l 0.9 2 l 2 0.9 l -2 0.9 l -0.9 2 l -0.9 -2 l -2 -0.9 l 2 -0.9 z" fill="currentColor" />
          </g>
          <text
            x="72"
            y="28"
            fill="currentColor"
            style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
            fontSize="22"
            fontWeight="900"
            letterSpacing="0.6"
          >
            DOORWAY
          </text>
          <text
            x="72"
            y="50"
            fill={gold}
            style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
            fontSize="22"
            fontWeight="900"
            letterSpacing="2.4"
          >
            DETAIL
          </text>
        </svg>
      </span>
    );
  }

  // Light-background variant (nav, hero, quote page) — real brand PNG.
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/logo.png"
        alt="Doorway Detail"
        width={LOGO_W}
        height={LOGO_H}
        priority
        className="h-[2.6em] w-auto"
      />
    </span>
  );
}
