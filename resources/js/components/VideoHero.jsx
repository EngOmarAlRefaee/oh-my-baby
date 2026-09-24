import React from "react";

export default function VideoHero({ locale = "ar" }) {
  const isAr = locale === "ar";

  return (
    <section id="home-hero" className="relative w-full overflow-hidden bg-black">
      <div className="relative h-[72vh] min-h-[560px] max-h-[820px] w-full bg-black">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/home/hero-videos/hero-01.jpg"
          aria-label={isAr ? "فيديو OH MY BABY الرئيسي" : "OH MY BABY hero video"}
        >
          <source src="/images/home/hero-videos/hero-02.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/75">WELCOME TO</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[0.08em] text-white sm:text-6xl lg:text-7xl">OH MY BABY</h1>
            <p className="mt-4 text-lg text-white/90 sm:text-xl">
              {isAr ? "أهلاً بكم في عالمنا الصغير" : "Our little world, made with love."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
