import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import OrderStatus from "./ui/OrderStatus";

function Stat({ label, value, action, href }) {
  return (
    <a href={href || "/admin/orders"} className="border border-espresso/10 bg-oat/20 p-5 transition hover:border-aubergine/35">
      <p className="text-xs font-black text-aubergine/60">{label}</p>
      <strong className="mt-2 block text-3xl text-espresso">{value}</strong>
      {action && <p className="mt-2 text-xs text-espresso/50">{action}</p>}
    </a>
  );
}

export default function AdminDashboardPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => apiFetch("/api/dashboard").then(setData).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-[75vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="omb-eyebrow-label text-aubergine/65">OH MY BABY — ADMIN</p>
            <h1 className="mt-2 text-4xl font-black text-espresso">{isAr ? "لوحة التشغيل" : "Operations dashboard"}</h1>
            <p className="mt-3 text-sm text-espresso/55">{isAr ? "هاي الصفحة هي نقطة البداية اليومية: الطلبات أولاً، بعدها المنتجات والتوصيل والتحصيل." : "Your daily starting point: orders first, then products, delivery and payments."}</p>
          </div>
          <a href="/admin/orders" className="omb-btn omb-btn-primary">{isAr ? "فتح الطلبات" : "Open orders"}</a>
        </div>

        {error && <p className="mt-6 border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>}
        {data && (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Stat label={isAr ? "طلبات اليوم" : "Today's orders"} value={data.orders.today} action={isAr ? "كل الطلبات الجديدة" : "New orders"} />
              <Stat label={isAr ? "قيد المراجعة" : "Under review"} value={data.orders.pending_review} action={isAr ? "الأولوية الآن" : "Priority now"} />
              <Stat label={isAr ? "تم قبولها" : "Accepted"} value={data.orders.accepted} action={isAr ? "بانتظار سائق" : "Waiting for driver"} />
              <Stat label={isAr ? "عند السائق" : "Assigned"} value={data.orders.assigned_to_driver} action={isAr ? "لم يبدأ التوصيل" : "Not started"} href="/delivery" />
              <Stat label={isAr ? "بالتوصيل" : "Out for delivery"} value={data.orders.out_for_delivery} action={isAr ? "جارية الآن" : "Live now"} href="/delivery" />
              <Stat label={isAr ? "تم اليوم" : "Delivered today"} value={data.orders.delivered_today} action={`$${Number(data.sales.delivered_today_usd).toFixed(2)}`} />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <a href="/admin/orders" className="border border-espresso/10 bg-milk p-5 hover:border-aubergine/35"><p className="text-[10px] font-black text-aubergine/55">ORDERS</p><strong className="mt-2 block text-lg">{isAr ? "قبول وتحويل الطلبات" : "Accept & dispatch orders"}</strong><p className="mt-2 text-sm text-espresso/55">{isAr ? "راجع الطلب، اقبله، اختر السائق وأرسله." : "Review, accept, choose a driver and dispatch."}</p></a>
              <a href="/admin/products" className="border border-espresso/10 bg-milk p-5 hover:border-aubergine/35"><p className="text-[10px] font-black text-aubergine/55">PRODUCTS</p><strong className="mt-2 block text-lg">{isAr ? "المنتجات والمخزون" : "Products & inventory"}</strong><p className="mt-2 text-sm text-espresso/55">{isAr ? "إضافة وتعديل الأسعار والقياسات والصور." : "Edit products, prices, variants and images."}</p></a>
              <a href="/delivery" className="border border-espresso/10 bg-milk p-5 hover:border-aubergine/35"><p className="text-[10px] font-black text-aubergine/55">DELIVERY</p><strong className="mt-2 block text-lg">{isAr ? "متابعة التوصيل" : "Delivery follow-up"}</strong><p className="mt-2 text-sm text-espresso/55">{isAr ? "شوف شو عند كل سائق ووين وصلت الطلبات." : "See assigned orders and delivery progress."}</p></a>
              <a href="/admin/operations" className="border border-espresso/10 bg-milk p-5 hover:border-aubergine/35"><p className="text-[10px] font-black text-aubergine/55">SHAM CASH</p><strong className="mt-2 block text-lg">{isAr ? "التحصيل والعمولات" : "Payments & commissions"}</strong><p className="mt-2 text-sm text-espresso/55">{isAr ? "متابعة حساب الشركة والعمولات والتحويلات." : "Company account, commission and transfer operations."}</p></a>
              <a href="/admin/marketing" className="border border-espresso/10 bg-milk p-5 hover:border-aubergine/35"><p className="text-[10px] font-black text-aubergine/55">MARKETING</p><strong className="mt-2 block text-lg">{isAr ? "العروض والتسويق" : "Marketing"}</strong><p className="mt-2 text-sm text-espresso/55">{isAr ? "كود الحسم، المشتركين ونتائج الاستفتاءات." : "Promo code, subscribers and poll results."}</p></a>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_.75fr]">
              <section className="border border-espresso/10 bg-oat/15 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-black">{isAr ? "آخر الطلبات" : "Recent orders"}</h2><a href="/admin/orders" className="text-xs font-black text-aubergine underline">{isAr ? "إدارة الطلبات" : "Manage orders"}</a></div>
                <div className="mt-4 grid gap-3">
                  {data.recent_orders.map((order) => (
                    <a key={order.id} href="/admin/orders" className="flex flex-wrap items-center justify-between gap-3 border-t border-espresso/10 pt-3 first:border-0 first:pt-0">
                      <div><strong className="text-sm">{order.reference}</strong><p className="mt-1 text-xs text-espresso/50">{order.customer_name} · ${Number(order.total_usd).toFixed(2)}</p></div>
                      <OrderStatus status={order.status} locale={locale} />
                    </a>
                  ))}
                </div>
              </section>

              <aside className="border border-espresso/10 bg-milk p-5 sm:p-6">
                <p className="text-xs font-black text-aubergine/60">SHAM CASH</p>
                <h2 className="mt-2 text-xl font-black">{isAr ? "مرجع التحصيل" : "Payment reference"}</h2>
                <p className="mt-3 text-sm leading-6 text-espresso/55">{isAr ? "هذا هو حساب الشركة الذي سنعرضه للزبون عند تفعيل الدفع عبر Sham Cash." : "This is the company account that will be shown to customers when Sham Cash checkout is enabled."}</p>
                <p className="mt-4 border border-espresso/10 bg-oat/20 p-3 text-sm font-black">{data.sham_cash.company_account_configured ? data.sham_cash.company_account : (isAr ? "الحساب غير مضبوط بعد" : "Account not configured yet")}</p>
                <p className="mt-4 text-xs text-espresso/50">{isAr ? `عمولات بانتظار المعالجة: $${Number(data.commissions.pending_usd).toFixed(2)}` : `Pending commissions: $${Number(data.commissions.pending_usd).toFixed(2)}`}</p>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
