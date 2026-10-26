type StatProps = {
  label: string;
  value: string;
  highlight?: boolean;
};

export function Stat({ label, value, highlight = false }: StatProps) {
  return (
    <div
      className={`rounded-xl border-2 border-line p-4 ${
        highlight ? "bg-sun text-on-accent" : "bg-card"
      }`}
    >
      <dt className={`text-sm font-semibold ${highlight ? "" : "text-muted"}`}>
        {label}
      </dt>
      <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  );
}
