import React from "react";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";
import DualPrice from "./ui/DualPrice";
import { getProductsForSection, isProductOutOfStock } from "../data/productStore";

function BestSellerCard({ product, locale = "ar" }) {
  const isAr = locale === "ar";
  const name = isAr ? product.name : product.nameEn || product.name;
  const category = isAr ? product.categoryAr || product.category : product.categoryEn || product.category;
  const badge = isAr ? product.badge : product.badgeEn || product.badge;
  const outOfStock = isProductOutOfStock(product);
  const displayPrice = product.offerPrice ?? product.price;
  const comparePrice = product.offerPrice ? product.price : product.oldPrice;
  const href = `/product/${product.id}`;

  return (
    <article className="group w-full">
      <a href={href} className="block" aria-label={name}>
        <div className="relative overflow-hidden bg-oat/40">
          <img
            src={product.image}
            alt={name}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: product.position || "center" }}
            className="omb-media-zoom aspect-[4/5] w-full object-cover"
          />

          {badge && (
            <span className="absolute right-3 top-3 z-10 bg-milk/94 px-3 py-1 text-[10px] font-black tracking-[0.04em] text-aubergine">
              {badge}
            </span>
          )}
          {outOfStock && (
            <span className="absolute bottom-3 right-3 z-10 bg-espresso px-3 py-1.5 text-[10px] font-black text-milk">
              {isAr ? "نفد من المخزون" : "Out of stock"}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 z-20 translate-y-2 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pb-4 pt-20 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">{category}</p>
            <DualPrice usd={displayPrice} compareUsd={comparePrice} locale={locale} compact light className="mt-1.5" />
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/20 pt-3 text-xs font-black">
              <span>{isAr ? "عرض القطعة" : "View item"}</span>
              <span aria-hidden="true">↗</span>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-aubergine/50">{category}</p>
          <h3 className="mt-1.5 text-[15px] font-semibold text-espresso">{name}</h3>
        </div>
      </a>
    </article>
  );
}

export default function BestSellers({ locale = "ar" }) {
  const isAr = locale === "ar";
  const source = getProductsForSection("best-sellers");
  const products = source.length
    ? Array.from({ length: 10 }, (_, index) => source[index % source.length])
    : [];

  return (
    <section
      id="best-sellers"
      className="overflow-hidden bg-oat/30 py-20 sm:py-28"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow="Best Sellers"
            tone="pistachio"
            title={isAr ? "الأكثر طلباً" : "Best sellers"}
            description={
              isAr
                ? "اختيارات محبوبة تمر بشكل مستمر. مرّر المؤشر لرؤية السعر، واضغط على القطعة لفتح صفحتها الكاملة."
                : "Customer favorites in a continuous loop. Hover for the price, then open the full item page to order."
            }
            linkHref="/collections/best-sellers"
            linkLabel={isAr ? "عرض الأكثر طلباً" : "View best sellers"}
          />
        </Reveal>
      </div>

      {products.length > 0 && (
        <div
          className={`omb-best-marquee mt-4 ${isAr ? "is-ar" : "is-en"}`}
          aria-label={isAr ? "الأكثر طلباً" : "Best sellers"}
        >
          <div className="omb-best-marquee-track">
            {[0, 1].map((groupIndex) => (
              <div
                className="omb-best-marquee-sequence"
                key={`sequence-${groupIndex}`}
                aria-hidden={groupIndex === 1 ? "true" : undefined}
              >
                {products.map((product, index) => (
                  <div
                    className="omb-best-marquee-card"
                    key={`${groupIndex}-${product.id}-${index}`}
                  >
                    <BestSellerCard product={product} locale={locale} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
