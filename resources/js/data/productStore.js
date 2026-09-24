import { mockProducts } from "./mockProducts";

export const PRODUCTS_STORAGE_KEY = "omb-admin-products";
export const CART_STORAGE_KEY = "omb-cart";
export const WISHLIST_STORAGE_KEY = "omb-wishlist";
export const CATALOG_SCHEMA_KEY = "omb-catalog-schema";
export const CATALOG_BACKUP_KEY = "omb-admin-products-before-v2";
const CATALOG_SCHEMA_VERSION = 2;

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function inventoryKey(colorId = "default", size = "default") {
  return `${colorId || "default"}::${size || "default"}`;
}

function buildFallbackInventory(colors, sizes, defaultStock = 4) {
  const inventory = {};
  const colorIds = colors.length ? colors.map((color) => color.id) : ["default"];
  const sizeIds = sizes.length ? sizes : ["default"];
  colorIds.forEach((colorId) => {
    sizeIds.forEach((size) => {
      inventory[inventoryKey(colorId, size)] = defaultStock;
    });
  });
  return inventory;
}

export function normalizeProduct(product) {
  const rawColors = Array.isArray(product.colors) ? product.colors : [];
  const colors = rawColors.map((color) => {
    const images = Array.isArray(color.images)
      ? color.images.filter(Boolean)
      : color.image
        ? [color.image]
        : [];
    return {
      ...color,
      image: color.image || images[0] || product.image || "",
      images,
    };
  });
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const inventory = Object.keys(product.inventory || {}).length
    ? { ...product.inventory }
    : buildFallbackInventory(colors, sizes, Number(product.stock ?? 4));
  const firstColorImage = colors.find((color) => color.image)?.image;

  return {
    ...product,
    world:
      product.world ||
      (["newborn", "girls", "boys", "shoes", "accessories"].includes(product.category)
        ? "fashion"
        : "baby-world"),
    subcategory: product.subcategory || "all",
    slug: product.slug || `product-${product.id}`,
    status: product.status || "active",
    sections: Array.isArray(product.sections) ? product.sections : [],
    // Every catalog product must belong to summer, winter, or both.
    // Legacy products that predate the season flags are treated as both so
    // the new filters never hide the existing catalog by accident.
    isSummer: Boolean(product.isSummer) || (!Boolean(product.isSummer) && !Boolean(product.isWinter)),
    isWinter: Boolean(product.isWinter) || (!Boolean(product.isSummer) && !Boolean(product.isWinter)),
    bestSellerPinned: Boolean(product.bestSellerPinned),
    bestSellerOrder: Number(product.bestSellerOrder || 0),
    offerPrice: product.offerPrice === "" || product.offerPrice == null ? null : Number(product.offerPrice),
    price: Number(product.price || 0),
    colors,
    sizes,
    inventory,
    image: product.image || firstColorImage || "/images/products/product-01-dress.jpg",
  };
}

function migrateLegacyProducts(savedProducts) {
  const defaultsById = new Map(mockProducts.map((product) => [String(product.id), product]));
  const savedById = new Map(
    savedProducts.map((product) => [String(product.id), product]),
  );

  // Keep any previous user/admin edits, but backfill the new catalog structure
  // (world, subcategory, inventory, etc.) from the upgraded demo catalog.
  const mergedDefaults = mockProducts.map((product) => {
    const saved = savedById.get(String(product.id));
    if (!saved) return product;
    return {
      ...product,
      ...saved,
      world: saved.world || product.world,
      subcategory: saved.subcategory || product.subcategory,
      sections: Array.isArray(saved.sections) ? saved.sections : product.sections,
      colors: Array.isArray(saved.colors) && saved.colors.length ? saved.colors : product.colors,
      sizes: Array.isArray(saved.sizes) && saved.sizes.length ? saved.sizes : product.sizes,
      inventory:
        saved.inventory && Object.keys(saved.inventory).length
          ? saved.inventory
          : product.inventory,
    };
  });

  const customProducts = savedProducts.filter(
    (product) => !defaultsById.has(String(product.id)),
  );

  return [...customProducts, ...mergedDefaults].map(normalizeProduct);
}

export function getProducts() {
  if (typeof window === "undefined") return mockProducts.map(normalizeProduct);

  const saved = safeParse(window.localStorage.getItem(PRODUCTS_STORAGE_KEY), null);
  const schemaVersion = Number(window.localStorage.getItem(CATALOG_SCHEMA_KEY) || 1);
  if (!Array.isArray(saved)) return mockProducts.map(normalizeProduct);
  if (!saved.length) {
    return schemaVersion >= CATALOG_SCHEMA_VERSION
      ? []
      : mockProducts.map(normalizeProduct);
  }

  if (schemaVersion < CATALOG_SCHEMA_VERSION) {
    try {
      if (!window.localStorage.getItem(CATALOG_BACKUP_KEY)) {
        window.localStorage.setItem(CATALOG_BACKUP_KEY, JSON.stringify(saved));
      }
      const migrated = migrateLegacyProducts(saved);
      window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(migrated));
      window.localStorage.setItem(CATALOG_SCHEMA_KEY, String(CATALOG_SCHEMA_VERSION));
      return migrated;
    } catch {
      // If storage is unavailable/full, keep the old products rather than losing them.
      return saved.map(normalizeProduct);
    }
  }

  return saved.map(normalizeProduct);
}

