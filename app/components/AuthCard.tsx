import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="card flex w-full max-w-sm flex-col gap-6 p-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-muted">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-muted">
      <span className="h-0.5 flex-1 bg-line/25" />
      or
      <span className="h-0.5 flex-1 bg-line/25" />
    </div>
  );
}
