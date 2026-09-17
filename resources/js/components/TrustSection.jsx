import React from "react";
import Reveal from "./ui/Reveal";

const benefitsAr = [
    {
        title: "توصيل سريع",
        description: "طلباتك بتوصلك بأسرع وقت ممكن وبطريقة مرتبة.",
    },
    {
        title: "طلب سهل",
        description: "خطوات بسيطة وواضحة من اختيار المنتج لحد تأكيد الطلب.",
    },
    {
        title: "حفظ العنوان",
        description: "سجّل دخولك وخلي عنوانك جاهز لطلباتك القادمة.",
    },
    {
        title: "مكافآت مستمرة",
        description: "طلباتك المكتملة بتقربك من عروض ومكافآت خاصة.",
    },
];

const benefitsEn = [
    {
        title: "Fast delivery",
        description: "Your orders arrive quickly, and neatly packed.",
    },
    {
        title: "Easy ordering",
        description: "Simple, clear steps from picking a product to confirming your order.",
    },
    {
        title: "Saved address",
        description: "Sign in and keep your address ready for future orders.",
    },
    {
        title: "Ongoing rewards",
        description: "Completed orders bring you closer to special offers and rewards.",
    },
];

const icons = [
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
    </svg>,
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M6 8h12l1 13H5L6 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>,
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.2" />
    </svg>,
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M4 9h16v11H4zM3 6h18v3H3zM12 6v14" />
        <path d="M12 6c-2.8 0-4.5-1-4.5-2.5S9.5 2 12 6Zm0 0c2.8 0 4.5-1 4.5-2.5S14.5 2 12 6Z" />
    </svg>,
];

export default function TrustSection({ locale = "ar" }) {
    const isAr = locale === "ar";
    const benefits = isAr ? benefitsAr : benefitsEn;

    return (
        <section className="border-y border-espresso/10 bg-oat/35">
            <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                    {benefits.map((benefit, index) => (
                        <Reveal
                            key={benefit.title}
                            delay={index * 60}
                            className={`group px-3 py-10 sm:px-7 sm:py-12 lg:py-14 ${
                                index !== 0 ? "lg:border-r lg:border-espresso/10" : ""
                            }`}
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-milk text-aubergine transition-all duration-300 ease-premium group-hover:-translate-y-1 group-hover:bg-aubergine group-hover:text-milk">
                                {icons[index]}
                            </div>

                            <h3 className="mt-5 text-lg font-black text-espresso">
                                {benefit.title}
                            </h3>

                            <p className="mt-2 max-w-xs text-sm leading-6 text-espresso/50">
                                {benefit.description}
                            </p>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
