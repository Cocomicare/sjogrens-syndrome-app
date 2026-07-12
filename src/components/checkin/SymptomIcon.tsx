"use client";

import clsx from "clsx";
import type { SeverityBand } from "@/lib/types/domain";

/** Symptoms with real uploaded photo icons (public/icons/<symptomName>/<band>.jpg), overriding the drawn SVG set below. */
const PHOTO_ICONS: Record<string, true> = {
  eye_dryness: true,
};

function photoSrc(symptomName: string, band: SeverityBand) {
  return `/icons/${symptomName}/${band}.jpg`;
}

const BAND_COLOR: Record<SeverityBand, { ring: string; bg: string; accent: string; accentSoft: string }> = {
  none: { ring: "#10b981", bg: "#ecfdf5", accent: "#10b981", accentSoft: "#a7f3d0" },
  mild: { ring: "#0f8b8d", bg: "#e6f5f5", accent: "#0f8b8d", accentSoft: "#99d5d6" },
  moderate: { ring: "#f59e0b", bg: "#fffbeb", accent: "#f59e0b", accentSoft: "#fde68a" },
  significant: { ring: "#f97316", bg: "#fff7ed", accent: "#f97316", accentSoft: "#fdba74" },
  severe: { ring: "#f43f5e", bg: "#fff1f2", accent: "#f43f5e", accentSoft: "#fda4af" },
};

const BAND_INDEX: Record<SeverityBand, number> = { none: 0, mild: 1, moderate: 2, significant: 3, severe: 4 };

const STROKE = "#3f3f46";

/** Short tick marks that accumulate (0-4) near the top-right of the icon as severity rises. */
function DistressMarks({ count, color }: { count: number; color: string }) {
  const marks = [
    { x1: 34, y1: 9, x2: 38, y2: 5 },
    { x1: 39, y1: 14, x2: 44, y2: 12 },
    { x1: 41, y1: 21, x2: 46, y2: 21 },
    { x1: 39, y1: 28, x2: 44, y2: 31 },
  ];
  return (
    <>
      {marks.slice(0, count).map((m, i) => (
        <line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      ))}
    </>
  );
}

function EyeIcon({ accent, showShine }: { accent: string; showShine: boolean }) {
  return (
    <>
      <path d="M9,24 Q24,13 39,24 Q24,35 9,24 Z" fill="white" stroke={STROKE} strokeWidth={2.2} strokeLinejoin="round" />
      <circle cx="24" cy="24" r="7" fill={accent} stroke={STROKE} strokeWidth={2} />
      <circle cx="24" cy="24" r="3" fill={STROKE} />
      {showShine && <circle cx="22" cy="22" r="1.4" fill="white" />}
    </>
  );
}

function MouthIcon({ accent }: { accent: string }) {
  return (
    <>
      <rect x="11" y="16" width="26" height="13" rx="6.5" fill="white" stroke={STROKE} strokeWidth={2.2} />
      <rect x="13.5" y="22" width="21" height="6" rx="3" fill={accent} />
      <line x1="12.5" y1="22" x2="35.5" y2="22" stroke={STROKE} strokeWidth={1.8} strokeLinecap="round" />
    </>
  );
}

function BatteryIcon({ accent, level }: { accent: string; level: number }) {
  const innerW = 20;
  const fillW = Math.max(2, innerW * level);
  return (
    <>
      <rect x="9" y="16" width="27" height="16" rx="3" fill="white" stroke={STROKE} strokeWidth={2.2} />
      <rect x="37" y="21" width="3.5" height="6" rx="1" fill={STROKE} />
      <rect x="11.5" y="18.5" width={fillW} height="11" rx="1.5" fill={accent} />
    </>
  );
}

function BoneIcon({ accent }: { accent: string }) {
  return (
    <>
      <rect x="15" y="21" width="18" height="6" rx="3" fill={accent} stroke={STROKE} strokeWidth={2} />
      <circle cx="14" cy="18" r="4.5" fill={accent} stroke={STROKE} strokeWidth={2} />
      <circle cx="14" cy="30" r="4.5" fill={accent} stroke={STROKE} strokeWidth={2} />
      <circle cx="34" cy="18" r="4.5" fill={accent} stroke={STROKE} strokeWidth={2} />
      <circle cx="34" cy="30" r="4.5" fill={accent} stroke={STROKE} strokeWidth={2} />
    </>
  );
}

