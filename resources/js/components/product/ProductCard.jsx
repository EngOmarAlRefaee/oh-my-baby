import React, { useMemo, useState } from "react";
import {
  addToCart,
  getCartQuantity,
  getVariantStock,
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

function QuickAdd({ product, locale, onClose }) {
  const isAr = locale === "ar";
  const hasSizes = Boolean(product.sizes?.length);
  const initialColorId = useMemo(() => {
    const firstAvailable = product.colors?.find((item) =>
      hasSizes
        ? product.sizes.some((productSize) => getVariantStock(product, item.id, productSize) > 0)
        : getVariantStock(product, item.id, "default") > 0,
    );
    return firstAvailable?.id || product.colors?.[0]?.id || "default";
  }, [product, hasSizes]);
  const [colorId, setColorId] = useState(initialColorId);
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");

  const selectedSize = hasSizes ? size : "default";
  const stock = getVariantStock(product, colorId, selectedSize || "default");
  const alreadyInCart = selectedSize ? getCartQuantity(product.id, colorId, selectedSize) : 0;
  const availableToAdd = Math.max(0, stock - alreadyInCart);

  function changeColor(id) {
    setColorId(id);
    setSize("");
    setQuantity(1);
    setNotice("");
  }

  function changeSize(nextSize) {
    setSize(nextSize);
    setQuantity(1);
    setNotice("");
  }

  function increase() {
    if (hasSizes && !size) {
      setNotice(isAr ? "اختاري القياس أولاً." : "Choose a size first.");
      return;
    }
    if (quantity >= availableToAdd) {
      setNotice(
        availableToAdd <= 0
          ? isAr ? "نفد من المخزون." : "Out of stock."
          : isAr ? `الكمية المتوفرة لهذا الخيار هي ${availableToAdd} فقط.` : `Only ${availableToAdd} available for this option.`,
      );
      return;
    }
    setQuantity((value) => value + 1);
  }

  function add() {
    if (hasSizes && !size) {
      setNotice(isAr ? "اختاري القياس قبل الإضافة للسلة." : "Choose a size before adding to bag.");
      return;
    }
    const result = addToCart(product, { colorId, size: selectedSize, quantity });
    if (!result.ok) {
      setNotice(
        result.reason === "out-of-stock"
          ? isAr ? "نفد من المخزون." : "Out of stock."
          : isAr ? `وصلتِ للحد الأقصى المتوفر (${result.stock ?? 0}).` : `You've reached the available stock (${result.stock ?? 0}).`,
      );
      return;
    }
    setNotice(isAr ? "تمت الإضافة للسلة." : "Added to bag.");
    window.setTimeout(onClose, 650);
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-milk p-6 shadow-2xl" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="omb-eyebrow-label text-aubergine/70">{isAr ? "إضافة سريعة" : "Quick add"}</p>
            <h3 className="mt-2 text-xl font-black text-espresso">{isAr ? product.name : product.nameEn || product.name}</h3>
            <DualPrice usd={product.offerPrice ?? product.price} compareUsd={product.offerPrice ? product.price : product.oldPrice} locale={locale} className="mt-3" />
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-espresso/60" aria-label={isAr ? "إغلاق" : "Close"}>×</button>
        </div>

        {product.colors?.length > 0 && (
          <div className="mt-7">
            <p className="text-sm font-bold text-espresso">{isAr ? "اللون" : "Color"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.colors.map((item) => {
                const colorHasStock = hasSizes
                  ? product.sizes.some((productSize) => getVariantStock(product, item.id, productSize) > 0)
                  : getVariantStock(product, item.id, "default") > 0;
                return (
                  <button key={item.id} type="button" disabled={!colorHasStock} onClick={() => changeColor(item.id)} className={`flex items-center gap-2 border px-3 py-2 text-xs font-bold ${item.id === colorId ? "border-aubergine" : "border-espresso/15"} disabled:cursor-not-allowed disabled:opacity-35`}>
                    <span className="h-4 w-4 rounded-full border border-espresso/15" style={{ background: item.hex }} />
                    {isAr ? item.nameAr : item.nameEn}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {hasSizes && (
          <div className="mt-6">
            <p className="text-sm font-bold text-espresso">{isAr ? "القياس" : "Size"}</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.sizes.map((item) => {
                const itemStock = getVariantStock(product, colorId, item);
                return (
                  <button key={item} type="button" disabled={itemStock <= 0} onClick={() => changeSize(item)} className={`border px-3 py-3 text-xs font-bold ${item === size ? "border-aubergine bg-aubergine text-milk" : "border-espresso/15 text-espresso"} disabled:cursor-not-allowed disabled:opacity-35`}>
                    {item}{itemStock <= 0 ? <span className="block text-[9px] mt-1">{isAr ? "نفد" : "Out"}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(!hasSizes || size) && (
          <div className="mt-6">
            <p className="text-sm font-bold text-espresso">{isAr ? "الكمية" : "Quantity"}</p>
            <div className="mt-3 inline-flex items-center border border-espresso/15">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-11 w-11 text-lg">−</button>
              <span className="flex h-11 min-w-12 items-center justify-center border-x border-espresso/15 px-3 font-black">{quantity}</span>
              <button type="button" onClick={increase} disabled={availableToAdd <= 0 || quantity >= availableToAdd} className="h-11 w-11 text-lg disabled:opacity-30">+</button>
            </div>
            <p className="mt-2 text-[11px] text-espresso/50">
              {availableToAdd > 0 ? (isAr ? `متوفر للإضافة الآن: ${availableToAdd}` : `Available to add now: ${availableToAdd}`) : (isAr ? "نفد من المخزون" : "Out of stock")}
            </p>
          </div>
        )}

        {notice && <p className="mt-4 text-xs font-bold text-aubergine">{notice}</p>}
        <button type="button" onClick={add} disabled={isProductOutOfStock(product) || (hasSizes && !size) || availableToAdd <= 0} className="omb-btn omb-btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40">
          {isProductOutOfStock(product) ? (isAr ? "نفد من المخزون" : "Out of stock") : (isAr ? "أضف للسلة" : "Add to bag")}
        </button>
      </div>
    </div>
  );
}

export default function ProductCard({ product, locale = "ar" }) {
  const isAr = locale === "ar";
  const [saved, setSaved] = useState(() => getWishlist().map(String).includes(String(product.id)));
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const name = isAr ? product.name : product.nameEn || product.name;
  const category = isAr ? product.categoryAr || product.category : product.categoryEn || product.category;
  const badge = isAr ? product.badge : product.badgeEn || product.badge;
  const outOfStock = isProductOutOfStock(product);
  const displayPrice = product.offerPrice ?? product.price;
  const comparePrice = product.offerPrice ? product.price : product.oldPrice;
  const colorCount = useMemo(() => product.colors?.length || 0, [product.colors]);

  function toggleSaved() {
    setSaved(toggleWishlist(product.id));
  }

  return (
    <>
      <article className="group w-full">
        <div className="relative overflow-hidden bg-oat/40">
          <a href={`/product/${product.id}`} className="block" aria-label={name}>
            <img src={product.image} alt={name} loading="lazy" decoding="async" style={{ objectPosition: product.position || "center" }} className="omb-media-zoom aspect-[4/5] w-full object-cover" />
          </a>
          {badge && <span className="absolute right-3 top-3 z-10 bg-milk/94 px-3 py-1 text-[10px] font-black tracking-[0.04em] text-aubergine">{badge}</span>}
          {outOfStock && <span className="absolute bottom-3 right-3 z-10 bg-espresso px-3 py-1.5 text-[10px] font-black text-milk">{isAr ? "نفد من المخزون" : "Out of stock"}</span>}
          <button type="button" onClick={toggleSaved} aria-pressed={saved} aria-label={saved ? (isAr ? "إزالة من المفضلة" : "Remove from wishlist") : (isAr ? "إضافة إلى المفضلة" : "Add to wishlist")} className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-milk/92 text-espresso/70">
            <HeartIcon filled={saved} />
          </button>
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/65 to-transparent px-3 pb-4 pt-16 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">{category}</p>
                <DualPrice usd={displayPrice} compareUsd={comparePrice} locale={locale} compact light className="mt-1" />
                <p className="mt-1 text-[11px] text-white/75">{product.sizes?.length ? `${product.sizes[0]}–${product.sizes[product.sizes.length - 1]}` : ""}{colorCount ? ` · ${colorCount} ${isAr ? "ألوان" : "colors"}` : ""}</p>
              </div>
              <button type="button" disabled={outOfStock} onClick={() => setQuickAddOpen(true)} className="omb-btn min-h-9 border border-white/40 bg-white/12 px-4 text-xs text-white disabled:opacity-45">
                {outOfStock ? (isAr ? "نفد" : "Out") : (isAr ? "إضافة للسلة" : "Add to bag")}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-aubergine/50">{category}</p>
          <a href={`/product/${product.id}`} className="mt-1.5 inline-block"><h3 className="text-[15px] font-semibold text-espresso">{name}</h3></a>
          <DualPrice usd={displayPrice} compareUsd={comparePrice} locale={locale} className="mt-2" />
        </div>
      </article>
      {quickAddOpen && <QuickAdd product={product} locale={locale} onClose={() => setQuickAddOpen(false)} />}
    </>
  );
}
