import React, { useEffect, useMemo, useState } from "react";
import OrderStatus from "./ui/OrderStatus";
import OrderTimeline from "./ui/OrderTimeline";
import ReturnTimeline from "./ui/ReturnTimeline";
import { apiFetch } from "../lib/api";

export default function DeliveryPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [orders, setOrders] = useState([]);
  const [totals, setTotals] = useState({ delivered: 0, returned: 0 });
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [returned, setReturned] = useState({});
  const [doorFor, setDoorFor] = useState(null);
  const [doorReason, setDoorReason] = useState("");
  const retQty = (order, item) => {
    const typed = returned[`${order.id}:${item.id}`];
    if (typed !== undefined) return typed;
    const items = order.items || [];
    if (items.some((i) => Number(i.returned_quantity) > 0)) return Number(item.returned_quantity) || 0;
    if (items.some((i) => Number(i.return_requested_quantity) > 0)) return Number(item.return_requested_quantity) || 0;
    return Number(item.quantity);
  };
  const setRetQty = (order, item, value) => setReturned((current) => ({ ...current, [`${order.id}:${item.id}`]: Math.max(0, Math.min(Number(item.quantity), Number(value) || 0)) }));

  const load = () => apiFetch("/api/delivery/orders")
    .then((data) => { setOrders(data.orders || []); setTotals({ delivered: data.delivered_total ?? 0, returned: data.returned_total ?? 0 }); setError(""); })
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

  const isDone = (o) => ["delivered", "returned"].includes(o.status);
  const activeOrders = orders.filter((o) => !isDone(o));
  const doneToday = orders.filter((o) => isDone(o) && new Date(o.updated_at).toDateString() === new Date().toDateString());

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

        <div className="mt-7 grid gap-3 sm:grid-cols-5">
          {[
            [isAr ? "بانتظار البدء" : "Assigned", counts.assigned],
            [isAr ? "قيد التوصيل" : "Out for delivery", counts.out],
            [isAr ? "مرتجعات نشطة" : "Active returns", counts.returns],
            [isAr ? "مكتمل اليوم" : "Completed today", counts.done],
            [isAr ? "إجمالي المسلّم" : "Total delivered", totals.delivered],
          ].map(([label, number]) => (
            <div key={label} className="border border-espresso/10 bg-oat/20 p-5"><p className="text-xs font-black text-aubergine/55">{label}</p><strong className="mt-2 block text-3xl">{number}</strong></div>
          ))}
        </div>

        {error && <p className="mt-5 border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>}

        <div className="mt-7 grid gap-5">
          {activeOrders.map((order) => (
            <article key={order.id} className="border border-espresso/10 bg-oat/18 p-6">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <strong>{order.reference}</strong>
                  <p className="mt-1 text-sm">{order.customer_name}{order.customer_phone ? (<>
                    {" · "}<span dir="ltr">{order.customer_phone}</span>
                    <a href={`tel:${String(order.customer_phone).replace(/[^\d+]/g, "")}`} aria-label={isAr ? "اتصال بالزبون" : "Call customer"} title={isAr ? "اتصال بالزبون" : "Call customer"} className="ms-3 inline-grid h-9 w-9 place-items-center rounded-full bg-[#25D366] align-middle text-white shadow-sm">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.100.4 2.300.6 3.600.6.600 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.500c.6 0 1 .4 1 1 0 1.300.2 2.500.6 3.600.1.300 0 .7-.2 1z" /></svg>
                    </a></>) : null}</p>
                  <p className="mt-2 text-sm text-espresso/60">{order.delivery_address}</p>
                </div>
                <OrderStatus status={order.status} locale={locale} />
              </div>

              <div className="mt-4 border border-espresso/10 bg-milk/60 p-4"><OrderTimeline status={order.status} locale={locale} compact wasDelivered={Boolean(order.delivered_at)} /></div>
              {["return_assigned", "return_in_transit", "returned"].includes(order.status) && <div className="mt-3 border border-espresso/10 bg-milk/60 p-4"><p className="mb-3 text-xs font-black text-aubergine/65">{isAr ? "مسار المرتجع" : "Return flow"}</p><ReturnTimeline status={order.status} locale={locale} compact /></div>}

              <div className="mt-4 grid gap-2 text-sm">
                {order.items?.map((item) => <p key={item.id}>{item.quantity}× {isAr ? item.name_ar : (item.name_en || item.name_ar)} {[item.color_name, item.size].filter(Boolean).join(" · ")}</p>)}
              </div>

              {order.status === "return_in_transit" && (
                <div className="mt-4 border border-espresso/10 bg-milk p-4 text-sm">
                  <p className="mb-2 text-xs font-black text-aubergine/65">{isAr ? "القطع التي رجعت فعلياً (الباقي يعتبر مع الزبون)" : "Pieces actually returned (the rest stay with the customer)"}</p>
                  {order.items?.map((item) => (
                    <label key={item.id} className="mb-2 flex items-center justify-between gap-3">
                      <span>{isAr ? item.name_ar : (item.name_en || item.name_ar)} {[item.color_name, item.size].filter(Boolean).join(" · ")}</span>
                      <input type="number" min="0" max={item.quantity} value={retQty(order, item)} onChange={(e) => setRetQty(order, item, e.target.value)} className="w-20 border border-espresso/12 bg-milk p-2 text-center" />
                    </label>
                  ))}
                </div>
              )}

              {order.return_reason && <p className="mt-4 border border-espresso/10 bg-milk p-3 text-sm"><b>{isAr ? "سبب المرتجع" : "Return reason"}:</b> {order.return_reason}</p>}

              <label className="mt-5 block text-xs font-black">
                {isAr ? "ملاحظات على الطلب" : "Delivery notes"}
                <textarea rows="2" value={notes[order.id] ?? order.delivery_note ?? ""} onChange={(e) => setNotes({ ...notes, [order.id]: e.target.value })} className="mt-2 w-full border border-espresso/12 bg-milk p-3" />
              </label>

              {doorFor === order.id && order.status === "out_for_delivery" && (
                <div className="mt-4 border border-aubergine/25 bg-milk p-4 text-sm">
                  <p className="text-xs font-black text-aubergine/70">{isAr ? "شو رجع من هالطلب؟ اختار عدد القطع الراجعة لكل منتج (القطع اللي بتبقى مع الزبون بتنحسب مسلّمة)" : "What is being returned? Set the pieces coming back per item (pieces left with the customer count as delivered)"}</p>
                  <div className="mt-3 grid gap-2">
                    {order.items?.map((item) => (
                      <label key={item.id} className="flex items-center justify-between gap-3">
                        <span>{isAr ? item.name_ar : (item.name_en || item.name_ar)} {[item.color_name, item.size].filter(Boolean).join(" · ")} <span className="text-espresso/50">(×{item.quantity})</span></span>
                        <input type="number" min="0" max={item.quantity} value={retQty(order, item)} onChange={(e) => setRetQty(order, item, e.target.value)} className="w-20 border border-espresso/12 bg-milk p-2 text-center" />
                      </label>
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-bold text-espresso/60">{isAr ? `الراجع: ${(order.items || []).reduce((sum, item) => sum + retQty(order, item), 0)} من ${(order.items || []).reduce((sum, item) => sum + Number(item.quantity), 0)} قطعة` : `Returning ${(order.items || []).reduce((sum, item) => sum + retQty(order, item), 0)} of ${(order.items || []).reduce((sum, item) => sum + Number(item.quantity), 0)} pieces`}</p>
                  <label className="mt-3 block text-xs font-black">{isAr ? "السبب" : "Reason"}
                    <input value={doorReason} onChange={(e) => setDoorReason(e.target.value)} className="mt-2 w-full border border-espresso/12 bg-milk p-3" />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" disabled={busy === `return-at-door-${order.id}` || doorReason.trim().length < 3 || (order.items || []).reduce((sum, item) => sum + retQty(order, item), 0) < 1} onClick={async () => { await command(order, "return-at-door", { reason: doorReason.trim(), returned_items: (order.items || []).map((item) => ({ id: item.id, quantity: retQty(order, item) })) }); setDoorFor(null); }} className="omb-btn omb-btn-primary disabled:opacity-40">{isAr ? "تأكيد المرتجع" : "Confirm return"}</button>
                    <button type="button" onClick={() => setDoorFor(null)} className="omb-btn omb-btn-secondary">{isAr ? "إلغاء" : "Cancel"}</button>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {order.status === "assigned_to_driver" && <button disabled={busy === `start-${order.id}`} onClick={() => command(order, "start")} className="omb-btn omb-btn-secondary">{isAr ? "بدأت التوصيل" : "Start delivery"}</button>}
                {order.status === "out_for_delivery" && <>
                  <button disabled={busy === `deliver-${order.id}`} onClick={() => command(order, "deliver")} className="omb-btn omb-btn-primary">{isAr ? "تم التسليم" : "Mark delivered"}</button>
                  <button disabled={busy === `return-at-door-${order.id}`} onClick={() => { setDoorFor(order.id); setDoorReason(""); }} className="omb-btn omb-btn-secondary">{isAr ? "تعذر التسليم / مرتجع" : "Failed delivery / return"}</button>
                </>}
                {order.status === "return_assigned" && <button disabled={busy === `return-start-${order.id}`} onClick={() => command(order, "return-start")} className="omb-btn omb-btn-secondary">{isAr ? "استلمت المرتجع من الزبون" : "Return picked up"}</button>}
                {order.status === "return_in_transit" && <button disabled={busy === `return-complete-${order.id}`} onClick={() => command(order, "return-complete", { returned_items: (order.items || []).map((item) => ({ id: item.id, quantity: retQty(order, item) })) })} className="omb-btn omb-btn-primary">{isAr ? "تم إرجاع الطلب للمتجر" : "Returned to store"}</button>}
                {order.status === "delivered" && <strong>{isAr ? "تم التسليم ✓" : "Delivered ✓"}</strong>}
                {order.status === "returned" && <strong>{isAr ? "تم استلام المرتجع ✓" : "Returned ✓"}</strong>}
              </div>
            </article>
          ))}
          {!activeOrders.length && !error && <p className="border border-espresso/10 p-8 text-center text-espresso/55">{isAr ? "لا توجد طلبات نشطة لهذا الحساب." : "No active orders."}</p>}
          {doneToday.length > 0 && (
            <section className="border border-espresso/10 bg-oat/12 p-5">
              <p className="text-xs font-black text-aubergine/65">{isAr ? "المكتملة اليوم" : "Completed today"}</p>
              <div className="mt-3 grid gap-2">
                {doneToday.map((order) => (
                  <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-espresso/10 pt-2 text-sm">
                    <strong>{order.reference}</strong>
                    <span className="text-espresso/60">{order.customer_name}</span>
                    <span className="font-bold">{order.status === "returned" ? (isAr ? "تم استلام المرتجع ✓" : "Returned ✓") : (isAr ? "تم التسليم ✓" : "Delivered ✓")}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
