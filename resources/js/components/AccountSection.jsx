import React, { useEffect, useState } from "react";
import AuthPanel from "./auth/AuthPanel";

export default function AccountSection({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const benefits = isAr
    ? [
        ["طلباتك", "تابع حالة كل طلب ومين السائق بعد تعيينه."],
        ["مكافآتك", "كل طلب مكتمل يقربك تلقائيًا من المكافأة التالية."],
        ["أسرع بالمرة الجاية", "احفظ معلوماتك ومفضلاتك بدل ما تبدأ من الصفر."],
      ]
    : [
        ["Your orders", "Track every order and the assigned driver when available."],
        ["Your rewards", "Every completed order moves you toward the next reward."],
        ["Faster next time", "Keep your details and favourites instead of starting over."],
      ];

  return (
    <section id="account" className="omb-account-section bg-milk py-16 sm:py-24" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-10">
        <div className="omb-account-shell">
          <div className="omb-account-copy" data-motion="copy">
            <div className="omb-account-eyebrow">
              <span />
              {isAr ? "حساب OH MY BABY" : "OH MY BABY ACCOUNT"}
            </div>
            <h2>{isAr ? "كل طلباتك بحساب واحد." : "One account for every order."}</h2>
            <p>
              {isAr
                ? "هذا هو مكان الدخول الفعلي لحسابك. استخدم Google أو حساب OH MY BABY، وبتظل طلباتك ومكافآتك محفوظة بنفس الحساب."
                : "This is your actual account entry. Use Google or an OH MY BABY account and keep orders and rewards in one profile."}
            </p>

            <div className="omb-account-benefits">
              {benefits.map(([title, body], index) => (
                <div className="omb-account-benefit" key={title} data-scroll-item>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{title}</strong><p>{body}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="omb-account-entry" data-motion="media">
            <div className="omb-account-entry-mark">OMB</div>
            <p className="omb-account-entry-kicker">{isAr ? "اختر طريقة الدخول" : "CHOOSE HOW TO CONTINUE"}</p>
            <h3>{isAr ? "تسجيل الدخول أو إنشاء حساب." : "Sign in or create an account."}</h3>
            <button type="button" onClick={() => setOpen(true)} className="omb-account-main-cta">
              <span className="omb-account-google-g">G</span>
              <span>{isAr ? "Google أو حساب OH MY BABY" : "Google or OH MY BABY account"}</span>
              <span aria-hidden="true">↗</span>
            </button>
            <p className="omb-account-entry-note">
              {isAr
                ? "الشراء كزائر يظل ممكنًا؛ الحساب مطلوب فقط إذا بدك تحفظ الطلبات والمكافآت بحسابك."
                : "Guest checkout can stay available; an account is only needed to keep orders and rewards together."}
            </p>
          </div>
        </div>
      </div>

      {open && (
        <div className="omb-auth-modal" role="dialog" aria-modal="true" aria-label={isAr ? "تسجيل الدخول أو إنشاء حساب" : "Sign in or create account"}>
          <button type="button" className="omb-auth-backdrop" aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setOpen(false)} />
          <div className="omb-auth-dialog">
            <div className="omb-auth-dialog-head">
              <div>
                <p>OH MY BABY</p>
                <strong>{isAr ? "أهلًا في حسابك" : "Welcome to your account"}</strong>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={isAr ? "إغلاق" : "Close"}>×</button>
            </div>
            <AuthPanel locale={locale} compact />
          </div>
        </div>
      )}
    </section>
  );
}
