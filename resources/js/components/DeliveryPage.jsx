import React, { useEffect, useMemo, useState } from "react";
import OrderStatus from "./ui/OrderStatus";
import OrderTimeline from "./ui/OrderTimeline";
import ReturnTimeline from "./ui/ReturnTimeline";
import { apiFetch } from "../lib/api";

export default function DeliveryPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [orders, setOrders] = useState([]);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const load = () => apiFetch("/api/delivery/orders")
    .then((data) => { setOrders(data.orders || []); setError(""); })
    .catch((e) => setError(e.message));

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 10000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const counts = useMemo(() => ({
    assigned: orders.filter((o) => o.status === "assigned_to_driver").length,
    out: orders.filter((o) => o.status === "out_for_delivery").length,
    returns: orders.filter((o) => ["return_assigned", "return_in_transit"].includes(o.status)).length,
    done: orders.filter((o) => ["delivered", "returned"].includes(o.status) && new Date(o.updated_at).toDateString() === new Date().toDateString()).length,
  }), [orders]);

  async function command(order, commandName, extra = {}) {
    setBusy(`${commandName}-${order.id}`);
    setError("");
    try {
      await apiFetch(`/api/delivery/orders/${order.id}/${commandName}`, {
        method: "POST",
        body: JSON.stringify({ delivery_note: notes[order.id] ?? order.delivery_note ?? null, ...extra }),
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-[70vh] bg-milk px-5 py-14" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl">
        <p className="omb-eyebrow-label text-aubergine/65">OH MY BABY — DELIVERY</p>
        <h1 className="mt-3 text-4xl font-black">{isAr ? "لوحة التوصيل والمرتجعات" : "Delivery & returns"}</h1>
        <p className="mt-3 text-sm text-espresso/60">{isAr ? "السائق ينفذ الإجراءات الطبيعية، وإذا لم يكن متاحاً يستطيع Admin أو Owner فتح نفس اللوحة من حسابه وتنفيذ الإجراء نيابة عنه. كل فعل يتسجل بالنظام." : "Drivers handle normal actions; Admin or Owner can use this same board as fallback. Every action is logged."}</p>

        <div className="mt-7 grid gap-3 sm:grid-cols-4">
          {[
            [isAr ? "بانتظار البدء" : "Assigned", counts.assigned],
            [isAr ? "قيد التوصيل" : "Out for delivery", counts.out],
            [isAr ? "مرتجعات نشطة" : "Active returns", counts.returns],
            [isAr ? "مكتمل اليوم" : "Completed today", counts.done],
          ].map(([label, number]) => (
            <div key={label} className="border border-espresso/10 bg-oat/20 p-5"><p className="text-xs font-black text-aubergine/55">{label}</p><strong className="mt-2 block text-3xl">{number}</strong></div>
          ))}
        </div>

        {error && <p className="mt-5 border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>}

        <div className="mt-7 grid gap-5">
          {orders.map((order) => (
            <article key={order.id} className="border border-espresso/10 bg-oat/18 p-6">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <strong>{order.reference}</strong>
                  <p className="mt-1 text-sm">{order.customer_name} · <a className="underline" href={`tel:${order.customer_phone}`}>{order.customer_phone}</a></p>
                  <p className="mt-2 text-sm text-espresso/60">{order.delivery_address}</p>
                </div>
                <OrderStatus status={order.status} locale={locale} />
              </div>

              <div className="mt-4 border border-espresso/10 bg-milk/60 p-4"><OrderTimeline status={order.status} locale={locale} compact wasDelivered={Boolean(order.delivered_at)} /></div>
              {["return_assigned", "return_in_transit", "returned"].includes(order.status) && <div className="mt-3 border border-espresso/10 bg-milk/60 p-4"><p className="mb-3 text-xs font-black text-aubergine/65">{isAr ? "مسار المرتجع" : "Return flow"}</p><ReturnTimeline status={order.status} locale={locale} compact /></div>}

              <div className="mt-4 grid gap-2 text-sm">
                {order.items?.map((item) => <p key={item.id}>{item.quantity}× {isAr ? item.name_ar : (item.name_en || item.name_ar)} {[item.color_name, item.size].filter(Boolean).join(" · ")}</p>)}
              </div>

              {order.return_reason && <p className="mt-4 border border-espresso/10 bg-milk p-3 text-sm"><b>{isAr ? "سبب المرتجع" : "Return reason"}:</b> {order.return_reason}</p>}

              <label className="mt-5 block text-xs font-black">
                {isAr ? "ملاحظات على الطلب" : "Delivery notes"}
                <textarea rows="2" value={notes[order.id] ?? order.delivery_note ?? ""} onChange={(e) => setNotes({ ...notes, [order.id]: e.target.value })} className="mt-2 w-full border border-espresso/12 bg-milk p-3" />
              </label>

              <div className="mt-4 flex flex-wrap gap-2">
                {order.status === "assigned_to_driver" && <button disabled={busy === `start-${order.id}`} onClick={() => command(order, "start")} className="omb-btn omb-btn-secondary">{isAr ? "بدأت التوصيل" : "Start delivery"}</button>}
                {order.status === "out_for_delivery" && <>
                  <button disabled={busy === `deliver-${order.id}`} onClick={() => command(order, "deliver")} className="omb-btn omb-btn-primary">{isAr ? "تم التسليم" : "Mark delivered"}</button>
                  <button disabled={busy === `return-at-door-${order.id}`} onClick={() => { const reason = window.prompt(isAr ? "سبب عدم التسليم / المرتجع" : "Reason for failed delivery / return", ""); if (reason?.trim()) command(order, "return-at-door", { reason: reason.trim() }); }} className="omb-btn omb-btn-secondary">{isAr ? "تعذر التسليم / مرتجع" : "Failed delivery / return"}</button>
                </>}
                {order.status === "return_assigned" && <button disabled={busy === `return-start-${order.id}`} onClick={() => command(order, "return-start")} className="omb-btn omb-btn-secondary">{isAr ? "استلمت المرتجع من الزبون" : "Return picked up"}</button>}
                {order.status === "return_in_transit" && <button disabled={busy === `return-complete-${order.id}`} onClick={() => command(order, "return-complete")} className="omb-btn omb-btn-primary">{isAr ? "تم إرجاع الطلب للمتجر" : "Returned to store"}</button>}
                {order.status === "delivered" && <strong>{isAr ? "تم التسليم ✓" : "Delivered ✓"}</strong>}
                {order.status === "returned" && <strong>{isAr ? "تم استلام المرتجع ✓" : "Returned ✓"}</strong>}
              </div>
            </article>
          ))}
          {!orders.length && !error && <p className="border border-espresso/10 p-8 text-center text-espresso/55">{isAr ? "لا توجد طلبات نشطة لهذا الحساب." : "No active orders."}</p>}
        </div>
      </div>
    </main>
  );
}
