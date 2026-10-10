import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { hasAnyPermission, hasPermission } from "../lib/permissions";
import OrderStatus from "./ui/OrderStatus";

function Stat({ label, value, action, href }) {
  const body = (
    <>
      <p className="text-xs font-black text-aubergine/60">{label}</p>
      <strong className="mt-2 block text-3xl text-espresso">{value}</strong>
      {action && <p className="mt-2 text-xs text-espresso/50">{action}</p>}
    </>
  );

  if (!href) {
    return <div className="rounded-2xl border border-espresso/10 bg-milk/80 p-5">{body}</div>;
  }

  return <a href={href} className="rounded-2xl border border-espresso/10 bg-milk/80 p-5 transition hover:border-aubergine/35">{body}</a>;
}

function WorkspaceCard({ eyebrow, title, description, href, badge = 0 }) {
  return (
    <a href={href} className="group rounded-2xl border border-espresso/10 bg-milk/80 p-5 transition duration-300 hover:border-aubergine/35 hover:bg-oat/25">
      <p className="text-[10px] font-black tracking-[0.18em] text-aubergine/55">{eyebrow}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <strong className="block text-lg text-espresso">{title}</strong>
        {badge > 0 && <span className="rounded-full bg-aubergine px-2 py-0.5 text-[10px] font-black text-milk">{badge}</span>}
      </div>
      <p className="mt-2 text-sm leading-6 text-espresso/55">{description}</p>
      <span className="mt-4 inline-block text-sm text-aubergine transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">→</span>
    </a>
  );
}

