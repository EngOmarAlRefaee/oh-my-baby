import React, { lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../css/app.css";
import "../css/omb-fixes.css";
import Header from "./components/header";
import VideoHero from "./components/VideoHero";
import Hero from "./components/Hero";
import NewArrivals from "./components/NewArrivals";
import FeaturedCollection from "./components/FeaturedCollection";
import Categories from "./components/Categories";
import BestSellers from "./components/BestSellers";
import NewbornEssentials from "./components/NewbornEssentials";
import GiftIdeas from "./components/GiftIdeas";
import RewardsSection from "./components/RewardsSection";
import TrustSection from "./components/TrustSection";
import Footer from "./components/Footer";
import ScrollMotion from "./components/ui/ScrollMotion";
const CatalogPage = lazy(() => import("./components/CatalogPage"));
const AdminPage = lazy(() => import("./components/AdminPage"));
import AccountSection from "./components/AccountSection";
const DeliveryPage = lazy(() => import("./components/DeliveryPage"));
const AdminOrdersPage = lazy(() => import("./components/AdminOrdersPage"));
const OwnerOperationsPage = lazy(() => import("./components/OwnerOperationsPage"));
const AdminCommissionsPage = lazy(() => import("./components/AdminCommissionsPage"));
const OwnerDashboardPage = lazy(() => import("./components/OwnerDashboardPage"));
const AdminDashboardPage = lazy(() => import("./components/AdminDashboardPage"));
const MarketingPage = lazy(() => import("./components/MarketingPage"));
const TeamManagementPage = lazy(() => import("./components/TeamManagementPage"));
const HelpCenterPage = lazy(() => import("./components/HelpCenterPage"));
const OwnerSectionPage = lazy(() => import("./components/OwnerSectionPage"));
const StaffWorkspaceHeader = lazy(() => import("./components/StaffWorkspaceHeader"));
const DecorationWorkspacePage = lazy(() => import("./components/DecorationWorkspacePage"));
const CustomerAccountPage = lazy(() => import("./components/CustomerAccountPage"));
import SupportChatLauncher from "./components/SupportChatLauncher";
const AdminSupportPage = lazy(() => import("./components/AdminSupportPage"));
import { syncCatalogFromServer, PRODUCTS_STORAGE_KEY } from "./data/productStore";
import { prefetchFeaturedCollection } from "./lib/siteContent";
const AdminSiteContentPage = lazy(() => import("./components/AdminSiteContentPage"));

function App() {
  const [locale, setLocale] = useState(() => { try { return window.localStorage.getItem("omb-locale") || "ar"; } catch { return "ar"; } });
  const [darkMode, setDarkMode] = useState(() => { try { const saved = window.localStorage.getItem("omb-theme"); if (saved === "dark" || saved === "light") return saved === "dark"; return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false; } catch { return false; } });
  const isAr = locale === "ar";
  const pathname = window.location.pathname;

  useEffect(() => { document.documentElement.lang = locale; document.documentElement.dir = isAr ? "rtl" : "ltr"; try { window.localStorage.setItem("omb-locale", locale); } catch {} }, [locale, isAr]);
  useEffect(() => { const theme = darkMode ? "dark" : "light"; document.documentElement.dataset.theme = theme; try { window.localStorage.setItem("omb-theme", theme); } catch {} }, [darkMode]);

  useEffect(() => {
    if (pathname !== "/" || !window.location.hash) return undefined;
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    let firstFrame = 0;
    let secondFrame = 0;

    // Hash navigation can happen before React has mounted the homepage sections.
    // Re-apply it once after layout; CSS scroll-margin handles the sticky header offset.
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const target = document.getElementById(targetId);
        if (target) {
          const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--omb-header-offset")) || 190;
          const anchorTarget = target.querySelector(".omb-section-head") || target.firstElementChild || target;
          const gapBelowHeader = window.innerWidth >= 1024 ? 12 : 8;
          const top = window.scrollY + anchorTarget.getBoundingClientRect().top - offset - gapBelowHeader;
          window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname]);

  const shell = (children) => <div className="min-h-screen bg-milk text-espresso" dir={isAr ? "rtl" : "ltr"}><div aria-hidden="true" className="omb-dark-stars" /><Suspense fallback={<div className="grid min-h-[40vh] place-items-center text-sm text-espresso/50">…</div>}>{children}</Suspense></div>;

  if (pathname.startsWith("/owner/finance")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><OwnerOperationsPage locale={locale} /><Footer locale={locale} /></>);
  if (pathname.startsWith("/owner/marketing")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><MarketingPage locale={locale} /><Footer locale={locale} /></>);
  if (pathname.startsWith("/owner/support")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><AdminSupportPage locale={locale} /><Footer locale={locale} /></>);
  if (pathname.startsWith("/owner/team")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><TeamManagementPage locale={locale} /><Footer locale={locale} /></>);
  if (pathname.startsWith("/owner/help")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><HelpCenterPage locale={locale} /><Footer locale={locale} /></>);
  if (pathname.startsWith("/owner/section/")) {
    const sectionKey = pathname.split("/owner/section/")[1]?.split("/")[0] || "";
    return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><OwnerSectionPage locale={locale} sectionKey={sectionKey} /><Footer locale={locale} /></>);
  }
  if (pathname.startsWith("/owner")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><OwnerDashboardPage locale={locale} /><Footer locale={locale} /></>);
  const adminHeader = <StaffWorkspaceHeader locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} role="admin" />;
  const deliveryHeader = <StaffWorkspaceHeader locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} role="delivery" />;

  if (pathname.startsWith("/admin/support")) return shell(<>{adminHeader}<AdminSupportPage locale={locale} /></>);
  if (pathname.startsWith("/admin/team")) return shell(<>{adminHeader}<TeamManagementPage locale={locale} /></>);
  if (pathname.startsWith("/admin/marketing")) return shell(<>{adminHeader}<MarketingPage locale={locale} /></>);
  if (pathname.startsWith("/admin/operations")) return shell(<>{adminHeader}<AdminCommissionsPage locale={locale} /></>);
  if (pathname.startsWith("/admin/orders")) return shell(<>{adminHeader}<AdminOrdersPage locale={locale} /></>);
  if (pathname.startsWith("/admin/products")) return shell(<>{adminHeader}<AdminPage locale={locale} /></>);
  if (pathname.startsWith("/admin/site-content")) return shell(<>{adminHeader}<AdminSiteContentPage locale={locale} /></>);
  if (pathname.startsWith("/admin/decoration")) return shell(<>{adminHeader}<DecorationWorkspacePage locale={locale} /></>);
  if (pathname === "/admin" || pathname === "/admin/") return shell(<>{adminHeader}<AdminDashboardPage locale={locale} /></>);
  if (pathname.startsWith("/delivery")) return shell(<>{deliveryHeader}<DeliveryPage locale={locale} /></>);
  if (pathname.startsWith("/customer")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><CustomerAccountPage locale={locale} /><Footer locale={locale} /><SupportChatLauncher locale={locale} /></>);
  if (pathname !== "/" && !pathname.startsWith("/#")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><CatalogPage locale={locale} path={`${pathname}${window.location.search}`} /><Footer locale={locale} /><SupportChatLauncher locale={locale} /></>);

  return shell(<>
    <Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} />
    <main>
      <ScrollMotion><VideoHero locale={locale} /></ScrollMotion>
      <ScrollMotion><NewArrivals locale={locale} /></ScrollMotion>
      <ScrollMotion><Categories locale={locale} /></ScrollMotion>
      <ScrollMotion><Hero locale={locale} /></ScrollMotion>
      <ScrollMotion><GiftIdeas locale={locale} /></ScrollMotion>
      <ScrollMotion><FeaturedCollection locale={locale} /></ScrollMotion>
      <ScrollMotion><NewbornEssentials locale={locale} /></ScrollMotion>
      <ScrollMotion><BestSellers locale={locale} /></ScrollMotion>
      <ScrollMotion><TrustSection locale={locale} /></ScrollMotion>
      <ScrollMotion><RewardsSection locale={locale} /></ScrollMotion>
      <ScrollMotion><AccountSection locale={locale} /></ScrollMotion>
    </main>
    <ScrollMotion><Footer locale={locale} /></ScrollMotion>
    <SupportChatLauncher locale={locale} />
  </>);
}

