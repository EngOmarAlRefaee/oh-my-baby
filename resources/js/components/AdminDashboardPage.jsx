import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import OrderStatus from "./ui/OrderStatus";

function MainCard({ number, eyebrow, title, body, href, badge, accent = false }) {
  return (
    <a href={href} className={`group relative min-h-[230px] overflow-hidden border p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(40,35,33,.10)] ${accent ? "border-aubergine/30 bg-aubergine text-milk" : "border-espresso/10 bg-milk hover:border-aubergine/35"}`}>
      <span className={`text-[11px] font-black tracking-[.18em] ${accent ? "text-milk/65" : "text-aubergine/55"}`}>{String(number).padStart(2, "0")} · {eyebrow}</span>
      <strong className="mt-5 block text-2xl font-black">{title}</strong>
      <p className={`mt-3 max-w-[28rem] text-sm leading-7 ${accent ? "text-milk/72" : "text-espresso/55"}`}>{body}</p>
      <div className="absolute bottom-5 start-6 flex items-center gap-3"><span className="text-sm font-black">فتح ←</span>{badge !== undefined && <span className={`px-2.5 py-1 text-[11px] font-black ${accent ? "bg-milk/12 text-milk" : "bg-oat/50 text-aubergine"}`}>{badge}</span>}</div>
    </a>
  );
}

function Metric({ label, value, note }) {
  return <div className="border border-espresso/10 bg-oat/18 p-4"><p className="text-[11px] font-black text-aubergine/60">{label}</p><strong className="mt-2 block text-2xl text-espresso">{value}</strong>{note && <p className="mt-1 text-xs text-espresso/45">{note}</p>}</div>;
}

