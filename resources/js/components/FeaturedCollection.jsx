import React from "react";

import Button from "./ui/Button";
import Eyebrow from "./ui/Eyebrow";
import Reveal from "./ui/Reveal";

const activeCampaign = {
  key: "back-to-school",

  titleAr: "جاهزين لأول يوم.",
  titleEn: "Ready for the first day.",

  descriptionAr:
    "اختيارات مدرسية مريحة وعملية، من الملابس والأحذية للتفاصيل اليومية اللي بترافقهم بكل يوم دراسي.",

  descriptionEn:
    "Comfortable and practical school-day picks, from clothing and shoes to everyday essentials.",

  collectionHref: "/collections/back-to-school",
  categoriesHref: "/category/clothing",

  image: "/images/home/final/featured-kids.jpg",

  imageAltAr: "تشكيلة العودة إلى المدرسة من OH MY BABY",
  imageAltEn: "OH MY BABY Back to School collection",
};

export default function FeaturedCollection({ locale = "ar" }) {
  const isAr = locale === "ar";
  const campaign = activeCampaign;

  return (
    <section
      id="featured-collection"
      className="relative overflow-hidden bg-milk py-20 sm:py-28"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-[1560px] px-5 sm:px-8 lg:px-10">
        {/* SECTION HEADER */}
        <Reveal>
          <div
            className={`mb-12 sm:mb-16 ${isAr ? "text-right" : "text-left"}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-[13px] font-bold tracking-[0.18em] text-aubergine">
                {isAr ? "تشكيلة الموسم" : "SEASONAL COLLECTION"}
              </span>

              <span className="h-px w-20 bg-espresso/25" />
            </div>

            <h2 className="mt-5 text-[46px] font-black leading-[1.05] tracking-tight text-espresso sm:text-[62px] lg:text-[76px]">
              {isAr ? "العودة إلى المدرسة" : "BACK TO SCHOOL"}
            </h2>

            <p className="mt-5 max-w-xl text-[18px] font-semibold leading-8 text-espresso/80">
              {isAr
                ? "تشكيلة مختارة للموسم الحالي، مصممة لأيام المدرسة براحة وأناقة."
                : "A seasonal edit designed for comfortable, stylish school days."}
            </p>
          </div>
        </Reveal>

        {/* CAMPAIGN */}
        <div className="relative overflow-hidden bg-oat">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-5 top-2 z-0 text-[110px] font-black leading-none text-espresso/[0.035] sm:text-[150px] lg:text-[190px]"
          >
            BTS
          </div>

          <div className="relative z-10 grid lg:grid-cols-[1.18fr_0.82fr]">
            {/* IMAGE */}
            <a
              data-motion="media"
              href={campaign.collectionHref}
              className="group relative min-h-[560px] overflow-hidden bg-espresso lg:min-h-[760px]"
            >
              <img
                src={campaign.image}
                loading="lazy"
                decoding="async"
                alt={isAr ? campaign.imageAltAr : campaign.imageAltEn}
                className="absolute inset-0 h-full w-full object-cover object-[right_28%] transition-transform duration-1000 ease-out group-hover:scale-[1.025]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

              <div className="absolute left-6 top-6 border border-white/40 bg-black/10 px-4 py-2 backdrop-blur-sm">
                <span className="text-[10px] font-bold tracking-[0.25em] text-white">
                  SEASON 01
                </span>
              </div>

              <div className="absolute bottom-7 left-7 text-left text-white sm:bottom-9 sm:left-9">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">
                  SEASONAL EDIT
                </p>

                <p className="mt-2 text-2xl font-black tracking-wide sm:text-3xl">
                  BACK TO SCHOOL
                </p>
              </div>
            </a>

            {/* CONTENT */}
            <div
              data-motion="copy"
              className="relative flex items-center px-7 py-14 sm:px-12 lg:px-14 lg:py-20"
            >
              <Reveal className="relative z-10 max-w-lg">
                <Eyebrow tone="pistachio">
                  {isAr ? "موسم العودة للمدرسة" : "Back to School Edit"}
                </Eyebrow>

                <h3 className="mt-5 text-[42px] font-black leading-[1.15] tracking-tight text-espresso sm:text-[54px]">
                  {isAr ? campaign.titleAr : campaign.titleEn}
                </h3>

                <p className="mt-6 max-w-lg text-[19px] font-semibold leading-9 text-espresso/90">
                  {isAr ? campaign.descriptionAr : campaign.descriptionEn}
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {[
                    isAr ? "ملابس" : "Clothing",
                    isAr ? "أحذية" : "Shoes",
                    isAr ? "يوميات المدرسة" : "School Essentials",
                  ].map((item) => (
                    <span
                      key={item}
                      className="border border-espresso/15 bg-milk/60 px-4 py-2 text-[12px] font-bold text-espresso/70"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-5">
                  <Button href={campaign.collectionHref} variant="primary">
                    {isAr ? "اكتشف تشكيلة المدرسة" : "Explore the collection"}
                  </Button>

                  <a
                    href={campaign.categoriesHref}
                    className="omb-link border-espresso/30 text-espresso"
                  >
                    {isAr ? "تسوّق كل الأقسام" : "Shop all categories"}
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
