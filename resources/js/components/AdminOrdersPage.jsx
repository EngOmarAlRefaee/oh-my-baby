import React, { useEffect, useState } from "react";
import OrderStatus from "./ui/OrderStatus";
import OrderTimeline from "./ui/OrderTimeline";
import ReturnTimeline from "./ui/ReturnTimeline";
import { apiFetch } from "../lib/api";

const RETURN_STATUSES = ["return_requested", "return_approved", "return_assigned", "return_in_transit", "returned"];

export default function AdminOrdersPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [data, setData] = useState({ orders: [], drivers: [] });
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const [selectedReturnDrivers, setSelectedReturnDrivers] = useState({});
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const next = await apiFetch("/api/admin/orders");
      setData(next);
      setSelectedDrivers((current) => {
        const merged = { ...current };
        next.orders?.forEach((order) => {
          if (merged[order.id] == null && order.assigned_delivery_id) merged[order.id] = String(order.assigned_delivery_id);
        });
        return merged;
      });
      setSelectedReturnDrivers((current) => {
        const merged = { ...current };
        next.orders?.forEach((order) => {
          if (merged[order.id] == null && order.return_delivery_id) merged[order.id] = String(order.return_delivery_id);
        });
        return merged;
      });
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

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

  async function action(orderId, actionName, payload = {}) {
    setBusy(`${actionName}-${orderId}`);
    setError("");
    try {
      await apiFetch(`/api/admin/orders/${orderId}/${actionName}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-[75vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="omb-eyebrow-label text-aubergine/65">OH MY BABY ADMIN</p>
            <h1 className="mt-2 text-4xl font-black">{isAr ? "إدارة الطلبات" : "Order management"}</h1>
            <p className="mt-3 text-espresso/60">{isAr ? "الحالة تتغيّر حسب الإجراء الحقيقي. والإدمن أو الأونر يقدر يتدخل مكان السائق من لوحة التوصيل عند الحاجة." : "Statuses follow real actions. Admin/Owner can step in from the delivery board when needed."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/admin" className="omb-btn omb-btn-secondary">{isAr ? "لوحة الإدمن" : "Admin"}</a>
            <a href="/delivery" className="omb-btn omb-btn-secondary">{isAr ? "لوحة التوصيل / التدخل" : "Delivery / fallback"}</a>
            <a href="/admin/operations" className="omb-btn omb-btn-secondary">{isAr ? "التحصيل والعمولات" : "Finance"}</a>
          </div>
        </div>

        {error && <p className="mt-6 border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>}

        <div className="mt-8 grid gap-5">
          {data.orders.map((order) => {
            const selectedDriver = selectedDrivers[order.id] || "";
            const selectedReturnDriver = selectedReturnDrivers[order.id] || "";
            return (
              <article key={order.id} className="border border-espresso/10 bg-oat/18 p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <strong className="text-lg">{order.reference}</strong>
                    <p className="mt-1 text-sm text-espresso/55">{order.customer_name} · {order.customer_phone}</p>
                    <p className="mt-1 text-xs text-espresso/50">{order.delivery_address}</p>
                  </div>
                  <div className="text-end">
                    <OrderStatus status={order.status} locale={locale} />
                    <p className="mt-2 font-black">${Number(order.total_usd).toFixed(2)} · {Number(order.total_syp || 0).toLocaleString()} {isAr ? "ل.س جديدة" : "New SYP"}</p>
                  </div>
                </div>

                <div className="mt-5 border border-espresso/10 bg-milk/70 p-4">
                  <OrderTimeline status={order.status} locale={locale} compact wasDelivered={Boolean(order.delivered_at)} />
                </div>

                {RETURN_STATUSES.includes(order.status) && (
                  <div className="mt-3 border border-espresso/10 bg-milk/70 p-4">
                    <p className="mb-3 text-xs font-black text-aubergine/65">{isAr ? "مسار المرتجع" : "Return flow"}</p>
                    <ReturnTimeline status={order.status} locale={locale} compact />
                    {order.return_reason && <p className="mt-3 text-xs text-espresso/55"><b>{isAr ? "سبب الإرجاع" : "Return reason"}:</b> {order.return_reason}</p>}
                  </div>
                )}

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead><tr className="border-b border-espresso/10 text-start text-xs text-espresso/50"><th className="py-2 text-start">{isAr ? "المنتج" : "Product"}</th><th className="text-start">{isAr ? "الخيار" : "Variant"}</th><th>{isAr ? "الكمية" : "Qty"}</th><th>{isAr ? "السعر" : "Price"}</th><th>{isAr ? "عرض؟" : "Offer?"}</th></tr></thead>
                    <tbody>{order.items?.map((item) => <tr key={item.id} className="border-b border-espresso/5"><td className="py-3 font-bold">{isAr ? item.name_ar : (item.name_en || item.name_ar)}</td><td>{[item.color_name, item.size].filter(Boolean).join(" · ")}</td><td className="text-center">{item.quantity}</td><td className="text-center">${Number(item.line_total_usd).toFixed(2)}</td><td className="text-center">{item.is_offer ? "✓" : "—"}</td></tr>)}</tbody>
                  </table>
                </div>

                <div className="mt-6 border-t border-espresso/10 pt-5">
                  {order.status === "pending_review" && (
                    <div className="flex flex-wrap gap-3">
                      <button disabled={busy === `accept-${order.id}`} onClick={() => action(order.id, "accept")} className="omb-btn omb-btn-primary">{isAr ? "قبول الطلب" : "Accept order"}</button>
                      <button disabled={busy === `reject-${order.id}`} onClick={() => { const note = window.prompt(isAr ? "سبب الرفض (اختياري)" : "Rejection reason (optional)", "") ?? null; if (note !== null) action(order.id, "reject", { admin_note: note || null }); }} className="omb-btn omb-btn-secondary">{isAr ? "رفض الطلب" : "Reject order"}</button>
                    </div>
                  )}

                  {order.status === "accepted" && (
                    <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                      <label className="text-xs font-black">{isAr ? "اختر السائق" : "Choose driver"}<select value={selectedDriver} onChange={(e) => setSelectedDrivers((current) => ({ ...current, [order.id]: e.target.value }))} className="mt-2 h-11 w-full border border-espresso/12 bg-milk px-3"><option value="">{isAr ? "اختر سائقاً" : "Choose driver"}</option>{data.drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}</select></label>
                      <button disabled={!selectedDriver || busy === `dispatch-${order.id}`} onClick={() => action(order.id, "dispatch", { delivery_user_id: Number(selectedDriver) })} className="omb-btn omb-btn-primary disabled:opacity-40">{isAr ? "إرسال الطلب للسائق" : "Send to driver"}</button>
                    </div>
                  )}

                  {order.status === "assigned_to_driver" && <div className="flex flex-wrap items-center justify-between gap-3 border border-espresso/10 bg-milk/60 p-4"><div><strong>{isAr ? "تم إرسال الطلب للسائق" : "Order sent to driver"}</strong><p className="mt-1 text-sm text-espresso/60">{order.delivery_user?.name || "—"}</p></div><a href="/delivery" className="omb-btn omb-btn-secondary">{isAr ? "تدخل مكان السائق" : "Operate as fallback"}</a></div>}

                  {order.status === "out_for_delivery" && <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">{isAr ? `السائق ${order.delivery_user?.name || ""} بدأ التوصيل.` : "Driver started delivery."}</p><a href="/delivery" className="omb-btn omb-btn-secondary">{isAr ? "تدخل مكان السائق" : "Operate as fallback"}</a></div>}

                  {order.status === "delivered" && <p className="font-bold">{isAr ? "تم التسليم ✓ — تم احتساب الطلب للمكافآت والعمولة." : "Delivered ✓ — rewards and commission processed."}</p>}

                  {order.status === "return_requested" && (
                    <div>
                      <p className="mb-3 font-bold">{isAr ? "الزبون طلب إرجاع الطلب." : "Customer requested a return."}</p>
                      <div className="flex flex-wrap gap-3">
                        <button disabled={busy === `return-approve-${order.id}`} onClick={() => { const note = window.prompt(isAr ? "ملاحظة الموافقة (اختياري)" : "Approval note (optional)", "") ?? null; if (note !== null) action(order.id, "return-approve", { note: note || null }); }} className="omb-btn omb-btn-primary">{isAr ? "الموافقة على الإرجاع" : "Approve return"}</button>
                        <button disabled={busy === `return-reject-${order.id}`} onClick={() => { const note = window.prompt(isAr ? "سبب رفض الإرجاع" : "Why reject the return?", "") ?? null; if (note !== null) action(order.id, "return-reject", { note: note || null }); }} className="omb-btn omb-btn-secondary">{isAr ? "رفض الإرجاع" : "Reject return"}</button>
                      </div>
                    </div>
                  )}

                  {order.status === "return_approved" && (
                    <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                      <label className="text-xs font-black">{isAr ? "اختر سائق استلام المرتجع" : "Choose return driver"}<select value={selectedReturnDriver} onChange={(e) => setSelectedReturnDrivers((current) => ({ ...current, [order.id]: e.target.value }))} className="mt-2 h-11 w-full border border-espresso/12 bg-milk px-3"><option value="">{isAr ? "اختر سائقاً" : "Choose driver"}</option>{data.drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}</select></label>
                      <button disabled={!selectedReturnDriver || busy === `return-dispatch-${order.id}`} onClick={() => action(order.id, "return-dispatch", { delivery_user_id: Number(selectedReturnDriver) })} className="omb-btn omb-btn-primary disabled:opacity-40">{isAr ? "إرسال سائق لاستلام المرتجع" : "Send return driver"}</button>
                    </div>
                  )}

                  {order.status === "return_assigned" && <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">{isAr ? `تم تكليف ${order.return_delivery_user?.name || "السائق"} باستلام المرتجع.` : "Return driver assigned."}</p><a href="/delivery" className="omb-btn omb-btn-secondary">{isAr ? "تدخل مكان السائق" : "Operate as fallback"}</a></div>}
                  {order.status === "return_in_transit" && <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">{isAr ? "المرتجع بالطريق إلى OH MY BABY." : "Return is on the way back."}</p><a href="/delivery" className="omb-btn omb-btn-secondary">{isAr ? "إتمام المرتجع بنفسي" : "Complete return as fallback"}</a></div>}
                  {order.status === "returned" && <p className="font-bold">{isAr ? "تم استلام المرتجع ✓ — تم تحديث المكافآت وعكس العمولة إن وجدت." : "Returned ✓ — rewards and commission updated."}</p>}
                  {order.status === "rejected" && <p className="font-bold text-red-700">{isAr ? "تم رفض الطلب." : "Order rejected."}</p>}
                </div>

                {(order.customer_note || order.admin_note || order.delivery_note || order.return_admin_note) && (
                  <div className="mt-5 grid gap-2 text-xs text-espresso/60">
                    {order.customer_note && <p><b>{isAr ? "ملاحظة الزبون" : "Customer"}:</b> {order.customer_note}</p>}
                    {order.admin_note && <p><b>{isAr ? "ملاحظة الإدارة" : "Admin"}:</b> {order.admin_note}</p>}
                    {order.delivery_note && <p><b>{isAr ? "ملاحظة السائق" : "Driver"}:</b> {order.delivery_note}</p>}
                    {order.return_admin_note && <p><b>{isAr ? "ملاحظة المرتجع" : "Return admin note"}:</b> {order.return_admin_note}</p>}
                  </div>
                )}
              </article>
            );
          })}
          {!data.orders.length && <p className="border border-espresso/10 p-8 text-center text-espresso/55">{isAr ? "لا توجد طلبات بعد." : "No orders yet."}</p>}
        </div>
      </div>
    </main>
  );
}
