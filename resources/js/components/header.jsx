import React, { useEffect, useMemo, useRef, useState } from "react";
import { getCartCount } from "../data/productStore";
import CartAddedNotice from "./CartAddedNotice";
import { categoryTree } from "../data/catalog";
import { apiFetch } from "../lib/api";

function menuForWorld(worldId) {
  return (
    categoryTree.find((world) => world.id === worldId)?.children || []
  ).map((item) => ({
    slug: item.id,
    ar: item.ar,
    en: item.en,
  }));
}

// Header, Admin and catalog pages now read from the same category source.
const clothingMenu = menuForWorld("fashion");
const babyWorldMenu = menuForWorld("baby-world");

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-[23px] w-[23px]"
    >
      <circle cx="11" cy="11" r="6.7" />
      <path d="m19.6 19.6-3.25-3.25" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-[23px] w-[23px]"
    >
      <circle cx="12" cy="7.8" r="3.7" />
      <path d="M5.1 20c.7-3.8 3-5.8 6.9-5.8s6.2 2 6.9 5.8" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-[23px] w-[23px]"
    >
      <path d="M20.8 4.7a5.3 5.3 0 0 0-7.5 0L12 6l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.8a5.3 5.3 0 0 0 0-7.5Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-[23px] w-[23px]"
    >
      <path d="M6.2 8.3h11.6l.9 12.4H5.3L6.2 8.3Z" />
      <path d="M9.1 9V6.2a2.9 2.9 0 0 1 5.8 0V9" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-[22px] w-[22px]"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-[22px] w-[22px]"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function ThemeToggle({ darkMode, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={darkMode}
      className="omb-theme-toggle"
    >
      <span className="omb-theme-toggle-knob" aria-hidden="true">
        {darkMode ? "☾" : "☀"}
      </span>
    </button>
  );
}

function HeaderAction({ label, children, onClick, className = "", badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`omb-header-icon relative flex h-11 w-11 items-center justify-center text-espresso ${className}`.trim()}
    >
      <span className="relative z-10">{children}</span>
      {badge !== undefined && (
        <span className="omb-header-badge absolute -top-0.5 z-20 flex h-4 min-w-4 items-center justify-center rounded-full bg-aubergine px-1 text-[9px] font-bold leading-none text-milk">
          {badge}
        </span>
      )}
    </button>
  );
}

const promoMessagesAr = [
  "بسم الله الرحمن الرحيم",
  {
    text: "تسجيل دخولك ببريدك الإلكتروني ممكن يكسبك جوائز لا تضيع الفرصة",
    cta: "سجل دخول الآن",
  },
  "﴿ وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ ﴾",
  "﴿ وَابْتَغِ فِيمَا آتَاكَ اللَّهُ الدَّارَ الْآخِرَةَ ۖ وَلَا تَنسَ نَصِيبَكَ مِنَ الدُّنْيَا ۖ وَأَحْسِن كَمَا أَحْسَنَ اللَّهُ إِلَيْكَ ﴾",
  "﴿ وَفِي السَّمَاءِ رِزْقُكُمْ وَمَا تُوعَدُونَ ﴾",
  "﴿ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ ﴾",
  "﴿ فَابْتَغُوا عِندَ اللَّهِ الرِّزْقَ وَاعْبُدُوهُ وَاشْكُرُوا لَهُ ﴾",
  "أهلاً وسهلاً في OH MY BABY",
  "نورتوا عالمنا الصغير",
  "سعداء بوجودكم معنا",
  "كل شي بتحبوه لصغاركم بمكان واحد",
  "اكتشفوا عالم OH MY BABY",
  "كل يوم في شي جديد لصغاركم",
  "شحن مجاني للطلبات المؤهلة",
  "خصم 10% لأول طلب — BABY10",
  "تغليف هدايا متوفر على مختاراتنا",
];

const promoMessagesEn = [
  "Welcome to Oh My Baby",
  {
    text: "Sign in with your email for a chance to earn rewards. Don't miss out.",
    cta: "Sign in now",
  },
  "You light up our little world",
  "We're so glad you're here",
  "Everything your little ones will love, in one place",
  "Discover the Oh My Baby world",
  "New arrivals for your little ones, every day",
  "Free shipping on qualifying orders",
  "10% off your first order — BABY10",
  "Gift wrapping available on selected pieces",
];

