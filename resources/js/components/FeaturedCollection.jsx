import React, { useEffect, useState } from "react";

import Button from "./ui/Button";
import Eyebrow from "./ui/Eyebrow";
import Reveal from "./ui/Reveal";
import { getCachedFeatured, prefetchFeaturedCollection, resolveFeatured } from "../lib/siteContent";

// `previewContent` lets the admin editor render the exact same section live.
export default function FeaturedCollection({ locale = "ar", previewContent }) {
  const isAr = locale === "ar";
  const [saved, setSaved] = useState(() => getCachedFeatured());
  useEffect(() => {
    if (previewContent !== undefined) return undefined;
    let active = true;
    prefetchFeaturedCollection().then((next) => { if (active && next !== undefined) setSaved(next); });
    return () => { active = false; };
  }, [previewContent]);
  const c = resolveFeatured(previewContent !== undefined ? previewContent : saved, locale);

  return (
    <section
      id="featured-collection"
      className="relative overflow-hidden bg-milk py-20 sm:py-28"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-[1560px] px-5 sm:px-8 lg:px-10">
        {/* SECTION HEADER */}
        <Reveal>
          <div
            className={`mb-12 sm:mb-16 ${isAr ? "text-right" : "text-left"}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-[13px] font-bold tracking-[0.18em] text-aubergine">
                {c.eyebrow}
              </span>

              <span className="h-px w-20 bg-espresso/25" />
            </div>

            <h2 className="mt-5 break-words text-[clamp(2.3rem,7vw,4.75rem)] font-black leading-[1.05] tracking-tight text-espresso">
              {c.sectionTitle}
            </h2>

            <p className="mt-5 max-w-xl text-[clamp(1rem,1.5vw,1.125rem)] font-semibold leading-8 text-espresso/80">
              {c.sectionSubtitle}
            </p>
          </div>
        </Reveal>

        {/* CAMPAIGN */}
        <div className="relative overflow-hidden bg-oat">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-5 top-2 z-0 text-[110px] font-black leading-none text-espresso/[0.035] sm:text-[150px] lg:text-[190px]"
          >
            {c.watermark}
          </div>

          <div className="relative z-10 grid lg:grid-cols-[1.18fr_0.82fr]">
            {/* IMAGE */}
            <a
              data-motion="media"
              href={c.ctaHref}
              style={{ minHeight: "clamp(320px, 52vw, 760px)" }}
              className="group relative min-w-0 overflow-hidden bg-espresso"
            >
              <img
                src={c.image}
                decoding="async"
                alt={c.imageAlt}
                style={{ objectPosition: `${c.imageX}% ${c.imageY}%`, transform: c.imageZoom > 1 ? `scale(${c.imageZoom})` : undefined, transformOrigin: `${c.imageX}% ${c.imageY}%` }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

              <div className="absolute left-6 top-6 border border-white/40 bg-black/10 px-4 py-2 backdrop-blur-sm">
                <span className="text-[10px] font-bold tracking-[0.25em] text-white">
                  {c.seasonTag}
                </span>
              </div>

              <div className="absolute bottom-7 left-7 text-left text-white sm:bottom-9 sm:left-9">
                <p className="text-2xl font-black tracking-wide sm:text-3xl">
                  {c.sectionTitle}
                </p>
              </div>
            </a>

            {/* CONTENT */}
            <div
              data-motion="copy"
              className="relative flex min-w-0 items-center px-6 py-12 sm:px-10 lg:px-12 lg:py-16"
            >
              <Reveal className="relative z-10 max-w-lg">
                <Eyebrow tone="pistachio">
                  {c.badge}
                </Eyebrow>

                <h3 className="mt-5 break-words text-[clamp(2rem,4.2vw,3.4rem)] font-black leading-[1.15] tracking-tight text-espresso">
                  {c.headline}
                </h3>

                <p className="mt-6 max-w-lg break-words text-[clamp(1rem,1.5vw,1.19rem)] font-semibold leading-8 text-espresso/90">
                  {c.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {c.tags.map((item) => (
                    <span
                      key={item}
                      className="border border-espresso/15 bg-milk/60 px-4 py-2 text-[12px] font-bold text-espresso/70"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-5">
                  <Button href={c.ctaHref} variant="primary">
                    {c.cta}
                  </Button>

                  <a
                    href={c.secondaryHref}
                    className="omb-link border-espresso/30 text-espresso"
                  >
                    {c.secondary}
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
