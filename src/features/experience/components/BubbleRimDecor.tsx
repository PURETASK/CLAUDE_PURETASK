/** Iridescent rim arcs — decorative SVG, no interaction. */
export const BubbleRimDecor = () => (
  <svg
    className="bubble-rim-decor"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <defs>
      <linearGradient id="bubble-rim-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#40e8e0" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#169af5" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.8" />
      </linearGradient>
    </defs>
    <path
      d="M 8 120 Q 40 20 120 8"
      stroke="url(#bubble-rim-grad)"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />
    <path
      d="M 192 80 Q 160 180 80 192"
      stroke="url(#bubble-rim-grad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.55"
    />
  </svg>
);
