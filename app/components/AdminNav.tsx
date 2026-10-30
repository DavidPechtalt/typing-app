// Tab bar shared by all admin pages.
import { NavLink } from "react-router";
import { useTranslate } from "~/lib/use-translate";

const tabs = [
  // `end` makes "Overview" active only on exactly /admin, not on /admin/users too.
  { to: "/admin", key: "admin.tab.overview", end: true },
  { to: "/admin/stats", key: "admin.tab.stats", end: false },
  { to: "/admin/users", key: "admin.tab.users", end: false },
  { to: "/admin/texts", key: "admin.tab.texts", end: false },
  { to: "/admin/results", key: "admin.tab.practices", end: false },
] as const;

// NavLink calls this with isActive, so the current tab gets the yellow underline.
function tabClass({ isActive }: { isActive: boolean }) {
  return `whitespace-nowrap border-b-2 py-1 text-sm font-medium transition-colors ${
    isActive
      ? "border-accent text-ink"
      : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink"
  }`;
}

export function AdminNav() {
  const t = useTranslate();
  return (
    // aria-label tells screen readers this is a second navigation, apart from the header's "Main".
    <nav aria-label={t("nav.admin")} className="flex gap-5 overflow-x-auto">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={tabClass}>
          {t(tab.key)}
        </NavLink>
      ))}
    </nav>
  );
}
