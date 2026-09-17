import React, { useEffect, useState } from "react";
import AuthPanel from "./auth/AuthPanel";
import OrderStatus from "./ui/OrderStatus";
import OrderTimeline from "./ui/OrderTimeline";
import ReturnTimeline from "./ui/ReturnTimeline";
import { apiFetch } from "../lib/api";

export default function CustomerAccountPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [overview, setOverview] = useState(null);
  const [unauth, setUnauth] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const load = () => apiFetch("/api/account/overview")
    .then((data) => { setOverview(data); setUnauth(false); setError(""); })
    .catch((e) => { if (e.status === 401) setUnauth(true); else setError(e.message); });

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 10000);
    const onFocus = () => load();
    window.addEventListener("omb:auth-updated", load);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("omb:auth-updated", load);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  async function requestReturn(order) {
    const reason = window.prompt(isAr ? "اكتب سبب الإرجاع" : "Why would you like to return this order?", "");
    if (!reason?.trim()) return;
    setBusy(order.id);
    setError("");
    try {
      await apiFetch(`/api/orders/${order.id}/return-request`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="min-h-[70vh] bg-milk px-5 py-14" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl">
        <p className="omb-eyebrow-label text-aubergine/65">OH MY BABY MEMBER</p>
        <h1 className="mt-3 text-4xl font-black">{isAr ? "حسابك وطلباتك" : "Your account & orders"}</h1>
        <div className="mt-8"><AuthPanel locale={locale} compact redirectOnSuccess={false} /></div>

        {error && <p className="mt-6 border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>}

        {overview && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div>
              <h2 className="text-2xl font-black">{isAr ? "الطلبات" : "Orders"}</h2>
              <p className="mt-2 text-sm text-espresso/55">{isAr ? "الحالة تتحدث تلقائياً كل عدة ثوانٍ، وما تحتاج تعمل Refresh." : "Order status refreshes automatically every few seconds."}</p>
              <div className="mt-4 grid gap-4">
                {overview.orders?.length ? overview.orders.map((order) => (
                  <article key={order.id} className="border border-espresso/10 bg-oat/20 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <strong>{order.reference}</strong>
                      <OrderStatus status={order.status} locale={locale} audience="customer" />
                    </div>
                    <p className="mt-3 text-sm text-espresso/60">${Number(order.total_usd).toFixed(2)} · {Number(order.total_syp || 0).toLocaleString()} {isAr ? "ل.س جديدة" : "New SYP"}</p>
                    <div className="mt-4 border-t border-espresso/10 pt-4">
                      <OrderTimeline status={order.status} locale={locale} wasDelivered={Boolean(order.delivered_at)} />
                    </div>

                    {["return_requested", "return_approved", "return_assigned", "return_in_transit", "returned"].includes(order.status) && (
                      <div className="mt-4 border-t border-espresso/10 pt-4">
                        <p className="mb-3 text-xs font-black text-aubergine/65">{isAr ? "مسار الإرجاع" : "Return progress"}</p>
                        <ReturnTimeline status={order.status} locale={locale} />
                        {order.return_reason && <p className="mt-3 text-xs text-espresso/55"><b>{isAr ? "السبب" : "Reason"}:</b> {order.return_reason}</p>}
                        {order.return_admin_note && <p className="mt-2 text-xs text-espresso/55"><b>{isAr ? "ملاحظة الإدارة" : "Admin note"}:</b> {order.return_admin_note}</p>}
                      </div>
                    )}

                    {order.return_rejected_at && order.status === "delivered" && (
                      <p className="mt-4 border border-espresso/10 bg-milk p-3 text-sm font-bold text-espresso/70">
                        {isAr ? "تمت مراجعة طلب الإرجاع ولم تتم الموافقة عليه." : "Your return request was reviewed and not approved."}
                        {order.return_admin_note ? ` — ${order.return_admin_note}` : ""}
                      </p>
                    )}

                    {order.delivery_user && ["out_for_delivery", "delivered", "return_requested", "return_approved", "return_assigned", "return_in_transit", "returned"].includes(order.status) && (
                      <p className="mt-3 text-xs text-espresso/55">{isAr ? "سائق التوصيل" : "Delivery driver"}: {order.delivery_user.name}</p>
                    )}
                    {order.return_delivery_user && ["return_assigned", "return_in_transit", "returned"].includes(order.status) && (
                      <p className="mt-2 text-xs text-espresso/55">{isAr ? "سائق المرتجع" : "Return driver"}: {order.return_delivery_user.name}</p>
                    )}

                    {order.status === "delivered" && !order.return_rejected_at && (
                      <div className="mt-4 border-t border-espresso/10 pt-4">
                        <button
                          disabled={busy === order.id}
                          onClick={() => requestReturn(order)}
                          className="omb-btn omb-btn-secondary disabled:opacity-40"
                        >
                          {isAr ? "طلب إرجاع" : "Request return"}
                        </button>
                      </div>
                    )}
                    {order.status === "returned" && (
                      <p className="mt-4 font-bold">{isAr ? "تم استلام المرتجع من قبل OH MY BABY، وتم تحديث المكافآت والعمولة." : "Return received by OH MY BABY; rewards and commission were updated."}</p>
                    )}
                  </article>
                )) : <p className="border border-espresso/10 p-6 text-espresso/55">{isAr ? "ما في طلبات بعد." : "No orders yet."}</p>}
              </div>
            </div>

            <aside>
              <h2 className="text-2xl font-black">{isAr ? "المكافآت" : "Rewards"}</h2>
              <p className="mt-2 text-sm text-espresso/60">{isAr ? `طلبات مسلّمة: ${overview.rewards?.delivered_orders ?? 0}` : `Delivered orders: ${overview.rewards?.delivered_orders ?? 0}`}</p>
              <div className="mt-4 grid gap-3">
                {overview.rewards?.coupons?.length ? overview.rewards.coupons.map((coupon) => (
                  <div key={coupon.id} className="border border-espresso/10 bg-oat/20 p-4">
                    <code className="font-black text-aubergine">{coupon.code}</code>
                    <p className="mt-1 text-sm">{Number(coupon.discount_percent)}% · {coupon.status}</p>
                  </div>
                )) : <p className="text-sm text-espresso/55">{isAr ? "أكمل عدد الطلبات المطلوب لفتح أول كوبون." : "Complete the required delivered orders to unlock your first coupon."}</p>}
              </div>
            </aside>
          </div>
        )}

        {unauth && <p className="mt-6 text-sm text-espresso/55">{isAr ? "سجّل دخولك ليظهر تاريخ الطلبات والمكافآت." : "Sign in to see order history and rewards."}</p>}
      </div>
    </section>
  );
}
