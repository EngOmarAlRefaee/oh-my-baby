import React from "react";
import { getWorkspaceModule } from "../data/workspaceModules";

export default function OwnerSectionPage({ locale = "ar", sectionKey }) {
  const isAr = locale === "ar";
  const module = getWorkspaceModule(sectionKey);

  if (!module) {
    return (
      <main className="min-h-[70vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-4xl rounded-3xl border border-espresso/10 bg-oat/15 p-8">
          <h1 className="text-3xl font-black">{isAr ? "القسم غير موجود" : "Module not found"}</h1>
          <a href="/owner" className="mt-6 inline-block text-sm font-black text-aubergine underline">{isAr ? "العودة للوحة المالك" : "Back to owner dashboard"}</a>
        </div>
      </main>
    );
  }

  const items = isAr ? module.itemsAr : module.itemsEn;

  return (
    <main className="min-h-[70vh] bg-milk px-5 py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-5xl">
        <a href="/owner" className="text-xs font-black text-aubergine/70 hover:underline">{isAr ? "← مركز إدارة النظام" : "← System control center"}</a>
        <section className="mt-4 rounded-[30px] border border-espresso/10 bg-oat/15 p-6 sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-black tracking-[.16em] text-aubergine/50">{module.code}</p>
              <h1 className="mt-2 text-3xl font-black text-espresso sm:text-4xl">{isAr ? module.ar : module.en}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-espresso/55">{isAr ? module.arShort : module.enShort}</p>
            </div>
            <span className="rounded-full bg-oat px-3 py-1.5 text-xs font-black text-espresso/55">{isAr ? "قيد البناء المنظم" : "Structured build in progress"}</span>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item} className="rounded-2xl border border-espresso/10 bg-milk p-4 text-sm font-black text-espresso/75">{item}</div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-aubergine/10 bg-aubergine/[.04] p-5 text-sm leading-7 text-espresso/60">
            {isAr
              ? "هاي الصفحة حاليًا هي مكان القسم الرسمي ضمن شجرة الـOwner. وقت نبني وظائفه، رح تنضاف هون بدل ما نوزعها بأماكن عشوائية."
              : "This is now the official home for this module in the Owner tree. New functions will be added here instead of being scattered across unrelated pages."}
          </div>
        </section>
      </div>
    </main>
  );
}
