import React, { useMemo, useState } from "react";
import {
  categoryTree,
  colorPresets,
  getCategory,
  getCategoryChildren,
  getSizePresets,
  getSubcategories,
  placementOptions,
} from "../data/catalog";
import {
  getProducts,
  inventoryKey,
  normalizeProduct,
  saveProducts,
} from "../data/productStore";

const NEW_STEPS = [
  "world",
  "category",
  "season",
  "colors",
  "sizes",
  "inventory",
  "price",
  "description",
  "placements",
  "review",
];

const EDITABLE_STEPS = [
  "category",
  "season",
  "colors",
  "sizes",
  "inventory",
  "price",
  "description",
  "placements",
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function emptyProduct() {
  return {
    id: Date.now(),
    slug: "",
    name: "",
    nameEn: "",
    world: "",
    category: "",
    categoryAr: "",
    categoryEn: "",
    subcategory: "all",
    audience: "all",
    // Default new products to both seasons. Admin can keep both or turn one off.
    isSummer: true,
    isWinter: true,
    bestSellerPinned: false,
    bestSellerOrder: 0,
    colors: [],
    sizes: [],
    inventory: {},
    price: "",
    offerPrice: null,
    descriptionAr: "",
    descriptionEn: "",
    image: "",
    sections: [],
    status: "active",
  };
}

function StepHeading({ title, description }) {
  return (
    <div>
      <p className="omb-eyebrow-label text-aubergine/70">OH MY BABY ADMIN</p>
      <h1 className="mt-3 text-4xl font-black text-espresso sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-espresso/60">{description}</p>
    </div>
  );
}

function ChoiceCard({ active, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-40 border p-7 text-start transition-colors ${
        active
          ? "border-aubergine bg-aubergine text-milk"
          : "border-espresso/12 bg-milk text-espresso hover:border-aubergine/45"
      }`}
    >
      <span className="block text-lg font-black">{title}</span>
      <span className="mt-3 block text-sm leading-7 opacity-75">{description}</span>
    </button>
  );
}

function FieldLabel({ children }) {
  return <p className="mb-3 text-sm font-black text-espresso">{children}</p>;
}

function categorySizeKind(categoryId) {
  if (categoryId === "newborn") return "baby";
  if (["girls", "boys"].includes(categoryId)) return "kids";
  if (categoryId === "shoes") return "shoes";
  return "none";
}

function productUsesSizes(product) {
  return (
    product?.world === "fashion" &&
    ["newborn", "girls", "boys", "shoes"].includes(product?.category)
  );
}

function reconcileInventory(product, overrides = {}) {
  const nextProduct = { ...product, ...overrides };
  const colors = Array.isArray(nextProduct.colors) ? nextProduct.colors : [];
  const sizes = Array.isArray(nextProduct.sizes) ? nextProduct.sizes : [];
  const rows = colors.length ? colors.map((color) => color.id) : ["default"];
  const columns = productUsesSizes(nextProduct) && sizes.length ? sizes : ["default"];
  const currentInventory = product?.inventory || {};
  const inventory = {};

  rows.forEach((colorId) => {
    columns.forEach((size) => {
      const key = inventoryKey(colorId, size);
      inventory[key] = Math.max(0, Number(currentInventory[key] ?? 0));
    });
  });

  return inventory;
}

export default function AdminPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [products, setProducts] = useState(() => getProducts());
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [editParts, setEditParts] = useState([]);
  const [editSelectionConfirmed, setEditSelectionConfirmed] = useState(false);
  const [customSize, setCustomSize] = useState("");
  const [customColor, setCustomColor] = useState({ ar: "", en: "", hex: "#b9a79d" });
  const [message, setMessage] = useState("");

  const editSteps = useMemo(
    () => [...EDITABLE_STEPS.filter((step) => editParts.includes(step)), "review"],
    [editParts],
  );
  const newSteps = useMemo(() => {
    const categoryUsesSizes =
      form?.world === "fashion" &&
      ["newborn", "girls", "boys", "shoes"].includes(form?.category);
    return NEW_STEPS.filter(
      (step) => step !== "sizes" || !form?.category || categoryUsesSizes,
    );
  }, [form?.world, form?.category]);
  const steps = editing ? editSteps : newSteps;
  const currentStep = steps[stepIndex] || "review";
  const world = useMemo(
    () => categoryTree.find((item) => item.id === form?.world) || null,
    [form?.world],
  );
  const category = form?.category ? getCategory(form.category) : null;
  const categoryChildren = form?.world ? getCategoryChildren(form.world) : [];
  const subcategories = form?.category ? getSubcategories(form.category).filter((item) => item.id !== "all") : [];
  const isFashion = form?.world === "fashion";
  const usesSizes = isFashion && ["newborn", "girls", "boys", "shoes"].includes(form?.category);
  const sizePresets = getSizePresets(form?.category);
  const colorRows = form?.colors?.length ? form.colors : [{ id: "default", nameAr: "المنتج", nameEn: "Product" }];
  const sizeColumns = usesSizes && form?.sizes?.length ? form.sizes : ["default"];

  const stepTitles = {
    world: isAr ? "اختاري العالم" : "Choose a world",
    category: isAr ? "القسم ونوع القطعة" : "Category & product type",
    season: isAr ? "الموسم" : "Season",
    colors: isAr ? "الألوان والصور" : "Colors & images",
    sizes: isAr ? "القياسات" : "Sizes",
    inventory: isAr ? "الكميات المتوفرة" : "Inventory",
    price: isAr ? "السعر" : "Price",
    description: isAr ? "الاسم والوصف" : "Name & description",
    placements: isAr ? "أماكن الظهور الإضافية" : "Additional placements",
    review: isAr ? "مراجعة قبل الحفظ" : "Review",
  };

  function update(updates) {
    setForm((current) => ({ ...current, ...updates }));
    setMessage("");
  }

  function startNew() {
    setEditing(null);
    setEditParts([]);
    setEditSelectionConfirmed(false);
    setStepIndex(0);
    setCustomSize("");
    setMessage("");
    setForm(emptyProduct());
  }

  function startEdit(product) {
    setEditing(product);
    setForm(clone(normalizeProduct(product)));
    setEditParts([]);
    setEditSelectionConfirmed(false);
    setStepIndex(0);
    setMessage("");
  }

  function expandEditParts(parts) {
    const selected = new Set(parts);
    // Category/color/size changes can alter the variant matrix. Always expose
    // inventory afterwards so an edit never silently resets stock to zero.
    if (["category", "colors", "sizes"].some((part) => selected.has(part))) {
      selected.add("inventory");
    }
    return EDITABLE_STEPS.filter((part) => selected.has(part));
  }

  function cancel() {
    setForm(null);
    setEditing(null);
    setEditParts([]);
    setEditSelectionConfirmed(false);
    setStepIndex(0);
    setMessage("");
  }

  function remove(productId) {
    const ok = window.confirm(
      isAr
        ? "هل أنتِ متأكدة من حذف هذا المنتج؟ لا يمكن التراجع عن الحذف داخل هذه النسخة."
        : "Delete this product? This cannot be undone in this prototype.",
    );
    if (!ok) return;
    const next = products.filter((product) => String(product.id) !== String(productId));
    const result = saveProducts(next);
    if (!result?.ok) {
      setMessage(
        isAr
          ? "تعذر حفظ الحذف داخل المتصفح. جربي تقليل حجم الصور أو أعيدي المحاولة."
          : "The delete could not be saved in browser storage. Try reducing image size or retrying.",
      );
      return;
    }
    setProducts(next);
  }

  function selectWorld(worldId) {
    setForm((current) => {
      if (current.world === worldId) return current;
      return {
        ...current,
        world: worldId,
        category: "",
        categoryAr: "",
        categoryEn: "",
        subcategory: "all",
        audience: "all",
        sizes: [],
        // Keep the old matrix temporarily while the employee chooses the new
        // category. The next category choice reconciles it safely instead of
        // destroying stock at the first click.
        inventory: { ...(current.inventory || {}) },
      };
    });
    setMessage("");
  }

  function selectCategory(categoryId) {
    const item = getCategory(categoryId);
    setForm((current) => {
      const oldKind = categorySizeKind(current.category);
      const nextKind = categorySizeKind(categoryId);
      const sizes = oldKind === nextKind ? current.sizes : [];
      const nextValues = {
        category: categoryId,
        categoryAr: item?.ar || categoryId,
        categoryEn: item?.en || categoryId,
        subcategory: getSubcategories(categoryId).filter((entry) => entry.id !== "all").length ? "" : "all",
        audience:
          categoryId === "girls" ? "girls" : categoryId === "boys" ? "boys" : "all",
        sizes,
      };
      return {
        ...current,
        ...nextValues,
        inventory: reconcileInventory(current, nextValues),
      };
    });
    setMessage("");
  }

  function selectSubcategory(subcategoryId) {
    setForm((current) => ({
      ...current,
      subcategory: subcategoryId,
      audience:
        current.category === "shoes" && ["girls", "boys"].includes(subcategoryId)
          ? subcategoryId
          : current.audience,
    }));
    setMessage("");
  }

  function toggleSize(size) {
    setForm((current) => {
      const exists = current.sizes.includes(size);
      const sizes = exists ? current.sizes.filter((item) => item !== size) : [...current.sizes, size];
      return {
        ...current,
        sizes,
        inventory: reconcileInventory(current, { sizes }),
      };
    });
    setMessage("");
  }

  function addCustomSize() {
    const value = customSize.trim();
    if (!value) return;
    setForm((current) => {
      const sizes = current.sizes.includes(value) ? current.sizes : [...current.sizes, value];
      return {
        ...current,
        sizes,
        inventory: reconcileInventory(current, { sizes }),
      };
    });
    setCustomSize("");
    setMessage("");
  }

  function removeColor(colorId) {
    setForm((current) => {
      const removed = current.colors.find((color) => color.id === colorId);
      const colors = current.colors.filter((color) => color.id !== colorId);
      const removedImages = new Set([removed?.image, ...(removed?.images || [])].filter(Boolean));
      const nextImage = removedImages.has(current.image)
        ? colors.find((color) => color.image)?.image || ""
        : current.image;
      return {
        ...current,
        colors,
        image: nextImage,
        inventory: reconcileInventory(current, { colors }),
      };
    });
    setMessage("");
  }

  function togglePresetColor(preset) {
    if (form.colors.some((color) => color.id === preset.id)) {
      removeColor(preset.id);
      return;
    }
    setForm((current) => {
      const colors = [
        ...current.colors,
        {
          id: preset.id,
          nameAr: preset.ar,
          nameEn: preset.en,
          hex: preset.hex,
          image: "",
          images: [],
        },
      ];
      return {
        ...current,
        colors,
        inventory: reconcileInventory(current, { colors }),
      };
    });
    setMessage("");
  }

  function addCustomColor() {
    const ar = customColor.ar.trim();
    const en = customColor.en.trim();
    if (!ar && !en) return;
    const id = `custom-${Date.now()}`;
    setForm((current) => {
      const colors = [
        ...current.colors,
        {
          id,
          nameAr: ar || en,
          nameEn: en || ar,
          hex: customColor.hex,
          image: "",
          images: [],
        },
      ];
      return {
        ...current,
        colors,
        inventory: reconcileInventory(current, { colors }),
      };
    });
    setCustomColor({ ar: "", en: "", hex: "#b9a79d" });
    setMessage("");
  }

  async function setMainImage(file) {
    if (!file) return;
    const image = await fileToDataUrl(file);
    update({ image });
  }

  async function setColorImage(colorId, file) {
    if (!file) return;
    const image = await fileToDataUrl(file);
    setForm((current) => ({
      ...current,
      colors: current.colors.map((color) =>
        color.id === colorId
          ? { ...color, image, images: Array.from(new Set([image, ...(color.images || [])])) }
          : color,
      ),
      image: current.image || image,
    }));
    setMessage("");
  }

  async function addColorGalleryImages(colorId, files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    const images = await Promise.all(list.map(fileToDataUrl));
    setForm((current) => ({
      ...current,
      colors: current.colors.map((color) =>
        color.id === colorId
          ? {
              ...color,
              image: color.image || images[0],
              images: Array.from(new Set([...(color.images || []), ...images])),
            }
          : color,
      ),
      image: current.image || images[0],
    }));
  }

  function updateStock(colorId, size, value) {
    const amount = Math.max(0, Number.parseInt(value || "0", 10) || 0);
    setForm((current) => ({
      ...current,
      inventory: {
        ...(current.inventory || {}),
        [inventoryKey(colorId, size)]: amount,
      },
    }));
  }

  function ensureInventory() {
    setForm((current) => ({
      ...current,
      inventory: reconcileInventory(current),
    }));
  }

  function togglePlacement(placementId) {
    setForm((current) => {
      const selected = current.sections.includes(placementId);
      const sections = selected
        ? current.sections.filter((item) => item !== placementId)
        : [...current.sections, placementId];
      return {
        ...current,
        sections,
        bestSellerPinned:
          placementId === "best-sellers" ? !selected : Boolean(current.bestSellerPinned),
        offerPrice: placementId === "offers" && selected ? null : current.offerPrice,
      };
    });
  }

  function validateStep(step) {
    if (step === "world" && !form.world) return isAr ? "اختاري العالم أولاً." : "Choose a world first.";
    if (step === "category" && !form.category) return isAr ? "اختاري القسم." : "Choose a category.";
    if (step === "category" && isFashion && subcategories.length && !form.subcategory)
      return isAr ? "اختاري نوع القطعة." : "Choose the product type.";
    if (step === "colors") {
      const missingColorImage = form.colors.some((color) => !color.image);
      if (missingColorImage)
        return isAr
          ? "كل لون مضاف لازم يكون معه صورة حقيقية للمنتج بهذا اللون."
          : "Every selected color needs a real product image in that color.";
      if (!form.colors.length && !form.image)
        return isAr ? "ارفعي صورة أساسية للمنتج." : "Upload a main product image.";
    }
    if (step === "sizes" && usesSizes && !form.sizes.length)
      return isAr ? "اختاري قياساً واحداً على الأقل أو أضيفي مقاساً مخصصاً." : "Choose at least one size or add a custom size.";
    if (step === "price" && !(Number(form.price) > 0))
      return isAr ? "أدخلي سعراً صحيحاً للمنتج." : "Enter a valid product price.";
    if (step === "description" && (!form.name.trim() || !form.nameEn.trim()))
      return isAr ? "أدخلي اسم المنتج بالعربي والإنكليزي." : "Enter the product name in Arabic and English.";
    if (step === "placements" && form.sections.includes("offers")) {
      const offer = Number(form.offerPrice || 0);
      const regular = Number(form.price || 0);
      if (!(offer > 0) || offer >= regular)
        return isAr
          ? "للمنتج الموجود ضمن العروض، أدخلي سعر عرض أقل من السعر الأساسي."
          : "Products in Offers need a promotional price below the regular price.";
    }
    return "";
  }

  function next() {
    const error = validateStep(currentStep);
    if (error) {
      setMessage(error);
      return;
    }
    if (currentStep === "sizes" || currentStep === "colors") ensureInventory();
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  }

  function back() {
    setMessage("");
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function save() {
    const normalized = normalizeProduct({
      ...form,
      slug:
        form.slug ||
        `${form.category || "product"}-${String(form.id).replace(/\D/g, "") || Date.now()}`,
      price: Number(form.price || 0),
      offerPrice: form.sections.includes("offers") ? Number(form.offerPrice || 0) : null,
    });
    const next = editing
      ? products.map((product) => (String(product.id) === String(normalized.id) ? normalized : product))
      : [normalized, ...products];
    const result = saveProducts(next);
    if (!result?.ok) {
      setMessage(
        result?.reason === "storage-full"
          ? isAr
            ? "حجم الصور كبير على التخزين المؤقت الحالي. خففي حجم الصور أو عددها بهذه النسخة التجريبية ثم أعيدي الحفظ."
            : "The uploaded images exceed this prototype's browser storage. Reduce image size/count and save again."
          : isAr
            ? "تعذر حفظ المنتج حالياً. البيانات ما زالت موجودة بالنموذج."
            : "The product could not be saved. Your form data is still here.",
      );
      return;
    }
    setProducts(next);
    cancel();
  }

  function selectedCategoryLabel(product) {
    const item = getCategory(product.category);
    return isAr ? item?.ar || product.categoryAr || product.category : item?.en || product.categoryEn || product.category;
  }

  function totalStock(product) {
    return Object.values(product.inventory || {}).reduce(
      (sum, value) => sum + Math.max(0, Number(value || 0)),
      0,
    );
  }

  if (!form) {
    return (
      <section className="min-h-screen bg-milk py-16 sm:py-20" dir={isAr ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-7 lg:px-10">
          <div className="flex flex-col justify-between gap-6 border-b border-espresso/10 pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="omb-eyebrow-label text-aubergine/70">ADMIN CATALOG</p>
              <h1 className="mt-3 text-4xl font-black text-espresso sm:text-5xl">
                {isAr ? "إدارة المنتجات والمخزون" : "Products & inventory"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-espresso/60">
                {isAr
                  ? "إضافة المنتج تبدأ من عالمه الصحيح، وكل لون وقياس يرتبطان بالمخزون الحقيقي المعروض للزبونة."
                  : "Create products from the correct world, with real color, size and inventory relationships."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/admin/orders" className="omb-btn omb-btn-secondary">{isAr ? "إدارة الطلبات" : "Orders"}</a>
              <a href="/admin/operations" className="omb-btn omb-btn-secondary">{isAr ? "عمليات الأونر" : "Owner operations"}</a>
              <button type="button" onClick={startNew} className="omb-btn omb-btn-primary">
                + {isAr ? "إضافة جديد" : "Add new"}
              </button>
            </div>
          </div>

          <div className="mt-9 grid gap-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="grid gap-5 border border-espresso/10 bg-oat/20 p-4 sm:grid-cols-[110px_1fr_auto] sm:items-center"
              >
                <img
                  src={product.colors?.find((color) => color.image)?.image || product.image}
                  alt=""
                  className="aspect-[4/5] h-28 w-full object-cover sm:w-24"
                />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-aubergine/60">
                    {selectedCategoryLabel(product)}
                  </p>
                  <h2 className="mt-1 text-lg font-black text-espresso">
                    {isAr ? product.name : product.nameEn || product.name}
                  </h2>
                  <p className="mt-2 text-sm text-espresso/55">
                    ${product.offerPrice ?? product.price} · {totalStock(product)} {isAr ? "قطعة بالمخزون" : "units in stock"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(product)}
                    className="border border-espresso/15 px-4 py-2 text-xs font-black"
                  >
                    {isAr ? "تعديل" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(product.id)}
                    className="border border-aubergine/25 px-4 py-2 text-xs font-black text-aubergine"
                  >
                    {isAr ? "حذف" : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (editing && !editSelectionConfirmed) {
    return (
      <section className="min-h-screen bg-milk py-16 sm:py-20" dir={isAr ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <div className="flex items-start justify-between gap-5">
            <StepHeading
              title={isAr ? "شو بدك تعدّلي؟" : "What do you want to edit?"}
              description={isAr ? "اختاري جزء أو أكثر. ما رح نفتحلك كل النموذج بلا داعي." : "Choose only the parts that need changes."}
            />
            <button type="button" onClick={cancel} className="text-sm font-black text-aubergine">
              × {isAr ? "إلغاء" : "Cancel"}
            </button>
          </div>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EDITABLE_STEPS.map((part) => (
              <label
                key={part}
                className={`flex cursor-pointer items-center gap-3 border p-4 ${
                  editParts.includes(part) ? "border-aubergine bg-aubergine/5" : "border-espresso/12"
                }`}
              >
                <input
                  type="checkbox"
                  checked={editParts.includes(part)}
                  onChange={() =>
                    setEditParts((current) =>
                      current.includes(part) ? current.filter((item) => item !== part) : [...current, part],
                    )
                  }
                />
                <span className="text-sm font-black">{stepTitles[part]}</span>
              </label>
            ))}
          </div>
          <div className="mt-7 flex justify-end">
            <button
              type="button"
              disabled={!editParts.length}
              onClick={() => {
                setEditParts((current) => expandEditParts(current));
                setStepIndex(0);
                setEditSelectionConfirmed(true);
              }}
              className="omb-btn omb-btn-primary disabled:opacity-35"
            >
              {isAr ? "ابدئي التعديل" : "Start editing"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-milk py-16 sm:py-20" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="flex items-start justify-between gap-5">
          <StepHeading
            title={editing ? (isAr ? "تعديل المنتج" : "Edit product") : isAr ? "إضافة جديد" : "Add new"}
            description={
              isAr
                ? "كل خطوة مبنية على اللي اخترتيه قبلها، والرجوع ما بيمسح البيانات."
                : "Each step adapts to your previous choices and keeps your data when you go back."
            }
          />
          <button type="button" onClick={cancel} className="text-sm font-black text-aubergine">
            × {isAr ? "إلغاء" : "Cancel"}
          </button>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-9">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`border px-2 py-3 text-center text-[10px] font-black ${
                index <= stepIndex ? "border-aubergine bg-aubergine text-milk" : "border-espresso/10 text-espresso/45"
              }`}
            >
              {index + 1}. {stepTitles[step]}
            </div>
          ))}
        </div>

        <div className="mt-8 border border-espresso/10 bg-oat/15 p-5 sm:p-8 lg:p-10">
          {currentStep === "world" && (
            <div>
              <h2 className="text-2xl font-black">{stepTitles.world}</h2>
              <p className="mt-2 text-sm text-espresso/60">
                {isAr ? "العالمين مستقلين، واختيارك هون هو اللي بيحدد بقية خطوات الإدخال." : "The two worlds are independent; this choice drives the rest of the flow."}
              </p>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                {categoryTree.map((item) => (
                  <ChoiceCard
                    key={item.id}
                    active={form.world === item.id}
                    title={isAr ? item.ar : item.en}
                    description={isAr ? item.descriptionAr : item.descriptionEn}
                    onClick={() => selectWorld(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {currentStep === "category" && (
            <div>
              <h2 className="text-2xl font-black">{stepTitles.category}</h2>
              {editing && (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {categoryTree.map((item) => (
                    <ChoiceCard
                      key={item.id}
                      active={form.world === item.id}
                      title={isAr ? item.ar : item.en}
                      description={isAr ? item.descriptionAr : item.descriptionEn}
                      onClick={() => selectWorld(item.id)}
                    />
                  ))}
                </div>
              )}
              <div className="mt-7">
                <FieldLabel>{isAr ? "القسم" : "Category"}</FieldLabel>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {categoryChildren.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectCategory(item.id)}
                      className={`border px-4 py-4 text-start text-sm font-black ${
                        form.category === item.id ? "border-aubergine bg-aubergine text-milk" : "border-espresso/12 bg-milk"
                      }`}
                    >
                      {isAr ? item.ar : item.en}
                    </button>
                  ))}
                </div>
              </div>

              {isFashion && form.category && subcategories.length > 0 && (
                <div className="mt-8">
                  <FieldLabel>{form.category === "shoes" ? (isAr ? "لمن الحذاء؟" : "Who is it for?") : isAr ? "نوع القطعة" : "Product type"}</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {subcategories.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectSubcategory(item.id)}
                        className={`border px-4 py-3 text-sm font-black ${
                          form.subcategory === item.id ? "border-aubergine bg-aubergine text-milk" : "border-espresso/12 bg-milk"
                        }`}
                      >
                        {isAr ? item.ar : item.en}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === "season" && (
            <div>
              <h2 className="text-2xl font-black">{stepTitles.season}</h2>
              <p className="mt-2 text-sm leading-7 text-espresso/55">
                {isAr
                  ? "اختاري صيفي أو شتوي أو الاثنين معاً. هذا الخيار مستقل تماماً عن القياسات والألوان والمخزون."
                  : "Choose Summer, Winter, or both. This is independent from sizes, colors and inventory."}
              </p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <button type="button" onClick={() => update({ isSummer: form.isSummer && !form.isWinter ? true : !form.isSummer })} className={`border p-6 text-start ${form.isSummer ? "border-aubergine bg-aubergine text-milk" : "border-espresso/12 bg-milk text-espresso"}`}>
                  <span className="block text-lg font-black">{isAr ? "صيفي" : "Summer"}</span>
                  <span className="mt-2 block text-sm opacity-70">{form.isSummer ? (isAr ? "مفعّل" : "Enabled") : (isAr ? "غير مفعّل" : "Disabled")}</span>
                </button>
                <button type="button" onClick={() => update({ isWinter: form.isWinter && !form.isSummer ? true : !form.isWinter })} className={`border p-6 text-start ${form.isWinter ? "border-aubergine bg-aubergine text-milk" : "border-espresso/12 bg-milk text-espresso"}`}>
                  <span className="block text-lg font-black">{isAr ? "شتوي" : "Winter"}</span>
                  <span className="mt-2 block text-sm opacity-70">{form.isWinter ? (isAr ? "مفعّل" : "Enabled") : (isAr ? "غير مفعّل" : "Disabled")}</span>
                </button>
              </div>
              <p className="mt-4 text-xs font-semibold text-espresso/50">{isAr ? "لا يمكن ترك الموسمين فارغين: اختاري صيفي أو شتوي أو الاثنين معاً." : "At least one season is required: Summer, Winter, or both."}</p>
            </div>
          )}

          {currentStep === "colors" && (
            <div>
              <h2 className="text-2xl font-black">{stepTitles.colors}</h2>
              <p className="mt-2 text-sm leading-7 text-espresso/60">
                {isAr
                  ? "إذا أضفتِ لون، لازم ترفعي معه صورة حقيقية للمنتج بهذا اللون. الصور التي ترفعينها هي مصدر الحقيقة في المتجر."
                  : "Every added color needs a real product image in that color. Uploaded images are the store source of truth."}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {colorPresets.map((preset) => {
                  const selected = form.colors.some((color) => color.id === preset.id);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => togglePresetColor(preset)}
                      className={`flex items-center gap-3 border p-3 text-start text-sm font-black ${
                        selected ? "border-aubergine bg-aubergine/5" : "border-espresso/12 bg-milk"
                      }`}
                    >
                      <span className="h-6 w-6 rounded-full border border-espresso/15" style={{ background: preset.hex }} />
                      {isAr ? preset.ar : preset.en}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border border-espresso/10 bg-milk p-4">
                <FieldLabel>{isAr ? "لون مخصص" : "Custom color"}</FieldLabel>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_90px_auto]">
                  <input value={customColor.ar} onChange={(e) => setCustomColor((c) => ({ ...c, ar: e.target.value }))} placeholder={isAr ? "اسم اللون بالعربي" : "Arabic name"} className="h-11 border border-espresso/12 bg-transparent px-3 outline-none" />
                  <input value={customColor.en} onChange={(e) => setCustomColor((c) => ({ ...c, en: e.target.value }))} placeholder="English name" className="h-11 border border-espresso/12 bg-transparent px-3 outline-none" />
                  <input type="color" value={customColor.hex} onChange={(e) => setCustomColor((c) => ({ ...c, hex: e.target.value }))} className="h-11 w-full border border-espresso/12 bg-transparent p-1" />
                  <button type="button" onClick={addCustomColor} className="border border-aubergine px-4 text-sm font-black text-aubergine">+ {isAr ? "إضافة" : "Add"}</button>
                </div>
              </div>

              {form.colors.length > 0 ? (
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {form.colors.map((color) => (
                    <div key={color.id} className="border border-espresso/12 bg-milk p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="h-6 w-6 rounded-full border" style={{ background: color.hex }} />
                          <span className="font-black">{isAr ? color.nameAr : color.nameEn}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeColor(color.id)}
                          className="text-xs font-black text-aubergine underline"
                        >
                          {isAr ? "إزالة اللون" : "Remove color"}
                        </button>
                      </div>
                      <label className="mt-4 block text-xs font-black text-espresso/60">
                        {isAr ? "الصورة الرئيسية لهذا اللون — مطلوبة" : "Main image for this color — required"}
                        <input type="file" accept="image/*" onChange={(e) => setColorImage(color.id, e.target.files?.[0])} className="mt-2 block w-full text-xs" />
                      </label>
                      <label className="mt-3 block text-xs font-black text-espresso/60">
                        {isAr ? "صور إضافية لهذا اللون — اختيارية" : "Additional color images — optional"}
                        <input type="file" multiple accept="image/*" onChange={(e) => addColorGalleryImages(color.id, e.target.files)} className="mt-2 block w-full text-xs" />
                      </label>
                      {(color.images?.length || color.image) && (
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                          {(color.images?.length ? color.images : [color.image]).map((image, index) => (
                            <img key={`${color.id}-${index}`} src={image} alt="" className="h-24 w-20 flex-none object-cover" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-8 max-w-lg border border-espresso/12 bg-milk p-4">
                  <label className="block text-sm font-black">
                    {isAr ? "المنتج ما إلو ألوان؟ ارفعي صورته الأساسية" : "No color variants? Upload the main image"}
                    <input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files?.[0])} className="mt-3 block w-full text-xs" />
                  </label>
                  {form.image && <img src={form.image} alt="" className="mt-4 h-36 w-28 object-cover" />}
                </div>
              )}
            </div>
          )}

          {currentStep === "sizes" && (
            <div>
              <h2 className="text-2xl font-black">{stepTitles.sizes}</h2>
              {!usesSizes ? (
                <div className="mt-7 border border-espresso/10 bg-milk p-6 text-sm leading-7 text-espresso/65">
                  {isAr
                    ? "هذا القسم لا يحتاج قياسات افتراضياً، لذلك رح ينتقل المخزون مباشرة للون أو للمنتج نفسه."
                    : "This category does not require sizes by default, so inventory will be tracked by color or by the product itself."}
                </div>
              ) : (
                <>
                  <div className="mt-7 flex flex-wrap gap-2">
                    {sizePresets.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`min-w-16 border px-4 py-3 text-sm font-black ${
                          form.sizes.includes(size) ? "border-aubergine bg-aubergine text-milk" : "border-espresso/12 bg-milk"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {form.sizes.some((size) => !sizePresets.includes(size)) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {form.sizes.filter((size) => !sizePresets.includes(size)).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className="border border-aubergine bg-aubergine/5 px-4 py-2 text-sm font-black text-aubergine"
                          title={isAr ? "اضغطي لإزالة المقاس المخصص" : "Click to remove custom size"}
                        >
                          {size} ×
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-6 flex max-w-xl gap-2">
                    <input
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomSize();
                        }
                      }}
                      placeholder={isAr ? "مقاس مخصص، مثال 17Y أو XS Kids" : "Custom size, e.g. 17Y or XS Kids"}
                      className="h-12 flex-1 border border-espresso/12 bg-milk px-4 outline-none"
                    />
                    <button type="button" onClick={addCustomSize} className="border border-aubergine px-5 text-sm font-black text-aubergine">+ {isAr ? "مخصص" : "Custom"}</button>
                  </div>
                </>
              )}
            </div>
          )}

          {currentStep === "inventory" && (
            <div>
              <h2 className="text-2xl font-black">{stepTitles.inventory}</h2>
              <p className="mt-2 text-sm leading-7 text-espresso/60">
                {isAr
                  ? "الكمية تنحفظ لكل لون × قياس بشكل مستقل. الصفر يعني نفد من المخزون لهذا الخيار."
                  : "Stock is saved independently for each color × size. Zero means that option is out of stock."}
              </p>
              <div className="mt-7 overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse bg-milk text-sm">
                  <thead>
                    <tr>
                      <th className="border border-espresso/10 p-3 text-start">{isAr ? "اللون / القياس" : "Color / size"}</th>
                      {sizeColumns.map((size) => (
                        <th key={size} className="border border-espresso/10 p-3 text-center">{size === "default" ? (isAr ? "الكمية" : "Stock") : size}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {colorRows.map((color) => (
                      <tr key={color.id}>
                        <th className="border border-espresso/10 p-3 text-start font-black">
                          {color.id === "default" ? (isAr ? "المنتج" : "Product") : isAr ? color.nameAr : color.nameEn}
                        </th>
                        {sizeColumns.map((size) => {
                          const key = inventoryKey(color.id, size);
                          return (
                            <td key={key} className="border border-espresso/10 p-2 text-center">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={form.inventory?.[key] ?? 0}
                                onChange={(e) => updateStock(color.id, size, e.target.value)}
                                className="h-11 w-24 border border-espresso/12 bg-oat/20 px-3 text-center font-black outline-none"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentStep === "price" && (
            <div>
              <h2 className="text-2xl font-black">{stepTitles.price}</h2>
              <label className="mt-7 block max-w-sm text-sm font-black">
                {isAr ? "السعر الأساسي ($)" : "Regular price ($)"}
                <div className="mt-2 flex items-center border border-espresso/12 bg-milk">
                  <span className="px-4 text-espresso/50">$</span>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => update({ price: e.target.value })} className="h-14 w-full bg-transparent px-2 text-xl font-black outline-none" />
                </div>
              </label>
              <p className="mt-3 text-xs leading-6 text-espresso/50">
                {isAr ? "إذا اخترتِ قسم العروض بآخر خطوة رح يظهر حقل سعر العرض هناك." : "If you select Offers in the final step, the promotional price field will appear there."}
              </p>
            </div>
          )}

          {currentStep === "description" && (
            <div>
              <h2 className="text-2xl font-black">{stepTitles.description}</h2>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-black">
                  {isAr ? "اسم المنتج بالعربي" : "Arabic product name"}
                  <input value={form.name} onChange={(e) => update({ name: e.target.value })} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none" />
                </label>
                <label className="text-sm font-black">
                  {isAr ? "اسم المنتج بالإنكليزي" : "English product name"}
                  <input value={form.nameEn} onChange={(e) => update({ nameEn: e.target.value })} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none" />
                </label>
                <label className="text-sm font-black">
                  {isAr ? "وصف مختصر بالعربي" : "Arabic description"}
                  <textarea rows="6" value={form.descriptionAr} onChange={(e) => update({ descriptionAr: e.target.value })} className="mt-2 w-full border border-espresso/12 bg-milk p-4 outline-none" />
                </label>
                <label className="text-sm font-black">
                  {isAr ? "وصف مختصر بالإنكليزي" : "English description"}
                  <textarea rows="6" value={form.descriptionEn} onChange={(e) => update({ descriptionEn: e.target.value })} className="mt-2 w-full border border-espresso/12 bg-milk p-4 outline-none" />
                </label>
              </div>
            </div>
          )}

          {currentStep === "placements" && (
            <div>
              <h2 className="text-2xl font-black">{stepTitles.placements}</h2>
              <p className="mt-2 text-sm leading-7 text-espresso/60">
                {isAr
                  ? "هاي آخر خطوة ترويجية. المنتج بيضل نسخة واحدة ومخزون واحد حتى لو ظهر بأكثر من قسم."
                  : "This is the final merchandising step. The product remains one record with one inventory even when it appears in several places."}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {placementOptions.map((item) => (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-center gap-3 border p-4 ${
                      form.sections.includes(item.id) ? "border-aubergine bg-aubergine/5" : "border-espresso/12 bg-milk"
                    }`}
                  >
                    <input type="checkbox" checked={form.sections.includes(item.id)} onChange={() => togglePlacement(item.id)} />
                    <span className="text-sm font-black">{isAr ? item.ar : item.en}</span>
                  </label>
                ))}
              </div>
              {form.sections.includes("offers") && (
                <label className="mt-6 block max-w-sm text-sm font-black">
                  {isAr ? "سعر العرض ($)" : "Offer price ($)"}
                  <div className="mt-2 flex items-center border border-aubergine bg-milk">
                    <span className="px-4 text-aubergine">$</span>
                    <input type="number" min="0" step="0.01" value={form.offerPrice ?? ""} onChange={(e) => update({ offerPrice: e.target.value })} className="h-14 w-full bg-transparent px-2 text-xl font-black outline-none" />
                  </div>
                </label>
              )}
              {form.sections.includes("best-sellers") && (
                <div className="mt-6 grid gap-3 border border-espresso/10 bg-milk p-4 sm:grid-cols-[1fr_170px] sm:items-end">
                  <label className="flex items-center gap-3 text-sm font-black">
                    <input type="checkbox" checked={Boolean(form.bestSellerPinned)} onChange={(event) => update({ bestSellerPinned: event.target.checked })} />
                    <span>{isAr ? "تثبيت هذا المنتج يدوياً ضمن الأكثر طلباً فوق الاختيار التلقائي حسب المبيعات." : "Pin this item manually in Best Sellers ahead of the automatic sales ranking."}</span>
                  </label>
                  <label className="text-xs font-black">
                    {isAr ? "ترتيب التثبيت" : "Pin order"}
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.bestSellerOrder ?? 0}
                      onChange={(event) => update({ bestSellerOrder: Number(event.target.value || 0) })}
                      className="mt-2 h-11 w-full border border-espresso/15 bg-transparent px-3 font-black outline-none"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {currentStep === "review" && (
            <div>
              <h2 className="text-2xl font-black">{stepTitles.review}</h2>
              <div className="mt-7 grid gap-7 lg:grid-cols-[300px_1fr]">
                <img src={form.colors?.find((color) => color.image)?.image || form.image} alt="" className="aspect-[4/5] w-full bg-oat object-cover" />
                <div>
                  <p className="omb-eyebrow-label text-aubergine/60">{isAr ? world?.ar : world?.en}</p>
                  <p className="mt-2 text-sm font-black text-espresso/55">{selectedCategoryLabel(form)}</p>
                  <h3 className="mt-2 text-3xl font-black text-espresso">{isAr ? form.name || "—" : form.nameEn || "—"}</h3>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="text-2xl font-black text-aubergine">${form.offerPrice || form.price || 0}</span>
                    {form.offerPrice && Number(form.offerPrice) < Number(form.price) && <span className="text-sm text-espresso/40 line-through">${form.price}</span>}
                  </div>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-espresso/65">{isAr ? form.descriptionAr : form.descriptionEn}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {form.colors.map((color) => <span key={color.id} className="border border-espresso/12 px-3 py-2 text-xs font-black">{isAr ? color.nameAr : color.nameEn}</span>)}
                    {form.sizes.map((size) => <span key={size} className="border border-espresso/12 px-3 py-2 text-xs font-black">{size}</span>)}
                  </div>
                  <p className="mt-5 text-sm font-black text-espresso/65">
                    {isAr ? "إجمالي المخزون:" : "Total stock:"} {totalStock(form)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {message && <p className="mt-4 border border-aubergine/25 bg-aubergine/5 px-4 py-3 text-sm font-black text-aubergine">{message}</p>}

        <div className="mt-7 flex items-center justify-between gap-3">
          <button type="button" disabled={stepIndex === 0} onClick={back} className="border border-espresso/15 px-6 py-3 text-sm font-black disabled:opacity-30">
            {isAr ? "السابق" : "Back"}
          </button>
          {stepIndex < steps.length - 1 ? (
            <button type="button" onClick={next} className="omb-btn omb-btn-primary">
              {isAr ? "التالي" : "Next"}
            </button>
          ) : (
            <button type="button" onClick={save} className="omb-btn omb-btn-primary">
              {editing ? (isAr ? "حفظ التعديلات" : "Save changes") : isAr ? "إنهاء وحفظ" : "Finish & save"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