function ArmIcon({ accent }: { accent: string }) {
  return (
    <>
      <rect
        x="12.5"
        y="9"
        width="10"
        height="19"
        rx="5"
        fill={accent}
        stroke={STROKE}
        strokeWidth={2}
        transform="rotate(-20 17.5 18.5)"
      />
      <circle cx="28" cy="28" r="9" fill={accent} stroke={STROKE} strokeWidth={2} />
      <circle cx="35" cy="34" r="5" fill={accent} stroke={STROKE} strokeWidth={2} />
    </>
  );
}

function BrainIcon({ accent }: { accent: string }) {
  return (
    <>
      <path
        d="M24,12 C21,10 17,11 16,14 C12,14 10,18 12,21 C9,23 10,28 14,29 C13,33 17,36 21,35 C22,37 26,37 27,35 C31,36 35,33 34,29 C38,28 39,23 36,21 C38,18 36,14 32,14 C31,11 27,10 24,12 Z"
        fill={accent}
        stroke={STROKE}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <path
        d="M24,15 L24,33 M18,19 Q21,24 18,29 M30,19 Q27,24 30,29"
        fill="none"
        stroke={STROKE}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </>
  );
}

function HeartIcon({ accent }: { accent: string }) {
  return (
    <path
      d="M24,34 C10,25 10,15 17,12 C21,10.5 24,13 24,16 C24,13 27,10.5 31,12 C38,15 38,25 24,34 Z"
      fill={accent}
      stroke={STROKE}
      strokeWidth={2.2}
      strokeLinejoin="round"
    />
  );
}

function NoseIcon({ accent }: { accent: string }) {
  return (
    <>
      <path
        d="M20,13 Q17,22 15,28 Q14,33 19,33 L29,33 Q34,33 33,28 Q31,22 28,13 Z"
        fill={accent}
        stroke={STROKE}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <ellipse cx="20.5" cy="29.5" rx="2.2" ry="1.6" fill={STROKE} />
      <ellipse cx="27.5" cy="29.5" rx="2.2" ry="1.6" fill={STROKE} />
    </>
  );
}

function SkinPatchIcon({ accent, cracked }: { accent: string; cracked: boolean }) {
  return (
    <>
      <rect x="11" y="11" width="26" height="26" rx="7" fill={accent} stroke={STROKE} strokeWidth={2.2} />
      {cracked && (
        <>
          <path d="M17,17 L23,23 M23,17 L17,23" stroke={STROKE} strokeWidth={1.4} strokeLinecap="round" />
          <path d="M28,26 L34,32 M34,26 L28,32" stroke={STROKE} strokeWidth={1.4} strokeLinecap="round" />
        </>
      )}
    </>
  );
}

function ThroatIcon({ accent, withGlands }: { accent: string; withGlands: boolean }) {
  return (
    <>
      <path d="M16,13 L32,13 L30,34 Q24,38 18,34 Z" fill={accent} stroke={STROKE} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M18,23 Q24,26 30,23" fill="none" stroke={STROKE} strokeWidth={1.6} strokeLinecap="round" />
      {withGlands && (
        <>
          <circle cx="13" cy="22" r="4.5" fill={accent} stroke={STROKE} strokeWidth={2} />
          <circle cx="35" cy="22" r="4.5" fill={accent} stroke={STROKE} strokeWidth={2} />
        </>
      )}
    </>
  );
}

function LungsIcon({ accent }: { accent: string }) {
  return (
    <>
      <path d="M24,10 L24,20" stroke={STROKE} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M24,18 Q18,16 16,20" stroke={STROKE} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <path d="M24,18 Q30,16 32,20" stroke={STROKE} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <ellipse cx="16" cy="27" rx="7" ry="10" fill={accent} stroke={STROKE} strokeWidth={2.2} />
      <ellipse cx="32" cy="27" rx="7" ry="10" fill={accent} stroke={STROKE} strokeWidth={2.2} />
    </>
  );
}

