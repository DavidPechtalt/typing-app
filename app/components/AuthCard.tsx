import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  children: ReactNode;
};

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-500 uppercase dark:text-slate-400">
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      or
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
