import React from "react";

import Reveal from "./ui/Reveal";

export default function GiftIdeas({ locale = "ar" }) {
  const isAr = locale === "ar";
  const arrow = isAr ? "←" : "→";

  return (
    <section
      id="baby-world"
      className="relative overflow-hidden bg-milk py-20 sm:py-28"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-[1560px] px-5 sm:px-8 lg:px-10">
        {/* ================= HEADER ================= */}

        <Reveal>
          <div className="mb-12 sm:mb-16">
            <div className="flex items-center gap-4">
              <span className="text-[13px] font-bold uppercase tracking-[0.25em] text-aubergine">
                OH MY BABY WORLD
              </span>

              <span className="h-px w-20 bg-espresso/20" />
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
              <h2 className="max-w-4xl text-[44px] font-black leading-[1.08] tracking-tight text-espresso sm:text-[60px] lg:text-[72px]">
                {isAr
                  ? "كل شي لصغاركم، أبعد من الملابس."
                  : "Everything for little ones, beyond clothing."}
              </h2>

              <p className="max-w-xl text-[22px] font-semibold leading-9 text-espresso/80">
                {isAr
                  ? "من استقبال المولود، للعربايات والهدايا والألعاب — عالم كامل لتفاصيلهم الصغيرة."
                  : "From newborn welcomes to strollers, gifts and toys."}
              </p>
            </div>
          </div>
        </Reveal>

        {/* ================= MAIN GRID ================= */}

        <div className="grid items-stretch gap-4 lg:grid-cols-12">
          {/* =========================================
                        01 — NEWBORN WELCOME
                    ========================================= */}

          <Reveal className="h-full lg:col-span-7">
            <a
              href="/category/decor"
              className="group relative block h-full min-h-[720px] overflow-hidden bg-espresso lg:min-h-[870px]"
            >
              <img
                src="/images/home/services/newborn-welcome-optimized.webp"
                loading="lazy"
                decoding="async"
                alt={
                  isAr ? "تزيين استقبال المولود" : "Newborn welcome decoration"
                }
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1400ms] ease-out group-hover:scale-[1.035]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              {/* BOOKING BADGE */}
              <div
                className={`absolute top-8 z-20 ${isAr ? "left-8" : "right-8"}`}
              >
                <span className="bg-butter px-5 py-2.5 text-[15px] font-black text-espresso">
                  {isAr ? "قريباً" : "COMING SOON"}
                </span>
              </div>

              {/* MAIN TITLE */}
              <div className="absolute bottom-10 left-0 right-0 z-10 px-8 text-white sm:px-10 lg:px-12">
                <h3 className="max-w-4xl text-[46px] font-black leading-[1.08] sm:text-[60px] lg:text-[68px]">
                  {isAr
                    ? "نزيّن استقبال مولودكم"
                    : "A beautiful welcome for your little one"}
                </h3>

                <p className="mt-7 max-w-xl text-[15px] font-semibold leading-7 text-white/80">
                  {isAr ? "قسم تجريبي مبدئي سيتم توسيع تفاصيله عند اعتماد الخدمة." : "A provisional section ready to expand when the service is finalized."}
                </p>
              </div>
            </a>
          </Reveal>

          {/* =========================================
                        LEFT COLUMN
                    ========================================= */}

          <div className="grid h-full gap-4 lg:col-span-5 lg:grid-rows-[1.25fr_0.75fr]">
            {/* =====================================
                            02 — MOBILITY
                        ===================================== */}

            <Reveal delay={70} className="h-full">
              <a
                href="/category/mobility"
                className="group relative block h-full min-h-[480px] overflow-hidden bg-espresso"
              >
                <img
                  src="/images/home/categories/mobility-optimized.webp"
                  loading="lazy"
                  decoding="async"
                  alt={
                    isAr ? "عربايات ومقاعد أطفال" : "Strollers and car seats"
                  }
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.045]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />

                {/* TITLE INSIDE IMAGE */}
                <div className="absolute bottom-0 left-0 right-0 p-7 text-white sm:p-9">
                  <h3 className="text-[36px] font-black leading-tight sm:text-[44px]">
                    {isAr ? "عربايات ومقاعد أطفال" : "Strollers & Car Seats"}
                  </h3>

                  <div className="mt-5 flex items-center justify-between border-t border-white/25 pt-5">
                    <span className="text-[15px] font-black">
                      {isAr ? "تسوّق القسم" : "Shop"}
                    </span>

                    <span className="text-3xl transition-transform duration-300 group-hover:-translate-x-2">
                      {arrow}
                    </span>
                  </div>
                </div>
              </a>
            </Reveal>

            {/* =====================================
                            BOTTOM TWO
                        ===================================== */}

            <div className="grid h-full gap-4 sm:grid-cols-2">
              {/* =================================
                                03 — GIFTS
                            ================================= */}

              <Reveal delay={120} className="h-full">
                <a
                  href="/category/gifts"
                  className="group relative block h-full min-h-[330px] overflow-hidden bg-espresso"
                >
                  <img
                    src="/images/home/categories/newborn-gifts-optimized.webp"
                    loading="lazy"
                    decoding="async"
                    alt={isAr ? "هدايا" : "Gifts"}
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1100ms] ease-out group-hover:scale-[1.05]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-[30px] font-black leading-tight">
                      {isAr ? "هدايا" : "Gifts"}
                    </h3>

                    <div className="mt-5 flex items-center justify-end">
                      <span className="text-2xl transition-transform duration-300 group-hover:-translate-x-2">
                        {arrow}
                      </span>
                    </div>
                  </div>
                </a>
              </Reveal>

              {/* =================================
                                04 — TOYS
                            ================================= */}

              <Reveal delay={170} className="h-full">
                <a
                  href="/category/baby-essentials"
                  className="group relative block h-full min-h-[330px] overflow-hidden bg-espresso"
                >
                  <img
                    src="/images/home/categories/toys-essentials-optimized.webp"
                    loading="lazy"
                    decoding="async"
                    alt={
                      isAr
                        ? "ألعاب ومستلزمات الطفل"
                        : "Toys and baby essentials"
                    }
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1100ms] ease-out group-hover:scale-[1.05]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-[29px] font-black leading-tight">
                      {isAr ? "ألعاب ومستلزمات الطفل" : "Toys & Essentials"}
                    </h3>

                    <div className="mt-5 flex items-center justify-end">
                      <span className="text-2xl transition-transform duration-300 group-hover:-translate-x-2">
                        {arrow}
                      </span>
                    </div>
                  </div>
                </a>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
