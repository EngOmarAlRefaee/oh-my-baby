import React, { useEffect, useState } from "react";

const offers = [
  { src: "/images/home/hero-selected/hero-01.webp", titleAr: "عرض على اختيارات الأولاد", titleEn: "Offers on boys' picks", bodyAr: "قطع يومية مختارة بسعر خاص لفترة محدودة.", bodyEn: "Selected everyday pieces at a special price for a limited time.", ctaAr: "اطلب الآن", ctaEn: "Shop offer", href: "/category/boys?placement=offers" },
  { src: "/images/home/hero-selected/hero-04.webp", titleAr: "عرض على البنات", titleEn: "Girls' edit on offer", bodyAr: "فستان وقطع لطيفة ضمن مجموعة العروض.", bodyEn: "Sweet pieces and dresses from our current offers.", ctaAr: "اطلب الآن", ctaEn: "Shop offer", href: "/category/girls?placement=offers" },
  { src: "/images/home/hero-selected/hero-02.webp", titleAr: "عرض حديثي الولادة", titleEn: "Newborn offer", bodyAr: "اختيارات ناعمة لأول أيامهم.", bodyEn: "Soft essentials for their first days.", ctaAr: "اطلب الآن", ctaEn: "Shop offer", href: "/category/newborn?placement=offers" },
  { src: "/images/home/hero-selected/hero-03.webp", titleAr: "عرض على الأحذية", titleEn: "Shoe offer", bodyAr: "اختيارات عملية للخطوات الصغيرة.", bodyEn: "Practical picks for little steps.", ctaAr: "اطلب الآن", ctaEn: "Shop offer", href: "/category/shoes?placement=offers" },
];

export default function Hero({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [current, setCurrent] = useState(0);
  const active = offers[current];
  useEffect(() => { const timer = window.setTimeout(() => setCurrent((value) => (value + 1) % offers.length), 7000); return () => window.clearTimeout(timer); }, [current]);
  return (
    <section id="product-hero" dir={isAr ? "rtl" : "ltr"} aria-label={isAr ? "العروض" : "Offers"} className="relative isolate w-full overflow-hidden bg-espresso">
      <div className="relative w-full" style={{ height: "clamp(700px, 78vh, 860px)" }}>
        <img src={active.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className={`absolute bottom-16 z-20 max-w-[620px] ${isAr ? "right-7 sm:right-12 xl:right-20" : "left-7 sm:left-12 xl:left-20"} ${isAr ? "text-right" : "text-left"}`}>
          <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-white/65">{isAr ? "قسم العروض" : "OFFERS"}</p>
          <h2 className="mt-4 max-w-[15ch] text-[48px] font-black leading-[1.02] tracking-tight text-white sm:text-[64px]">{isAr ? active.titleAr : active.titleEn}</h2>
          <p className="mt-5 max-w-xl text-[18px] leading-8 text-white/80">{isAr ? active.bodyAr : active.bodyEn}</p>
          <a href={active.href} className="mt-7 inline-flex items-center gap-3 border-b border-white/60 pb-2 text-base font-bold text-white">{isAr ? active.ctaAr : active.ctaEn}<span aria-hidden="true">{isAr ? "←" : "→"}</span></a>
        </div>
        <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">{offers.map((offer, index) => <button key={offer.href} type="button" onClick={() => setCurrent(index)} aria-label={`${isAr ? "العرض" : "Offer"} ${index + 1}`} className={`h-1.5 rounded-full bg-white ${index === current ? "w-9 opacity-100" : "w-1.5 opacity-45"}`} />)}</div>
      </div>
    </section>
  );
}
