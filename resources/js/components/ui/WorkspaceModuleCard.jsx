import React from "react";

function ModuleIcon({ type }) {
  const common = {
    width: 34,
    height: 34,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.65,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    team: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    finance: <><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M16 10h5.5v4H16a2 2 0 0 1 0-4Z"/><path d="M6.5 9h4"/></>,
    orders: <><path d="M6 3h12l2 4H4l2-4Z"/><path d="M5 7v13h14V7"/><path d="M9 11h6M9 15h6"/></>,
    catalog: <><path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4"/><path d="m4 17 8 4 8-4"/></>,
    delivery: <><path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    decoration: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m18.5 13 1 2.5L22 16.5l-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z"/><path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z"/></>,
    customers: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M17.5 4.5 19 3l1.5 1.5L22 3"/></>,
    marketing: <><path d="m3 11 14-6v14L3 13z"/><path d="M7 14v5a2 2 0 0 0 2 2h1v-6"/><path d="M20 9v6"/></>,
    reports: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/><path d="m4 7 5-4 6 5 5-4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3v-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    account: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/><path d="M18.5 5.5 20 7l2.5-3"/></>,
    sitecontent: <><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18"/><path d="M7 14h6M7 17h10"/></>,
    support: <><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 11.5h7M8.5 14.5h4"/></>,
    help: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 4.5v17"/><path d="M10 8a2.5 2.5 0 1 1 3 2.45c-.7.2-1 .55-1 1.3V12"/><path d="M12 15.5h.01"/></>,
  };

  return <svg {...common}>{icons[type] || icons[String(type).replace(/-/g, "")] || icons.help}</svg>;
}

export default function WorkspaceModuleCard({ module, locale = "ar", badge = 0 }) {
  const isAr = locale === "ar";

  return (
    <a
      href={module.href}
      className="group relative flex min-h-[155px] items-center justify-center overflow-hidden rounded-[24px] border border-espresso/10 bg-milk px-5 py-6 text-center shadow-[0_10px_32px_rgba(56,36,42,.045)] transition-[border-color,box-shadow,background-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:border-aubergine/20 hover:bg-milk hover:shadow-[0_20px_46px_rgba(56,36,42,.09)] focus:outline-none focus:ring-2 focus:ring-aubergine/25"
    >
      {/* Card stays completely fixed: the hover motion happens inside the surface. */}
      <span className="pointer-events-none absolute inset-[1px] rounded-[23px] border border-white/25 opacity-70" />

      {/* Soft underline reveal from the center — restores the pleasant motion without moving the card. */}
      <span className="pointer-events-none absolute inset-x-7 bottom-0 h-px origin-center scale-x-0 bg-aubergine/45 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100 motion-reduce:transition-none" />

      {/* Gentle light bloom. */}
      <span className="pointer-events-none absolute -top-14 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-aubergine/[.035] blur-2xl transition-[width,height,opacity,background-color] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:h-36 group-hover:w-36 group-hover:bg-aubergine/[.075] motion-reduce:transition-none" />

      {/* Very subtle sheen across the card; opacity only, so there is no layout jump. */}
      <span className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-[left,opacity] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:left-full group-hover:opacity-100 motion-reduce:hidden" />

      {badge > 0 && <span className="absolute end-4 top-4 z-10 grid min-h-6 min-w-6 place-items-center rounded-full bg-aubergine px-1.5 text-[11px] font-black text-milk">{badge}</span>}

      <div className="relative flex flex-col items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-espresso/10 bg-oat/30 text-aubergine shadow-[inset_0_1px_0_rgba(255,255,255,.35)] transition-[transform,border-color,background-color,color,box-shadow] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.08] group-hover:-rotate-[1.5deg] group-hover:border-aubergine/25 group-hover:bg-aubergine group-hover:text-milk group-hover:shadow-[0_10px_25px_rgba(80,52,67,.16),inset_0_1px_0_rgba(255,255,255,.12)] motion-reduce:transform-none motion-reduce:transition-none">
          <ModuleIcon type={module.key} />
        </span>
        <h2 className="text-[17px] font-black leading-tight text-espresso transition-[color,letter-spacing] duration-500 ease-out group-hover:tracking-[.005em] group-hover:text-aubergine sm:text-[18px]">
          {isAr ? module.ar : module.en}
        </h2>
      </div>
    </a>
  );
}
