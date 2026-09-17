import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import OrderStatus from "./ui/OrderStatus";

function MainCard({ number, eyebrow, title, body, href, badge, accent = false, owner = false }) {
  return (
    <a
      href={href}
      className={`group relative min-h-[230px] overflow-hidden border p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(40,35,33,.10)] ${
        owner
          ? "border-espresso bg-espresso text-milk"
          : accent
            ? "border-aubergine/30 bg-aubergine text-milk"
            : "border-espresso/10 bg-milk hover:border-aubergine/35"
      }`}
    >
      <span className={`text-[11px] font-black tracking-[.18em] ${owner || accent ? "text-milk/65" : "text-aubergine/55"}`}>
        {String(number).padStart(2, "0")} · {eyebrow}
      </span>
      <strong className="mt-5 block text-2xl font-black">{title}</strong>
      <p className={`mt-3 max-w-[28rem] text-sm leading-7 ${owner || accent ? "text-milk/72" : "text-espresso/55"}`}>{body}</p>
      <div className="absolute bottom-5 start-6 flex items-center gap-3">
        <span className="text-sm font-black">فتح ←</span>
        {badge !== undefined && (
          <span className={`px-2.5 py-1 text-[11px] font-black ${owner || accent ? "bg-milk/12 text-milk" : "bg-oat/50 text-aubergine"}`}>
            {badge}
          </span>
        )}
      </div>
    </a>
  );
}

function Metric({ label, value, note }) {
  return (
    <div className="border border-espresso/10 bg-oat/18 p-4">
      <p className="text-[11px] font-black text-aubergine/60">{label}</p>
      <strong className="mt-2 block text-2xl text-espresso">{value}</strong>
      {note && <p className="mt-1 text-xs text-espresso/45">{note}</p>}
    </div>
  );
}

function OwnerTool({ href, eyebrow, title, body }) {
  return (
    <a href={href} className="group border border-milk/15 bg-milk/[.045] p-5 transition hover:bg-milk/[.085]">
      <p className="text-[10px] font-black tracking-[.15em] text-oat/60">{eyebrow}</p>
      <strong className="mt-2 block text-lg text-milk">{title}</strong>
      <p className="mt-2 text-sm leading-6 text-milk/58">{body}</p>
      <span className="mt-4 inline-block text-sm font-black text-oat group-hover:underline">فتح ←</span>
    </a>
  );
}