export default function AdminDashboardPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [session, setSession] = useState(null);
  const [data, setData] = useState(null);
  const [sessionError, setSessionError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");
  const [supportSummary, setSupportSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch("/auth/session")
      .then((next) => {
        if (!cancelled) {
          setSession(next);
          setSessionError("");
        }
      })
      .catch((error) => {
        if (!cancelled) setSessionError(error.message);
      });

    return () => { cancelled = true; };
  }, []);

  const user = session?.user || null;
  const canViewAnalytics = hasPermission(user, "analytics.view");
  const canViewSupport = hasPermission(user, "support.view");

  useEffect(() => {
    if (!user || !canViewAnalytics) {
      setData(null);
      setAnalyticsError("");
      return undefined;
    }

    let cancelled = false;
    const load = () => apiFetch("/api/dashboard")
      .then((next) => {
        if (!cancelled) {
          setData(next);
          setAnalyticsError("");
        }
      })
      .catch((error) => {
        if (!cancelled) setAnalyticsError(error.message);
      });

    load();
    const timer = window.setInterval(load, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [user?.id, canViewAnalytics]);

  useEffect(() => {
    if (!user || !canViewSupport) {
      setSupportSummary(null);
      return undefined;
    }

    let cancelled = false;
    const load = () => apiFetch("/api/support/staff/summary")
      .then((next) => { if (!cancelled) setSupportSummary(next); })
      .catch(() => { if (!cancelled) setSupportSummary(null); });

    load();
    const timer = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [user?.id, canViewSupport]);

  const workspaces = useMemo(() => {
    if (!user) return [];

    const modules = [
      {
        key: "orders",
        visible: hasPermission(user, "orders.view"),
        eyebrow: "ORDERS",
        title: isAr ? "الطلبات" : "Orders",
        description: isAr ? "مراجعة الطلبات وتنفيذ الإجراءات المسموحة لحسابك." : "Review orders and perform only the actions granted to your account.",
        href: "/admin/orders",
      },
      {
        key: "products",
        visible: hasPermission(user, "products.view"),
        eyebrow: "CATALOG",
        title: isAr ? "المنتجات والمخزون" : "Products & inventory",
        description: isAr ? "إدارة المنتجات والمخزون ضمن الصلاحيات المحددة." : "Manage products and inventory within your granted permissions.",
        href: "/admin/products",
      },
      {
        key: "delivery",
        visible: hasAnyPermission(user, ["delivery.view", "delivery.act_as"]),
        eyebrow: "DELIVERY",
        title: isAr ? "التوصيل" : "Delivery",
        description: isAr ? "متابعة التوصيل فقط إذا سمح لك الـOwner بذلك." : "Access delivery operations only when granted by the owner.",
        href: "/delivery",
      },
      {
        key: "finance",
        visible: hasPermission(user, "commissions.self.view"),
        eyebrow: "MY COMMISSIONS",
        title: isAr ? "عمولاتي ومستحقاتي" : "My commissions & dues",
        description: isAr ? "مشاهدة مستحقاتك الحالية وتأكيد التحويل الأسبوعي حسب صلاحياتك." : "View your current dues and confirm the weekly transfer when permitted.",
        href: "/admin/operations",
      },
      {
        key: "team",
        visible: hasPermission(user, "team.view"),
        eyebrow: "ACCESS",
        title: isAr ? "الحسابات والصلاحيات" : "Accounts & permissions",
        description: isAr ? "إدارة الحسابات الأدنى فقط ضمن حدود التفويض." : "Manage lower-level accounts only within delegated limits.",
        href: "/admin/team",
      },
      {
        key: "decoration",
        visible: hasPermission(user, "decoration.view"),
        eyebrow: "DECOR",
        title: isAr ? "التزيين" : "Decoration",
        description: isAr ? "مساحة العمل الخاصة بالتزيين فقط." : "Dedicated decoration workspace.",
        href: "/admin/decoration",
      },
      {
        key: "support",
        visible: hasPermission(user, "support.view"),
        eyebrow: "SUPPORT",
        title: isAr ? "محادثات العملاء" : "Customer support",
        description: isAr ? "متابعة رسائل الزباين والزوار والرد عليها حسب صلاحيات الحساب." : "Handle customer and guest conversations within the granted support permissions.",
        href: "/admin/support",
        badge: Number(supportSummary?.unread || 0),
      },
      {
        key: "marketing",
        visible: hasPermission(user, "marketing.view"),
        eyebrow: "GROWTH",
        title: isAr ? "التسويق والعروض" : "Marketing & offers",
        description: isAr ? "متابعة التسويق ونتائجه حسب الصلاحيات الحالية." : "View marketing operations allowed by the current permission set.",
        href: "/admin/marketing",
      },
    ];

    return modules.filter((module) => module.visible);
  }, [user, isAr, canViewAnalytics, supportSummary?.unread]);

  return (
    <main className="min-h-[75vh] bg-milk px-4 py-8 sm:px-6 sm:py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[32px] border border-espresso/10 bg-oat/15 px-5 py-7 sm:px-8 sm:py-9">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><p className="omb-eyebrow-label text-aubergine/60">OH MY BABY — ADMIN</p><h1 className="mt-2 text-3xl font-black tracking-tight text-espresso sm:text-4xl">{isAr ? "مركز إدارة النظام" : "System control center"}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-espresso/55">{isAr ? "كل قسم بمكان واضح، وتظهر لك فقط الوظائف المسموحة لحسابك." : "A consistent workspace layout, showing only the functions permitted for your account."}</p></div>
          {user && <div className="rounded-2xl border border-espresso/10 bg-milk/70 px-4 py-3 text-sm"><strong>{user.name}</strong><p className="mt-1 text-xs text-espresso/50">{user.email || user.phone || "—"}</p></div>}
        </div>

        {sessionError && <p className="mt-6 border border-red-300 bg-red-50 p-3 text-red-700">{sessionError}</p>}

        {session && !user && (
          <p className="mt-6 border border-espresso/10 bg-oat/20 p-5 text-sm text-espresso/65">{isAr ? "الجلسة غير صالحة. سجّل الدخول من جديد." : "Your session is no longer valid. Please sign in again."}</p>
        )}

        {user && (
          <>
            <section className="mt-7">
              {workspaces.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {workspaces.map((module) => <WorkspaceCard key={module.key} {...module} />)}
                </div>
              ) : null}
            </section>

            {canViewAnalytics && analyticsError && <p className="mt-6 border border-red-300 bg-red-50 p-3 text-red-700">{analyticsError}</p>}

            {canViewAnalytics && data && (
              <>
                <section className="mt-10">
                  <div>
                    <p className="text-xs font-black tracking-[0.18em] text-aubergine/50">ANALYTICS</p>
                    <h2 className="mt-1 text-2xl font-black text-espresso">{isAr ? "ملخص التشغيل" : "Operations summary"}</h2>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <Stat label={isAr ? "طلبات اليوم" : "Today's orders"} value={data.orders.today} action={isAr ? "كل الطلبات الجديدة" : "New orders"} href={hasPermission(user, "orders.view") ? "/admin/orders" : null} />
                    <Stat label={isAr ? "قيد المراجعة" : "Under review"} value={data.orders.pending_review} action={isAr ? "الأولوية الآن" : "Priority now"} href={hasPermission(user, "orders.view") ? "/admin/orders" : null} />
                    <Stat label={isAr ? "تم قبولها" : "Accepted"} value={data.orders.accepted} action={isAr ? "بانتظار سائق" : "Waiting for driver"} href={hasPermission(user, "orders.view") ? "/admin/orders" : null} />
                    <Stat label={isAr ? "عند السائق" : "Assigned"} value={data.orders.assigned_to_driver} action={isAr ? "لم يبدأ التوصيل" : "Not started"} href={hasAnyPermission(user, ["delivery.view", "delivery.act_as"]) ? "/delivery" : null} />
                    <Stat label={isAr ? "بالتوصيل" : "Out for delivery"} value={data.orders.out_for_delivery} action={isAr ? "جارية الآن" : "Live now"} href={hasAnyPermission(user, ["delivery.view", "delivery.act_as"]) ? "/delivery" : null} />
                    <Stat label={isAr ? "تم اليوم" : "Delivered today"} value={data.orders.delivered_today} action={`$${Number(data.sales.delivered_today_usd).toFixed(2)}`} />
                  </div>
                </section>

                {hasPermission(user, "orders.view") && (
                  <section className="mt-8 border border-espresso/10 bg-oat/15 p-5 sm:p-6">
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
                )}

              </>
            )}
          </>
        )}
        </section>
      </div>
    </main>
  );
}


