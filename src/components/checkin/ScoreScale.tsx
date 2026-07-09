"use client";

function descriptor(score: number): string {
  if (score === 0) return "None";
  if (score <= 3) return "Mild";
  if (score <= 6) return "Moderate";
  if (score <= 8) return "Significant";
  return "Severe";
}

export function ScoreScale({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium text-zinc-900">{label}</span>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-dark">
          {value} · {descriptor(value)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-3 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-brand"
        aria-label={label}
      />
      <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
        <span>0 · None</span>
        <span>10 · Severe</span>
      </div>
    </div>
  );
}
