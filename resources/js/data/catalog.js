export const fashionSubcategories = {
  newborn: [
    { id: "all", ar: "الكل", en: "All" },
    { id: "bodysuits", ar: "بودي", en: "Bodysuits" },
    { id: "sets", ar: "أطقم", en: "Sets" },
    { id: "pajamas", ar: "بيجامات", en: "Pajamas" },
    { id: "rompers", ar: "سالوبيت", en: "Rompers" },
    { id: "pants", ar: "بناطيل", en: "Pants" },
    { id: "knitwear", ar: "كنزات", en: "Knitwear" },
  ],
  girls: [
    { id: "all", ar: "الكل", en: "All" },
    { id: "dresses", ar: "فساتين", en: "Dresses" },
    { id: "sets", ar: "أطقم", en: "Sets" },
    { id: "tshirts", ar: "تيشيرتات", en: "T-Shirts" },
    { id: "shirts", ar: "قمصان", en: "Shirts" },
    { id: "knitwear", ar: "كنزات", en: "Knitwear" },
    { id: "jackets", ar: "جاكيتات", en: "Jackets" },
    { id: "pants", ar: "بناطيل", en: "Pants" },
    { id: "skirts", ar: "تنانير", en: "Skirts" },
    { id: "shorts", ar: "شورتات", en: "Shorts" },
    { id: "pajamas", ar: "بيجامات", en: "Pajamas" },
  ],
  boys: [
    { id: "all", ar: "الكل", en: "All" },
    { id: "sets", ar: "أطقم", en: "Sets" },
    { id: "tshirts", ar: "تيشيرتات", en: "T-Shirts" },
    { id: "shirts", ar: "قمصان", en: "Shirts" },
    { id: "knitwear", ar: "كنزات", en: "Knitwear" },
    { id: "jackets", ar: "جاكيتات", en: "Jackets" },
    { id: "pants", ar: "بناطيل", en: "Pants" },
    { id: "shorts", ar: "شورتات", en: "Shorts" },
    { id: "pajamas", ar: "بيجامات", en: "Pajamas" },
  ],
  shoes: [
    { id: "all", ar: "الكل", en: "All" },
    { id: "girls", ar: "بناتي", en: "Girls" },
    { id: "boys", ar: "صبياني", en: "Boys" },
  ],
  accessories: [
    { id: "all", ar: "الكل", en: "All" },
    { id: "bags", ar: "حقائب", en: "Bags" },
    { id: "hats", ar: "قبعات", en: "Hats" },
    { id: "socks", ar: "جوارب", en: "Socks" },
    { id: "hair", ar: "إكسسوارات شعر", en: "Hair Accessories" },
    { id: "other", ar: "تفاصيل أخرى", en: "Other Details" },
  ],
};

export const categoryTree = [
  {
    id: "fashion",
    ar: "الملابس والأزياء",
    en: "Clothing & Fashion",
    descriptionAr: "حديثي الولادة، بنات، أولاد، أحذية وتفاصيل.",
    descriptionEn: "Newborn, girls, boys, shoes and details.",
    children: [
      { id: "newborn", ar: "حديثي الولادة", en: "Newborn" },
      { id: "girls", ar: "بنات", en: "Girls" },
      { id: "boys", ar: "أولاد", en: "Boys" },
      { id: "shoes", ar: "أحذية", en: "Shoes" },
      { id: "accessories", ar: "Details / إكسسوارات", en: "Details / Accessories" },
    ],
  },
  {
    id: "baby-world",
    ar: "عالم الطفل",
    en: "Baby World",
    descriptionAr: "كل شيء للصغار أبعد من الملابس.",
    descriptionEn: "Everything for little ones beyond clothing.",
    children: [
      { id: "decor", ar: "استقبال المولود والتزيين", en: "Newborn Welcome & Decor" },
      { id: "mobility", ar: "عربايات ومقاعد", en: "Strollers & Seats" },
      { id: "gifts", ar: "هدايا", en: "Gifts" },
      { id: "baby-essentials", ar: "ألعاب ومستلزمات الطفل", en: "Toys & Essentials" },
    ],
  },
];

