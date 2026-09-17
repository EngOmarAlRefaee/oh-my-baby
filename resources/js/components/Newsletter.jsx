import React, { useState } from "react";
import Eyebrow from "./ui/Eyebrow";
import Reveal from "./ui/Reveal";

export default function Newsletter({ locale = "ar" }) {
    const isAr = locale === "ar";
    const [message, setMessage] = useState("");

    const t = isAr
        ? {
              eyebrow: "انضموا إلينا",
              title: "لحظات ناعمة في بريدك",
              body: "اشترك لتصلك عروض حصرية ومقالات عن رعاية الأطفال، وإصداراتنا الجديدة من القطع الناعمة.",
              emailLabel: "البريد الإلكتروني",
              placeholder: "بريدك الإلكتروني",
              submit: "اشترك الآن",
          }
        : {
              eyebrow: "Join us",
              title: "Soft moments, in your inbox",
              body: "Subscribe for exclusive offers, baby-care articles, and our newest soft new arrivals.",
              emailLabel: "Email address",
              placeholder: "Your email address",
              submit: "Subscribe",
          };

    return (
        <section className="omb-newsletter-section bg-espresso py-16 text-milk sm:py-20">
            <div className="mx-auto max-w-[1100px] px-5 sm:px-8 lg:px-10">
                <Reveal className="grid gap-8 lg:grid-cols-2 lg:items-center">
                    <div>
                        <Eyebrow tone="pistachio" dark>
                            {t.eyebrow}
                        </Eyebrow>

                        <h3 className="omb-h3 text-3xl leading-[1.05]">
                            {t.title}
                        </h3>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-milk/75">
                            {t.body}
                        </p>
                    </div>

                    <form
                        className="flex w-full flex-wrap items-center gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            setMessage(isAr ? "تم حفظ البريد بهذه الجلسة التجريبية. الربط النهائي مع قائمة البريد يأتي مع الـBackend." : "Email captured in this demo session. Final mailing-list storage will connect with the backend.");
                        }}
                    >
                        <label htmlFor="email" className="sr-only">
                            {t.emailLabel}
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder={t.placeholder}
                            className="min-h-12 flex-1 rounded-full border border-milk/25 bg-white/8 px-5 text-sm text-milk placeholder:text-milk/50 transition-colors duration-300 ease-premium focus:border-milk/70 focus:outline-none"
                        />

                        <button
                            type="submit"
                            className="omb-btn min-h-12 bg-pistachio px-6 text-espresso transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-butter"
                        >
                            {t.submit}
                        </button>
                        {message && <p className="w-full text-xs font-semibold text-milk/75">{message}</p>}
                    </form>
                </Reveal>
            </div>
        </section>
    );
}
