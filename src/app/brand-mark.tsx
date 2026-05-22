const gold = "#C9A227";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <svg
        viewBox="0 0 264 52"
        role="img"
        aria-label="Doorway Detail"
        className="h-[2.35em] w-auto overflow-visible"
      >
        {/* DOORWAY — bold, current color */}
        <text
          x="0"
          y="31"
          fill="currentColor"
          fontFamily="Montserrat, Arial, sans-serif"
          fontSize="26"
          fontWeight="900"
          letterSpacing="1.5"
        >
          DOORWAY
        </text>

        {/* Diamond separator accent */}
        <path d="M139 14 L143 21 L139 28 L135 21Z" fill={gold} />

        {/* DETAIL — italic, gold */}
        <text
          x="147"
          y="31"
          fill={gold}
          fontFamily="Montserrat, Arial, sans-serif"
          fontSize="26"
          fontWeight="900"
          fontStyle="italic"
          letterSpacing="2.2"
        >
          DETAIL
        </text>

        {/* Tagline */}
        <text
          x="1"
          y="48"
          fill="currentColor"
          opacity="0.52"
          fontFamily="DM Sans, Arial, sans-serif"
          fontSize="9.5"
          fontWeight="700"
          letterSpacing="1.4"
        >
          Detail Done Flawlessly
        </text>
      </svg>
    </span>
  );
}
