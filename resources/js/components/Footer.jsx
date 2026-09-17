import React from "react";

function FooterColumn({ title, children }) {
    return (
        <div>
            <p className="omb-eyebrow-label mb-5 block text-aubergine/55">{title}</p>
            <div className="space-y-3 text-sm text-espresso/65">{children}</div>
        </div>
    );
}

function FooterLink({ children, href }) {
    return (
        <a href={href} className="omb-underline block w-fit transition-colors duration-300 ease-premium hover:text-aubergine">
            {children}
        </a>
    );
}

export default function Footer({ locale = "ar" }) {
    const isAr = locale === "ar";
    const t = isAr
        ? {
              tagline: "أشياء صغيرة، بحب كبير — مختارة بعناية لطفلك.",
              shop: "Shop",
              shopLinks: [["وصل حديثاً", "/#new-arrivals"], ["الأكثر طلباً", "/#best-sellers"], ["العروض", "/#product-hero"], ["العودة للمدرسة", "/#featured-collection"], ["حديثي الولادة", "/#newborn-essentials"]],
              care: "Customer Care",
              careLinks: [["طرق الشحن", "/services/shipping"], ["سياسة الإرجاع", "/services/returns"], ["الأسئلة الشائعة", "/services/faq"]],
              brand: "Oh My Baby",
              brandLinks: [["قصتنا", "/about"], ["تسجيل الدخول", "/#account"], ["تابعونا", "/social/facebook"]],
              rights: "كل الحقوق محفوظة.",
          }
        : {
              tagline: "Small things, big love — carefully chosen for your child.",
              shop: "Shop",
              shopLinks: [["New arrivals", "/#new-arrivals"], ["Best sellers", "/#best-sellers"], ["Offers", "/#product-hero"], ["Back to school", "/#featured-collection"], ["Newborn", "/#newborn-essentials"]],
              care: "Customer Care",
              careLinks: [["Shipping", "/services/shipping"], ["Return policy", "/services/returns"], ["FAQ", "/services/faq"]],
              brand: "Oh My Baby",
              brandLinks: [["Our story", "/about"], ["Sign in", "/#account"], ["Follow us", "/social/facebook"]],
              rights: "All rights reserved.",
          };

    return (
        <footer className="border-t border-espresso/8 bg-milk py-16 text-espresso sm:py-20">
            <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
                <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
                    <div>
                        <img src="/images/brand/logo-transparent.png" alt="Oh My Baby" className="h-14 w-auto object-contain" />
                        <p className="mt-4 max-w-[220px] text-sm leading-6 text-espresso/50">{t.tagline}</p>
                    </div>
                    <FooterColumn title={t.shop}>{t.shopLinks.map(([label, href]) => <FooterLink key={label} href={href}>{label}</FooterLink>)}</FooterColumn>
                    <FooterColumn title={t.care}>{t.careLinks.map(([label, href]) => <FooterLink key={label} href={href}>{label}</FooterLink>)}</FooterColumn>
                    <FooterColumn title={t.brand}>{t.brandLinks.map(([label, href]) => <FooterLink key={label} href={href}>{label}</FooterLink>)}</FooterColumn>
                </div>
                <div className="mt-14 flex flex-col gap-6 border-t border-espresso/8 pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-espresso/45">© {new Date().getFullYear()} Oh My Baby. {t.rights}</p>
                    <div className="flex gap-6 text-sm font-semibold text-espresso/65">
                        <a href="/social/instagram" className="omb-underline transition-colors duration-300 ease-premium hover:text-aubergine">Instagram</a>
                        <a href="/social/facebook" className="omb-underline transition-colors duration-300 ease-premium hover:text-aubergine">Facebook</a>
                        <a href="/social/pinterest" className="omb-underline transition-colors duration-300 ease-premium hover:text-aubergine">Pinterest</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
