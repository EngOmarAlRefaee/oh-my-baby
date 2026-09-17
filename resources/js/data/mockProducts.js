const colorBook = {
  cream: { id: "cream", nameAr: "كريمي", nameEn: "Cream", hex: "#eee7dc" },
  sand: { id: "sand", nameAr: "رملي", nameEn: "Sand", hex: "#c8b69d" },
  olive: { id: "olive", nameAr: "زيتي", nameEn: "Olive", hex: "#7c8060" },
  navy: { id: "navy", nameAr: "كحلي", nameEn: "Navy", hex: "#1f2a3d" },
  pink: { id: "pink", nameAr: "وردي", nameEn: "Pink", hex: "#e7c3c7" },
  white: { id: "white", nameAr: "أبيض", nameEn: "White", hex: "#f7f5ef" },
  black: { id: "black", nameAr: "أسود", nameEn: "Black", hex: "#161616" },
  blue: { id: "blue", nameAr: "أزرق", nameEn: "Blue", hex: "#8da8c6" },
  yellow: { id: "yellow", nameAr: "أصفر", nameEn: "Yellow", hex: "#eed77d" },
  brown: { id: "brown", nameAr: "بني", nameEn: "Brown", hex: "#8a654a" },
};

function buildInventory(colors, sizes, baseStock = 4, zeroVariants = []) {
  const inventory = {};
  const colorIds = colors.length ? colors.map((color) => color.id) : ["default"];
  const sizeIds = sizes.length ? sizes : ["default"];
  colorIds.forEach((colorId, colorIndex) => {
    sizeIds.forEach((size, sizeIndex) => {
      const key = `${colorId}::${size}`;
      inventory[key] = zeroVariants.includes(key)
        ? 0
        : Math.max(1, baseStock + ((colorIndex + sizeIndex) % 3) - 1);
    });
  });
  return inventory;
}

function makeProduct({
  id,
  name,
  nameEn,
  world = "fashion",
  category,
  categoryAr,
  categoryEn,
  subcategory = "all",
  audience = "all",
  price,
  oldPrice = null,
  offerPrice = null,
  descriptionAr,
  descriptionEn,
  image,
  badge = null,
  badgeEn = null,
  sizes = [],
  colorIds = [],
  sections = [],
  baseStock = 4,
  zeroVariants = [],
}) {
  const colors = colorIds.map((colorId) => ({ ...colorBook[colorId], image }));
  return {
    id,
    slug: `omb-${id}`,
    name,
    nameEn,
    world,
    category,
    categoryAr,
    categoryEn,
    subcategory,
    audience,
    price,
    oldPrice,
    offerPrice,
    descriptionAr,
    descriptionEn,
    image,
    badge,
    badgeEn,
    sizes,
    colors,
    inventory: buildInventory(colors, sizes, baseStock, zeroVariants),
    sections,
    status: "active",
  };
}

const kids = ["2Y", "3Y", "4Y", "5Y", "6Y", "7Y", "8Y"];
const older = ["8Y", "10Y", "12Y", "14Y", "16Y"];
const baby = ["0-3M", "3-6M", "6-9M", "9-12M", "12-18M", "18-24M"];
const shoes = ["24", "25", "26", "27", "28", "29", "30", "31", "32"];

