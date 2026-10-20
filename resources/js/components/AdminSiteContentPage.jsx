import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { hasPermission } from "../lib/permissions";
import { DEFAULT_FEATURED } from "../lib/siteContent";
import { translateArToEn } from "../lib/translate";
import FeaturedCollection from "./FeaturedCollection";

const TEXT_KEYS = ["eyebrow", "sectionTitle", "sectionSubtitle", "badge", "headline", "description", "cta", "secondary", "imageAlt"];

function toForm(content) {
  const base = content || DEFAULT_FEATURED;
  const ar = { ...DEFAULT_FEATURED.ar, ...(content?.ar || {}) };
  return {
    image: base.image || "",
    imageX: Number(base.imageX ?? 100),
    imageY: Number(base.imageY ?? 28),
    imageZoom: Number(base.imageZoom ?? 1),
    ctaHref: base.ctaHref || "",
    secondaryHref: base.secondaryHref || "",
    seasonTag: base.seasonTag ?? "",
    watermark: base.watermark ?? "",
    ar: { ...ar, tags: (ar.tags || []).join("، ") },
  };
}

function splitTags(value) {
  return String(value || "").split(/[،,\n]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 6);
}

export default function AdminSiteContentPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(null); // last saved content (or null)
  const [form, setForm] = useState(() => toForm(null));
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [previewLocale, setPreviewLocale] = useState(locale);

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiFetch("/auth/session"), apiFetch("/api/admin/site/featured-collection").catch(() => ({ content: null }))])
      .then(([sessionData, contentData]) => {
        if (cancelled) return;
        setSession(sessionData);
        setLoaded(contentData?.content || null);
        setForm(toForm(contentData?.content || null));
        setReady(true);
      })
      .catch(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  const user = session?.user || null;
  const allowed = hasPermission(user, "site_content.edit");

  const setAr = (key, value) => setForm((current) => ({ ...current, ar: { ...current.ar, [key]: value } }));
  const setRoot = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  // The exact object the storefront section receives (live preview).
  const draftContent = useMemo(() => ({
    image: form.image,
    imageX: form.imageX,
    imageY: form.imageY,
    imageZoom: form.imageZoom,
    ctaHref: form.ctaHref,
    secondaryHref: form.secondaryHref,
    seasonTag: form.seasonTag,
    watermark: form.watermark,
    ar: { ...form.ar, tags: splitTags(form.ar.tags) },
    en: loaded?.en || {},
  }), [form, loaded]);

  async function uploadImage(file) {
    if (!file) return;
    setBusy("upload");
    setMessage({ type: "", text: "" });
    try {
      const body = new FormData();
      body.append("image", file);
      const result = await apiFetch("/api/admin/site/upload-image", { method: "POST", body });
      setRoot("image", result.url);
    } catch (error) {
      setMessage({ type: "error", text: error?.data?.message || (isAr ? "تعذر رفع الصورة (jpg/png/webp حتى 8MB)." : "Could not upload the image (jpg/png/webp up to 8MB).") });
    } finally {
      setBusy("");
    }
  }

  async function save() {
    setBusy("save");
    setMessage({ type: "", text: isAr ? "جاري الحفظ..." : "Saving..." });

    const ar = { ...form.ar, tags: splitTags(form.ar.tags) };
    const prevAr = loaded?.ar || {};
    const prevEn = loaded?.en || {};

    // English is generated, never typed: keep the saved English while its Arabic is
    // unchanged, translate only what changed (free on-device translator, never blocks).
    const en = {};
    const jobs = [];
    TEXT_KEYS.forEach((key) => {
      if (!ar[key]) { en[key] = ""; return; }
      if (prevEn[key] && prevAr[key] === ar[key]) { en[key] = prevEn[key]; return; }
      jobs.push({ key, text: ar[key] });
    });
    const tagsUnchanged = JSON.stringify(prevAr.tags || []) === JSON.stringify(ar.tags) && (prevEn.tags || []).length === ar.tags.length;
    if (tagsUnchanged) en.tags = prevEn.tags;
    else ar.tags.forEach((tag) => jobs.push({ key: "tag", text: tag }));

    if (jobs.length) {
      const translated = await translateArToEn(jobs.map((job) => job.text));
      const tags = [];
      jobs.forEach((job, index) => {
        const value = translated?.[index] || "";
        if (job.key === "tag") tags.push(value);
        else en[job.key] = value;
      });
      if (!tagsUnchanged) en.tags = tags.every(Boolean) ? tags : [];
    }

    try {
      const result = await apiFetch("/api/admin/site/featured-collection", {
        method: "PUT",
        body: JSON.stringify({
          content: {
            image: form.image,
            imageX: form.imageX,
            imageY: form.imageY,
            imageZoom: form.imageZoom,
            ctaHref: form.ctaHref,
            secondaryHref: form.secondaryHref,
            seasonTag: form.seasonTag,
            watermark: form.watermark,
            ar,
            en,
          },
        }),
      });
      setLoaded(result.content);
      setMessage({ type: "ok", text: isAr ? "تم الحفظ وصار ظاهر بالموقع." : "Saved. It is now live on the site." });
    } catch (error) {
      const first = error?.data?.errors ? Object.values(error.data.errors).flat()[0] : null;
      setMessage({ type: "error", text: first || error?.data?.message || (isAr ? "تعذر الحفظ." : "Could not save.") });
    } finally {
      setBusy("");
    }
  }

  const input = "mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none";
  const label = "block min-w-0 text-sm font-black";

  if (!ready) {
    return <main className="px-5 py-16 text-center text-sm font-bold text-espresso/60">{isAr ? "جاري التحميل..." : "Loading..."}</main>;
  }
  if (!allowed) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-center" dir={isAr ? "rtl" : "ltr"}>
        <p className="text-lg font-black text-espresso">{isAr ? "ما عندك صلاحية تعديل محتوى الموقع." : "You do not have permission to edit site content."}</p>
        <p className="mt-2 text-sm text-espresso/60">{isAr ? "اطلب من الأونر يعطيك صلاحية «تعديل محتوى الموقع»." : "Ask the owner to grant “Edit site content”."}</p>
      </main>
    );
  }

  return (
    <main className="bg-milk py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <p className="text-xs font-black tracking-[0.2em] text-aubergine">SITE CONTENT</p>
        <h1 className="mt-2 text-3xl font-black text-espresso sm:text-4xl">{isAr ? "قسم الموسم / الترند بالصفحة الرئيسية" : "Homepage season / trend section"}</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-espresso/65">
          {isAr
            ? "اكتبي النصوص بالعربي فقط. النسخة الإنكليزية بتتولّد لحالها وقت الحفظ (على Chrome سطح المكتب)، وإذا ما توفرت بتظهر بالعربي."
            : "Write Arabic only. The English version is generated automatically when you save (Chrome desktop); if unavailable the Arabic text is shown."}
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <label className={label}>{isAr ? "عنوان صغير فوق العنوان (مثال: تشكيلة الموسم)" : "Small label"}
            <input className={input} value={form.ar.eyebrow} maxLength={200} onChange={(e) => setAr("eyebrow", e.target.value)} />
          </label>
          <label className={label}>{isAr ? "عنوان القسم (مثال: موسم الشتاء)" : "Section title"}
            <input className={input} value={form.ar.sectionTitle} maxLength={200} onChange={(e) => setAr("sectionTitle", e.target.value)} />
          </label>
          <label className={`${label} md:col-span-2`}>{isAr ? "جملة تحت العنوان" : "Subtitle"}
            <input className={input} value={form.ar.sectionSubtitle} maxLength={200} onChange={(e) => setAr("sectionSubtitle", e.target.value)} />
          </label>
          <label className={label}>{isAr ? "شارة البطاقة (مثال: ترند الشتاء)" : "Card badge"}
            <input className={input} value={form.ar.badge} maxLength={200} onChange={(e) => setAr("badge", e.target.value)} />
          </label>
          <label className={label}>{isAr ? "العنوان الرئيسي" : "Headline"}
            <input className={input} value={form.ar.headline} maxLength={200} onChange={(e) => setAr("headline", e.target.value)} />
          </label>
          <label className={`${label} md:col-span-2`}>{isAr ? "الوصف" : "Description"}
            <textarea rows="4" maxLength={600} className="mt-2 w-full border border-espresso/12 bg-milk p-4 outline-none" value={form.ar.description} onChange={(e) => setAr("description", e.target.value)} />
          </label>
          <label className={`${label} md:col-span-2`}>{isAr ? "الوسوم (افصلي بينها بفاصلة، حتى 6)" : "Tags (comma separated, up to 6)"}
            <input className={input} value={form.ar.tags} onChange={(e) => setAr("tags", e.target.value)} />
          </label>
          <label className={label}>{isAr ? "نص الزر الرئيسي" : "Main button text"}
            <input className={input} value={form.ar.cta} maxLength={200} onChange={(e) => setAr("cta", e.target.value)} />
          </label>
          <label className={label}>{isAr ? "رابط الزر الرئيسي (مثال: /collections/winter)" : "Main button link"}
            <input dir="ltr" className={input} value={form.ctaHref} onChange={(e) => setRoot("ctaHref", e.target.value)} />
          </label>
          <label className={label}>{isAr ? "نص الرابط الثاني" : "Second link text"}
            <input className={input} value={form.ar.secondary} maxLength={200} onChange={(e) => setAr("secondary", e.target.value)} />
          </label>
          <label className={label}>{isAr ? "الرابط الثاني" : "Second link"}
            <input dir="ltr" className={input} value={form.secondaryHref} onChange={(e) => setRoot("secondaryHref", e.target.value)} />
          </label>
          <label className={label}>{isAr ? "وسم الموسم على الصورة (مثال: SEASON 02)" : "Season tag on image"}
            <input dir="ltr" className={input} value={form.seasonTag} maxLength={40} onChange={(e) => setRoot("seasonTag", e.target.value)} />
          </label>
          <label className={label}>{isAr ? "حروف الخلفية الباهتة (3 حروف، مثال: WNT)" : "Faint background letters"}
            <input dir="ltr" className={input} value={form.watermark} maxLength={12} onChange={(e) => setRoot("watermark", e.target.value)} />
          </label>
          <label className={`${label} md:col-span-2`}>{isAr ? "وصف الصورة (لقارئات الشاشة)" : "Image description"}
            <input className={input} value={form.ar.imageAlt} maxLength={200} onChange={(e) => setAr("imageAlt", e.target.value)} />
          </label>

          <div className="md:col-span-2">
            <span className="text-sm font-black">{isAr ? "صورة القسم" : "Section image"}</span>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {form.image && <img src={form.image} alt="" className="h-24 w-20 border border-espresso/10 object-cover" />}
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy === "upload"} onChange={(e) => uploadImage(e.target.files?.[0])} className="block text-xs" />
              {busy === "upload" && <span className="text-xs font-bold text-espresso/60">{isAr ? "جاري الرفع..." : "Uploading..."}</span>}
            </div>
            {form.image && (
              <div className="mt-4 grid gap-5 border border-espresso/10 bg-oat/20 p-4 md:grid-cols-[240px_1fr]">
                <div className="relative h-56 w-full overflow-hidden bg-espresso md:w-60">
                  <img src={form.image} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${form.imageX}% ${form.imageY}%`, transform: `scale(${form.imageZoom})`, transformOrigin: `${form.imageX}% ${form.imageY}%` }} />
                </div>
                <div className="grid content-start gap-4 text-sm">
                  <p className="font-black">{isAr ? "ضبط الصورة (المعاينة على اليسار)" : "Adjust the image (preview on the left)"}</p>
                  <label className="grid gap-1">{isAr ? "الموضع أفقياً" : "Horizontal position"}
                    <input type="range" min="0" max="100" value={form.imageX} onChange={(e) => setRoot("imageX", Number(e.target.value))} />
                  </label>
                  <label className="grid gap-1">{isAr ? "الموضع عمودياً" : "Vertical position"}
                    <input type="range" min="0" max="100" value={form.imageY} onChange={(e) => setRoot("imageY", Number(e.target.value))} />
                  </label>
                  <label className="grid gap-1">{isAr ? "التقريب" : "Zoom"}
                    <input type="range" min="1" max="2" step="0.05" value={form.imageZoom} onChange={(e) => setRoot("imageZoom", Number(e.target.value))} />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => { setRoot("imageX", 50); setRoot("imageY", 30); setRoot("imageZoom", 1); }} className="border border-espresso/15 px-4 py-2 text-xs font-black">{isAr ? "إعادة الضبط" : "Reset"}</button>
                    <button type="button" onClick={() => setRoot("image", DEFAULT_FEATURED.image)} className="border border-espresso/15 px-4 py-2 text-xs font-black">{isAr ? "رجوع للصورة الأصلية" : "Use the original image"}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="button" onClick={save} disabled={busy === "save"} className="omb-btn omb-btn-primary disabled:opacity-50"><span>{isAr ? "حفظ ونشر" : "Save & publish"}</span></button>
          <button type="button" onClick={() => setForm(toForm(null))} className="text-sm font-black text-espresso/60 underline">{isAr ? "استرجاع النص الافتراضي (بدون حفظ)" : "Load defaults (not saved)"}</button>
          {message.text && <span className={`text-sm font-bold ${message.type === "error" ? "text-red-700" : "text-aubergine"}`} role="status">{message.text}</span>}
        </div>

        <div className="mt-12 border-t border-espresso/10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-espresso">{isAr ? "معاينة حيّة" : "Live preview"}</h2>
            <div className="flex gap-2 text-xs font-black">
              {["ar", "en"].map((code) => (
                <button key={code} type="button" onClick={() => setPreviewLocale(code)} className={`border px-3 py-1.5 ${previewLocale === code ? "border-aubergine bg-aubergine text-milk" : "border-espresso/15"}`}>{code === "ar" ? "العربية" : "English"}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <FeaturedCollection locale={previewLocale} previewContent={draftContent} />
      </div>
    </main>
  );
}