export default function OwnerDashboardPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => apiFetch("/api/dashboard")
    .then(setData)
    .catch((e) => setError(e.status === 403 ? (isAr ? "هذه اللوحة خاصة بحساب Owner." : "Owner account only.") : e.message));

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [isAr]);

  return (
    <main className="min-h-[75vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="omb-eyebrow-label text-aubergine/65">OH MY BABY — OWNER CONTROL CENTER</p>
            <h1 className="mt-2 text-4xl font-black text-espresso">{isAr ? "لوحة تحكم الأونر" : "Owner control center"}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-espresso/55">
              {isAr
                ? "نفس مركز تشغيل الإدمن، مع صلاحيات الأونر العليا مجمّعة بقسم سادس مستقل. أول ما تسجل دخول كـOwner بتوصل لهون مباشرة."
                : "The same operational control center as Admin, plus a sixth area for owner-only powers. Owner login lands here automatically."}
            </p>
          </div>
          <a href="/" className="omb-btn omb-btn-secondary">{isAr ? "فتح الموقع كزبون" : "View store"}</a>
        </div>

        {error && <p className="mt-6 border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>}
        {!data && !error && <p className="mt-8 text-sm font-black text-espresso/45">{isAr ? "جاري تحميل لوحة التحكم..." : "Loading dashboard..."}</p>}

        {data && (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <MainCard
                number={1}
                eyebrow="ACCOUNTS"
                title={isAr ? "الحسابات والفريق" : "Accounts & team"}
                body={isAr ? "الإشراف الكامل على الإدمنز والديليفري والمشتركين، إنشاء الحسابات، الإيقاف، إعادة التفعيل وتحديد الإدمن الرئيسي." : "Full oversight of admins, delivery and customers, including account creation and access management."}
                href="/owner/team"
                badge={`${data.people.admins + data.people.drivers + data.people.customers} حساب`}
              />
              <MainCard
                number={2}
                eyebrow="ORDERS"
                title={isAr ? "الطلبات والعمليات" : "Orders & operations"}
                body={isAr ? "متابعة كل الطلبات والمرتجعات والتوصيل والتدخل بأي مرحلة عند الحاجة بصلاحية الأونر." : "Monitor every order, return and delivery, with owner override when needed."}
                href="/admin/orders"
                badge={`${data.orders.pending_review} بانتظار المراجعة`}
              />
              <MainCard
                number={3}
                eyebrow="ADMINS"
                title={isAr ? "طلبات الإدمن والتواصل" : "Admin requests"}
                body={isAr ? "استقبل طلبات الموافقات والاستثناءات والمشاكل المالية أو الإدارية المرفوعة من الإدمنز، ورد عليها من مكان واحد." : "Review approvals, exceptions and operational issues raised by admins."}
                href="/owner/requests"
                badge={`${data.owner_requests?.pending_mine || 0} معلّق`}
              />
              <MainCard
                number={4}
                eyebrow="CONTROL"
                title={isAr ? "الإحصائيات والمراقبة" : "Statistics & monitoring"}
                body={isAr ? "راقب الطلبات المكتملة والمرتجعات والزيارات وتسجيلات الدخول والمبيعات والعمولات من شاشة واحدة." : "Monitor orders, returns, visits, logins, sales and commissions."}
                href="#owner-stats"
              />
              <MainCard
                number={5}
                eyebrow="STORE"
                title={isAr ? "الدخول للموقع كزبون" : "Browse the store"}
                body={isAr ? "شوف واجهة المتجر مثل الزبون بدون ما تطلع من حساب الأونر. زر لوحة التحكم بالهيدر بيرجعك لهون." : "Browse the storefront without leaving the owner session; use the header dashboard button to return."}
                href="/"
                accent
              />
              <MainCard
                number={6}
                eyebrow="OWNER ONLY"
                title={isAr ? "صلاحيات الأونر العليا" : "Owner-only controls"}
                body={isAr ? "المال والعمولات، Sham Cash، الصلاحيات العليا، سجل الرقابة والقرارات الحساسة الخاصة بالمالك فقط." : "Finance, commissions, Sham Cash, high-level permissions and owner-only controls."}
                href="#owner-control"
                owner
              />
            </section>

            <section className="mt-8 border border-espresso/10 bg-oat/15 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs font-black text-aubergine/60">NEEDS ATTENTION</p><h2 className="mt-1 text-xl font-black">{isAr ? "بحاجة لتدخل الآن" : "Needs attention now"}</h2></div>
                <a href="/admin/orders" className="text-sm font-black text-aubergine underline">{isAr ? "فتح الطلبات" : "Open orders"}</a>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Metric label={isAr ? "قيد المراجعة" : "Under review"} value={data.orders.pending_review} />
                <Metric label={isAr ? "مقبولة بانتظار سائق" : "Accepted, waiting driver"} value={data.orders.accepted} />
                <Metric label={isAr ? "طلبات إرجاع" : "Return requests"} value={data.orders.return_requested} />
                <Metric label={isAr ? "طلبات إدمن معلّقة" : "Admin requests pending"} value={data.owner_requests?.pending_mine || 0} />
                <Metric label={isAr ? "عمولات معلّقة" : "Pending commissions"} value={`$${Number(data.commissions.pending_usd || 0).toFixed(2)}`} />
              </div>
            </section>

            <section id="owner-stats" className="mt-8 scroll-mt-56 border border-espresso/10 bg-milk p-5 sm:p-6">
              <div><p className="text-xs font-black text-aubergine/60">OPERATIONS & ANALYTICS</p><h2 className="mt-1 text-xl font-black">{isAr ? "الإحصائيات ومراقبة الموقع" : "Statistics & site monitoring"}</h2></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                <Metric label={isAr ? "مبيعات اليوم" : "Sales today"} value={`$${Number(data.sales.delivered_today_usd || 0).toFixed(2)}`} />
                <Metric label={isAr ? "تم التسليم اليوم" : "Delivered today"} value={data.orders.delivered_today} />
                <Metric label={isAr ? "إجمالي المسلّم" : "Delivered total"} value={data.orders.delivered_total} />
                <Metric label={isAr ? "مرتجعات مباشرة" : "Door returns"} value={data.orders.direct_returns_total} />
                <Metric label={isAr ? "طلبات مرتجع بعد التسليم" : "Post-delivery returns"} value={data.orders.post_delivery_return_requests_total} />
                <Metric label={isAr ? "زيارات اليوم" : "Visits today"} value={data.analytics?.unique_visits_today || 0} note={`${data.analytics?.pageviews_today || 0} مشاهدة صفحة`} />
                <Metric label={isAr ? "تسجيلات الدخول اليوم" : "Logins today"} value={data.analytics?.logins_today || 0} note={`${data.analytics?.logins_month || 0} هذا الشهر`} />
                <Metric label={isAr ? "العمولات المدفوعة" : "Paid commissions"} value={`$${Number(data.commissions.paid_usd || 0).toFixed(2)}`} />
              </div>
            </section>

            <section id="owner-control" className="mt-8 scroll-mt-56 bg-espresso p-5 text-milk sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black tracking-[.15em] text-oat/60">OWNER ONLY</p>
                  <h2 className="mt-2 text-2xl font-black">{isAr ? "صلاحيات الأونر الخاصة" : "Owner-only controls"}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-milk/58">{isAr ? "هاي المنطقة للأمور الحساسة اللي ما لازم تكون جزء من التشغيل اليومي العادي للإدمن." : "Sensitive controls that stay outside normal admin operations."}</p>
                </div>
                <span className="border border-milk/15 px-3 py-2 text-xs font-black text-oat">{isAr ? "Owner فقط" : "Owner only"}</span>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <OwnerTool href="/admin/operations" eyebrow="FINANCE" title={isAr ? "Sham Cash والعمولات" : "Sham Cash & commissions"} body={isAr ? "راجع العمولات المعلقة والمدفوعة والتحويلات والحالات المالية." : "Review pending and paid commissions and transfer operations."} />
                <OwnerTool href="/owner/team" eyebrow="PERMISSIONS" title={isAr ? "الصلاحيات العليا" : "High-level permissions"} body={isAr ? "عيّن الإدمن الرئيسي، أنشئ أو أوقف الحسابات الإدارية وتابع سجل إدارة الفريق." : "Choose the primary admin and control staff account access."} />
                <OwnerTool href="/owner/requests" eyebrow="APPROVALS" title={isAr ? "قرارات وموافقات الإدمن" : "Admin approvals"} body={isAr ? "وافق أو ارفض الاستثناءات والطلبات المرفوعة من الإدمنز." : "Approve or reject escalations raised by admins."} />
                <OwnerTool href="/delivery" eyebrow="OVERRIDE" title={isAr ? "تدخل تشغيلي مباشر" : "Operational override"} body={isAr ? "ادخل على تشغيل الديليفري أو تدخل بالطلبات عند الضرورة بدون تبديل حسابك." : "Step into delivery operations when necessary without switching accounts."} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div className="border border-milk/12 p-4"><p className="text-milk/48">{isAr ? "حساب Sham Cash" : "Sham Cash account"}</p><strong className="mt-1 block">{data.sham_cash.company_account_configured ? data.sham_cash.company_account : (isAr ? "غير مدخل بعد" : "Not configured")}</strong></div>
                <div className="border border-milk/12 p-4"><p className="text-milk/48">{isAr ? "الربط المالي" : "Finance integration"}</p><strong className="mt-1 block">{data.sham_cash.enabled ? (isAr ? "مفعّل" : "Enabled") : (isAr ? "غير مفعّل" : "Disabled")}</strong></div>
                <div className="border border-milk/12 p-4"><p className="text-milk/48">{isAr ? "التحويل التلقائي" : "Auto transfer"}</p><strong className="mt-1 block">{data.sham_cash.auto_transfer ? (isAr ? "مفعّل" : "Enabled") : (isAr ? "غير مفعّل" : "Disabled")}</strong></div>
                <div className="border border-milk/12 p-4"><p className="text-milk/48">{isAr ? "الفريق" : "Team"}</p><strong className="mt-1 block">{data.people.admins} Admin · {data.people.drivers} Delivery</strong></div>
              </div>
            </section>

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
                  {!data.recent_orders.length && <p className="text-sm text-espresso/50">{isAr ? "لا توجد طلبات بعد." : "No orders yet."}</p>}
                </div>
              </section>
              <aside className="border border-espresso/10 bg-milk p-5 sm:p-6">
                <p className="text-xs font-black text-aubergine/60">QUICK LINKS</p>
                <h2 className="mt-2 text-xl font-black">{isAr ? "وصول سريع" : "Quick access"}</h2>
                <div className="mt-4 grid gap-2 text-sm font-black">
                  <a className="border-b border-espresso/10 py-3" href="/admin/products">{isAr ? "المنتجات والمخزون" : "Products & inventory"}</a>
                  <a className="border-b border-espresso/10 py-3" href="/delivery">{isAr ? "لوحة التوصيل" : "Delivery"}</a>
                  <a className="border-b border-espresso/10 py-3" href="/admin/operations">{isAr ? "Sham Cash والعمولات" : "Sham Cash & commissions"}</a>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
