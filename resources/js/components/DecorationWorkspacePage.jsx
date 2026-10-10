import React from "react";

export default function DecorationWorkspacePage({ locale = "ar" }) {
  const isAr = locale === "ar";

  return (
    <main className="min-h-[75vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <p className="text-[10px] font-black tracking-[0.18em] text-aubergine/55">DECORATION</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-espresso sm:text-4xl">
          {isAr ? "التزيين" : "Decoration"}
        </h1>
      </div>
    </main>
  );
}
