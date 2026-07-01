import { Bookmark, ExternalLink, Grid3X3, LayoutDashboard, MousePointerClick, Tags } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { useI18n } from "../i18n";
import { useDashboardStore } from "../store/dashboardStore";

export function DashboardOverview() {
  const shortcuts = useDashboardStore((state) => state.shortcuts);
  const shortcutCategories = useDashboardStore((state) => state.shortcutCategories);
  const showCategoriesOnDashboard = useDashboardStore((state) => state.settings.shortcuts.showCategoriesOnDashboard);
  const { t } = useI18n();

  const stats = useMemo(() => {
    const categoryNames = new Set([
      ...shortcutCategories.map((category) => category.name.trim().toLowerCase()).filter(Boolean),
      ...shortcuts.map((shortcut) => shortcut.category.trim().toLowerCase()).filter(Boolean),
    ]);
    const openInNewTab = shortcuts.filter((shortcut) => shortcut.openInNewTab).length;

    return {
      shortcuts: shortcuts.length,
      categories: categoryNames.size,
      dashboardMode: showCategoriesOnDashboard ? t("overview.grouped") : t("overview.grid"),
      openInNewTab,
      openInCurrentTab: shortcuts.length - openInNewTab,
    };
  }, [shortcutCategories, shortcuts, showCategoriesOnDashboard, t]);

  return (
    <section className="dashboard-overview glass" aria-label={t("overview.title")}>
      <div className="dashboard-overview-heading">
        <span><LayoutDashboard size={17} /></span>
        <div>
          <strong>{t("overview.title")}</strong>
          <small>{t("overview.subtitle")}</small>
        </div>
      </div>
      <div className="dashboard-overview-grid">
        <OverviewStat icon={<Bookmark size={17} />} label={t("overview.shortcuts")} value={String(stats.shortcuts)} />
        <OverviewStat icon={<Tags size={17} />} label={t("overview.categories")} value={String(stats.categories)} />
        <OverviewStat icon={<Grid3X3 size={17} />} label={t("overview.dashboardMode")} value={stats.dashboardMode} />
        <OverviewStat icon={<ExternalLink size={17} />} label={t("overview.newTab")} value={String(stats.openInNewTab)} />
        <OverviewStat icon={<MousePointerClick size={17} />} label={t("overview.currentTab")} value={String(stats.openInCurrentTab)} />
      </div>
    </section>
  );
}

function OverviewStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="dashboard-overview-stat">
      <span className="dashboard-overview-icon">{icon}</span>
      <span className="dashboard-overview-copy">
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}
