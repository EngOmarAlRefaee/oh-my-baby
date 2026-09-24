import React, { useEffect, useMemo, useState } from "react";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";
import DualPrice from "./ui/DualPrice";
import { getProducts, isProductOutOfStock } from "../data/productStore";
import { apiFetch } from "../lib/api";

function BestSellerCard({ product, locale = "ar" }) {
  const isAr = locale === "ar";
  const name = isAr ? product.name : product.nameEn || product.name;
  const category = isAr ? product.categoryAr || product.category : product.categoryEn || product.category;
  const outOfStock = isProductOutOfStock(product);
  const displayPrice = product.offerPrice ?? product.price;
  const comparePrice = product.offerPrice ? product.price : product.oldPrice;
  const href = `/category/${product.category || "clothing"}`;

  return (
    <article className="group w-full">
      <a href={href} className="block" aria-label={`${name} — ${isAr ? "الذهاب إلى القسم" : "Go to category"}`}>
        <div className="relative overflow-hidden bg-oat/40">
          <img
            src={product.image}
            alt={name}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: product.position || "center" }}
            className="omb-media-zoom aspect-[4/5] w-full object-cover"
          />

          {outOfStock && (
            <span style={{ insetInlineEnd: "0.75rem" }} className="absolute bottom-3 z-10 bg-espresso px-3 py-1.5 text-[10px] font-black text-milk">
              {isAr ? "نفد من المخزون" : "Out of stock"}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 z-20 translate-y-2 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pb-4 pt-24 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">{category}</p>
            <h3 className="mt-1.5 text-sm font-black">{name}</h3>
            <DualPrice usd={displayPrice} compareUsd={comparePrice} locale={locale} compact light className="mt-2" />
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/20 pt-3 text-xs font-black">
              <span>{isAr ? "الذهاب إلى القسم" : "Go to category"}</span>
              <span aria-hidden="true">↗</span>
            </div>
          </div>
        </div>
      </a>
    </article>
  );
}

export default function BestSellers({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [sales, setSales] = useState([]);

  useEffect(() => {
    let active = true;
    apiFetch("/api/best-sellers")
      .then((payload) => {
        if (active) setSales(Array.isArray(payload?.products) ? payload.products : []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const products = useMemo(() => {
    const all = getProducts().filter((product) => product.status !== "inactive");
    const byId = new Map(all.map((product) => [String(product.id), product]));
    const pinned = all
      .filter((product) => product.bestSellerPinned || product.sections?.includes("best-sellers"))
      .sort((a, b) => Number(a.bestSellerOrder || 0) - Number(b.bestSellerOrder || 0));
    const ranked = sales
      .map((row) => {
        const product = byId.get(String(row.product_external_id));
        return product ? { ...product, soldCount: Number(row.sold_count || 0) } : null;
      })
      .filter(Boolean);
    const source = [...pinned, ...ranked];
    return Array.from(new Map(source.map((product) => [String(product.id), product])).values()).slice(0, 10);
  }, [sales]);

  return (
    <section id="best-sellers" className="overflow-hidden bg-oat/30 py-20 sm:py-28" dir={isAr ? "rtl" : "ltr"}>
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow="Best Sellers"
            tone="pistachio"
            title={isAr ? "الأكثر طلباً" : "Best sellers"}
            description={isAr ? "حتى 10 قطع من الأكثر مبيعاً فعلياً، مع إمكانية تثبيت اختيارات يدوية من لوحة المنتجات." : "Up to 10 real best sellers, with optional manual pins from the product admin."}
            linkHref="/collections/best-sellers"
            linkLabel={isAr ? "عرض الأكثر طلباً" : "View best sellers"}
          />
        </Reveal>
      </div>

      {products.length > 0 && (
        <div className={`omb-best-marquee mt-4 ${isAr ? "is-ar" : "is-en"}`} aria-label={isAr ? "الأكثر طلباً" : "Best sellers"}>
          <div className="omb-best-marquee-track">
            {[0, 1].map((groupIndex) => (
              <div className="omb-best-marquee-sequence" key={`sequence-${groupIndex}`} aria-hidden={groupIndex === 1 ? "true" : undefined}>
                {products.map((product, index) => (
                  <div className="omb-best-marquee-card" key={`${groupIndex}-${product.id}-${index}`}>
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
