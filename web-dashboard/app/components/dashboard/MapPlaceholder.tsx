export function MapPlaceholder() {
  return (
    <div className="absolute inset-0 pointer-events-none map-placeholder">
      <svg viewBox="0 0 1000 520" className="w-full h-full" aria-hidden>
        <rect x="0" y="0" width="1000" height="520" fill="transparent" />

        <g fill="rgba(255,255,255,0.08)" stroke="rgba(120,200,255,0.25)" strokeWidth="1">
          <path d="M70 150 L130 120 L210 140 L250 170 L240 210 L190 230 L140 210 L100 180 Z" />
          <path d="M230 240 L270 220 L320 240 L340 280 L300 320 L250 300 Z" />
          <path d="M430 150 L480 130 L540 150 L570 190 L540 220 L490 220 L450 200 Z" />
          <path d="M520 230 L570 220 L610 240 L610 290 L570 330 L520 300 Z" />
          <path d="M600 140 L690 120 L780 150 L830 190 L820 240 L760 260 L690 240 L640 200 Z" />
          <path d="M760 300 L810 290 L860 310 L870 350 L830 370 L780 350 Z" />
        </g>

        <g stroke="rgba(120,200,255,0.35)" strokeWidth="1" fill="none">
          <path d="M110 190 C 200 150, 320 150, 420 190" />
          <path d="M420 190 C 520 230, 640 230, 760 190" />
          <path d="M200 300 C 340 260, 480 270, 620 300" />
          <path d="M620 300 C 720 320, 820 320, 900 280" />
        </g>

        <g fill="rgba(255,255,255,0.2)">
          <circle cx="170" cy="190" r="4" />
          <circle cx="220" cy="200" r="3" />
          <circle cx="260" cy="175" r="3" />
          <circle cx="300" cy="210" r="4" />
          <circle cx="360" cy="190" r="3" />
          <circle cx="520" cy="210" r="4" />
          <circle cx="580" cy="170" r="3" />
          <circle cx="650" cy="190" r="4" />
          <circle cx="720" cy="210" r="3" />
          <circle cx="780" cy="230" r="4" />
          <circle cx="560" cy="300" r="4" />
          <circle cx="620" cy="320" r="3" />
          <circle cx="680" cy="330" r="3" />
          <circle cx="740" cy="310" r="4" />
          <circle cx="820" cy="300" r="3" />
        </g>
      </svg>
    </div>
  );
}