export const categoryMap = {
  newborn: { ar: "حديثي الولادة", en: "Newborn", world: "fashion", image: "/images/categories/optimized/newborn.webp", audience: ["all"] },
  girls: { ar: "بنات", en: "Girls", world: "fashion", image: "/images/categories/optimized/girls-v2.webp", audience: ["girls"] },
  boys: { ar: "أولاد", en: "Boys", world: "fashion", image: "/images/categories/optimized/boys-v2.webp", audience: ["boys"] },
  shoes: { ar: "أحذية", en: "Shoes", world: "fashion", image: "/images/categories/optimized/shoes.webp", audience: ["girls", "boys", "all"] },
  accessories: { ar: "Details / إكسسوارات", en: "Details / Accessories", world: "fashion", image: "/images/categories/optimized/accessories-gifts-v2.webp", audience: ["girls", "boys", "all"] },
  decor: { ar: "استقبال المولود والتزيين", en: "Newborn Welcome & Decor", world: "baby-world", image: "/images/home/services/newborn-welcome-optimized.webp", audience: ["all"] },
  mobility: { ar: "عربايات ومقاعد", en: "Strollers & Seats", world: "baby-world", image: "/images/home/categories/mobility-optimized.webp", audience: ["all"] },
  gifts: { ar: "هدايا", en: "Gifts", world: "baby-world", image: "/images/home/categories/newborn-gifts-optimized.webp", audience: ["all"] },
  "baby-essentials": { ar: "ألعاب ومستلزمات الطفل", en: "Toys & Essentials", world: "baby-world", image: "/images/home/categories/toys-essentials-optimized.webp", audience: ["all"] },
};

export const discoverySections = [
  { id: "home-hero", ar: "من نحن", en: "About us" },
  { id: "new-arrivals", ar: "وصل حديثاً", en: "New arrivals" },
  { id: "categories", ar: "ملابس", en: "Clothing" },
  { id: "product-hero", ar: "العروض", en: "Offers" },
  { id: "baby-world", ar: "عالم الطفل", en: "Baby World" },
  { id: "featured-collection", ar: "العودة إلى المدرسة", en: "Back to school" },
  { id: "newborn-essentials", ar: "حديثي الولادة", en: "Newborn" },
  { id: "best-sellers", ar: "الأكثر طلباً", en: "Best sellers" },
  { id: "account", ar: "تسجيل الدخول", en: "Sign in" },
];

export const placementOptions = [
  { id: "new-arrivals", ar: "وصل حديثاً", en: "New arrivals" },
  { id: "offers", ar: "العروض", en: "Offers" },
  { id: "featured-collection", ar: "العودة إلى المدرسة", en: "Back to school" },
  { id: "best-sellers", ar: "الأكثر طلباً", en: "Best sellers" },
];

export const babySizePresets = ["0-3M", "3-6M", "6-9M", "9-12M", "12-18M", "18-24M"];
export const kidsSizePresets = Array.from({ length: 15 }, (_, index) => `${index + 2}Y`);
export const shoeSizePresets = Array.from({ length: 20 }, (_, index) => String(index + 18));

export const colorPresets = [
  { id: "cream", ar: "سكري", en: "Cream", hex: "#e9e1d3" },
  { id: "white", ar: "أبيض", en: "White", hex: "#f7f5ef" },
  { id: "sand", ar: "رملي", en: "Sand", hex: "#c8b69d" },
  { id: "pink", ar: "وردي", en: "Pink", hex: "#e7c3c7" },
  { id: "blue", ar: "أزرق", en: "Blue", hex: "#8da8c6" },
  { id: "navy", ar: "كحلي", en: "Navy", hex: "#1f2a3d" },
  { id: "black", ar: "أسود", en: "Black", hex: "#161616" },
  { id: "olive", ar: "زيتي", en: "Olive", hex: "#7c8060" },
  { id: "yellow", ar: "أصفر", en: "Yellow", hex: "#eed77d" },
  { id: "brown", ar: "بني", en: "Brown", hex: "#8a654a" },
];

export function getSubcategories(categoryId) {
  return fashionSubcategories[categoryId] || [{ id: "all", ar: "الكل", en: "All" }];
}

export function getWorldById(worldId) {
  return categoryTree.find((world) => world.id === worldId) || null;
}

export function getCategory(categoryId) {
  return categoryMap[categoryId] || null;
}

export function getCategoryChildren(worldId) {
  return getWorldById(worldId)?.children || [];
}

export function getSizePresets(categoryId) {
  if (categoryId === "newborn") return babySizePresets;
  if (categoryId === "shoes") return shoeSizePresets;
  if (["girls", "boys"].includes(categoryId)) return kidsSizePresets;
  return [];
}
