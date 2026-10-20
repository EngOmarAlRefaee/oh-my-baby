// Editable storefront sections. Saved by Admin/Owner (permission site_content.edit),
// read publicly. When nothing was saved the built-in defaults below are used.

export const DEFAULT_FEATURED = {
  image: "/images/home/final/featured-kids.jpg",
  ctaHref: "/collections/back-to-school",
  secondaryHref: "/category/clothing",
  seasonTag: "SEASON 01",
  watermark: "BTS",
  ar: {
    eyebrow: "تشكيلة الموسم",
    sectionTitle: "العودة إلى المدرسة",
    sectionSubtitle: "تشكيلة مختارة للموسم الحالي، مصممة لأيام المدرسة براحة وأناقة.",
    badge: "موسم العودة للمدرسة",
    headline: "جاهزين لأول يوم.",
    description: "اختيارات مدرسية مريحة وعملية، من الملابس والأحذية للتفاصيل اليومية اللي بترافقهم بكل يوم دراسي.",
    cta: "اكتشف تشكيلة المدرسة",
    secondary: "تسوّق كل الأقسام",
    imageAlt: "تشكيلة العودة إلى المدرسة من OH MY BABY",
    tags: ["ملابس", "أحذية", "يوميات المدرسة"],
  },
  en: {
    eyebrow: "SEASONAL COLLECTION",
    sectionTitle: "BACK TO SCHOOL",
    sectionSubtitle: "A seasonal edit designed for comfortable, stylish school days.",
    badge: "Back to School Edit",
    headline: "Ready for the first day.",
    description: "Comfortable and practical school-day picks, from clothing and shoes to everyday essentials.",
    cta: "Explore the collection",
    secondary: "Shop all categories",
    imageAlt: "OH MY BABY Back to School collection",
    tags: ["Clothing", "Shoes", "School Essentials"],
  },
};

const TEXT_FIELDS = ["eyebrow", "sectionTitle", "sectionSubtitle", "badge", "headline", "description", "cta", "secondary", "imageAlt"];

let cachedContent; // undefined = not fetched yet, null = fetched and nothing saved

export function getCachedFeatured() {
  return cachedContent;
}

export async function prefetchFeaturedCollection({ timeoutMs = 4000 } = {}) {
  if (typeof window === "undefined") return undefined;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetch("/api/site/featured-collection", {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      signal: controller?.signal,
    });
    if (!response.ok) return cachedContent;
    const payload = await response.json();
    cachedContent = payload?.content || null;
  } catch {
    // keep whatever we had; the defaults render if nothing was ever fetched
  } finally {
    if (timer) window.clearTimeout(timer);
  }
  return cachedContent;
}

/** Flat, ready-to-render values for one locale (never empty for required text). */
export function resolveFeatured(content, locale = "ar") {
  const saved = content && typeof content === "object" ? content : null;
  const base = saved || DEFAULT_FEATURED;
  const lang = locale === "en" ? "en" : "ar";
  const pick = (field) => {
    if (!saved) return DEFAULT_FEATURED[lang][field] || "";
    // Missing English falls back to the Arabic text the admin wrote (never to the old season).
    return saved[lang]?.[field] || saved.ar?.[field] || "";
  };
  const out = {
    image: base.image || DEFAULT_FEATURED.image,
    ctaHref: base.ctaHref || DEFAULT_FEATURED.ctaHref,
    secondaryHref: base.secondaryHref || DEFAULT_FEATURED.secondaryHref,
    seasonTag: base.seasonTag ?? DEFAULT_FEATURED.seasonTag,
    watermark: base.watermark ?? DEFAULT_FEATURED.watermark,
    imageX: Number(base.imageX ?? 100),
    imageY: Number(base.imageY ?? 28),
    imageZoom: Number(base.imageZoom ?? 1),
  };
  TEXT_FIELDS.forEach((field) => { out[field] = pick(field); });
  const tags = saved ? (saved[lang]?.tags?.length ? saved[lang].tags : saved.ar?.tags) : DEFAULT_FEATURED[lang].tags;
  out.tags = Array.isArray(tags) ? tags : [];
  return out;
}
