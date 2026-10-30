// A single headline number with a label: a rule on top, a big serif numeral.
type StatTileProps = {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
};

export function StatTile({
  label,
  value,
  hint,
  emphasis = false,
}: StatTileProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-line-strong pt-3">
      <dt className="eyebrow">{label}</dt>
      <dd
        className={`font-display leading-none tabular-nums ${
          emphasis ? "text-6xl" : "text-4xl"
        }`}
      >
        {value}
      </dd>
      {hint && <dd className="font-mono text-[11px] text-ink-faint">{hint}</dd>}
    </div>
  );
}
