import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const types = [
  ["general", "طلب عام"],
  ["permission", "صلاحية أو وصول"],
  ["financial", "موضوع مالي"],
  ["staff", "موظف أو سائق"],
  ["exception", "استثناء على طلب"],
  ["technical", "مشكلة تقنية"],
];

function statusLabel(status) {
  return ({ pending: "بانتظار الأونر", approved: "تمت الموافقة", rejected: "مرفوض", answered: "تم الرد" })[status] || status;
}

export default function AdminOwnerRequestsPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ type: "general", title: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => apiFetch("/api/admin/owner-requests").then((data) => setItems(data.requests || [])).catch((e) => setMessage(e.message));
  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      await apiFetch("/api/admin/owner-requests", { method: "POST", body: JSON.stringify(form) });
      setForm({ type: "general", title: "", message: "" });
      setMessage(isAr ? "تم رفع الطلب للأونر." : "Request sent to owner.");
      await load();
    } catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }

  return (
    <main className="min-h-[75vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="omb-eyebrow-label text-aubergine/65">ADMIN → OWNER</p><h1 className="mt-2 text-3xl font-black text-espresso">{isAr ? "طلبات مرفوعة للأونر" : "Requests to owner"}</h1><p className="mt-2 text-sm text-espresso/55">{isAr ? "للموافقات والاستثناءات والمشاكل المهمة التي تحتاج قرار الأونر." : "For approvals, exceptions and issues that need an owner decision."}</p></div>
          <a href="/admin" className="omb-btn omb-btn-secondary">{isAr ? "لوحة التحكم" : "Dashboard"}</a>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <form onSubmit={submit} className="border border-espresso/10 bg-oat/20 p-5 sm:p-6">
            <h2 className="text-xl font-black">{isAr ? "رفع طلب جديد" : "New request"}</h2>
            <label className="mt-5 block text-sm font-black">{isAr ? "نوع الطلب" : "Type"}<select value={form.type} onChange={(e) => setForm((v) => ({ ...v, type: e.target.value }))} className="mt-2 h-12 w-full border border-espresso/15 bg-milk px-3">{types.map(([value, ar]) => <option key={value} value={value}>{isAr ? ar : value}</option>)}</select></label>
            <label className="mt-4 block text-sm font-black">{isAr ? "العنوان" : "Title"}<input required value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} className="mt-2 h-12 w-full border border-espresso/15 bg-milk px-3" /></label>
            <label className="mt-4 block text-sm font-black">{isAr ? "التفاصيل" : "Details"}<textarea required minLength={3} rows={6} value={form.message} onChange={(e) => setForm((v) => ({ ...v, message: e.target.value }))} className="mt-2 w-full border border-espresso/15 bg-milk p-3" /></label>
            <button disabled={busy} className="omb-btn omb-btn-primary mt-5 w-full disabled:opacity-50">{busy ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال للأونر" : "Send to owner")}</button>
            {message && <p className="mt-4 text-sm font-black text-aubergine">{message}</p>}
          </form>

          <section className="border border-espresso/10 bg-milk p-5 sm:p-6">
            <h2 className="text-xl font-black">{isAr ? "طلباتي السابقة" : "Previous requests"}</h2>
            <div className="mt-4 grid gap-3">
              {items.map((item) => <article key={item.id} className="border border-espresso/10 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{item.title}</strong><span className="border border-aubergine/20 bg-aubergine/5 px-2.5 py-1 text-[11px] font-black text-aubergine">{statusLabel(item.status)}</span></div><p className="mt-2 text-sm leading-6 text-espresso/60">{item.message}</p>{item.owner_response && <p className="mt-3 border-t border-espresso/10 pt-3 text-sm"><strong>{isAr ? "رد الأونر:" : "Owner response:"}</strong> {item.owner_response}</p>}</article>)}
              {!items.length && <p className="text-sm text-espresso/50">{isAr ? "ما في طلبات مرفوعة لسا." : "No requests yet."}</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
