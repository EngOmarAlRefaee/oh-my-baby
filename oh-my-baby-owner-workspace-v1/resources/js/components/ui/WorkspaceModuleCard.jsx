import React from "react";

export default function WorkspaceModuleCard({ module, locale = "ar" }) {
  const isAr = locale === "ar";
  const isLive = module.status === "live";

  return (
    <a
      href={module.href}
      className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-[26px] border border-espresso/10 bg-milk p-5 shadow-[0_12px_36px_rgba(56,36,42,.05)] transition duration-300 hover:-translate-y-1 hover:border-aubergine/30 hover:shadow-[0_20px_50px_rgba(56,36,42,.09)] focus:outline-none focus:ring-2 focus:ring-aubergine/25"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-[11px] font-black tracking-[.16em] text-aubergine/50">{String(module.order).padStart(2, "0")}</span>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${isLive ? "bg-emerald-50 text-emerald-700" : "bg-oat/60 text-espresso/50"}`}>
          {isLive ? (isAr ? "متاح" : "Live") : (isAr ? "قيد البناء" : "Planned")}
        </span>
      </div>

      <div className="mt-7">
        <p className="text-[10px] font-black uppercase tracking-[.16em] text-aubergine/45">{module.code}</p>
        <h2 className="mt-2 text-[21px] font-black leading-tight text-espresso">{isAr ? module.ar : module.en}</h2>
        <p className="mt-3 text-sm leading-7 text-espresso/55">{isAr ? module.arShort : module.enShort}</p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 pt-7">
        <span className="text-xs font-black text-aubergine/75 transition group-hover:text-aubergine">
          {isAr ? "فتح القسم" : "Open section"}
        </span>
        <span aria-hidden="true" className={`text-xl font-light text-aubergine/45 transition group-hover:translate-x-[-3px] group-hover:text-aubergine ${isAr ? "" : "rotate-180"}`}>←</span>
      </div>
    </a>
  );
}
