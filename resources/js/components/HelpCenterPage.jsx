import React from "react";
import { WORKSPACE_MODULES } from "../data/workspaceModules";

function HelpBlock({ title, children }) {
  return <section className="rounded-3xl border border-espresso/10 bg-milk p-5 sm:p-6"><h2 className="text-xl font-black text-espresso">{title}</h2><div className="mt-4 text-sm leading-7 text-espresso/60">{children}</div></section>;
}

export default function HelpCenterPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  return (
    <main className="min-h-[75vh] bg-milk px-5 py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl">
        <a href="/owner" className="text-xs font-black text-aubergine/70 hover:underline">{isAr ? "← مركز إدارة النظام" : "← System control center"}</a>
        <header className="mt-4 rounded-[30px] border border-espresso/10 bg-oat/15 p-6 sm:p-9">
          <p className="text-[11px] font-black tracking-[.16em] text-aubergine/50">OH MY BABY — SYSTEM GUIDE</p>
          <h1 className="mt-2 text-3xl font-black text-espresso sm:text-4xl">{isAr ? "المساعدة ودليل النظام" : "Help & system guide"}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-espresso/55">{isAr ? "هذا القسم هو خريطة المشروع داخل الموقع: أين توجد كل وظيفة، كيف تعمل الحسابات، وما هي القواعد التي نعتمدها أثناء التطوير." : "This is the in-app project map: where features live, how accounts work, and the rules followed while building the system."}</p>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <HelpBlock title={isAr ? "قاعدة الحسابات" : "Account model"}>
            <p>{isAr ? "الـOwner هو جذر شجرة الصلاحيات. لكل حساب نحدد بشكل منفصل: ما الذي يراه، ما الذي يفعله، نطاق البيانات، وما الذي يستطيع تفويضه لغيره." : "The Owner is the root of the permission tree. Each account independently receives visibility, actions, data scope and delegation limits."}</p>
            <p className="mt-3 font-black text-espresso/70">Role + Permissions + Visibility + Data Scope + Delegation</p>
          </HelpBlock>

          <HelpBlock title={isAr ? "قاعدة الواجهة" : "UI rule"}>
            <p>{isAr ? "كل الحسابات التشغيلية رح تعتمد نفس أسماء الأقسام الأساسية. الحساب ما بيشوف إلا الأقسام والعناصر التي سمح بها الـOwner، والـBackend يمنع الوصول حتى لو حاول فتح الرابط مباشرة." : "Operational accounts share the same module names. They only see modules and items granted by the Owner, while backend authorization still blocks direct URL/API access."}</p>
          </HelpBlock>

          <HelpBlock title={isAr ? "قاعدة العمولة" : "Commission rule"}>
            <p>{isAr ? "الطلب المكتمل المؤهل: 0.50 USD. قسم العروض مستثنى. كل عملية تزيين مكتملة: 2.50 USD. المرتجع الكامل يعكس العمولة بحركة Reversal ولا يمسح التاريخ المالي." : "Eligible completed order: $0.50. Offers are excluded. Each completed decoration operation: $2.50. Full returns create a reversal instead of deleting financial history."}</p>
          </HelpBlock>

          <HelpBlock title={isAr ? "طريقة التطوير" : "Build rule"}>
            <p>{isAr ? "الكود يضيف القدرة، وبعدها التشغيل اليومي يتم من الموقع. Tinker والـPowerShell للطوارئ والتطوير فقط، وليس لإدارة الحسابات اليومية." : "Code adds capabilities; daily operations happen inside the site. Tinker and PowerShell are development/emergency tools, not daily account management."}</p>
          </HelpBlock>
        </div>

        <section className="mt-6 rounded-3xl border border-espresso/10 bg-milk p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-black text-espresso">{isAr ? "خريطة الأقسام" : "Module map"}</h2><p className="mt-1 text-sm text-espresso/50">{isAr ? "إذا سألت مستقبلًا: وين موجودة الشغلة؟ هاي هي الخريطة الأساسية." : "Use this map whenever you need to locate a feature later."}</p></div><span className="text-xs font-black text-aubergine/55">12 MODULES</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WORKSPACE_MODULES.map((module) => (
              <a key={module.key} href={module.href} className="rounded-2xl border border-espresso/10 bg-oat/15 p-4 transition hover:border-aubergine/25">
                <span className="text-[10px] font-black tracking-[.15em] text-aubergine/45">{String(module.order).padStart(2, "0")} · {module.code}</span>
                <strong className="mt-1 block text-sm text-espresso">{isAr ? module.ar : module.en}</strong>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
