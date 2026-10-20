import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { WORKSPACE_MODULES } from "../data/workspaceModules";
import WorkspaceModuleCard from "./ui/WorkspaceModuleCard";
import StockAlertsBox from "./StockAlertsBox";

function Metric({ label, value, note, priority = false }) {
  return (
    <div className={`rounded-2xl border p-4 ${priority ? "border-aubergine/20 bg-aubergine/[.045]" : "border-espresso/10 bg-oat/20"}`}>
      <p className="text-[11px] font-black text-aubergine/60">{label}</p>
      <strong className="mt-2 block text-2xl font-black text-espresso">{value}</strong>
      {note && <p className="mt-1.5 text-[11px] leading-5 text-espresso/45">{note}</p>}
    </div>
  );
}

export default function OwnerDashboardPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [supportUnread, setSupportUnread] = useState(0);
  const modules = useMemo(() => [...WORKSPACE_MODULES].sort((a, b) => a.order - b.order), []);

  useEffect(() => {
    apiFetch("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.status === 403 ? (isAr ? "هذه اللوحة خاصة بحساب Owner." : "Owner account only.") : e.message));
  }, [isAr]);

  useEffect(() => {
    let cancelled = false;
    const load = () => apiFetch("/api/support/staff/summary")
      .then((next) => { if (!cancelled) setSupportUnread(Number(next.unread || 0)); })
      .catch(() => { if (!cancelled) setSupportUnread(0); });

    load();
    const timer = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <main className="min-h-[75vh] bg-milk px-4 py-8 sm:px-6 sm:py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[32px] border border-espresso/10 bg-oat/15 px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="omb-eyebrow-label text-aubergine/60">OH MY BABY — OWNER</p>
              <h1 className="mt-2 text-3xl font-black text-espresso sm:text-4xl">{isAr ? "مركز إدارة النظام" : "System control center"}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-espresso/55">
                {isAr
                  ? "كل وظيفة بمكانها. ابدأ بالأولوية، وبعدها ادخل للقسم المختص بدون تشتيت أو خلط بين الحساب الشخصي وتشغيل المتجر."
                  : "Every function has one home. Start with priorities, then enter the right module without mixing personal account settings with store operations."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/owner/team" className="omb-btn omb-btn-primary">{isAr ? "الحسابات والصلاحيات" : "Accounts & permissions"}</a>
              <a href="/owner/support" className="omb-btn omb-btn-secondary">{isAr ? "محادثات العملاء" : "Customer support"}{supportUnread > 0 ? ` (${supportUnread})` : ""}</a>
              <a href="/" className="omb-btn omb-btn-secondary">{isAr ? "عرض المتجر" : "View store"}</a>
            </div>
          </div>

          {error && <p className="mt-6 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {!data && !error && <p className="mt-6 text-sm font-black text-espresso/40">{isAr ? "جاري تحميل الأولويات..." : "Loading priorities..."}</p>}

          {data && (
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric priority label={isAr ? "قيد المراجعة الآن" : "Needs review now"} value={data.orders.pending_review} note={isAr ? "أولوية تشغيلية" : "Operational priority"} />
              <Metric label={isAr ? "قيد التوصيل" : "Out for delivery"} value={data.orders.out_for_delivery} note={isAr ? `${data.orders.assigned_to_driver} مسندة ولم تبدأ بعد` : `${data.orders.assigned_to_driver} assigned, not started`} />
              <Metric label={isAr ? "مبيعات مسلّمة اليوم" : "Delivered sales today"} value={`$${Number(data.sales.delivered_today_usd).toFixed(2)}`} note={isAr ? `${data.orders.delivered_today} طلب مكتمل اليوم` : `${data.orders.delivered_today} completed today`} />
              <Metric label={isAr ? "عمولات معلّقة" : "Pending commissions"} value={`$${Number(data.commissions.pending_usd).toFixed(2)}`} note={isAr ? `مدفوع إجمالاً $${Number(data.commissions.paid_usd || 0).toFixed(2)}` : `Paid total $${Number(data.commissions.paid_usd || 0).toFixed(2)}`} />
            </div>
          )}
        </section>

        <StockAlertsBox locale={locale} />

        <section className="mt-9">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.16em] text-aubergine/50">OWNER WORKSPACE</p>
              <h2 className="mt-1 text-2xl font-black text-espresso">{isAr ? "الأقسام" : "Modules"}</h2>
              <p className="mt-2 text-sm text-espresso/50">{isAr ? "12 قسم رئيسي مرتبين حسب الأولوية. نفس المسميات ستكون أساس واجهات الحسابات الأخرى، وما يظهر لكل حساب يتحدد من صلاحياته." : "Twelve priority-based modules. The same names power other account dashboards, filtered by permissions."}</p>
            </div>
            <p className="rounded-full border border-espresso/10 bg-milk px-3 py-1.5 text-xs font-black text-espresso/50">{isAr ? "مرتبة حسب الأولوية" : "Ordered by priority"}</p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modules.map((module) => <WorkspaceModuleCard key={module.key} module={module} locale={locale} />)}
          </div>
        </section>
      </div>
    </main>
  );
}
