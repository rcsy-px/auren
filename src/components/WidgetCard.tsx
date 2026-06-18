import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

export function WidgetCard({ title, icon, children }: Props) {
  return (
    <section className="glass min-h-[180px] rounded-2xl border border-white/12 p-5 shadow-2xl shadow-black/20">
      <header className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm font-medium text-white">
          {icon}
          <span>{title}</span>
        </div>
        <MoreHorizontal size={20} className="text-slate-200/65" />
      </header>
      {children}
    </section>
  );
}