function PromoMessage({ message }) {
  if (typeof message === "string") return <span>{message}</span>;
  return (
    <span>
      {message.text}
      {" — "}
      <a href="/#account" className="omb-promo-cta">
        {message.cta}
      </a>
    </span>
  );
}

export default function Header({
  locale = "ar",
  onLocaleChange = () => {},
  darkMode = false,
  onThemeChange = () => {},
}) {
  const isAr = locale === "ar";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [offerVisible, setOfferVisible] = useState(false);
  const [promo, setPromo] = useState({
    code: "BABY10",
    discount_percent: 10,
    active: true,
    first_order_only: true,
  });
  const [compactHeader, setCompactHeader] = useState(false);
  const [cartCount, setCartCount] = useState(() => getCartCount());
  const [authUser, setAuthUser] = useState(null);
  const headerRef = useRef(null);

  const dashboardHref =
    authUser?.role === "owner"
      ? "/owner"
      : authUser?.role === "admin"
        ? "/admin"
        : null;

  const promoMessages = useMemo(() => {
    const base = (isAr ? promoMessagesAr : promoMessagesEn).filter(
      (message) => typeof message !== "string" || !message.includes("BABY10"),
    );
    if (!promo?.active) return base;
    const percent = Number(promo.discount_percent || 0);
    const message = isAr
      ? `خصم ${percent}%${promo.first_order_only ? " لأول طلب" : ""} — ${promo.code}`
      : `${percent}% off${promo.first_order_only ? " your first order" : ""} — ${promo.code}`;
    return [...base, message];
  }, [isAr, promo]);

  const copy = useMemo(
    () => ({
      search: isAr ? "بحث" : "Search",
      close: isAr ? "إغلاق" : "Close",
      menu: isAr ? "القائمة" : "Menu",
      theme: "Dark",
      light: "Light",
    }),
    [isAr],
  );

  useEffect(() => {
    let active = true;
    apiFetch("/api/promo/current")
      .then((payload) => {
        if (active) setPromo(payload?.promo || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadSession = () => {
      apiFetch("/auth/session")
        .then((payload) => {
          if (!active) return;
          setAuthUser(payload?.user || null);
        })
        .catch(() => {
          if (!active) return;
          setAuthUser(null);
        });
    };

    loadSession();
    window.addEventListener("omb:auth-updated", loadSession);

    return () => {
      active = false;
      window.removeEventListener("omb:auth-updated", loadSession);
    };
  }, []);

  useEffect(() => {
    if (!promo?.active) return undefined;
    const timer = window.setTimeout(() => setOfferVisible(true), 11000);
    return () => window.clearTimeout(timer);
  }, [promo?.active]);

  useEffect(() => {
    let frameId = null;

    const updateCompactState = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        const y = window.scrollY || 0;
        // Hysteresis prevents the header from flickering around the threshold.
        setCompactHeader((current) => (current ? y >= 70 : y > 150));
      });
    };

    updateCompactState();
    window.addEventListener("scroll", updateCompactState, { passive: true });
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateCompactState);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const syncCart = () => setCartCount(getCartCount());
    window.addEventListener("omb:cart-updated", syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener("omb:cart-updated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    let frameId = null;

    const updateOffset = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        const height = Math.ceil(header.offsetHeight);

        document.documentElement.style.setProperty(
          "--omb-header-offset",
          `${height + 8}px`,
        );
      });
    };

    updateOffset();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateOffset)
        : null;

    observer?.observe(header);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      observer?.disconnect();
    };
  }, [locale, darkMode, compactHeader]);

  useEffect(() => {
    let timer = null;

    const handleResize = () => {
      document.documentElement.classList.add("omb-viewport-resizing");

      window.clearTimeout(timer);

      timer = window.setTimeout(() => {
        document.documentElement.classList.remove("omb-viewport-resizing");
      }, 180);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      document.documentElement.classList.remove("omb-viewport-resizing");
    };
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    window.location.href = `/search?q=${encodeURIComponent(value)}`;
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(promo?.code || "BABY10");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function handleHomeAnchor(event, href) {
    if (!href?.startsWith("/#") || window.location.pathname !== "/") return;
    const id = decodeURIComponent(href.slice(2));
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    setMobileMenuOpen(false);

    const headerHeight = Math.ceil(
      headerRef.current?.getBoundingClientRect().height || 0,
    );

    // Scroll to the first meaningful content inside the section, not to the
    // section box itself. Most homepage sections have generous top padding,
    // so targeting the section created a large empty band below the header.
    const anchorTarget =
      target.querySelector(".omb-section-head") ||
      target.firstElementChild ||
      target;

    const anchorTop =
      window.scrollY + anchorTarget.getBoundingClientRect().top;
    const gapBelowHeader = window.innerWidth >= 1024 ? 12 : 8;
    const top = anchorTop - headerHeight - gapBelowHeader;

    window.history.replaceState(null, "", `/#${encodeURIComponent(id)}`);
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  const menuLink = (href, text) => (
    <a
      href={href}
      onClick={(event) => {
        setMobileMenuOpen(false);
        handleHomeAnchor(event, href);
      }}
      className="flex items-center border-b border-espresso/10 py-4 text-base font-bold"
    >
      {text}
    </a>
  );

  const MegaMenu = ({ title, items, featuredHref, comingSoon = false }) => (
    <div className="omb-mega-menu invisible absolute top-full z-[999] min-w-[500px] translate-y-2 border border-espresso/12 bg-milk p-7 opacity-0 shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 ltr:left-0 rtl:right-0">
      <div className="grid grid-cols-[1fr_220px] gap-8">
        <div>
          <p className="omb-eyebrow-label mb-4 block text-aubergine/70 text-xs font-black uppercase tracking-wider">
            {title}
          </p>
          <div className="flex flex-col gap-3">
            {items.map((item) =>
              comingSoon ? (
                <div
                  key={item.slug}
                  className="omb-coming-soon-menu-item flex cursor-not-allowed items-center justify-between gap-4 py-1 text-[15px] font-bold text-espresso/55"
                  aria-disabled="true"
                >
                  <span>{isAr ? item.ar : item.en}</span>
                  <span className="rounded-full border border-aubergine/20 bg-aubergine/5 px-2 py-1 text-[9px] font-black text-aubergine">
                    {isAr ? "قريباً" : "SOON"}
                  </span>
                </div>
              ) : (
                <a
                  key={item.slug}
                  href={`/category/${item.slug}`}
                  className="whitespace-nowrap text-[15px] font-bold text-espresso transition-colors hover:text-aubergine"
                >
                  {isAr ? item.ar : item.en}
                </a>
              ),
            )}
          </div>
          {comingSoon ? (
            <span className="mt-6 inline-block text-sm font-bold text-aubergine/65">
              {isAr
                ? `أقسام ${title} قيد التجهيز`
                : `${title} sections are coming soon`}
            </span>
          ) : (
            <a
              href={featuredHref}
              className="omb-link mt-6 inline-block font-bold text-sm text-aubergine underline"
            >
              {isAr ? `عرض كل ${title}` : `View all ${title}`}
            </a>
          )}
        </div>
        <div className="bg-oat/40 p-5 border-s border-espresso/10 flex flex-col justify-between">
          <div>
            <span className="block h-1 w-8 bg-pistachio" />
            <p className="omb-eyebrow-label mt-3 block text-[10px] font-black text-aubergine/60 uppercase">
              OH MY BABY
            </p>
            <h3 className="mt-2 text-base font-black leading-snug">
              {isAr ? "عالمهم الصغير" : "Their little world"}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-espresso/60">
              {comingSoon
                ? isAr
                  ? "عم نجهز هالأقسام، وصوتك بالاستفتاء بيساعدنا نقرر شو نطلق أولاً."
                  : "We're preparing these sections. Your poll vote helps us decide what launches first."
                : isAr
                  ? "اختاري الفئة المناسبة لطفلك."
                  : "Choose the right category."}
            </p>
          </div>
          {comingSoon ? (
            <span className="omb-btn mt-4 flex h-9 cursor-not-allowed items-center justify-center border border-aubergine/15 bg-aubergine/5 px-3 text-xs font-black text-aubergine/65">
              {isAr ? "قريباً" : "Coming soon"}
            </span>
          ) : (
            <a
              href={featuredHref}
              className="omb-btn omb-btn-primary mt-4 flex h-9 items-center justify-center text-xs px-3"
            >
              {isAr ? "اكتشف" : "Discover"}
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header
        ref={headerRef}
        className={`omb-site-header ${compactHeader ? "is-compact" : ""} sticky top-0 z-50 bg-milk text-espresso shadow-[0_1px_0_rgba(40,35,33,0.06)]`.trim()}
      >
        <div className="omb-promo-bar" dir={isAr ? "rtl" : "ltr"}>
          <div className={`omb-promo-track ${isAr ? "is-ar" : "is-en"}`}>
            <div className="omb-promo-group">
              {promoMessages.map((message, index) => (
                <PromoMessage key={`first-${index}`} message={message} />
              ))}
            </div>
            <div className="omb-promo-group" aria-hidden="true">
              {promoMessages.map((message, index) => (
                <PromoMessage key={`second-${index}`} message={message} />
              ))}
            </div>
          </div>
        </div>

        <div className="omb-header-brand border-b border-espresso/8 bg-milk/98">
          <div
            dir={isAr ? "rtl" : "ltr"}
            className="omb-header-brand-row grid h-[78px] w-full grid-cols-[1fr_auto_1fr] items-center px-6 sm:h-[88px] sm:px-10 lg:px-14 xl:px-16 2xl:px-20"
          >
            <div className="flex min-w-0 items-center justify-self-start gap-1.5 sm:gap-2">
              <HeaderAction
                label={isAr ? "فتح القائمة" : "Open menu"}
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden"
              >
                <MenuIcon />
              </HeaderAction>
              <HeaderAction
                label={copy.search}
                onClick={() => setSearchOpen(true)}
              >
                <SearchIcon />
              </HeaderAction>
              <HeaderAction
                label={isAr ? "الحساب" : "Account"}
                className="hidden sm:flex"
                onClick={() => {
                  window.location.href = "/account";
                }}
              >
                <UserIcon />
              </HeaderAction>
              <HeaderAction
                label={isAr ? "المفضلة" : "Wishlist"}
                className="hidden sm:flex"
                onClick={() => {
                  window.location.href = "/wishlist";
                }}
              >
                <HeartIcon />
              </HeaderAction>
              <HeaderAction
                label={isAr ? "السلة" : "Bag"}
                badge={cartCount}
                onClick={() => {
                  window.location.href = "/cart";
                }}
              >
                <BagIcon />
              </HeaderAction>
              <button
                type="button"
                onClick={() => onLocaleChange(isAr ? "en" : "ar")}
                className="ms-2 flex h-11 items-center justify-center px-3 text-[13px] font-bold tracking-[0.12em]"
              >
                {isAr ? "EN" : "AR"}
              </button>
              <div className="flex items-center gap-2">
                <ThemeToggle
                  darkMode={darkMode}
                  onToggle={() => onThemeChange(!darkMode)}
                  label={darkMode ? copy.light : copy.theme}
                />
                <span className="hidden text-[11px] font-bold uppercase tracking-[0.12em] sm:inline">
                  {darkMode ? "Dark" : "Light"}
                </span>
              </div>
            </div>
            <a
              href="/"
              className="omb-wordmark justify-self-center"
              aria-label="Oh My Baby home"
            >
              <span className="omb-brand-wordmark-text font-serif text-[26px] font-semibold tracking-[0.15em] sm:text-[28px]">
                OH MY BABY
              </span>
            </a>
            <a
              href="/"
              className="group justify-self-end"
              aria-label="Oh My Baby"
            >
              <img
                src="/images/brand/bear-mark.png"
                alt="Oh My Baby"
                className="omb-brand-mark h-[56px] w-auto object-contain sm:h-[64px]"
              />
            </a>
          </div>
        </div>

        <nav
          dir={isAr ? "rtl" : "ltr"}
          className="omb-header-nav relative hidden border-b border-espresso/8 bg-milk lg:block"
        >
          <div className="mx-auto flex h-[54px] items-center justify-center px-8">
            <div className="flex h-full items-center gap-6 xl:gap-8">
              <a
                href="/#home-hero"
                onClick={(event) => handleHomeAnchor(event, "/#home-hero")}
                className="omb-nav-link flex h-full items-center text-[15px] font-bold"
              >
                {isAr ? "من نحن" : "About us"}
              </a>
              <a
                href="/#new-arrivals"
                onClick={(event) => handleHomeAnchor(event, "/#new-arrivals")}
                className="omb-nav-link flex h-full items-center text-[15px] font-bold"
              >
                {isAr ? "وصل حديثاً" : "New arrivals"}
              </a>

              <div className="group relative flex h-full items-center">
                <a
                  href="/category/clothing"
                  className="omb-nav-link flex h-full items-center gap-1.5 text-[15px] font-bold"
                >
                  {isAr ? "ملابس" : "Clothing"}
                  <span aria-hidden="true">⌄</span>
                </a>
                <MegaMenu
                  title={isAr ? "ملابس" : "Clothing"}
                  items={clothingMenu}
                  featuredHref="/category/clothing"
                />
              </div>

              <a
                href="/#product-hero"
                onClick={(event) => handleHomeAnchor(event, "/#product-hero")}
                className="omb-nav-link flex h-full items-center text-[15px] font-bold text-aubergine"
              >
                {isAr ? "العروض" : "Offers"}
              </a>

              <div className="group relative flex h-full items-center">
                <a
                  href="/#baby-world"
                  onClick={(event) => handleHomeAnchor(event, "/#baby-world")}
                  className="omb-nav-link flex h-full items-center gap-1.5 text-[15px] font-bold"
                >
                  {isAr ? "عالم الطفل" : "Baby World"}
                  <span aria-hidden="true">⌄</span>
                </a>
                <MegaMenu
                  title={isAr ? "عالم الطفل" : "Baby World"}
                  items={babyWorldMenu}
                  featuredHref="/#baby-world"
                  comingSoon
                />
              </div>

              <a
                href="/#featured-collection"
                onClick={(event) =>
                  handleHomeAnchor(event, "/#featured-collection")
                }
                className="omb-nav-link flex h-full items-center text-[15px] font-bold"
              >
                {isAr ? "العودة للمدرسة" : "Back to school"}
              </a>
              <a
                href="/#newborn-essentials"
                onClick={(event) =>
                  handleHomeAnchor(event, "/#newborn-essentials")
                }
                className="omb-nav-link flex h-full items-center text-[15px] font-bold"
              >
                {isAr ? "حديثي الولادة" : "Newborn"}
              </a>
              <a
                href="/#best-sellers"
                onClick={(event) => handleHomeAnchor(event, "/#best-sellers")}
                className="omb-nav-link flex h-full items-center text-[15px] font-bold"
              >
                {isAr ? "الأكثر طلباً" : "Best sellers"}
              </a>

              {dashboardHref && (
                <a
                  href={dashboardHref}
                  className="omb-nav-link flex h-full items-center text-[15px] font-black text-aubergine"
                >
                  {isAr ? "لوحة التحكم" : "Dashboard"}
                </a>
              )}

              <a
                href="/#account"
                onClick={(event) => handleHomeAnchor(event, "/#account")}
                className="omb-nav-link flex h-full items-center text-[15px] font-bold"
              >
                {isAr ? "تسجيل الدخول" : "Sign in"}
              </a>
            </div>
          </div>
        </nav>
      </header>

      <CartAddedNotice locale={locale} />

      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 p-4 sm:p-8"
          dir={isAr ? "rtl" : "ltr"}
        >
          <form
            onSubmit={submitSearch}
            className="mx-auto mt-24 max-w-4xl bg-milk p-6 shadow-2xl sm:p-9"
          >
            <div className="flex items-center gap-4">
              <SearchIcon />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isAr ? "ابحثي بكل المتجر..." : "Search the whole store..."
                }
                className="h-14 flex-1 bg-transparent text-lg outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="h-11 w-11"
              >
                ×
              </button>
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-aubergine/60">
              {isAr ? "مثال" : "Example"}: حذاء / فستان / Newborn
            </p>
            <button type="submit" className="omb-btn omb-btn-primary mt-6">
              {isAr ? "بحث" : "Search"}
            </button>
          </form>
          <button
            type="button"
            className="absolute inset-0 -z-10"
            onClick={() => setSearchOpen(false)}
            aria-label={copy.close}
          />
        </div>
      )}

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[110] lg:hidden"
          dir={isAr ? "rtl" : "ltr"}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileMenuOpen(false)}
            aria-label={copy.close}
          />
          <aside
            className={`${isAr ? "right-0" : "left-0"} absolute top-0 h-full w-[90%] max-w-sm overflow-y-auto bg-milk p-5 shadow-2xl`}
          >
            <div className="flex items-center justify-between border-b border-espresso/10 pb-5">
              <span className="font-serif text-lg font-semibold tracking-[0.14em] text-aubergine">
                OH MY BABY
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="h-10 w-10"
                aria-label={copy.close}
              >
                <CloseIcon />
              </button>
            </div>
            <div className="mt-3">
              {menuLink("/#home-hero", isAr ? "من نحن" : "About us")}
              {menuLink(
                "/#new-arrivals",
                isAr ? "وصل حديثاً" : "New arrivals",
              )}
              <details className="border-b border-espresso/10">
                <summary className="cursor-pointer py-4 text-base font-bold">
                  {isAr ? "ملابس" : "Clothing"}
                </summary>
                <div className="grid gap-3 pb-5 ps-4">
                  <a
                    href="/category/clothing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-black text-aubergine"
                  >
                    {isAr ? "عرض كل الملابس" : "View all clothing"}
                  </a>
                  {clothingMenu.map((item) => (
                    <a
                      key={item.slug}
                      href={`/category/${item.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-medium text-espresso/65"
                    >
                      {isAr ? item.ar : item.en}
                    </a>
                  ))}
                </div>
              </details>
              {menuLink("/#product-hero", isAr ? "العروض" : "Offers")}
              <details className="border-b border-espresso/10">
                <summary className="cursor-pointer py-4 text-base font-bold">
                  {isAr ? "عالم الطفل" : "Baby World"}
                </summary>
                <div className="grid gap-3 pb-5 ps-4">
                  <a
                    href="/#baby-world"
                    onClick={(event) => {
                      setMobileMenuOpen(false);
                      handleHomeAnchor(event, "/#baby-world");
                    }}
                    className="text-sm font-black text-aubergine"
                  >
                    {isAr ? "عرض عالم الطفل" : "View Baby World"}
                  </a>
                  {babyWorldMenu.map((item) => (
                    <div
                      key={item.slug}
                      className="flex cursor-not-allowed items-center justify-between gap-3 text-sm font-medium text-espresso/50"
                      aria-disabled="true"
                    >
                      <span>{isAr ? item.ar : item.en}</span>
                      <span className="rounded-full border border-aubergine/20 px-2 py-0.5 text-[9px] font-black text-aubergine">
                        {isAr ? "قريباً" : "SOON"}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
              {menuLink(
                "/#featured-collection",
                isAr ? "العودة للمدرسة" : "Back to school",
              )}
              {menuLink(
                "/#newborn-essentials",
                isAr ? "حديثي الولادة" : "Newborn",
              )}
              {menuLink(
                "/#best-sellers",
                isAr ? "الأكثر طلباً" : "Best sellers",
              )}

              {dashboardHref &&
                menuLink(
                  dashboardHref,
                  isAr ? "لوحة التحكم" : "Dashboard",
                )}

              {menuLink("/#account", isAr ? "تسجيل الدخول" : "Sign in")}

              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.12em]">
                  {darkMode ? "Dark" : "Light"}
                </span>
                <ThemeToggle
                  darkMode={darkMode}
                  onToggle={() => onThemeChange(!darkMode)}
                  label={darkMode ? "Light" : "Dark"}
                />
              </div>
            </div>
          </aside>
        </div>
      )}

      {offerVisible && promo?.active && (
        <aside
          dir={isAr ? "rtl" : "ltr"}
          className="omb-offer-nudge fixed bottom-5 left-4 sm:left-6 z-[80] w-[min(340px,calc(100vw-32px))] bg-milk p-5 shadow-[0_22px_60px_rgba(40,35,33,0.22)]"
        >
          <button
            type="button"
            onClick={() => setOfferVisible(false)}
            className="omb-offer-close absolute top-3 h-8 w-8"
            aria-label={copy.close}
          >
            ×
          </button>
          <p className="omb-eyebrow-label block text-aubergine/55">
            {Number(promo.discount_percent || 0)}% OFF
          </p>
          <h3 className="mt-2 text-xl font-bold text-espresso">
            {isAr ? "هدية صغيرة إلك" : "A little gift for you"}
          </h3>
          <p className="mt-2 max-w-[260px] text-sm leading-6 text-espresso/58">
            {isAr
              ? `استخدم الكود وخد ${Number(promo.discount_percent || 0)}%${promo.first_order_only ? " على طلبك الأول" : ""}.`
              : `Use the code for ${Number(promo.discount_percent || 0)}% off${promo.first_order_only ? " your first order" : ""}.`}
          </p>
          <button
            type="button"
            onClick={copyCode}
            className="mt-4 text-sm font-bold text-aubergine underline"
          >
            <span className="font-serif tracking-[0.16em]">{promo.code}</span>{" "}
            —{" "}
            {copied
              ? isAr
                ? "تم النسخ"
                : "Copied"
              : isAr
                ? "انسخ الكود"
                : "Copy code"}
          </button>
        </aside>
      )}
    </>
  );
}