let appRoot = null;
const mountApp = () => {
  appRoot = createRoot(document.getElementById("root"));
  appRoot.render(<App />);
};

// Speed: never keep the customer staring at a blank page while the catalog downloads.
// If a cached catalog exists the page renders at once and the fresh catalog/stock is
// fetched in the background (the page refreshes itself only if something changed).
// With no cache (first visit) we wait briefly so the first paint already has products.
const rawCatalog = () => { try { return window.localStorage.getItem(PRODUCTS_STORAGE_KEY) || ""; } catch { return ""; } };
const refreshInBackground = (before) => {
  Promise.allSettled([syncCatalogFromServer(), prefetchFeaturedCollection()]).then((results) => {
    const memoryOnly = Boolean(results[0]?.value?.memoryOnly);
    if (appRoot && (memoryOnly || rawCatalog() !== before)) appRoot.render(<App key={Date.now()} />);
  });
};

if (window.location.pathname.startsWith("/admin/products")) {
  mountApp();
} else if (rawCatalog().length > 2) {
  const before = rawCatalog();
  mountApp();
  refreshInBackground(before);
} else {
  Promise.race([
    Promise.allSettled([syncCatalogFromServer(), prefetchFeaturedCollection()]),
    new Promise((resolve) => window.setTimeout(resolve, 3000)),
  ]).finally(mountApp);
}
