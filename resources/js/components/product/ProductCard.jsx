import React, { useMemo, useState } from "react";
import {
  getWishlist,
  isProductOutOfStock,
  toggleWishlist,
} from "../../data/productStore";
import DualPrice from "../ui/DualPrice";

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7">
      <path d="M20.8 4.7a5.3 5.3 0 0 0-7.5 0L12 6l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.8a5.3 5.3 0 0 0 0-7.5Z" />
    </svg>
  );
}

export default function ProductCard({ product, locale = "ar" }) {
  const isAr = locale === "ar";
  const [saved, setSaved] = useState(() => getWishlist().map(String).includes(String(product.id)));
  const name = isAr ? product.name : product.nameEn || product.name;
  const category = isAr ? product.categoryAr || product.category : product.categoryEn || product.category;
  const badge = isAr ? product.badge : product.badgeEn || product.badge;
  const outOfStock = isProductOutOfStock(product);
  const displayPrice = product.offerPrice ?? product.price;
  const comparePrice = product.offerPrice ? product.price : product.oldPrice;
  const colorCount = useMemo(() => product.colors?.length || 0, [product.colors]);
  const href = `/product/${product.id}`;

  function toggleSaved(event) {
    event.preventDefault();
    event.stopPropagation();
    setSaved(toggleWishlist(product.id));
  }

  return (
    <article className="group w-full">
      <div className="relative overflow-hidden bg-oat/40">
        <a href={href} className="block" aria-label={name}>
          <img
            src={product.image}
            alt={name}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: product.position || "center" }}
            className="omb-media-zoom aspect-[4/5] w-full object-cover"
          />
        </a>

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

        <button
          type="button"
          onClick={toggleSaved}
          aria-pressed={saved}
          aria-label={saved ? (isAr ? "إزالة من المفضلة" : "Remove from wishlist") : (isAr ? "إضافة إلى المفضلة" : "Add to wishlist")}
          className="absolute left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-milk/92 text-espresso/70"
        >
          <HeartIcon filled={saved} />
        </button>

        <a
          href={href}
          className="absolute inset-x-0 bottom-0 z-20 block translate-y-2 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pb-4 pt-20 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          aria-label={isAr ? `عرض ${name}` : `View ${name}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">{category}</p>
          <h3 className="mt-1.5 text-sm font-black">{name}</h3>
          <DualPrice usd={displayPrice} compareUsd={comparePrice} locale={locale} compact light className="mt-2" />
          <p className="mt-1 text-[11px] text-white/75">
            {product.sizes?.length ? `${product.sizes[0]}–${product.sizes[product.sizes.length - 1]}` : ""}
            {colorCount ? ` · ${colorCount} ${isAr ? "ألوان" : "colors"}` : ""}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/20 pt-3 text-xs font-black">
            <span>{isAr ? "عرض المنتج واختيار اللون والقياس" : "View product & choose options"}</span>
            <span aria-hidden="true">↗</span>
          </div>
        </a>
      </div>

      <div className="pt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-aubergine/50">{category}</p>
        <a href={href} className="mt-1.5 inline-block">
          <h3 className="text-[15px] font-semibold text-espresso">{name}</h3>
        </a>
        <DualPrice usd={displayPrice} compareUsd={comparePrice} locale={locale} className="mt-2" />
      </div>
    </article>
  );
}
