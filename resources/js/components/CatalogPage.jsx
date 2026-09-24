import React, { useEffect, useMemo, useState } from "react";
import ProductCard from "./product/ProductCard";
import AuthPanel from "./auth/AuthPanel";
import DualPrice from "./ui/DualPrice";
import CheckoutPage from "./CheckoutPage";
import CustomerAccountPage from "./CustomerAccountPage";
import {
  categoryMap,
  getSubcategories,
} from "../data/catalog";
import {
  addToCart,
  getCartDetailed,
  getCartQuantity,
  getProducts,
  getVariantStock,
  getWishlist,
  isProductOutOfStock,
  removeCartItem,
  setCartItemQuantity,
} from "../data/productStore";

function PageShell({ locale, title, eyebrow, description, children, compact = false }) {
  const isAr = locale === "ar";
  return (
    <section className="min-h-[70vh] bg-milk py-10 sm:py-14 lg:py-16" dir={isAr ? "rtl" : "ltr"}>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        {!compact && (
          <div className="mb-9 max-w-4xl">
            <p className="omb-eyebrow-label text-aubergine/70">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-espresso sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-espresso/65 sm:text-lg">{description}</p>
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

function SubcategoryNav({ locale, categorySlug, active = "all" }) {
  const isAr = locale === "ar";
  const items = getSubcategories(categorySlug);
  if (items.length <= 1) return null;
  return (
    <nav className="omb-category-subnav mb-7 overflow-x-auto border-y border-espresso/10" aria-label={isAr ? "أنواع القسم" : "Category types"}>
      <div className="flex min-w-max items-center gap-1 py-3">
        {items.map((item) => {
          const href = item.id === "all" ? `/category/${categorySlug}` : `/category/${categorySlug}/${item.id}`;
          return (
            <a
              key={item.id}
              href={href}
              className={`px-4 py-2.5 text-sm font-black transition-colors ${
                active === item.id ? "bg-aubergine text-milk" : "text-espresso/65 hover:text-aubergine"
              }`}
            >
              {isAr ? item.ar : item.en}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function SeasonNav({ locale, value, onChange }) {
  const isAr = locale === "ar";
  const items = [
    { id: "all", ar: "الكل", en: "All" },
    { id: "summer", ar: "صيفي", en: "Summer" },
    { id: "winter", ar: "شتوي", en: "Winter" },
  ];

  return (
    <nav className="omb-season-nav mb-4 border-y border-espresso/10 bg-oat/20" aria-label={isAr ? "فلترة حسب الموسم" : "Filter by season"}>
      <div className="flex min-w-max items-center justify-center gap-2 overflow-x-auto py-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`min-w-24 px-5 py-2.5 text-sm font-black transition ${value === item.id ? "bg-aubergine text-milk" : "text-espresso/65 hover:text-aubergine"}`}
          >
            {isAr ? item.ar : item.en}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Filters({ locale, products, state, setState, categorySlug }) {
  const isAr = locale === "ar";
  const [open, setOpen] = useState(false);
  const availableSizes = [...new Set(products.flatMap((product) => product.sizes || []))];
  const availableColors = [
    ...new Map(
      products.flatMap((product) => (product.colors || []).map((color) => [color.id, color])),
    ).values(),
  ];
  const isGlobalListing = !categorySlug || !categoryMap[categorySlug];
  const showAudience = isGlobalListing || ["shoes", "accessories"].includes(categorySlug);
  const showSize = availableSizes.length > 0;
  const showColor = availableColors.length > 0;
  const set = (key, value) => setState((current) => ({ ...current, [key]: value }));

  return (
    <div className="mb-9 border-b border-espresso/10 pb-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[260px] flex-1 items-center gap-3 border border-espresso/12 bg-oat/25 px-4 py-3.5">
          <span aria-hidden="true">⌕</span>
          <input
            value={state.query}
            onChange={(event) => set("query", event.target.value)}
            placeholder={isAr ? "ابحثي بكل المتجر..." : "Search the whole store..."}
            className="w-full bg-transparent text-base outline-none"
          />
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="omb-btn omb-btn-secondary h-12 px-6">
          {isAr ? "فلترة" : "Filter"}
        </button>
        <select value={state.sort} onChange={(event) => set("sort", event.target.value)} className="h-12 border border-espresso/12 bg-milk px-5 text-sm font-black text-espresso outline-none">
          <option value="featured">{isAr ? "مختاراتنا" : "Featured"}</option>
          <option value="newest">{isAr ? "الأحدث" : "Newest"}</option>
          <option value="price-asc">{isAr ? "السعر: الأقل" : "Price: low to high"}</option>
          <option value="price-desc">{isAr ? "السعر: الأعلى" : "Price: high to low"}</option>
        </select>
      </div>

      {open && (
        <div className="mt-5 grid gap-6 border-t border-espresso/10 pt-5 md:grid-cols-4">
          {showAudience && (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-aubergine">{isAr ? "الفئة" : "Audience"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { id: "all", ar: "الكل", en: "All" },
                  { id: "girls", ar: "بنات", en: "Girls" },
                  { id: "boys", ar: "أولاد", en: "Boys" },
                ].map((item) => (
                  <button key={item.id} type="button" onClick={() => set("audience", item.id)} className={`border px-3.5 py-2 text-xs font-black ${state.audience === item.id ? "border-aubergine bg-aubergine text-milk" : "border-espresso/12"}`}>
                    {isAr ? item.ar : item.en}
                  </button>
                ))}
              </div>
            </div>
          )}
          {showSize && (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-aubergine">{isAr ? "القياس" : "Size"}</p>
              <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                <button type="button" onClick={() => set("size", "")} className={`border px-3.5 py-2 text-xs font-black ${!state.size ? "border-aubergine bg-aubergine text-milk" : "border-espresso/12"}`}>{isAr ? "الكل" : "All"}</button>
                {availableSizes.map((size) => (
                  <button key={size} type="button" onClick={() => set("size", size)} className={`border px-3.5 py-2 text-xs font-black ${state.size === size ? "border-aubergine bg-aubergine text-milk" : "border-espresso/12"}`}>{size}</button>
                ))}
              </div>
            </div>
          )}
          {showColor && (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-aubergine">{isAr ? "اللون" : "Color"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => set("color", "")} className={`border px-3.5 py-2 text-xs font-black ${!state.color ? "border-aubergine bg-aubergine text-milk" : "border-espresso/12"}`}>{isAr ? "الكل" : "All"}</button>
                {availableColors.map((color) => (
                  <button key={color.id} type="button" onClick={() => set("color", color.id)} className={`flex items-center gap-2 border px-3 py-2 text-xs font-black ${state.color === color.id ? "border-aubergine" : "border-espresso/12"}`}>
                    <span className="h-4 w-4 rounded-full border border-espresso/15" style={{ background: color.hex }} />
                    {isAr ? color.nameAr : color.nameEn}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-aubergine">{isAr ? "السعر" : "Price"}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input value={state.minPrice} onChange={(event) => set("minPrice", event.target.value)} inputMode="decimal" placeholder={isAr ? "من" : "Min"} className="border border-espresso/12 bg-transparent px-3 py-2 text-sm outline-none" />
              <input value={state.maxPrice} onChange={(event) => set("maxPrice", event.target.value)} inputMode="decimal" placeholder={isAr ? "إلى" : "Max"} className="border border-espresso/12 bg-transparent px-3 py-2 text-sm outline-none" />
            </div>
            <button type="button" onClick={() => setState({ query: "", audience: "all", size: "", color: "", minPrice: "", maxPrice: "", sort: "featured", season: "all" })} className="mt-3 text-xs font-black text-aubergine underline">
              {isAr ? "مسح الفلاتر" : "Clear filters"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductDetail({ locale, product }) {
  const isAr = locale === "ar";
  const hasColors = Boolean(product.colors?.length);
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
  const [activeImage, setActiveImage] = useState(0);
  const color = product.colors?.find((item) => item.id === colorId) || product.colors?.[0] || null;
  const gallery = color?.images?.length ? color.images : color?.image ? [color.image] : [product.image];
  const stock = getVariantStock(product, colorId, hasSizes ? size || "default" : "default");
  const inCart = hasSizes && !size ? 0 : getCartQuantity(product.id, colorId, hasSizes ? size : "default");
  const availableToAdd = hasSizes && !size ? 0 : Math.max(0, stock - inCart);
  const displayPrice = Number(product.offerPrice ?? product.price ?? 0);
  const comparePrice = product.offerPrice ? Number(product.price || 0) : Number(product.oldPrice || 0);
  const outOfStock = isProductOutOfStock(product);

  useEffect(() => {
    setActiveImage(0);
    if (size && getVariantStock(product, colorId, size) <= 0) setSize("");
    setQuantity(1);
    setNotice("");
  }, [colorId]);

  useEffect(() => {
    setQuantity(1);
    setNotice("");
  }, [size]);

  function increase() {
    if (hasSizes && !size) {
      setNotice(isAr ? "اختاري القياس أولاً." : "Choose a size first.");
      return;
    }
    if (availableToAdd <= 0 || quantity >= availableToAdd) {
      setNotice(
        availableToAdd <= 0
          ? isAr ? "نفد من المخزون لهذا الخيار." : "This option is out of stock."
          : isAr ? `وصلتِ للحد الأقصى المتوفر: ${availableToAdd}.` : `You've reached the maximum available quantity: ${availableToAdd}.`,
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
    const result = addToCart(product, { colorId, size: hasSizes ? size : "default", quantity });
    if (!result.ok) {
      setNotice(
        result.reason === "out-of-stock"
          ? isAr ? "نفد من المخزون." : "Out of stock."
          : isAr ? `الحد الأقصى المتوفر لهذا الخيار هو ${result.stock || 0}.` : `The maximum available for this option is ${result.stock || 0}.`,
      );
      return;
    }
    setNotice(isAr ? "تمت إضافة المنتج إلى السلة." : "Added to bag.");
  }

  return (
    <PageShell
      locale={locale}
      eyebrow={isAr ? product.categoryAr || product.category : product.categoryEn || product.category}
      title={isAr ? product.name : product.nameEn || product.name}
      description={isAr ? product.descriptionAr : product.descriptionEn}
      compact
    >
      <div className="grid gap-9 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 xl:gap-20">
        <div>
          <div className="overflow-hidden bg-oat/35">
            <img src={gallery[activeImage] || product.image} alt={isAr ? product.name : product.nameEn || product.name} className="aspect-[4/5] w-full object-cover" />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {gallery.map((image, index) => (
                <button key={`${image}-${index}`} type="button" onClick={() => setActiveImage(index)} className={`overflow-hidden border ${index === activeImage ? "border-aubergine" : "border-espresso/10"}`}>
                  <img src={image} alt="" className="aspect-[4/5] w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-[190px] lg:self-start">
          <p className="omb-eyebrow-label text-aubergine/60">{isAr ? product.categoryAr || product.category : product.categoryEn || product.category}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-espresso sm:text-5xl">{isAr ? product.name : product.nameEn || product.name}</h1>
          <DualPrice usd={displayPrice} compareUsd={comparePrice > displayPrice ? comparePrice : null} locale={locale} className="mt-5" />
          <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-espresso/65">{isAr ? product.descriptionAr : product.descriptionEn}</p>

          {hasColors && (
            <div className="mt-8">
              <p className="text-sm font-black">{isAr ? "اللون" : "Color"}</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {product.colors.map((item) => {
                  const colorHasStock = hasSizes
                    ? product.sizes.some((productSize) => getVariantStock(product, item.id, productSize) > 0)
                    : getVariantStock(product, item.id, "default") > 0;
                  return (
                    <button key={item.id} type="button" onClick={() => setColorId(item.id)} disabled={!colorHasStock} className={`flex items-center gap-2 border px-4 py-2.5 text-sm font-black ${colorId === item.id ? "border-aubergine" : "border-espresso/12"} disabled:cursor-not-allowed disabled:opacity-35`}>
                      <span className="h-5 w-5 rounded-full border border-espresso/15" style={{ background: item.hex }} />
                      {isAr ? item.nameAr : item.nameEn}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasSizes && (
            <div className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-black">{isAr ? "القياس" : "Size"}</p>
                <span className="text-xs text-espresso/45">{isAr ? "اختاري القياس قبل الإضافة" : "Choose a size before adding"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {product.sizes.map((item) => {
                  const itemStock = getVariantStock(product, colorId, item);
                  return (
                    <button key={item} type="button" disabled={itemStock <= 0} onClick={() => setSize(item)} className={`min-w-16 border px-4 py-3 text-sm font-black ${size === item ? "border-aubergine bg-aubergine text-milk" : "border-espresso/12"} disabled:cursor-not-allowed disabled:opacity-35`}>
                      {item}
                      {itemStock <= 0 && <span className="mt-1 block text-[9px]">{isAr ? "نفد" : "Out"}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8">
            <p className="text-sm font-black">{isAr ? "الكمية" : "Quantity"}</p>
            <div className="mt-3 inline-flex items-center border border-espresso/12">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-12 w-12 text-lg font-black">−</button>
              <span className="flex h-12 min-w-14 items-center justify-center border-x border-espresso/12 px-3 text-lg font-black">{quantity}</span>
              <button type="button" onClick={increase} disabled={outOfStock || (hasSizes && !size) || availableToAdd <= 0 || quantity >= availableToAdd} className="h-12 w-12 text-lg font-black disabled:opacity-30">+</button>
            </div>
            {(hasSizes ? size : true) && (
              <p className="mt-2 text-xs text-espresso/50">
                {availableToAdd > 0
                  ? isAr ? `متوفر للإضافة الآن: ${availableToAdd}` : `Available to add now: ${availableToAdd}`
                  : isAr ? "نفد من المخزون" : "Out of stock"}
              </p>
            )}
          </div>

          <button type="button" onClick={add} disabled={outOfStock || (hasSizes && !size) || availableToAdd <= 0} className="omb-btn omb-btn-primary mt-7 h-14 w-full text-base disabled:cursor-not-allowed disabled:opacity-40">
            {outOfStock ? (isAr ? "نفد من المخزون" : "Out of stock") : isAr ? "إضافة للسلة" : "Add to bag"}
          </button>
          {notice && <p className="mt-4 border border-aubergine/20 bg-aubergine/5 px-4 py-3 text-sm font-black text-aubergine">{notice}</p>}
        </div>
      </div>
    </PageShell>
  );
}

function CartPage({ locale }) {
  const isAr = locale === "ar";
  const [items, setItems] = useState(() => getCartDetailed());
  const [notice, setNotice] = useState("");

  function refresh() {
    setItems(getCartDetailed());
  }

  function change(item, delta) {
    const nextQuantity = Number(item.quantity) + delta;
    if (nextQuantity <= 0) {
      removeCartItem(item.key);
      refresh();
      return;
    }
    const result = setCartItemQuantity(item.key, nextQuantity);
    if (!result.ok && result.reason === "max-stock") {
      setNotice(isAr ? `وصلتِ للحد الأقصى المتوفر (${result.stock}).` : `Maximum available stock reached (${result.stock}).`);
      return;
    }
    setNotice("");
    refresh();
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  return (
    <PageShell locale={locale} eyebrow="OH MY BABY" title={isAr ? "السلة" : "Your bag"} description={isAr ? "راجعي اختياراتك والكميات قبل إكمال الطلب." : "Review your items and quantities before checkout."}>
      {items.length ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4">
            {items.map((item) => (
              <article key={item.key} className="grid grid-cols-[100px_1fr] gap-4 border-b border-espresso/10 pb-4 sm:grid-cols-[130px_1fr_auto]">
                <img src={item.color?.image || item.product.image} alt="" className="aspect-[4/5] w-full object-cover" />
                <div>
                  <h2 className="font-black text-espresso">{isAr ? item.product.name : item.product.nameEn || item.product.name}</h2>
                  <p className="mt-1 text-xs text-espresso/55">{item.color ? (isAr ? item.color.nameAr : item.color.nameEn) : ""}{item.size !== "default" ? ` · ${item.size}` : ""}</p>
                  <DualPrice usd={item.price} locale={locale} compact className="mt-3" />
                  <button type="button" onClick={() => { removeCartItem(item.key); refresh(); }} className="mt-3 text-xs font-black text-aubergine underline">{isAr ? "إزالة" : "Remove"}</button>
                </div>
                <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:flex-col sm:items-end">
                  <div className="inline-flex border border-espresso/12">
                    <button type="button" onClick={() => change(item, -1)} className="h-10 w-10">−</button>
                    <span className="flex h-10 min-w-11 items-center justify-center border-x border-espresso/12 px-2 font-black">{item.quantity}</span>
                    <button type="button" onClick={() => change(item, 1)} disabled={item.quantity >= item.stock} className="h-10 w-10 disabled:opacity-30">+</button>
                  </div>
                  <DualPrice usd={item.subtotal} locale={locale} compact />
                </div>
              </article>
            ))}
          </div>
          <aside className="h-fit border border-espresso/10 bg-oat/25 p-6 lg:sticky lg:top-[190px]">
            <div className="text-lg font-black"><span>{isAr ? "الإجمالي" : "Total"}</span><DualPrice usd={total} locale={locale} className="mt-2" /></div>
            <p className="mt-3 text-xs leading-6 text-espresso/55">{isAr ? "بعد الضغط على متابعة الطلب ستدخل بيانات التوصيل ثم يُرسل الطلب للإدارة بحالة قيد المراجعة." : "Continue to enter delivery details and submit the order to the team for review."}</p>
            <a href="/checkout" className="omb-btn omb-btn-primary mt-5 w-full">{isAr ? "متابعة الطلب" : "Continue"}</a>
          </aside>
        </div>
      ) : (
        <div className="border border-espresso/10 bg-oat/25 p-14 text-center"><p className="text-xl font-black">{isAr ? "السلة فاضية حالياً." : "Your bag is empty."}</p><a href="/products" className="omb-btn omb-btn-primary mt-6">{isAr ? "تسوقي المنتجات" : "Shop products"}</a></div>
      )}
      {notice && <p className="mt-5 text-sm font-black text-aubergine">{notice}</p>}
    </PageShell>
  );
}

function WishlistPage({ locale }) {
  const isAr = locale === "ar";
  const ids = getWishlist().map(String);
  const products = getProducts().filter((product) => ids.includes(String(product.id)));
  return (
    <PageShell locale={locale} eyebrow="OH MY BABY" title={isAr ? "المفضلة" : "Wishlist"} description={isAr ? "القطع اللي حفظتيها للرجوع إلها بسهولة." : "Pieces you saved for later."}>
      {products.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}</div>
      ) : (
        <div className="border border-espresso/10 bg-oat/25 p-14 text-center"><p className="text-xl font-black">{isAr ? "ما في منتجات محفوظة بعد." : "No saved products yet."}</p></div>
      )}
    </PageShell>
  );
}

const infoPages = {
  about: {
    eyebrow: "OH MY BABY",
    titleAr: "قصتنا",
    titleEn: "Our story",
    bodyAr: "OH MY BABY عالم أطفال Premium يجمع الأزياء والتفاصيل اليومية بتجربة دافئة ومرتبة. هذه الصفحة جاهزة لاستقبال قصة العلامة الكاملة عند اعتماد النص النهائي.",
    bodyEn: "OH MY BABY is a premium children's world bringing fashion and everyday essentials into a warm, considered experience. This page is ready for the final brand story when approved.",
  },
  "services/shipping": {
    eyebrow: "CUSTOMER CARE",
    titleAr: "طرق الشحن",
    titleEn: "Shipping",
    bodyAr: "صفحة الشحن جاهزة للربط بسياسات المدن، المدد والتكاليف الفعلية عند اعتماد عمليات التوصيل.",
    bodyEn: "The shipping page is ready for the final city coverage, delivery times and fees once operations are approved.",
  },
  "services/returns": {
    eyebrow: "CUSTOMER CARE",
    titleAr: "سياسة الإرجاع",
    titleEn: "Return policy",
    bodyAr: "مكان مخصص لسياسة الاستبدال والإرجاع النهائية. لن نعرض شروطاً تجارية غير معتمدة قبل تثبيتها من الإدارة.",
    bodyEn: "A dedicated home for the final exchange and returns policy. No unapproved commercial terms are presented before management confirms them.",
  },
  "services/faq": {
    eyebrow: "CUSTOMER CARE",
    titleAr: "الأسئلة الشائعة",
    titleEn: "FAQ",
    bodyAr: "هذه الصفحة جاهزة للأسئلة المتكررة حول القياسات، الطلبات، الشحن والحسابات عندما يتم اعتماد الإجابات التشغيلية.",
    bodyEn: "This page is ready for common questions about sizing, orders, shipping and accounts once the operational answers are approved.",
  },
  rewards: {
    eyebrow: "OH MY BABY REWARDS",
    titleAr: "المكافآت",
    titleEn: "Rewards",
    bodyAr: "تم تجهيز وجهة المكافآت ضمن تجربة الحساب. احتساب النقاط والمكافآت سيُربط بالطلبات المسلّمة عند بناء دورة الطلبات الكاملة.",
    bodyEn: "The rewards destination is ready inside the account experience. Points and rewards will connect to delivered orders when the full order lifecycle is implemented.",
  },
  checkout: {
    eyebrow: "CHECKOUT",
    titleAr: "إتمام الطلب",
    titleEn: "Checkout",
    bodyAr: "السلة واختيار المنتجات والكميات يعملان في النسخة الحالية. إنشاء الطلب والدفع وعنوان التوصيل سيتم ربطهم بمرحلة الـBackend الخاصة بالطلبات بدون إعادة بناء تجربة المتجر.",
    bodyEn: "Bag, product selection and stock-aware quantities work in this version. Final order creation, payment and delivery address will connect in the Orders backend stage without rebuilding the storefront experience.",
  },
};

function InfoPage({ locale, page }) {
  const isAr = locale === "ar";
  return (
    <PageShell
      locale={locale}
      eyebrow={page.eyebrow}
      title={isAr ? page.titleAr : page.titleEn}
      description={isAr ? page.bodyAr : page.bodyEn}
    >
      <a href="/" className="omb-btn omb-btn-primary">
        {isAr ? "العودة للرئيسية" : "Back home"}
      </a>
    </PageShell>
  );
}

function SocialPlaceholder({ locale, network }) {
  const isAr = locale === "ar";
  return (
    <PageShell
      locale={locale}
      eyebrow="OH MY BABY SOCIAL"
      title={network.charAt(0).toUpperCase() + network.slice(1)}
      description={
        isAr
          ? "الرابط الرسمي لهذا الحساب لم يتم إدخاله بعد. تركناه كوجهة واضحة بدل رابط مكسور، وبمجرد تزويدنا بالرابط الرسمي يتم تحويله مباشرة للحساب."
          : "The official account URL has not been entered yet. This is kept as a clear destination instead of a broken link, and can be switched to the official profile as soon as it is provided."
      }
    >
      <a href="/" className="omb-btn omb-btn-primary">
        {isAr ? "العودة للرئيسية" : "Back home"}
      </a>
    </PageShell>
  );
}

function WorldLanding({ locale, worldId }) {
  const isAr = locale === "ar";
  const children = worldId === "fashion"
    ? ["newborn", "girls", "boys", "shoes", "accessories"]
    : ["decor", "mobility", "gifts", "baby-essentials"];
  return (
    <PageShell locale={locale} eyebrow="OH MY BABY" title={worldId === "fashion" ? (isAr ? "ملابس" : "Clothing") : (isAr ? "عالم الطفل" : "Baby World")} description={worldId === "fashion" ? (isAr ? "اختاري القسم المناسب لعمرهم وأسلوبهم." : "Choose the category that fits their age and style.") : (isAr ? "كل شيء للصغار أبعد من الملابس." : "Everything for little ones beyond clothing.")}>
      <div className={`grid gap-4 sm:grid-cols-2 ${worldId === "fashion" ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
        {children.map((child) => {
          const item = categoryMap[child];
          return (
            <a key={child} href={`/category/${child}`} className="group relative min-h-[420px] overflow-hidden bg-espresso">
              <img src={item.image} alt={isAr ? item.ar : item.en} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <h2 className="absolute bottom-6 left-6 right-6 text-2xl font-black text-white">{isAr ? item.ar : item.en}</h2>
            </a>
          );
        })}
      </div>
    </PageShell>
  );
}

const categorySearchAliases = {
  newborn: "مولود مواليد حديث الولادة حديثي الولادة newborn baby",
  girls: "بنت بنات بناتي girls girl",
  boys: "ولد أولاد اولاد صبي صبياني boys boy",
  shoes: "حذاء أحذية احذية جزمة جزم shoes shoe",
  accessories: "اكسسوار اكسسوارات إكسسوار إكسسوارات تفاصيل details accessories",
  decor: "تزيين زينة استقبال مولود ديكور decor newborn welcome",
  mobility: "عربة عرباية عربايات مقعد مقاعد stroller strollers seat seats",
  gifts: "هدية هدايا gift gifts",
  "baby-essentials": "ألعاب العاب لعبة مستلزمات toys toy essentials",
};

const subcategorySearchAliases = {
  bodysuits: "بودي بدي bodysuit bodysuits",
  sets: "طقم أطقم اطقم set sets",
  pajamas: "بيجاما بيجامات pajamas pyjamas",
  rompers: "سالوبيت romper rompers",
  pants: "بنطال بناطيل جينز jeans pants trousers",
  knitwear: "كنزة كنزات سويتر sweater knitwear",
  dresses: "فستان فساتين dress dresses",
  tshirts: "تيشيرت تيشيرتات t-shirt tshirt tshirts",
  shirts: "قميص قمصان shirt shirts",
  jackets: "جاكيت جاكيتات jacket jackets",
  skirts: "تنورة تنانير skirt skirts",
  shorts: "شورت شورتات shorts",
  bags: "حقيبة حقائب شنطة شنط bags",
  hats: "قبعة قبعات hats",
  socks: "جوارب جرابات socks",
  hair: "شعر اكسسوارات شعر إكسسوارات شعر hair accessories",
  other: "تفاصيل اكسسوارات إكسسوارات details accessories",
};

function normalizeSearchText(value = "") {
  const easternArabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return String(value)
    .toLowerCase()
    .replace(/[٠-٩]/g, (digit) => String(easternArabicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/(\d+)\s*(?:سنة|سنوات|سنين|عام|أعوام|اعوام)/g, "$1y")
    .replace(/(\d+)\s*(?:شهر|أشهر|اشهر|شهور)/g, "$1m")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export default function CatalogPage({ locale = "ar", path = "/" }) {
  const isAr = locale === "ar";
  const products = getProducts();
  const cleanPath = path.split("?")[0];
  const queryString = path.includes("?") ? new URLSearchParams(path.split("?")[1]) : new URLSearchParams();
  const initialQuery = queryString.get("q") || "";
  const [filters, setFilters] = useState({ query: initialQuery, audience: "all", size: "", color: "", minPrice: "", maxPrice: "", sort: "featured", season: "all" });
  const parts = cleanPath.replace(/^\//, "").split("/").filter(Boolean);
  const type = parts[0] || "";
  const slug = parts[1] || "";
  const subSlug = parts[2] || "all";

  if (type === "product" && slug) {
    const product = products.find((item) => String(item.id) === String(slug) || item.slug === slug);
    return product ? <ProductDetail locale={locale} product={product} /> : <PageShell locale={locale} eyebrow="OH MY BABY" title={isAr ? "المنتج غير موجود" : "Product not found"} description={isAr ? "جربي منتجاً آخر من نفس القسم." : "Try another product from the same category."}><a href="/products" className="omb-btn omb-btn-primary">{isAr ? "تصفح المنتجات" : "Browse products"}</a></PageShell>;
  }

  if (type === "cart") return <CartPage locale={locale} />;
  if (type === "checkout") return <CheckoutPage locale={locale} />;
  if (type === "wishlist") return <WishlistPage locale={locale} />;
  if (type === "account") return <CustomerAccountPage locale={locale} />;
  if (type === "category" && slug === "clothing") return <WorldLanding locale={locale} worldId="fashion" />;
  if (type === "category" && slug === "baby-world") return <WorldLanding locale={locale} worldId="baby-world" />;

  const titleMap = {
    "new-arrivals": { ar: "وصل حديثاً", en: "New arrivals" },
    "best-sellers": { ar: "الأكثر طلباً", en: "Best sellers" },
    offers: { ar: "العروض", en: "Offers" },
    "back-to-school": { ar: "العودة إلى المدرسة", en: "Back to school" },
  };

  if (["products", "search", "category", "collections", "collection"].includes(type)) {
    let base = products.filter((product) => product.status !== "inactive");
    let activeSubcategory = "all";

    if (type === "category" && categoryMap[slug]) {
      base = base.filter((product) => product.category === slug);
      if (subSlug && subSlug !== "all") {
        activeSubcategory = subSlug;
        base = base.filter((product) => product.subcategory === subSlug);
      }
      const placement = queryString.get("placement");
      if (["new-arrivals", "offers", "featured-collection", "best-sellers"].includes(placement)) {
        base = base.filter((product) => product.sections?.includes(placement));
      }
    }

    const collectionSlug = type === "collections" || type === "collection" ? slug : null;
    const sectionMap = {
      "back-to-school": "featured-collection",
      "best-sellers": "best-sellers",
      "new-arrivals": "new-arrivals",
      offers: "offers",
    };
    if (collectionSlug && sectionMap[collectionSlug]) base = base.filter((product) => product.sections?.includes(sectionMap[collectionSlug]));

    const filtered = base.filter((product) => {
      const q = normalizeSearchText(filters.query);
      const haystack = normalizeSearchText([
        product.name,
        product.nameEn,
        product.categoryAr,
        product.categoryEn,
        categorySearchAliases[product.category],
        product.descriptionAr,
        product.descriptionEn,
        product.subcategory,
        subcategorySearchAliases[product.subcategory],
        ...(product.sizes || []),
        ...(product.colors || []).flatMap((color) => [color.nameAr, color.nameEn, color.id]),
      ].filter(Boolean).join(" "));
      if (q && !haystack.includes(q)) return false;
      if (filters.audience !== "all" && product.audience && product.audience !== "all" && product.audience !== filters.audience) return false;
      if (filters.size && !(product.sizes || []).includes(filters.size)) return false;
      if (filters.color && !(product.colors || []).some((color) => color.id === filters.color)) return false;
      const price = Number(product.offerPrice ?? product.price ?? 0);
      if (filters.minPrice && price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && price > Number(filters.maxPrice)) return false;
      // Legacy products without season metadata count as both until the admin
      // explicitly classifies them. This guarantees every visible product is
      // reachable from Summer, Winter, or both.
      const isSummer = Boolean(product.isSummer) || (!product.isSummer && !product.isWinter);
      const isWinter = Boolean(product.isWinter) || (!product.isSummer && !product.isWinter);
      if (filters.season === "summer" && !isSummer) return false;
      if (filters.season === "winter" && !isWinter) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const priceA = Number(a.offerPrice ?? a.price ?? 0);
      const priceB = Number(b.offerPrice ?? b.price ?? 0);
      if (filters.sort === "price-asc") return priceA - priceB;
      if (filters.sort === "price-desc") return priceB - priceA;
      if (filters.sort === "newest") return Number(b.id) - Number(a.id);
      return 0;
    });

    const title = type === "category" && categoryMap[slug]
      ? categoryMap[slug][locale]
      : titleMap[collectionSlug]?.[locale] || (type === "search" ? (isAr ? "نتائج البحث" : "Search results") : isAr ? "كل المنتجات" : "All products");

    return (
      <PageShell locale={locale} eyebrow="OH MY BABY" title={title} description={isAr ? "ابحثي وفلّتي واختاري القطعة المناسبة بسهولة." : "Search, filter and find the right piece with ease."}>
        {type === "category" && categoryMap[slug]?.world === "fashion" && <SeasonNav locale={locale} value={filters.season} onChange={(season) => setFilters((current) => ({ ...current, season }))} />}
        {type === "category" && categoryMap[slug]?.world === "fashion" && <SubcategoryNav locale={locale} categorySlug={slug} active={activeSubcategory} />}
        <Filters locale={locale} products={base} state={filters} setState={setFilters} categorySlug={slug} />
        {sorted.length ? (
          <div className="grid w-full grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">{sorted.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}</div>
        ) : (
          <div className="border border-espresso/10 bg-oat/25 p-14 text-center"><p className="text-xl font-black text-espresso">{isAr ? "ما لقينا منتجات مطابقة." : "No matching products found."}</p><p className="mt-3 text-sm text-espresso/60">{isAr ? "جرّبي تغيير القياس أو اللون أو كلمة البحث." : "Try changing your size, color or search."}</p></div>
        )}
      </PageShell>
    );
  }

  if (type === "services" && slug === "newborn-welcome") {
    return <WorldLanding locale={locale} worldId="baby-world" />;
  }

  const infoKey = cleanPath.replace(/^\//, "");
  if (infoPages[infoKey]) {
    return <InfoPage locale={locale} page={infoPages[infoKey]} />;
  }
  if (type === "social" && slug) {
    return <SocialPlaceholder locale={locale} network={slug} />;
  }

  return (
    <PageShell locale={locale} eyebrow="OH MY BABY" title={isAr ? "الصفحة غير موجودة" : "Page not found"} description={isAr ? "ارجعي للرئيسية واكتشفي الأقسام." : "Return home and explore the collections."}>
      <a href="/" className="omb-btn omb-btn-primary">{isAr ? "العودة للرئيسية" : "Back home"}</a>
    </PageShell>
  );
}
