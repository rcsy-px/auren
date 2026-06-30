import { ArrowRight, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { resolveSearchTarget } from "../lib/search";
import { useI18n } from "../i18n";
import { useDashboardStore } from "../store/dashboardStore";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const provider = useDashboardStore((state) => state.settings.searchProvider);
  const { t } = useI18n();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const target = resolveSearchTarget(query, provider);
    if (target) window.location.href = target;
  }

  return (
    <form onSubmit={handleSubmit} className="glass search-shell">
      <Search className="shrink-0 text-slate-100/85" size={23} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("search.placeholder")}
        className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-200/62"
      />
      <button type="submit" className="rounded-full p-2 text-slate-100/85 transition hover:bg-white/10" title={t("search.submit")}>
        <ArrowRight size={22} />
      </button>
    </form>
  );
}
