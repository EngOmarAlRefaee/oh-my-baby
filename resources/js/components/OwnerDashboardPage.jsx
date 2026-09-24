import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import OrderStatus from "./ui/OrderStatus";

function Metric({ label, value, note }) {
  return (
    <div className="border border-espresso/10 bg-oat/20 p-5">
      <p className="text-xs font-black text-aubergine/60">{label}</p>
      <strong className="mt-2 block text-3xl text-espresso">{value}</strong>
      {note && <p className="mt-2 text-xs text-espresso/50">{note}</p>}
    </div>
  );
}

function LinkCard({ href, eyebrow, title, body }) {
  return (
    <a href={href} className="group border border-espresso/10 bg-milk p-5 transition hover:border-aubergine/35 hover:bg-oat/20">
      <p className="text-[10px] font-black uppercase tracking-[.14em] text-aubergine/55">{eyebrow}</p>
      <strong className="mt-2 block text-lg text-espresso">{title}</strong>
      <p className="mt-2 text-sm leading-6 text-espresso/55">{body}</p>
      <span className="mt-4 inline-block text-sm font-black text-aubergine group-hover:underline">←</span>
    </a>
  );
}

export default function OwnerDashboardPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.status === 403 ? (isAr ? "هذه اللوحة خاصة بحساب Owner." : "Owner account only.") : e.message));
  }, [isAr]);

  return (
    <main className="min-h-[75vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="omb-eyebrow-label text-aubergine/65">OH MY BABY — OWNER</p>
            <h1 className="mt-2 text-4xl font-black text-espresso">{isAr ? "لوحة المالك" : "Owner dashboard"}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-espresso/55">{isAr ? "نظرة سريعة على البيع والطلبات والعمولات، مع وصول مباشر لكل أقسام التشغيل." : "A quick view of sales, orders and commissions with direct access to operations."}</p>
          </div>
          <a href="/" className="omb-btn omb-btn-secondary">{isAr ? "عرض المتجر" : "View store"}</a>
        </div>

        {error && <p className="mt-6 border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>}
        {!data && !error && <p className="mt-8 text-sm font-black text-espresso/45">{isAr ? "جاري تحميل لوحة التحكم..." : "Loading dashboard..."}</p>}

        {data && (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Metric label={isAr ? "مبيعات مسلّمة اليوم" : "Delivered sales today"} value={`$${Number(data.sales.delivered_today_usd).toFixed(2)}`} note={isAr ? `${data.orders.delivered_today} طلب مكتمل` : `${data.orders.delivered_today} completed`} />
              <Metric label={isAr ? "قيد المراجعة" : "Under review"} value={data.orders.pending_review} note={isAr ? "تحتاج قرار الإدارة" : "Need team action"} />
              <Metric label={isAr ? "قيد التوصيل" : "Out for delivery"} value={data.orders.out_for_delivery} note={isAr ? `${data.orders.assigned_to_driver} مرسلة للسائق ولم تبدأ بعد` : `${data.orders.assigned_to_driver} assigned, not started`} />
              <Metric label={isAr ? "عمولات معلّقة" : "Pending commissions"} value={`$${Number(data.commissions.pending_usd).toFixed(2)}`} note={isAr ? `مدفوع إجمالاً $${Number(data.commissions.paid_usd || 0).toFixed(2)}` : `Paid total $${Number(data.commissions.paid_usd || 0).toFixed(2)}`} />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <LinkCard href="/admin/orders" eyebrow="ORDERS" title={isAr ? "الطلبات" : "Orders"} body={isAr ? "راجع كل الطلبات وتدخل فقط عند الحاجة." : "Review every order and intervene when needed."} />
              <LinkCard href="/admin/products" eyebrow="CATALOG" title={isAr ? "المنتجات والمخزون" : "Products & inventory"} body={isAr ? "إضافة وتعديل المنتجات والقياسات والأسعار." : "Manage products, variants and pricing."} />
              <LinkCard href="/admin/operations" eyebrow="FINANCE" title={isAr ? "Sham Cash والعمولات" : "Sham Cash & commissions"} body={isAr ? "التحويلات والعمولات وحالتها المالية." : "Transfers, commissions and payment operations."} />
              <LinkCard href="/delivery" eyebrow="DELIVERY" title={isAr ? "التوصيل" : "Delivery"} body={isAr ? "راقب الطلبات المسندة للسائقين وحالتها." : "Monitor assigned deliveries and their status."} />
              <LinkCard href="/admin/marketing" eyebrow="MARKETING" title={isAr ? "العروض والتسويق" : "Marketing"} body={isAr ? "إدارة كود الحسم والمشتركين ونتائج الاستفتاءات." : "Manage promo codes, subscribers and poll results."} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_.75fr]">
              <section className="border border-espresso/10 bg-oat/15 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-black">{isAr ? "آخر الطلبات" : "Recent orders"}</h2><a href="/admin/orders" className="text-xs font-black text-aubergine underline">{isAr ? "كل الطلبات" : "All orders"}</a></div>
                <div className="mt-4 grid gap-3">
                  {data.recent_orders.map((order) => (
                    <a key={order.id} href="/admin/orders" className="flex flex-wrap items-center justify-between gap-3 border-t border-espresso/10 pt-3 first:border-0 first:pt-0">
                      <div><strong className="text-sm">{order.reference}</strong><p className="mt-1 text-xs text-espresso/50">{order.customer_name} · ${Number(order.total_usd).toFixed(2)}</p></div>
                      <OrderStatus status={order.status} locale={locale} />
                    </a>
                  ))}
                  {!data.recent_orders.length && <p className="text-sm text-espresso/50">{isAr ? "لا توجد طلبات بعد." : "No orders yet."}</p>}
                </div>
              </section>

              <aside className="border border-espresso/10 bg-milk p-5 sm:p-6">
                <p className="text-xs font-black text-aubergine/60">SHAM CASH</p>
                <h2 className="mt-2 text-xl font-black">{isAr ? "حساب الشركة" : "Company account"}</h2>
                <p className="mt-4 text-sm text-espresso/55">{data.sham_cash.company_account_configured ? data.sham_cash.company_account : (isAr ? "لم يتم إدخال الحساب بعد" : "Account not configured yet")}</p>
                <div className="mt-5 grid gap-2 text-sm"><p>{isAr ? "الربط:" : "Integration:"} <strong>{data.sham_cash.enabled ? (isAr ? "مفعّل" : "Enabled") : (isAr ? "غير مفعّل" : "Disabled")}</strong></p><p>{isAr ? "التحويل التلقائي:" : "Auto transfer:"} <strong>{data.sham_cash.auto_transfer ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}</strong></p></div>
                <p className="mt-6 border-t border-espresso/10 pt-4 text-xs leading-6 text-espresso/50">{isAr ? `العملاء: ${data.people.customers} · السائقون: ${data.people.drivers} · الإدمن: ${data.people.admins}` : `Customers: ${data.people.customers} · Drivers: ${data.people.drivers} · Admins: ${data.people.admins}`}</p>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
