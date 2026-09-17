import React, { useEffect, useMemo, useState } from "react";
import AuthPanel from "./auth/AuthPanel";
import DualPrice from "./ui/DualPrice";
import OrderStatus from "./ui/OrderStatus";
import OrderTimeline from "./ui/OrderTimeline";
import { clearCart, getCartDetailed, saveProducts } from "../data/productStore";
import { apiFetch } from "../lib/api";

export default function CheckoutPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [session, setSession] = useState({ loading: true, user: null });
  const [items, setItems] = useState(() => getCartDetailed());
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", delivery_address: "", customer_note: "", coupon_code: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    const load = () => apiFetch("/auth/session").then((data) => {
      setSession({ loading: false, user: data.user || null });
      if (data.user) setForm((current) => ({ ...current, customer_name: current.customer_name || data.user.name || "", customer_phone: current.customer_phone || data.user.phone || "" }));
    }).catch(() => setSession({ loading: false, user: null }));
    load();
    window.addEventListener("omb:auth-updated", load);
    return () => window.removeEventListener("omb:auth-updated", load);
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.subtotal, 0), [items]);

  async function submit(event) {
    event.preventDefault();
    if (!items.length || !session.user) return;
    setBusy(true); setError("");
    try {
      const payload = {
        ...form,
        coupon_code: form.coupon_code.trim() || null,
        items: items.map((item) => ({
          product_id: item.product.id,
          name_ar: item.product.name,
          name_en: item.product.nameEn || item.product.name,
          image: item.color?.image || item.product.image,
          color_id: item.color?.id || null,
          color_name: item.color ? (isAr ? item.color.nameAr : item.color.nameEn) : null,
          size: item.size === "default" ? null : item.size,
          quantity: item.quantity,
          unit_price_usd: item.price,
          category: item.product.category || null,
          sections: item.product.sections || [],
        })),
      };
      const data = await apiFetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
      try {
        const catalog = await apiFetch("/api/catalog");
        if (Array.isArray(catalog.products) && catalog.products.length) saveProducts(catalog.products);
      } catch {}
      clearCart(); setItems([]); setSubmitted(data.order);
    } catch (err) {
      setError(err.data?.errors ? Object.values(err.data.errors).flat()[0] : err.message);
    } finally { setBusy(false); }
  }

  if (submitted) return (
    <section className="min-h-[70vh] bg-milk px-5 py-16" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl border border-espresso/12 bg-oat/25 p-8 sm:p-12">
        <p className="omb-eyebrow-label text-aubergine/70">ORDER RECEIVED</p>
        <h1 className="mt-3 text-4xl font-black">{isAr ? "تم إرسال طلبك" : "Your order was submitted"}</h1>
        <p className="mt-4 text-espresso/65">{isAr ? "صار الطلب عند الإدارة، وحالته حالياً:" : "The order is now with the team. Its current status is:"}</p>
        <div className="mt-5"><OrderStatus status={submitted.status} locale={locale} audience="customer" /></div>
        <div className="mt-6 border-t border-espresso/10 pt-5"><OrderTimeline status={submitted.status} locale={locale} /></div>
        <p className="mt-6 font-black">{isAr ? "رقم الطلب:" : "Order:"} {submitted.reference}</p>
        <a href="/account" className="omb-btn omb-btn-primary mt-7">{isAr ? "متابعة الطلب من حسابي" : "Track in my account"}</a>
      </div>
    </section>
  );

  if (session.loading) return <section className="min-h-[60vh] bg-milk p-10">{isAr ? "جاري التحميل..." : "Loading..."}</section>;
  if (!session.user) return (
    <section className="min-h-[70vh] bg-milk px-5 py-14" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-4xl font-black">{isAr ? "سجّل دخولك لإتمام الطلب" : "Sign in to checkout"}</h1>
        <AuthPanel locale={locale} redirectOnSuccess={false} />
      </div>
    </section>
  );

  return (
    <section className="min-h-[70vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_400px]">
        <form onSubmit={submit} className="border border-espresso/10 bg-oat/20 p-6 sm:p-8">
          <p className="omb-eyebrow-label text-aubergine/65">CHECKOUT</p>
          <h1 className="mt-2 text-3xl font-black">{isAr ? "إتمام الطلب" : "Complete your order"}</h1>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-black">{isAr ? "الاسم" : "Name"}<input required value={form.customer_name} onChange={(e)=>setForm({...form,customer_name:e.target.value})} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none" /></label>
            <label className="text-sm font-black">{isAr ? "الهاتف" : "Phone"}<input required value={form.customer_phone} onChange={(e)=>setForm({...form,customer_phone:e.target.value})} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none" /></label>
          </div>
          <label className="mt-5 block text-sm font-black">{isAr ? "عنوان التوصيل" : "Delivery address"}<textarea required rows="4" value={form.delivery_address} onChange={(e)=>setForm({...form,delivery_address:e.target.value})} className="mt-2 w-full border border-espresso/12 bg-milk p-4 outline-none" /></label>
          <label className="mt-5 block text-sm font-black">{isAr ? "ملاحظات" : "Notes"}<textarea rows="3" value={form.customer_note} onChange={(e)=>setForm({...form,customer_note:e.target.value})} className="mt-2 w-full border border-espresso/12 bg-milk p-4 outline-none" /></label>
          <label className="mt-5 block text-sm font-black">{isAr ? "كوبون مكافأة" : "Reward coupon"}<input value={form.coupon_code} onChange={(e)=>setForm({...form,coupon_code:e.target.value})} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none" /></label>
          {error && <p className="mt-5 border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
          <button disabled={busy || !items.length} className="omb-btn omb-btn-primary mt-7 w-full disabled:opacity-40">{busy ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال الطلب للمراجعة" : "Submit order for review")}</button>
        </form>
        <aside className="h-fit border border-espresso/10 bg-milk p-6 lg:sticky lg:top-[190px]">
          <h2 className="text-xl font-black">{isAr ? "ملخص السلة" : "Bag summary"}</h2>
          <div className="mt-5 grid gap-4">{items.map((item)=><div key={item.key} className="grid grid-cols-[64px_1fr] gap-3 border-b border-espresso/10 pb-4"><img src={item.color?.image || item.product.image} className="aspect-[4/5] w-full object-cover" alt=""/><div><p className="text-sm font-black">{isAr ? item.product.name : item.product.nameEn || item.product.name}</p><p className="mt-1 text-xs text-espresso/50">× {item.quantity}{item.size !== "default" ? ` · ${item.size}` : ""}</p><DualPrice usd={item.subtotal} locale={locale} compact className="mt-2"/></div></div>)}</div>
          <div className="mt-5 border-t border-espresso/10 pt-5"><p className="font-black">{isAr ? "الإجمالي قبل الكوبون" : "Total before coupon"}</p><DualPrice usd={total} locale={locale} className="mt-2"/></div>
        </aside>
      </div>
    </section>
  );
}
