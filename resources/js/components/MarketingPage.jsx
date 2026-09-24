import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

export default function MarketingPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [data, setData] = useState({ promo_codes: [], subscribers: [], polls: [], feedback: [] });
  const [form, setForm] = useState({ code: "BABY10", discount_percent: 10, active: true, first_order_only: true });
  const [message, setMessage] = useState("");

  function load() {
    apiFetch("/api/admin/marketing").then((payload) => {
      setData(payload);
      const current = payload.promo_codes?.[0];
      if (current) setForm({ code: current.code, discount_percent: Number(current.discount_percent), active: Boolean(current.active), first_order_only: Boolean(current.first_order_only) });
    }).catch((error) => setMessage(error.message));
  }

  useEffect(load, []);

  async function savePromo(event) {
    event.preventDefault();
    setMessage("");
    try {
      await apiFetch("/api/admin/marketing/promo", { method: "POST", body: JSON.stringify(form) });
      setMessage(isAr ? "تم حفظ كود الحسم." : "Promo code saved.");
      load();
    } catch (error) {
      setMessage(error.data?.errors ? Object.values(error.data.errors).flat()[0] : error.message);
    }
  }

  const pollRows = useMemo(() => {
    const map = new Map();
    (data.polls || []).forEach((row) => {
      const current = map.get(row.section) || { section: row.section, yes: 0, no: 0 };
      current[row.choice] = Number(row.votes || 0);
      map.set(row.section, current);
    });
    return Array.from(map.values());
  }, [data.polls]);

  return (
    <main className="min-h-[75vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <p className="omb-eyebrow-label text-aubergine/65">MARKETING</p>
        <h1 className="mt-2 text-4xl font-black text-espresso">{isAr ? "العروض والتسويق" : "Marketing & offers"}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-espresso/55">{isAr ? "إدارة كود الحسم، المشتركين بالبريد، ونتائج استفتاءات الأقسام القادمة." : "Manage promo codes, newsletter subscribers and upcoming-section polls."}</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form onSubmit={savePromo} className="border border-espresso/10 bg-oat/20 p-6">
            <h2 className="text-xl font-black">{isAr ? "كود الحسم العام" : "Public promo code"}</h2>
            <label className="mt-5 block text-sm font-black">{isAr ? "الكود" : "Code"}<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4" /></label>
            <label className="mt-4 block text-sm font-black">{isAr ? "نسبة الخصم %" : "Discount %"}<input type="number" min="0.01" max="100" step="0.01" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4" /></label>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setForm({ ...form, active: !form.active })} className={`border p-4 text-start font-black ${form.active ? "border-aubergine bg-aubergine text-milk" : "border-espresso/12"}`}>{isAr ? `الحالة: ${form.active ? "مفعّل" : "متوقف"}` : `Status: ${form.active ? "Enabled" : "Disabled"}`}</button>
              <button type="button" onClick={() => setForm({ ...form, first_order_only: !form.first_order_only })} className={`border p-4 text-start font-black ${form.first_order_only ? "border-aubergine bg-aubergine text-milk" : "border-espresso/12"}`}>{isAr ? `أول طلب فقط: ${form.first_order_only ? "نعم" : "لا"}` : `First order only: ${form.first_order_only ? "Yes" : "No"}`}</button>
            </div>
            <button className="omb-btn omb-btn-primary mt-5 w-full">{isAr ? "حفظ الإعدادات" : "Save settings"}</button>
            {message && <p className="mt-3 text-xs font-bold text-aubergine">{message}</p>}
          </form>

          <section className="border border-espresso/10 bg-milk p-6">
            <h2 className="text-xl font-black">{isAr ? "مشتركو البريد" : "Newsletter subscribers"}</h2>
            <p className="mt-2 text-3xl font-black text-aubergine">{data.subscribers?.length || 0}</p>
            <div className="mt-5 max-h-72 overflow-auto border-t border-espresso/10 pt-3">{data.subscribers?.map((row) => <p key={row.id} className="border-b border-espresso/10 py-2 text-sm">{row.email}</p>)}</div>
          </section>
        </div>

        <section className="mt-6 border border-espresso/10 bg-oat/20 p-6">
          <h2 className="text-xl font-black">{isAr ? "نتائج استفتاء عالم الطفل" : "Baby World poll result"}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{pollRows.map((row) => <div key={row.section} className="border border-espresso/10 bg-milk p-4"><strong>{row.section}</strong><p className="mt-3 text-sm">{isAr ? "نعم" : "Yes"}: {row.yes}</p><p className="text-sm">{isAr ? "لا" : "No"}: {row.no}</p></div>)}</div>
          {!pollRows.length && <p className="mt-4 text-sm text-espresso/55">{isAr ? "لا توجد أصوات بعد." : "No votes yet."}</p>}
        </section>

        <section className="mt-6 border border-espresso/10 bg-milk p-6">
          <h2 className="text-xl font-black">{isAr ? "ملاحظات الزباين" : "Customer feedback"}</h2>
          <p className="mt-2 text-sm leading-7 text-espresso/55">{isAr ? "الملاحظات المرسلة من قسم عالم الطفل." : "Notes submitted from the Baby World section."}</p>
          <div className="mt-5 grid gap-3">
            {(data.feedback || []).map((row) => (
              <article key={row.id} className="border border-espresso/10 bg-oat/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-sm text-aubergine">{row.source}</strong><span className="text-xs font-bold text-espresso/45">{row.created_at}</span></div>
                <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-espresso/75">{row.message}</p>
              </article>
            ))}
            {!(data.feedback || []).length && <p className="text-sm text-espresso/55">{isAr ? "لا توجد ملاحظات بعد." : "No feedback yet."}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
