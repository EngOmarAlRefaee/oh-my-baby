import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import SupportStaffNotifier from "./SupportStaffNotifier";

export default function StaffWorkspaceHeader({
  locale = "ar",
  onLocaleChange = () => {},
  darkMode = false,
  onThemeChange = () => {},
  role = "admin",
}) {
  const isAr = locale === "ar";
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const home = role === "delivery" ? "/delivery" : "/admin";

  useEffect(() => {
    let alive = true;
    apiFetch("/auth/session")
      .then((payload) => { if (alive) setUser(payload?.user || null); })
      .catch(() => { if (alive) setUser(null); });
    return () => { alive = false; };
  }, []);

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await apiFetch("/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch {
      // Even if the response is interrupted, leaving the workspace is the safest UI fallback.
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-espresso/10 bg-milk/95 text-espresso backdrop-blur" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2 sm:min-h-[82px] sm:flex-nowrap sm:px-8 sm:py-0">
        <a href={home} className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="OH MY BABY workspace">
          <img src="/images/brand/bear-mark.png" alt="" className="h-9 w-auto object-contain sm:h-12" />
          <div>
            <strong className="block whitespace-nowrap font-serif text-base tracking-[0.1em] sm:text-xl sm:tracking-[0.13em]">OH MY BABY</strong>
            <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-aubergine/55">
              {role === "delivery" ? "DELIVERY" : "ADMIN"}
            </p>
          </div>
        </a>

        <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:flex-nowrap sm:gap-3">
          {role === "admin" && <SupportStaffNotifier locale={locale} user={user} />}
          {user?.name && <span className="hidden max-w-[180px] truncate text-xs font-black text-espresso/65 md:inline">{user.name}</span>}
          <a href={home} className="border border-espresso/12 px-2.5 py-1.5 text-[11px] font-black sm:px-3 sm:py-2 sm:text-xs transition hover:border-aubergine/35 hover:bg-oat/25">
            {isAr ? "لوحة التحكم" : "Dashboard"}
          </a>
          {user?.storefront_access && (
            <a href="/" className="border border-espresso/12 px-2.5 py-1.5 text-[11px] font-black sm:px-3 sm:py-2 sm:text-xs transition hover:border-aubergine/35 hover:bg-oat/25">
              {isAr ? "عرض المتجر" : "Storefront"}
            </a>
          )}
          <button type="button" onClick={() => onLocaleChange(isAr ? "en" : "ar")} className="border border-espresso/12 px-2.5 py-1.5 text-[11px] font-black sm:px-3 sm:py-2 sm:text-xs">
            {isAr ? "EN" : "AR"}
          </button>
          <button type="button" onClick={() => onThemeChange(!darkMode)} className="border border-espresso/12 px-2.5 py-1.5 text-[11px] font-black sm:px-3 sm:py-2 sm:text-xs">
            {darkMode ? (isAr ? "فاتح" : "Light") : (isAr ? "داكن" : "Dark")}
          </button>
          <button type="button" disabled={busy} onClick={logout} className="border border-red-300/70 px-2.5 py-1.5 text-[11px] font-black sm:px-3 sm:py-2 sm:text-xs text-red-700 transition hover:bg-red-50 disabled:opacity-50">
            {busy ? (isAr ? "..." : "...") : (isAr ? "تسجيل الخروج" : "Sign out")}
          </button>
        </div>
      </div>
    </header>
  );
}


