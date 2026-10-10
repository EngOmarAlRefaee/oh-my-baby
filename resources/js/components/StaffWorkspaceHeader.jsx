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
      <div className="mx-auto flex min-h-[82px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href={home} className="flex items-center gap-3" aria-label="OH MY BABY workspace">
          <img src="/images/brand/bear-mark.png" alt="" className="h-12 w-auto object-contain" />
          <div>
            <strong className="font-serif text-lg tracking-[0.13em] sm:text-xl">OH MY BABY</strong>
            <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-aubergine/55">
              {role === "delivery" ? "DELIVERY" : "ADMIN"}
            </p>
          </div>
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          {role === "admin" && <SupportStaffNotifier locale={locale} user={user} />}
          {user?.name && <span className="hidden max-w-[180px] truncate text-xs font-black text-espresso/65 md:inline">{user.name}</span>}
          <a href={home} className="border border-espresso/12 px-3 py-2 text-xs font-black transition hover:border-aubergine/35 hover:bg-oat/25">
            {isAr ? "لوحة التحكم" : "Dashboard"}
          </a>
          {user?.storefront_access && (
            <a href="/" className="border border-espresso/12 px-3 py-2 text-xs font-black transition hover:border-aubergine/35 hover:bg-oat/25">
              {isAr ? "عرض المتجر" : "Storefront"}
            </a>
          )}
          <button type="button" onClick={() => onLocaleChange(isAr ? "en" : "ar")} className="border border-espresso/12 px-3 py-2 text-xs font-black">
            {isAr ? "EN" : "AR"}
          </button>
          <button type="button" onClick={() => onThemeChange(!darkMode)} className="border border-espresso/12 px-3 py-2 text-xs font-black">
            {darkMode ? (isAr ? "فاتح" : "Light") : (isAr ? "داكن" : "Dark")}
          </button>
          <button type="button" disabled={busy} onClick={logout} className="border border-red-300/70 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-50 disabled:opacity-50">
            {busy ? (isAr ? "..." : "...") : (isAr ? "تسجيل الخروج" : "Sign out")}
          </button>
        </div>
      </div>
    </header>
  );
}


