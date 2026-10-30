// Title row at the top of every page: a big serif heading, an optional line of
// context on the right in mono, and an optional row below (tabs, buttons).
type PageHeaderProps = {
  title: string;
  aside?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageHeader({ title, aside, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-line-strong pb-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-5xl leading-none tracking-tight sm:text-6xl">
          {title}
        </h1>
        {aside && (
          <div className="font-mono text-xs tracking-wider text-ink-muted uppercase">
            {aside}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