function VoiceBubbleIcon({ accent, jagged }: { accent: string; jagged: boolean }) {
  return (
    <>
      <path
        d="M10,14 h28 a4,4 0 0 1 4,4 v12 a4,4 0 0 1 -4,4 h-18 l-6,6 v-6 h-4 a4,4 0 0 1 -4,-4 v-12 a4,4 0 0 1 4,-4 Z"
        fill={accent}
        stroke={STROKE}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {jagged ? (
        <path d="M14,22 L20,26 L24,20 L28,26 L34,22" fill="none" stroke={STROKE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M14,22 L34,22" fill="none" stroke={STROKE} strokeWidth={1.8} strokeLinecap="round" />
      )}
    </>
  );
}

function HandIcon({ accent, sparks, icy }: { accent: string; sparks: boolean; icy: boolean }) {
  return (
    <>
      <path
        d="M16,36 L16,20 Q16,17 18.5,17 Q21,17 21,20 L21,16 Q21,13 23.5,13 Q26,13 26,16 L26,15 Q26,12 28.5,12 Q31,12 31,15 L31,20 Q31,17 33,17.5 Q35,18 34.5,21 L33,31 Q32,36 27,36 Z"
        fill={icy ? "#dbeafe" : accent}
        stroke={STROKE}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {sparks && (
        <path d="M14,14 L16,9 M20,10 L21,6 M26,9 L26,5" stroke={accent} strokeWidth={1.8} strokeLinecap="round" />
      )}
      {icy && <path d="M32,9 L32,15 M29,12 L35,12 M30,10 L34,14 M34,10 L30,14" stroke="#38bdf8" strokeWidth={1.4} strokeLinecap="round" />}
    </>
  );
}

function RashIcon({ accent }: { accent: string }) {
  return (
    <>
      <rect x="11" y="11" width="26" height="26" rx="7" fill="white" stroke={STROKE} strokeWidth={2.2} />
      {[
        [18, 18],
        [30, 17],
        [24, 24],
        [17, 30],
        [31, 30],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill={accent} stroke={STROKE} strokeWidth={1.2} />
      ))}
    </>
  );
}

function HeadacheIcon({ accent }: { accent: string }) {
  return (
    <>
      <circle cx="24" cy="24" r="13" fill="white" stroke={STROKE} strokeWidth={2.2} />
      <path d="M27,12 L18,26 L23,26 L20,38 L32,22 L26,22 Z" fill={accent} stroke={STROKE} strokeWidth={1.8} strokeLinejoin="round" />
    </>
  );
}

const ICONS: Record<string, (accent: string, bandIndex: number) => React.ReactNode> = {
  eye_dryness: (accent, i) => <EyeIcon accent={accent} showShine={i <= 1} />,
  mouth_dryness: (accent) => <MouthIcon accent={accent} />,
  energy_level: (accent, i) => <BatteryIcon accent={accent} level={1 - i / 4} />,
  joint_pain: (accent) => <BoneIcon accent={accent} />,
  muscle_pain: (accent) => <ArmIcon accent={accent} />,
  thinking_focus: (accent) => <BrainIcon accent={accent} />,
  overall_wellness: (accent) => <HeartIcon accent={accent} />,
  dry_nose: (accent) => <NoseIcon accent={accent} />,
  dry_skin: (accent, i) => <SkinPatchIcon accent={accent} cracked={i >= 3} />,
  swallowing: (accent) => <ThroatIcon accent={accent} withGlands={false} />,
  swollen_glands: (accent) => <ThroatIcon accent={accent} withGlands={true} />,
  cough: (accent) => <LungsIcon accent={accent} />,
  hoarseness: (accent, i) => <VoiceBubbleIcon accent={accent} jagged={i >= 3} />,
  mouth_sores: (accent) => <MouthIcon accent={accent} />,
  tingling_numbness: (accent, i) => <HandIcon accent={accent} sparks={i >= 2} icy={false} />,
  raynauds: (accent, i) => <HandIcon accent={accent} sparks={false} icy={i >= 2} />,
  rash_skin_changes: (accent) => <RashIcon accent={accent} />,
  headache: (accent) => <HeadacheIcon accent={accent} />,
};

function DefaultIcon({ accent }: { accent: string }) {
  return <circle cx="24" cy="24" r="12" fill={accent} stroke={STROKE} strokeWidth={2.2} />;
}

export function SymptomIcon({
  symptomName,
  band,
  className,
}: {
  symptomName?: string;
  band: SeverityBand;
  className?: string;
}) {
  const colors = BAND_COLOR[band];
  const bandIndex = BAND_INDEX[band];

  if (symptomName && PHOTO_ICONS[symptomName]) {
    return (
      <span
        className={clsx("relative block shrink-0 overflow-hidden rounded-full", className)}
        style={{ boxShadow: `0 0 0 3px ${colors.ring}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoSrc(symptomName, band)} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  const render = (symptomName && ICONS[symptomName]) || undefined;

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22" fill={colors.bg} stroke={colors.ring} strokeWidth={2} />
      {render ? render(colors.accent, bandIndex) : <DefaultIcon accent={colors.accent} />}
      <DistressMarks count={bandIndex} color={colors.ring} />
    </svg>
  );
}