export const mockProducts = [
  // Girls
  makeProduct({ id: 1, name: "فستان أطفال كريمي", nameEn: "Cream Kids Dress", category: "girls", categoryAr: "بنات", categoryEn: "Girls", subcategory: "dresses", audience: "girls", price: 34, offerPrice: 28, descriptionAr: "فستان ناعم بتفاصيل هادئة مناسب للطلعات والمناسبات الصغيرة.", descriptionEn: "A soft dress with quiet details for everyday occasions.", image: "/images/products/product-01-dress.jpg", badge: "جديد", badgeEn: "New", sizes: kids, colorIds: ["cream", "pink"], sections: ["new-arrivals", "offers", "best-sellers"], zeroVariants: ["pink::8Y"] }),
  makeProduct({ id: 2, name: "طقم بناتي يومي", nameEn: "Girls Everyday Set", category: "girls", categoryAr: "بنات", categoryEn: "Girls", subcategory: "sets", audience: "girls", price: 25, descriptionAr: "طقم عملي مريح للمدرسة والطلعات اليومية.", descriptionEn: "A comfortable everyday set for school and outings.", image: "/images/products/bestseller-01.jpg", sizes: kids, colorIds: ["cream", "pink"], sections: ["new-arrivals", "featured-collection"] }),
  makeProduct({ id: 3, name: "بيجاما بناتي ناعمة", nameEn: "Soft Girls Pajamas", category: "girls", categoryAr: "بنات", categoryEn: "Girls", subcategory: "pajamas", audience: "girls", price: 19, descriptionAr: "بيجاما قطنية مريحة لليالي الهادئة.", descriptionEn: "Soft cotton pajamas for quiet nights.", image: "/images/products/bestseller-02.jpg", sizes: kids, colorIds: ["pink", "cream"], sections: ["best-sellers"] }),
  makeProduct({ id: 4, name: "بنطال بناتي مريح", nameEn: "Girls Easy Pants", category: "girls", categoryAr: "بنات", categoryEn: "Girls", subcategory: "pants", audience: "girls", price: 27, descriptionAr: "قصة مريحة تشمل خيارات قماش وجينز ضمن قسم البناطيل.", descriptionEn: "An easy fit including fabric and denim options within pants.", image: "/images/products/product-04-pants.jpg", sizes: older, colorIds: ["sand", "blue"], sections: ["featured-collection", "best-sellers"] }),
  makeProduct({ id: 5, name: "جاكيت بناتي خفيف", nameEn: "Girls Light Jacket", category: "girls", categoryAr: "بنات", categoryEn: "Girls", subcategory: "jackets", audience: "girls", price: 36, descriptionAr: "طبقة خفيفة للمدرسة والطلعات.", descriptionEn: "A light layer for school and days out.", image: "/images/home/hero/hero-04-girl-studio.jpg", sizes: older, colorIds: ["cream", "pink"], sections: ["new-arrivals"] }),
  makeProduct({ id: 6, name: "تنورة بناتي أنيقة", nameEn: "Girls Editorial Skirt", category: "girls", categoryAr: "بنات", categoryEn: "Girls", subcategory: "skirts", audience: "girls", price: 24, descriptionAr: "تنورة بسيطة بتفاصيل مرتبة.", descriptionEn: "A simple skirt with polished details.", image: "/images/products/product-01-dress.jpg", sizes: kids, colorIds: ["cream", "brown"], sections: ["offers"], offerPrice: 20 }),

  // Boys
  makeProduct({ id: 7, name: "طقم أطفال Tom & Jerry", nameEn: "Tom & Jerry Kids Set", category: "boys", categoryAr: "أولاد", categoryEn: "Boys", subcategory: "sets", audience: "boys", price: 22, descriptionAr: "طقم يومي مريح للحركة واللعب طوال اليوم.", descriptionEn: "An easy everyday set made for movement and play.", image: "/images/products/product-02-tom-jerry-set.jpg", badge: "وصل حديثاً", badgeEn: "New arrival", sizes: kids, colorIds: ["navy", "cream"], sections: ["new-arrivals", "featured-collection"] }),
  makeProduct({ id: 8, name: "أوفرول جينز للأطفال", nameEn: "Kids Denim Overalls", category: "boys", categoryAr: "أولاد", categoryEn: "Boys", subcategory: "pants", audience: "boys", price: 26, descriptionAr: "أوفرول جينز عملي ضمن قسم البناطيل.", descriptionEn: "A practical denim overall within the pants edit.", image: "/images/products/product-03-overalls.jpg", sizes: kids, colorIds: ["blue"], sections: ["best-sellers", "featured-collection"] }),
  makeProduct({ id: 9, name: "بنطال أطفال ملون", nameEn: "Kids Colored Pants", category: "boys", categoryAr: "أولاد", categoryEn: "Boys", subcategory: "pants", audience: "boys", price: 24, descriptionAr: "بنطال مريح بقصة يومية ولون سهل للتنسيق.", descriptionEn: "Comfortable everyday pants with an easy-to-style color.", image: "/images/products/product-04-pants.jpg", badge: "الأكثر طلباً", badgeEn: "Best seller", sizes: kids, colorIds: ["sand", "olive"], sections: ["best-sellers", "featured-collection"] }),
  makeProduct({ id: 10, name: "تيشيرت أولاد يومي", nameEn: "Boys Everyday T-Shirt", category: "boys", categoryAr: "أولاد", categoryEn: "Boys", subcategory: "tshirts", audience: "boys", price: 16, descriptionAr: "تيشيرت خفيف للمدرسة واللعب.", descriptionEn: "A lightweight tee for school and play.", image: "/images/home/hero/hero-01-boys-studio.jpg", sizes: older, colorIds: ["navy", "white"], sections: ["new-arrivals", "featured-collection"] }),
  makeProduct({ id: 11, name: "قميص أولاد كلاسيكي", nameEn: "Classic Boys Shirt", category: "boys", categoryAr: "أولاد", categoryEn: "Boys", subcategory: "shirts", audience: "boys", price: 28, offerPrice: 23, descriptionAr: "قميص مرتب للمناسبات والمدرسة.", descriptionEn: "A polished shirt for occasions and school.", image: "/images/home/hero-curated/hero-01-boys.jpg", sizes: older, colorIds: ["white", "blue"], sections: ["offers", "featured-collection"] }),
  makeProduct({ id: 12, name: "بيجاما أولاد مريحة", nameEn: "Boys Comfort Pajamas", category: "boys", categoryAr: "أولاد", categoryEn: "Boys", subcategory: "pajamas", audience: "boys", price: 18, descriptionAr: "خامة مريحة وقصة بسيطة للنوم.", descriptionEn: "A simple comfortable set for bedtime.", image: "/images/products/bestseller-04.jpg", sizes: kids, colorIds: ["blue", "cream"], sections: ["best-sellers"] }),

  // Newborn fashion
  makeProduct({ id: 13, name: "طقم مولود ناعم", nameEn: "Soft Newborn Set", category: "newborn", categoryAr: "حديثي الولادة", categoryEn: "Newborn", subcategory: "sets", price: 21, descriptionAr: "طقم ناعم ومريح للأيام الأولى.", descriptionEn: "A soft comfortable set for the first days.", image: "/images/home/final/newborn-section-optimized.webp", sizes: baby, colorIds: ["cream", "blue"], sections: ["new-arrivals", "best-sellers"] }),
  makeProduct({ id: 14, name: "بودي حديثي الولادة", nameEn: "Newborn Bodysuit", category: "newborn", categoryAr: "حديثي الولادة", categoryEn: "Newborn", subcategory: "bodysuits", price: 14, descriptionAr: "بودي ناعم للاستخدام اليومي.", descriptionEn: "A soft everyday newborn bodysuit.", image: "/images/categories/newborn-optimized.webp", sizes: baby, colorIds: ["white", "cream"], sections: ["new-arrivals"] }),
  makeProduct({ id: 15, name: "بيجاما مولود", nameEn: "Newborn Pajamas", category: "newborn", categoryAr: "حديثي الولادة", categoryEn: "Newborn", subcategory: "pajamas", price: 20, offerPrice: 17, descriptionAr: "بيجاما مريحة للنوم والراحة.", descriptionEn: "Comfortable pajamas for sleep and rest.", image: "/images/home/hero/hero-03-newborn.jpg", sizes: baby, colorIds: ["blue", "cream"], sections: ["offers", "best-sellers"] }),
  makeProduct({ id: 16, name: "سالوبيت مولود", nameEn: "Newborn Romper", category: "newborn", categoryAr: "حديثي الولادة", categoryEn: "Newborn", subcategory: "rompers", price: 20, descriptionAr: "سالوبيت عملي وناعم لأول الشهور.", descriptionEn: "A practical soft romper for the first months.", image: "/images/home/hero-curated/hero-03-newborn.jpg", sizes: baby, colorIds: ["cream", "pink"], sections: ["new-arrivals"] }),
  makeProduct({ id: 17, name: "بنطال مولود قطني", nameEn: "Newborn Cotton Pants", category: "newborn", categoryAr: "حديثي الولادة", categoryEn: "Newborn", subcategory: "pants", price: 13, descriptionAr: "بنطال قطني خفيف لأول أيامهم.", descriptionEn: "Light cotton pants for their first days.", image: "/images/home/final/newborn-section-optimized.webp", sizes: baby, colorIds: ["sand", "cream"], sections: ["best-sellers"] }),

  // Shoes
  makeProduct({ id: 18, name: "حذاء بناتي يومي", nameEn: "Girls Everyday Shoes", category: "shoes", categoryAr: "أحذية", categoryEn: "Shoes", subcategory: "girls", audience: "girls", price: 29, descriptionAr: "حذاء مريح للخطوات اليومية.", descriptionEn: "Comfortable shoes for everyday steps.", image: "/images/categories/optimized/shoes.webp", sizes: shoes, colorIds: ["cream", "pink"], sections: ["new-arrivals", "featured-collection"] }),
  makeProduct({ id: 19, name: "حذاء صبياني رياضي", nameEn: "Boys Sport Shoes", category: "shoes", categoryAr: "أحذية", categoryEn: "Shoes", subcategory: "boys", audience: "boys", price: 36, offerPrice: 31, descriptionAr: "حذاء خفيف للحركة والمدرسة.", descriptionEn: "Light shoes for movement and school.", image: "/images/categories/shoes-optimized.webp", sizes: shoes, colorIds: ["black", "navy"], sections: ["offers", "featured-collection", "best-sellers"] }),
  makeProduct({ id: 20, name: "حذاء بناتي للمناسبات", nameEn: "Girls Occasion Shoes", category: "shoes", categoryAr: "أحذية", categoryEn: "Shoes", subcategory: "girls", audience: "girls", price: 33, descriptionAr: "تصميم هادئ للمناسبات والزيارات.", descriptionEn: "A quiet polished design for occasions.", image: "/images/products/bestseller-01.jpg", sizes: shoes, colorIds: ["cream", "white"], sections: ["best-sellers"] }),
  makeProduct({ id: 21, name: "حذاء صبياني كلاسيكي", nameEn: "Classic Boys Shoes", category: "shoes", categoryAr: "أحذية", categoryEn: "Shoes", subcategory: "boys", audience: "boys", price: 35, descriptionAr: "حذاء مرتب بتفاصيل بسيطة.", descriptionEn: "Polished boys shoes with simple details.", image: "/images/categories/optimized/shoes.webp", sizes: shoes, colorIds: ["black", "sand"], sections: ["new-arrivals"] }),

  // Details / Accessories
  makeProduct({ id: 22, name: "حقيبة أطفال صغيرة", nameEn: "Small Kids Bag", category: "accessories", categoryAr: "Details / إكسسوارات", categoryEn: "Details / Accessories", subcategory: "bags", price: 18, descriptionAr: "حقيبة خفيفة للتفاصيل اليومية.", descriptionEn: "A lightweight bag for everyday essentials.", image: "/images/categories/optimized/accessories-gifts-v2.webp", colorIds: ["cream", "pink"], sections: ["new-arrivals", "featured-collection"] }),
  makeProduct({ id: 23, name: "قبعة أطفال", nameEn: "Kids Hat", category: "accessories", categoryAr: "Details / إكسسوارات", categoryEn: "Details / Accessories", subcategory: "hats", price: 12, descriptionAr: "قبعة خفيفة للطلعات.", descriptionEn: "A lightweight hat for days out.", image: "/images/categories/optimized/accessories.webp", colorIds: ["sand", "navy"], sections: ["best-sellers"] }),
  makeProduct({ id: 24, name: "مجموعة جوارب", nameEn: "Kids Socks Set", category: "accessories", categoryAr: "Details / إكسسوارات", categoryEn: "Details / Accessories", subcategory: "socks", price: 9, descriptionAr: "مجموعة جوارب ناعمة للاستخدام اليومي.", descriptionEn: "A soft set of everyday socks.", image: "/images/products/bestseller-02.jpg", colorIds: ["white", "cream"], sections: ["new-arrivals"] }),
  makeProduct({ id: 25, name: "إكسسوار شعر بناتي", nameEn: "Girls Hair Accessory", category: "accessories", categoryAr: "Details / إكسسوارات", categoryEn: "Details / Accessories", subcategory: "hair", audience: "girls", price: 10, offerPrice: 8, descriptionAr: "تفصيل بسيط يكمل الإطلالة.", descriptionEn: "A small detail to finish the look.", image: "/images/categories/gifts-optimized.webp", colorIds: ["pink", "cream"], sections: ["offers", "best-sellers"] }),

  // Baby World: mobility
  makeProduct({ id: 26, name: "عربة أطفال يومية", nameEn: "Everyday Baby Stroller", world: "baby-world", category: "mobility", categoryAr: "عربايات ومقاعد", categoryEn: "Strollers & Seats", price: 145, descriptionAr: "عربة عملية للطلعات اليومية.", descriptionEn: "A practical stroller for everyday outings.", image: "/images/home/categories/mobility-optimized.webp", colorIds: ["black", "sand"], sections: ["new-arrivals", "best-sellers"], baseStock: 3 }),
  makeProduct({ id: 27, name: "مقعد سيارة للأطفال", nameEn: "Baby Car Seat", world: "baby-world", category: "mobility", categoryAr: "عربايات ومقاعد", categoryEn: "Strollers & Seats", price: 135, offerPrice: 119, descriptionAr: "مقعد مريح للاستخدام اليومي.", descriptionEn: "A comfortable car seat for everyday use.", image: "/images/home/categories/mobility-optimized.webp", colorIds: ["black", "navy"], sections: ["offers"], baseStock: 3 }),
  makeProduct({ id: 28, name: "عربة سفر خفيفة", nameEn: "Light Travel Stroller", world: "baby-world", category: "mobility", categoryAr: "عربايات ومقاعد", categoryEn: "Strollers & Seats", price: 129, descriptionAr: "عربة خفيفة وسهلة للاستخدام اليومي والسفر.", descriptionEn: "A lightweight stroller for everyday use and travel.", image: "/images/home/categories/mobility-optimized.webp", colorIds: ["sand", "black"], sections: ["new-arrivals"] }),
  makeProduct({ id: 29, name: "مقعد طفل مريح", nameEn: "Comfort Baby Seat", world: "baby-world", category: "mobility", categoryAr: "عربايات ومقاعد", categoryEn: "Strollers & Seats", price: 89, descriptionAr: "مقعد عملي بتفاصيل بسيطة.", descriptionEn: "A practical seat with simple details.", image: "/images/home/categories/mobility-optimized.webp", colorIds: ["cream"], sections: ["best-sellers"] }),

  // Baby World: gifts
  makeProduct({ id: 30, name: "هدية مولود مختارة", nameEn: "Curated Newborn Gift", world: "baby-world", category: "gifts", categoryAr: "هدايا", categoryEn: "Gifts", price: 35, descriptionAr: "هدية جاهزة بتفاصيل هادئة.", descriptionEn: "A ready-to-give newborn gift with quiet details.", image: "/images/home/categories/newborn-gifts-optimized.webp", colorIds: ["cream"], sections: ["new-arrivals", "best-sellers"] }),
  makeProduct({ id: 31, name: "صندوق هدية صغير", nameEn: "Little Gift Box", world: "baby-world", category: "gifts", categoryAr: "هدايا", categoryEn: "Gifts", price: 26, descriptionAr: "صندوق هدية بسيط ومميز.", descriptionEn: "A simple, thoughtful little gift box.", image: "/images/home/final/gifts-section-optimized.webp", sections: ["new-arrivals"] }),
  makeProduct({ id: 32, name: "هدية ناعمة للصغار", nameEn: "Soft Little Gift", world: "baby-world", category: "gifts", categoryAr: "هدايا", categoryEn: "Gifts", price: 22, descriptionAr: "هدية لطيفة بتغليف بسيط.", descriptionEn: "A gentle gift with simple wrapping.", image: "/images/home/categories/newborn-gifts-optimized.webp", sections: ["best-sellers"] }),
  makeProduct({ id: 33, name: "باقة هدية OH MY BABY", nameEn: "OH MY BABY Gift Edit", world: "baby-world", category: "gifts", categoryAr: "هدايا", categoryEn: "Gifts", price: 42, offerPrice: 36, descriptionAr: "اختيار هدية جاهز للمناسبات.", descriptionEn: "A ready gifting edit for special occasions.", image: "/images/home/final/gifts-section-optimized.webp", sections: ["offers"] }),

  // Baby World: toys & essentials
  makeProduct({ id: 34, name: "لعبة ناعمة للطفل", nameEn: "Soft Baby Toy", world: "baby-world", category: "baby-essentials", categoryAr: "ألعاب ومستلزمات الطفل", categoryEn: "Toys & Essentials", price: 16, descriptionAr: "لعبة ناعمة وخفيفة للصغار.", descriptionEn: "A soft lightweight toy for little ones.", image: "/images/home/categories/toys-essentials-optimized.webp", sections: ["new-arrivals", "best-sellers"] }),
  makeProduct({ id: 35, name: "مستلزم يومي للطفل", nameEn: "Everyday Baby Essential", world: "baby-world", category: "baby-essentials", categoryAr: "ألعاب ومستلزمات الطفل", categoryEn: "Toys & Essentials", price: 14, descriptionAr: "قطعة عملية للاستخدام اليومي.", descriptionEn: "A practical everyday baby essential.", image: "/images/categories/toys-optimized.webp", sections: ["new-arrivals"] }),
  makeProduct({ id: 36, name: "لعبة تفاصيل صغيرة", nameEn: "Little Details Toy", world: "baby-world", category: "baby-essentials", categoryAr: "ألعاب ومستلزمات الطفل", categoryEn: "Toys & Essentials", price: 18, descriptionAr: "لعبة بسيطة لعالمهم الصغير.", descriptionEn: "A simple toy for their little world.", image: "/images/home/categories/toys-essentials-optimized.webp", sections: ["best-sellers"] }),
  makeProduct({ id: 37, name: "مجموعة مستلزمات صغيرة", nameEn: "Little Essentials Set", world: "baby-world", category: "baby-essentials", categoryAr: "ألعاب ومستلزمات الطفل", categoryEn: "Toys & Essentials", price: 21, offerPrice: 18, descriptionAr: "مجموعة عملية مختارة للاستخدام اليومي.", descriptionEn: "A practical edit of everyday essentials.", image: "/images/categories/toys-optimized.webp", sections: ["offers"] }),

  // Baby World: decor (provisional catalog data)
  makeProduct({ id: 38, name: "باقة استقبال مولود هادئة", nameEn: "Soft Newborn Welcome Set", world: "baby-world", category: "decor", categoryAr: "استقبال المولود والتزيين", categoryEn: "Newborn Welcome & Decor", price: 65, descriptionAr: "باقة تجريبية لتعبئة القسم إلى أن يتم تحديد الخدمة النهائية.", descriptionEn: "Demo welcome set until the final service flow is defined.", image: "/images/home/services/newborn-welcome-optimized.webp", sections: ["new-arrivals"] }),
  makeProduct({ id: 39, name: "تزيين استقبال بسيط", nameEn: "Simple Welcome Decor", world: "baby-world", category: "decor", categoryAr: "استقبال المولود والتزيين", categoryEn: "Newborn Welcome & Decor", price: 85, descriptionAr: "عنصر تجريبي للقسم المبدئي.", descriptionEn: "Demo item for the provisional decor section.", image: "/images/home/services/newborn-welcome-optimized.webp", sections: [] }),
  makeProduct({ id: 40, name: "تفاصيل استقبال مولود", nameEn: "Newborn Welcome Details", world: "baby-world", category: "decor", categoryAr: "استقبال المولود والتزيين", categoryEn: "Newborn Welcome & Decor", price: 45, descriptionAr: "تفاصيل تجريبية للقسم لحين تحديد نموذج الخدمة.", descriptionEn: "Demo details until the service model is finalized.", image: "/images/home/services/newborn-welcome-optimized.webp", sections: ["best-sellers"] }),
  makeProduct({ id: 41, name: "باقة استقبال مميزة", nameEn: "Signature Welcome Edit", world: "baby-world", category: "decor", categoryAr: "استقبال المولود والتزيين", categoryEn: "Newborn Welcome & Decor", price: 110, offerPrice: 95, descriptionAr: "باقة عرض تجريبية للقسم الجديد.", descriptionEn: "A demo promotional welcome edit.", image: "/images/home/services/newborn-welcome-optimized.webp", sections: ["offers"] }),

  // Extra demo products so every visible fashion subcategory has content during the presentation.
  makeProduct({ id: 42, name: "تيشيرت بناتي ناعم", nameEn: "Soft Girls T-Shirt", category: "girls", categoryAr: "بنات", categoryEn: "Girls", subcategory: "tshirts", audience: "girls", price: 17, descriptionAr: "تيشيرت يومي خفيف بقصة مريحة.", descriptionEn: "A lightweight everyday tee with an easy fit.", image: "/images/home/hero/hero-04-girl-studio.jpg", sizes: kids, colorIds: ["cream", "pink"], sections: ["new-arrivals"] }),
  makeProduct({ id: 43, name: "قميص بناتي بسيط", nameEn: "Girls Easy Shirt", category: "girls", categoryAr: "بنات", categoryEn: "Girls", subcategory: "shirts", audience: "girls", price: 25, descriptionAr: "قميص مرتب للمدرسة والطلعات.", descriptionEn: "A polished shirt for school and days out.", image: "/images/products/product-01-dress.jpg", sizes: older, colorIds: ["white", "cream"], sections: ["featured-collection"] }),
  makeProduct({ id: 44, name: "كنزة بناتي خفيفة", nameEn: "Girls Light Knit", category: "girls", categoryAr: "بنات", categoryEn: "Girls", subcategory: "knitwear", audience: "girls", price: 29, descriptionAr: "كنزة خفيفة للطبقات اليومية.", descriptionEn: "A light knit for everyday layering.", image: "/images/home/hero/hero-04-girl-studio.jpg", sizes: older, colorIds: ["cream", "brown"], sections: ["best-sellers"] }),
  makeProduct({ id: 45, name: "شورت بناتي يومي", nameEn: "Girls Everyday Shorts", category: "girls", categoryAr: "بنات", categoryEn: "Girls", subcategory: "shorts", audience: "girls", price: 18, offerPrice: 15, descriptionAr: "شورت مريح للأيام الدافئة.", descriptionEn: "Easy shorts for warmer days.", image: "/images/products/product-04-pants.jpg", sizes: kids, colorIds: ["sand", "pink"], sections: ["offers"] }),

  makeProduct({ id: 46, name: "كنزة أولاد خفيفة", nameEn: "Boys Light Knit", category: "boys", categoryAr: "أولاد", categoryEn: "Boys", subcategory: "knitwear", audience: "boys", price: 28, descriptionAr: "كنزة يومية مريحة للمدرسة والطلعات.", descriptionEn: "An easy knit for school and outings.", image: "/images/home/hero/hero-01-boys-studio.jpg", sizes: older, colorIds: ["navy", "cream"], sections: ["new-arrivals"] }),
  makeProduct({ id: 47, name: "جاكيت أولاد خفيف", nameEn: "Boys Light Jacket", category: "boys", categoryAr: "أولاد", categoryEn: "Boys", subcategory: "jackets", audience: "boys", price: 39, descriptionAr: "جاكيت عملي بطبقة خفيفة.", descriptionEn: "A practical lightweight jacket.", image: "/images/home/hero-curated/hero-01-boys.jpg", sizes: older, colorIds: ["navy", "brown"], sections: ["best-sellers", "featured-collection"] }),
  makeProduct({ id: 48, name: "شورت أولاد مريح", nameEn: "Boys Easy Shorts", category: "boys", categoryAr: "أولاد", categoryEn: "Boys", subcategory: "shorts", audience: "boys", price: 19, descriptionAr: "شورت خفيف للحركة واللعب.", descriptionEn: "Light shorts made for movement and play.", image: "/images/products/product-04-pants.jpg", sizes: kids, colorIds: ["sand", "navy"], sections: ["new-arrivals"] }),

  makeProduct({ id: 49, name: "كنزة مولود ناعمة", nameEn: "Soft Newborn Knit", category: "newborn", categoryAr: "حديثي الولادة", categoryEn: "Newborn", subcategory: "knitwear", price: 18, descriptionAr: "كنزة ناعمة وخفيفة للأشهر الأولى.", descriptionEn: "A soft lightweight knit for the first months.", image: "/images/home/final/newborn-section-optimized.webp", sizes: baby, colorIds: ["cream", "blue"], sections: ["new-arrivals", "best-sellers"] }),
  makeProduct({ id: 50, name: "تفصيل أطفال صغير", nameEn: "Little Kids Detail", category: "accessories", categoryAr: "Details / إكسسوارات", categoryEn: "Details / Accessories", subcategory: "other", price: 11, descriptionAr: "تفصيل صغير يكمل الإطلالة اليومية.", descriptionEn: "A small detail to finish an everyday look.", image: "/images/categories/optimized/accessories-gifts-v2.webp", colorIds: ["cream", "sand"], sections: ["new-arrivals"] }),
];