export function saveProducts(products) {
  if (typeof window === "undefined") return { ok: false, reason: "no-window" };
  try {
    window.localStorage.setItem(
      PRODUCTS_STORAGE_KEY,
      JSON.stringify(products.map(normalizeProduct)),
    );
    window.localStorage.setItem(CATALOG_SCHEMA_KEY, String(CATALOG_SCHEMA_VERSION));
    window.dispatchEvent(new CustomEvent("omb:products-updated"));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error?.name === "QuotaExceededError" ? "storage-full" : "storage-error",
    };
  }
}

export function getProductById(productId) {
  return getProducts().find((product) => String(product.id) === String(productId)) || null;
}

export function getProductsForSection(section) {
  return getProducts().filter(
    (product) => product.status !== "inactive" && product.sections?.includes(section),
  );
}

export function getVariantStock(product, colorId = "default", size = "default") {
  const normalized = normalizeProduct(product);
  return Math.max(
    0,
    Number(normalized.inventory?.[inventoryKey(colorId, size)] || 0),
  );
}

export function getProductStock(product) {
  return Object.values(normalizeProduct(product).inventory || {}).reduce(
    (sum, value) => sum + Math.max(0, Number(value || 0)),
    0,
  );
}

export function isProductOutOfStock(product) {
  return getProductStock(product) <= 0;
}

export function getAvailableSizesForColor(product, colorId = "default") {
  const normalized = normalizeProduct(product);
  if (!normalized.sizes.length) return [];
  return normalized.sizes.filter(
    (size) => getVariantStock(normalized, colorId, size) > 0,
  );
}

export function getAvailableColors(product) {
  const normalized = normalizeProduct(product);
  if (!normalized.colors.length) return [];
  return normalized.colors.filter((color) => {
    if (!normalized.sizes.length) {
      return getVariantStock(normalized, color.id, "default") > 0;
    }
    return normalized.sizes.some(
      (size) => getVariantStock(normalized, color.id, size) > 0,
    );
  });
}

export function getCart() {
  if (typeof window === "undefined") return [];
  const cart = safeParse(window.localStorage.getItem(CART_STORAGE_KEY), []);
  return Array.isArray(cart) ? cart : [];
}

function saveCart(cart) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("omb:cart-updated"));
}

export function getCartQuantity(
  productId,
  colorId = "default",
  size = "default",
) {
  return getCart()
    .filter(
      (item) =>
        String(item.productId) === String(productId) &&
        (item.colorId || "default") === (colorId || "default") &&
        (item.size || "default") === (size || "default"),
    )
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

export function addToCart(
  product,
  { colorId = "default", size = "default", quantity = 1 } = {},
) {
  const stock = getVariantStock(product, colorId, size);
  const cart = getCart();
  const key = `${product.id}::${colorId || "default"}::${size || "default"}`;
  const existingIndex = cart.findIndex((item) => item.key === key);
  const existingQuantity =
    existingIndex >= 0 ? Number(cart[existingIndex].quantity || 0) : 0;
  const requested = existingQuantity + Number(quantity || 0);

  if (stock <= 0) return { ok: false, reason: "out-of-stock", available: 0, stock };
  if (requested > stock) {
    return {
      ok: false,
      reason: "max-stock",
      available: Math.max(0, stock - existingQuantity),
      stock,
    };
  }

  const nextItem = {
    key,
    productId: product.id,
    colorId: colorId || "default",
    size: size || "default",
    quantity: requested,
    addedAt: Date.now(),
  };
  if (existingIndex >= 0) cart[existingIndex] = nextItem;
  else cart.push(nextItem);
  saveCart(cart);
  return { ok: true, quantity: requested, stock };
}

export function setCartItemQuantity(key, quantity) {
  const cart = getCart();
  const index = cart.findIndex((item) => item.key === key);
  if (index < 0) return { ok: false, reason: "missing" };
  const item = cart[index];
  const product = getProductById(item.productId);
  if (!product) return { ok: false, reason: "missing-product" };
  const stock = getVariantStock(product, item.colorId, item.size);
  const nextQuantity = Math.max(1, Number(quantity || 1));
  if (nextQuantity > stock) return { ok: false, reason: "max-stock", stock };
  cart[index] = { ...item, quantity: nextQuantity };
  saveCart(cart);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("omb:cart-added", {
      detail: { productId: product.id, productName: product.name, productNameEn: product.nameEn || product.name, quantity },
    }));
  }
  return { ok: true, quantity: nextQuantity, stock };
}

export function removeCartItem(key) {
  saveCart(getCart().filter((item) => item.key !== key));
}

export function clearCart() {
  saveCart([]);
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

export function getCartDetailed() {
  return getCart()
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      const color = product.colors?.find((entry) => entry.id === item.colorId) || null;
      const price = Number(product.offerPrice ?? product.price ?? 0);
      return {
        ...item,
        product,
        color,
        price,
        subtotal: price * Number(item.quantity || 0),
        stock: getVariantStock(product, item.colorId, item.size),
      };
    })
    .filter(Boolean);
}

export function getWishlist() {
  if (typeof window === "undefined") return [];
  const list = safeParse(window.localStorage.getItem(WISHLIST_STORAGE_KEY), []);
  return Array.isArray(list) ? list : [];
}

export function toggleWishlist(productId) {
  const current = getWishlist().map(String);
  const id = String(productId);
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("omb:wishlist-updated"));
  return next.includes(id);
}
