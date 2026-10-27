// Tab bar shared by all admin pages.
import { NavLink } from "react-router";

const tabs = [
  // `end` makes "Overview" active only on exactly /admin, not on /admin/users too.
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/users", label: "Users", end: false },
  { to: "/admin/texts", label: "Texts", end: false },
  { to: "/admin/results", label: "Practices", end: false },
];

// NavLink calls this with isActive, so the current tab gets the highlighted
// style. Same look as the main header's links in root.tsx.
function tabClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
    isActive
      ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
  }`;
}

export function AdminNav() {
  return (
    // aria-label tells screen readers this is a second navigation, apart from the header's "Main".
    <nav aria-label="Admin" className="-mx-1 flex gap-1 overflow-x-auto px-1">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={tabClass}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
