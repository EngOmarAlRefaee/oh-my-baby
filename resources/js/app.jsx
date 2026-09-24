import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../css/app.css";
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
import Newsletter from "./components/Newsletter";
import Footer from "./components/Footer";
import ScrollMotion from "./components/ui/ScrollMotion";
import CatalogPage from "./components/CatalogPage";
import AdminPage from "./components/AdminPage";
import AccountSection from "./components/AccountSection";
import DeliveryPage from "./components/DeliveryPage";
import AdminOrdersPage from "./components/AdminOrdersPage";
import OwnerOperationsPage from "./components/OwnerOperationsPage";
import OwnerDashboardPage from "./components/OwnerDashboardPage";
import AdminDashboardPage from "./components/AdminDashboardPage";
import MarketingPage from "./components/MarketingPage";

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

  const shell = (children) => <div className="min-h-screen bg-milk text-espresso" dir={isAr ? "rtl" : "ltr"}><div aria-hidden="true" className="omb-dark-stars" />{children}</div>;

  if (pathname.startsWith("/owner")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><OwnerDashboardPage locale={locale} /><Footer locale={locale} /></>);
  if (pathname.startsWith("/admin/marketing")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><MarketingPage locale={locale} /><Footer locale={locale} /></>);
  if (pathname.startsWith("/admin/operations")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><OwnerOperationsPage locale={locale} /><Footer locale={locale} /></>);
  if (pathname.startsWith("/admin/orders")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><AdminOrdersPage locale={locale} /><Footer locale={locale} /></>);
  if (pathname.startsWith("/admin/products")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><AdminPage locale={locale} /></>);
  if (pathname === "/admin" || pathname === "/admin/") return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><AdminDashboardPage locale={locale} /><Footer locale={locale} /></>);
  if (pathname.startsWith("/delivery")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><DeliveryPage locale={locale} /><Footer locale={locale} /></>);
  if (pathname !== "/" && !pathname.startsWith("/#")) return shell(<><Header locale={locale} onLocaleChange={setLocale} darkMode={darkMode} onThemeChange={setDarkMode} /><CatalogPage locale={locale} path={`${pathname}${window.location.search}`} /><Footer locale={locale} /></>);

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
      <ScrollMotion><Newsletter locale={locale} /></ScrollMotion>
    </main>
    <ScrollMotion><Footer locale={locale} /></ScrollMotion>
  </>);
}

createRoot(document.getElementById("root")).render(<App />);
