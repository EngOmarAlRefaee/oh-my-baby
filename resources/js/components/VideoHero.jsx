import React from "react";

export default function VideoHero({ locale = "ar" }) {
  const isAr = locale === "ar";

  return (
    <section id="home-hero" className="relative w-full overflow-hidden bg-black">
      <div className="relative h-[72vh] min-h-[560px] max-h-[820px] w-full bg-black">
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/70">WELCOME TO</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[0.08em] text-white sm:text-6xl lg:text-7xl">OH MY BABY</h1>
            <p className="mt-4 text-lg text-white/85 sm:text-xl">
              {isAr ? "أهلاً بكم في عالمنا الصغير" : "Our little world, made with love."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
