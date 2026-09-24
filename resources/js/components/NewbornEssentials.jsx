import React from "react";

import Button from "./ui/Button";
import Reveal from "./ui/Reveal";

const newbornCollection = {
  href: "/category/newborn",
  image: "/images/home/final/newborn-section-optimized.webp",
  titleAr: "بداية ناعمة، من أول يوم.",
  titleEn: "A soft start, from day one.",
  descriptionAr:
    "كل التفاصيل الأولى بمكان واحد — ملابس ناعمة، أطقم مريحة، بطانيات وإكسسوارات مختارة بعناية لأيام البيبي الأولى.",
  descriptionEn:
    "Everything for their very first days — soft clothing, comfortable sets, blankets and carefully selected newborn essentials.",
};

const comingSoonSections = [
  { id: "decor", ar: "تزيين", en: "Decor", hintAr: "ثيمات استقبال ولمسات مرتبة", hintEn: "Welcome themes and details" },
  { id: "mobility", ar: "عربايات ومقاعد", en: "Strollers & seats", hintAr: "تنقّل آمن ومريح", hintEn: "Safe and comfy mobility" },
  { id: "gifts", ar: "هدايا", en: "Gifts", hintAr: "هدايا ناعمة ومجهزة", hintEn: "Soft curated gifts" },
  { id: "baby-essentials", ar: "ألعاب ومستلزمات الطفل", en: "Toys & essentials", hintAr: "اختيارات يومية مفيدة", hintEn: "Useful daily picks" },
];

export default function NewbornEssentials({ locale = "ar" }) {
  const isAr = locale === "ar";
  const collection = newbornCollection;

  return (
    <section id="newborn-essentials" className="relative overflow-hidden bg-milk py-20 sm:py-28" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[1560px] px-5 sm:px-8 lg:px-10">
        <Reveal>
          <div className={`mb-12 sm:mb-16 ${isAr ? "text-right" : "text-left"}`}>
            <div className="flex items-center gap-4">
              <span className="text-[13px] font-bold tracking-[0.18em] text-aubergine">
                {isAr ? "تشكيلة حديثي الولادة" : "NEWBORN COLLECTION"}
              </span>
              <span className="h-px w-20 bg-espresso/25" />
            </div>

            <h2 className="mt-5 max-w-4xl text-[40px] font-black leading-[1.12] tracking-tight text-espresso sm:text-[52px] lg:text-[62px]">
              {isAr ? "من أول لحظة… كل شي أقرب." : "From the very first moment."}
            </h2>

            <p className="mt-5 max-w-2xl text-[17px] font-semibold leading-8 text-espresso/75">
              {isAr ? "اختيارات ناعمة ومدروسة لأيام البيبي الأولى." : "Soft, thoughtful essentials for their very first days."}
            </p>
          </div>
        </Reveal>

        <div className="relative overflow-hidden bg-pistachio/20">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-7 -left-3 z-0 select-none text-[90px] font-black leading-none tracking-[-0.06em] text-espresso/[0.035] sm:text-[140px] lg:text-[190px]">
            NEWBORN
          </div>

          <div className="relative z-10 grid lg:grid-cols-[1.18fr_0.82fr]">
            <a href={collection.href} className="group relative min-h-[580px] overflow-hidden bg-espresso lg:min-h-[720px]">
              <img src={collection.image} loading="lazy" decoding="async" alt={isAr ? "تشكيلة حديثي الولادة من OH MY BABY" : "OH MY BABY newborn collection"} className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.035]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/10" />

              <div className="absolute left-6 top-6 border border-white/35 bg-black/10 px-4 py-2 backdrop-blur-md sm:left-8 sm:top-8">
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white">LITTLE BEGINNINGS / 01</span>
              </div>

              <div className="absolute bottom-8 left-8 text-left text-white sm:bottom-10 sm:left-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/70">NEWBORN ESSENTIALS</p>
                <p className="mt-3 text-[28px] font-black leading-none sm:text-[34px]">FROM DAY ONE</p>
              </div>

              <span className="absolute bottom-9 right-8 text-[11px] font-bold tracking-[0.28em] text-white/60">OMB / 01</span>
            </a>

            <div className="relative flex items-center px-7 py-16 sm:px-12 lg:px-14 lg:py-20 xl:px-16">
              <Reveal className="relative z-10 max-w-xl">
                <div className="mb-6 flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-aubergine" />
                  <span className="text-[12px] font-bold tracking-[0.14em] text-aubergine">
                    {isAr ? "أساسيات الأيام الأولى" : "FIRST-DAYS ESSENTIALS"}
                  </span>
                  <span className="h-px w-10 bg-espresso/20" />
                </div>

                <h3 className="text-[38px] font-black leading-[1.15] tracking-tight text-espresso sm:text-[48px] lg:text-[52px]">
                  {isAr ? collection.titleAr : collection.titleEn}
                </h3>

                <p className="mt-7 max-w-lg text-[18px] font-semibold leading-9 text-espresso/85">
                  {isAr ? collection.descriptionAr : collection.descriptionEn}
                </p>

                <div className="mt-9 flex flex-wrap gap-2.5">
                  {[isAr ? "ملابس ناعمة" : "Soft Clothing", isAr ? "أطقم" : "Sets", isAr ? "بطانيات" : "Blankets", isAr ? "إكسسوارات" : "Accessories"].map((item) => (
                    <span key={item} className="border border-espresso/15 bg-milk/70 px-4 py-2.5 text-[12px] font-bold text-espresso/75">{item}</span>
                  ))}
                </div>

                <div className="mt-11 flex flex-wrap items-center gap-6">
                  <Button href={collection.href} variant="primary">{isAr ? "تسوّق حديثي الولادة" : "Shop Newborn"}</Button>
                  <a href="/category/newborn" className="omb-link border-espresso/30 text-espresso">{isAr ? "اكتشف المجموعة" : "Explore the collection"}</a>
                </div>

                <div className="mt-12 border-t border-espresso/10 pt-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-espresso/45">OH MY BABY — LITTLE BEGINNINGS</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        <Reveal>
          <div className="omb-soon-grid mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {comingSoonSections.map((item) => (
              <div key={item.id} className="omb-soon-card" aria-disabled="true">
                <div className="omb-soon-card-top">
                  <span>{isAr ? "قريباً / SOON" : "SOON / قريباً"}</span>
                  <i aria-hidden="true">↗</i>
                </div>
                <h3>{isAr ? item.ar : item.en}</h3>
                <p>{isAr ? item.hintAr : item.hintEn}</p>
                <strong>{isAr ? "عم نجهزه ليطلع بأحلى شكل" : "Preparing this section beautifully"}</strong>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
