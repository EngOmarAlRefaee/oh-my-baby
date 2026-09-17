import React from "react";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";

const categories = [
  {
    id: "newborn",
    nameAr: "حديثي الولادة",
    nameEn: "Newborn",
    subtitleAr: "لأول حضن وأهدى نومة",
    subtitleEn: "For first cuddles and the softest naps",
    tag: "NEWBORN",
    image: "/images/categories/optimized/newborn.webp",
    position: "center 48%",
    size: "md:col-span-2 md:row-span-2",
  },
  {
    id: "girls",
    nameAr: "بنات",
    nameEn: "Girls",
    subtitleAr: "إطلالات ناعمة… بطريقتها",
    subtitleEn: "Soft looks, in her own way",
    tag: "GIRLS",
    image: "/images/categories/optimized/girls-v2.webp",
    position: "center 30%",
    size: "md:col-span-1 md:row-span-2",
  },
  {
    id: "boys",
    nameAr: "أولاد",
    nameEn: "Boys",
    subtitleAr: "راحة للحركة من الصبح للمسا",
    subtitleEn: "Comfort made for all-day movement",
    tag: "BOYS",
    image: "/images/categories/optimized/boys-v2.webp",
    position: "center 52%",
    size: "md:col-span-1 md:row-span-2",
  },
  {
    id: "shoes",
    nameAr: "أحذية",
    nameEn: "Shoes",
    subtitleAr: "خطوات صغيرة… بثقة أكبر",
    subtitleEn: "Little steps, a little more confidence",
    tag: "SHOES",
    image: "/images/categories/optimized/shoes.webp",
    position: "center 58%",
    size: "md:col-span-2 md:row-span-2",
  },
  {
    id: "accessories",
    nameAr: "Details / إكسسوارات",
    nameEn: "Details / Accessories",
    subtitleAr: "تفاصيل صغيرة بتكمّل الحكاية",
    subtitleEn: "Little details that complete the story",
    tag: "DETAILS",
    image: "/images/categories/optimized/accessories-gifts-v2.webp",
    position: "center 52%",
    size: "md:col-span-2 md:row-span-2",
  },
];

export default function Categories({ locale = "ar" }) {
  const isAr = locale === "ar";

  return (
    <section
      id="categories"
      dir={isAr ? "rtl" : "ltr"}
      className="bg-milk py-16 sm:py-24 lg:py-28"
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow={isAr ? "اختيارات OH MY BABY" : "OH MY BABY EDIT"}
            tone="aubergine"
            title={
              isAr ? (
                <>لكل مرحلة… عالمها الصغير</>
              ) : (
                <>Every stage has its little world.</>
              )
            }
            description={
              isAr
                ? "اختاري اللي بناسب صغيرك"
                : "Find what feels right for your little one."
            }
            linkHref="/category/clothing"
            linkLabel={isAr ? "عرض كل الأقسام" : "View all categories"}
          />
        </Reveal>

        <div className="omb-categories-expand grid auto-rows-[280px] sm:auto-rows-[340px] md:auto-rows-[320px] grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category, index) => {
            const name = isAr ? category.nameAr : category.nameEn;
            const subtitle = isAr ? category.subtitleAr : category.subtitleEn;

            return (
              <Reveal
                key={category.id}
                delay={index * 55}
                className={`${category.size} omb-category-slot`}
              >
                <a
                  href={`/category/${category.id}`}
                  className="omb-category-card group relative block h-full overflow-hidden bg-espresso shadow-md transition-shadow hover:shadow-xl"
                  aria-label={name}
                >
                  <img
                    src={category.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="omb-media-zoom absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ objectPosition: category.position }}
                  />
                  <div className="omb-scrim absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  <div className="omb-category-glow" />

                  <div className="omb-category-content absolute inset-0 flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                    <div className="flex items-start justify-between gap-4">
                      <span className="omb-eyebrow-label text-white/80 font-bold text-xs sm:text-sm tracking-wider">
                        {category.tag}
                      </span>
                      <span className="omb-category-index text-xs font-semibold tracking-[0.18em] text-white/60">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="omb-category-copy">
                      <h3 className="omb-category-title text-2xl text-white font-black sm:text-3xl lg:text-4xl">
                        {name}
                      </h3>

                      <div className="mt-3 flex items-end justify-between gap-4">
                        <p className="omb-category-subtitle max-w-[20rem] text-xs leading-6 text-white/80 sm:text-sm lg:text-base">
                          {subtitle}
                        </p>

                        <span
                          className="omb-category-cta flex items-center gap-2 text-white font-bold text-sm"
                          aria-hidden="true"
                        >
                          <span className="omb-category-cta-label">
                            {isAr ? "اكتشفي" : "Explore"}
                          </span>
                          <span className="omb-category-cta-arrow text-base">
                            {isAr ? "←" : "→"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