export default function AdminDashboardPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = () => apiFetch("/api/dashboard").then(setData).catch((e) => setError(e.message));
  const has = (permission) => Boolean(data?.permissions?.includes("*") || data?.permissions?.includes(permission));

  useEffect(() => { load(); const timer = window.setInterval(load, 15000); return () => window.clearInterval(timer); }, []);

  return (
    <main className="min-h-[75vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="omb-eyebrow-label text-aubergine/65">OH MY BABY — ADMIN CONTROL CENTER</p><h1 className="mt-2 text-4xl font-black text-espresso">{isAr ? "لوحة تحكم الإدمن" : "Admin control center"}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-espresso/55">{isAr ? "كل مسؤولياتك مقسمة لستة أقسام واضحة. أول ما تسجل دخول كـAdmin بتوصل لهون مباشرة." : "Your responsibilities are split into six clear areas. Admin login lands here automatically."}</p></div>
          <a href="/" className="omb-btn omb-btn-secondary">{isAr ? "فتح الموقع كزبون" : "View store"}</a>
        </div>

        {error && <p className="mt-6 border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>}
        {!data && !error && <p className="mt-8 text-sm font-black text-espresso/45">{isAr ? "جاري تحميل لوحة التحكم..." : "Loading dashboard..."}</p>}

        {data && <>
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {has("team.view") && <MainCard number={1} eyebrow="ACCOUNTS" title={isAr ? "الحسابات والفريق" : "Accounts & team"} body={isAr ? "الإشراف على حسابات الإدمن والديليفري والمشتركين، وإنشاء أو إيقاف الحسابات ضمن صلاحيتك." : "Manage staff, delivery and customer accounts within your permissions."} href="/admin/team" badge={`${data.people.admins + data.people.drivers + data.people.customers} حساب`} />}
            {has("products.view") && <MainCard number={2} eyebrow="CATALOG" title={isAr ? "المنتجات والمخزون" : "Products & inventory"} body={isAr ? "إضافة وتعديل وأرشفة المنتجات، الألوان والصور والقياسات، ومخزون كل لون × قياس بشكل مستقل." : "Create and manage products, images, sizes, colors and per-variant inventory."} href="/admin/products" />}
            {has("orders.view") && <MainCard number={3} eyebrow="ORDERS" title={isAr ? "الطلبات والعمليات" : "Orders & operations"} body={isAr ? "قبول ورفض الطلبات، تعيين السائق، متابعة التوصيل، المرتجع والتبديل والعمليات اليومية." : "Accept, dispatch and monitor orders, delivery and returns."} href="/admin/orders" badge={`${data.orders.pending_review} بانتظارك`} />}
            {has("owner_requests.manage") && <MainCard number={4} eyebrow="OWNER" title={isAr ? "التعامل مع الأونر" : "Owner requests"} body={isAr ? "ارفع طلب موافقة أو استثناء أو مشكلة مالية أو إدارية، وتابع رد الأونر من نفس المكان." : "Raise approvals, exceptions or important issues to the owner."} href="/admin/owner-requests" badge={`${data.owner_requests?.pending_mine || 0} معلّق`} />}
            {has("analytics.view") && <MainCard number={5} eyebrow="CONTROL" title={isAr ? "الإحصائيات والمراقبة" : "Statistics & monitoring"} body={isAr ? "شوف الطلبات المكتملة والمرتجعات والزيارات وتسجيلات الدخول وكل مؤشرات التشغيل المهمة." : "Monitor orders, returns, visits, logins and operations."} href="#admin-stats" />}
            <MainCard number={6} eyebrow="STORE" title={isAr ? "الدخول للموقع كزبون" : "Browse the store"} body={isAr ? "افتح واجهة المتجر وشوف التجربة مثل الزبون بدون ما تطلع من حساب الإدمن. زر لوحة التحكم بالهيدر بيرجعك لهون." : "Browse the customer storefront while staying signed in as admin."} href="/" accent />
          </section>

          {(has("orders.view") || has("owner_requests.manage")) && <section className="mt-8 border border-espresso/10 bg-oat/15 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black text-aubergine/60">NEEDS ATTENTION</p><h2 className="mt-1 text-xl font-black">{isAr ? "بحاجة لتدخل الآن" : "Needs attention now"}</h2></div>{has("orders.view") && <a href="/admin/orders" className="text-sm font-black text-aubergine underline">{isAr ? "فتح الطلبات" : "Open orders"}</a>}</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{has("orders.view") && <><Metric label={isAr ? "قيد المراجعة" : "Under review"} value={data.orders.pending_review} /><Metric label={isAr ? "مقبولة بانتظار سائق" : "Accepted, waiting driver"} value={data.orders.accepted} /><Metric label={isAr ? "طلبات إرجاع" : "Return requests"} value={data.orders.return_requested} /></>}{has("owner_requests.manage") && <Metric label={isAr ? "طلبات للأونر معلقة" : "Owner requests pending"} value={data.owner_requests?.pending_mine || 0} />}</div>
          </section>}

          {has("analytics.view") && <section id="admin-stats" className="mt-8 scroll-mt-56 border border-espresso/10 bg-milk p-5 sm:p-6">
            <div><p className="text-xs font-black text-aubergine/60">OPERATIONS & ANALYTICS</p><h2 className="mt-1 text-xl font-black">{isAr ? "الإحصائيات ومراقبة الموقع" : "Statistics & site monitoring"}</h2></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"><Metric label={isAr ? "تم التسليم اليوم" : "Delivered today"} value={data.orders.delivered_today} /><Metric label={isAr ? "إجمالي الطلبات المسلّمة" : "Delivered total"} value={data.orders.delivered_total} /><Metric label={isAr ? "مرتجعات مباشرة" : "Door returns"} value={data.orders.direct_returns_total} /><Metric label={isAr ? "طلبات مرتجع بعد التسليم" : "Post-delivery returns"} value={data.orders.post_delivery_return_requests_total} /><Metric label={isAr ? "زيارات اليوم" : "Visits today"} value={data.analytics?.unique_visits_today || 0} note={`${data.analytics?.pageviews_today || 0} مشاهدة صفحة`} /><Metric label={isAr ? "تسجيلات الدخول اليوم" : "Logins today"} value={data.analytics?.logins_today || 0} note={`${data.analytics?.logins_month || 0} هذا الشهر`} /></div>
          </section>}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_.75fr]">
            {has("orders.view") ? <section className="border border-espresso/10 bg-oat/15 p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-black">{isAr ? "آخر الطلبات" : "Recent orders"}</h2><a href="/admin/orders" className="text-xs font-black text-aubergine underline">{isAr ? "إدارة الطلبات" : "Manage orders"}</a></div><div className="mt-4 grid gap-3">{data.recent_orders.map((order) => <a key={order.id} href="/admin/orders" className="flex flex-wrap items-center justify-between gap-3 border-t border-espresso/10 pt-3 first:border-0 first:pt-0"><div><strong className="text-sm">{order.reference}</strong><p className="mt-1 text-xs text-espresso/50">{order.customer_name} · ${Number(order.total_usd).toFixed(2)}</p></div><OrderStatus status={order.status} locale={locale} /></a>)}</div></section> : <section className="border border-espresso/10 bg-oat/15 p-5 sm:p-6"><p className="text-sm leading-7 text-espresso/55">{isAr ? "لوحتك بتعرض فقط الأقسام والصلاحيات اللي الإدمن الرئيسي عطاك ياها." : "Your dashboard only shows the areas assigned to your account."}</p></section>}
            <aside className="border border-espresso/10 bg-milk p-5 sm:p-6"><p className="text-xs font-black text-aubergine/60">QUICK LINKS</p><h2 className="mt-2 text-xl font-black">{isAr ? "تشغيل يومي" : "Daily operations"}</h2><div className="mt-4 grid gap-2 text-sm font-black">{has("products.view") && <a className="border-b border-espresso/10 py-3" href="/admin/products">{isAr ? "المنتجات والمخزون" : "Products & inventory"}</a>}{(has("delivery.view") || has("delivery.act_as")) && <a className="border-b border-espresso/10 py-3" href="/delivery">{isAr ? "لوحة التوصيل" : "Delivery"}</a>}{has("finance.view") && <a className="border-b border-espresso/10 py-3" href="/admin/operations">{isAr ? "Sham Cash والعمولات" : "Sham Cash & commissions"}</a>}<a className="border-b border-espresso/10 py-3" href="/">{isAr ? "الدخول للمتجر" : "Open store"}</a></div></aside>
          </div>
        </>}
      </div>
    </main>
  );
}
