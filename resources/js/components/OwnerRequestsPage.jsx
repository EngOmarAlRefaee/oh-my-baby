import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const labels = { pending: "بانتظار القرار", approved: "موافق", rejected: "مرفوض", answered: "تم الرد" };

export default function OwnerRequestsPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState({});
  const [message, setMessage] = useState("");
  const load = () => apiFetch("/api/owner/requests").then((d) => setItems(d.requests || [])).catch((e) => setMessage(e.message));
  useEffect(() => { load(); }, []);

  async function resolve(id, status) {
    setMessage("");
    try {
      await apiFetch(`/api/owner/requests/${id}/resolve`, { method: "POST", body: JSON.stringify({ status, owner_response: notes[id] || "" }) });
      await load();
    } catch (e) { setMessage(e.message); }
  }

  return <main className="min-h-[75vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="omb-eyebrow-label text-aubergine/65">OWNER INBOX</p><h1 className="mt-2 text-3xl font-black">{isAr ? "طلبات الإدمن" : "Admin requests"}</h1></div><a href="/owner" className="omb-btn omb-btn-secondary">{isAr ? "لوحة الأونر" : "Owner dashboard"}</a></div>{message && <p className="mt-5 border border-red-300 bg-red-50 p-3 text-red-700">{message}</p>}<div className="mt-8 grid gap-4">{items.map((item) => <article key={item.id} className="border border-espresso/10 bg-oat/15 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-aubergine/60">{item.admin?.name} · {item.type}</p><h2 className="mt-1 text-lg font-black">{item.title}</h2></div><span className="text-xs font-black text-aubergine">{labels[item.status] || item.status}</span></div><p className="mt-3 text-sm leading-6 text-espresso/60">{item.message}</p>{item.status === "pending" ? <><textarea value={notes[item.id] || ""} onChange={(e) => setNotes((v) => ({ ...v, [item.id]: e.target.value }))} rows={3} placeholder={isAr ? "رد أو ملاحظة للأدمن..." : "Response..."} className="mt-4 w-full border border-espresso/15 bg-milk p-3"/><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => resolve(item.id, "approved")} className="omb-btn omb-btn-primary">{isAr ? "موافقة" : "Approve"}</button><button onClick={() => resolve(item.id, "answered")} className="omb-btn omb-btn-secondary">{isAr ? "رد فقط" : "Reply"}</button><button onClick={() => resolve(item.id, "rejected")} className="omb-btn omb-btn-secondary">{isAr ? "رفض" : "Reject"}</button></div></> : item.owner_response ? <p className="mt-4 border-t border-espresso/10 pt-3 text-sm"><strong>{isAr ? "الرد:" : "Response:"}</strong> {item.owner_response}</p> : null}</article>)}{!items.length && <p className="text-sm text-espresso/50">{isAr ? "ما في طلبات من الإدمن حالياً." : "No admin requests."}</p>}</div></div></main>;
}
