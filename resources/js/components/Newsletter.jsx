import React, { useEffect, useRef, useState } from "react";
import Eyebrow from "./ui/Eyebrow";
import Reveal from "./ui/Reveal";
import { apiFetch } from "../lib/api";

export default function Newsletter({ locale = "ar" }) {
    const isAr = locale === "ar";
    const [email, setEmail] = useState("");
    const [accountEmail, setAccountEmail] = useState("");
    const [feedback, setFeedback] = useState({ type: "", text: "" });
    const [busy, setBusy] = useState(false);
    const submittedRef = useRef(false);

    const t = isAr
        ? {
              eyebrow: "انضموا إلينا",
              title: "لحظات ناعمة في بريدك",
              body: "اشترك ببريدك ليصلك كل جديد من العروض والمنتجات والتحديثات من OH MY BABY.",
              emailLabel: "البريد الإلكتروني",
              placeholder: "بريدك الإلكتروني",
              submit: "اشترك الآن",
          }
        : {
              eyebrow: "Join us",
              title: "Soft moments, in your inbox",
              body: "Subscribe for OH MY BABY offers, new arrivals and updates.",
              emailLabel: "Email address",
              placeholder: "Your email address",
              submit: "Subscribe",
          };

    useEffect(() => {
        let active = true;
        apiFetch("/auth/session")
            .then((payload) => {
                if (!active) return;
                const detected = payload?.authenticated ? String(payload?.user?.email || "").trim() : "";
                if (!detected) return;
                setAccountEmail(detected);
                // Do not refill the field after a successful subscription.
                if (!submittedRef.current) {
                    setEmail((current) => current || detected);
                }
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, []);

    async function submit(event) {
        event.preventDefault();
        if (busy) return;

        const targetEmail = String(email || accountEmail).trim();
        if (!targetEmail) return;

        setBusy(true);
        setFeedback({ type: "", text: "" });

        try {
            const payload = await apiFetch("/api/newsletter/subscribe", {
                method: "POST",
                body: JSON.stringify({ email: targetEmail }),
            });

            submittedRef.current = true;
            setEmail("");

            if (payload?.already_subscribed) {
                setFeedback({
                    type: "success",
                    text: isAr
                        ? "تم التعرف على بريدك، وأنت مشترك معنا بالفعل 🤍"
                        : "We recognized your email — you're already subscribed 🤍",
                });
            } else if (payload?.recognized_account || (accountEmail && targetEmail.toLowerCase() === accountEmail.toLowerCase())) {
                setFeedback({
                    type: "success",
                    text: isAr
                        ? "تم التعرف على حسابك والاشتراك بنجاح 🤍"
                        : "We recognized your account and subscribed you successfully 🤍",
                });
            } else {
                setFeedback({
                    type: "success",
                    text: isAr ? "تم الاشتراك بنجاح. أهلاً بك معنا 🤍" : "You're subscribed. Welcome 🤍",
                });
            }
        } catch (error) {
            setFeedback({
                type: "error",
                text:
                    error?.data?.errors?.email?.[0] ||
                    (isAr ? "تعذر الاشتراك حالياً. حاول مرة أخرى." : "Subscription failed. Please try again."),
            });
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="omb-newsletter-section bg-espresso py-16 text-milk sm:py-20">
            <div className="mx-auto max-w-[1100px] px-5 sm:px-8 lg:px-10">
                <Reveal className="grid gap-8 lg:grid-cols-2 lg:items-center">
                    <div>
                        <Eyebrow tone="pistachio" dark>{t.eyebrow}</Eyebrow>
                        <h3 className="omb-h3 text-3xl leading-[1.05]">{t.title}</h3>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-milk/75">{t.body}</p>
                    </div>
                    <form className="flex w-full flex-wrap items-center gap-3" onSubmit={submit} noValidate={false}>
                        <label htmlFor="newsletter-email" className="sr-only">{t.emailLabel}</label>
                        <input
                            id="newsletter-email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                if (feedback.type === "error") setFeedback({ type: "", text: "" });
                            }}
                            placeholder={t.placeholder}
                            className="min-h-12 flex-1 rounded-full border border-milk/25 bg-white/8 px-5 text-sm text-milk placeholder:text-milk/50 transition-colors duration-300 ease-premium focus:border-milk/70 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={busy}
                            className="omb-btn min-h-12 bg-pistachio px-6 text-espresso transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-butter disabled:opacity-50"
                        >
                            {busy ? (isAr ? "جاري الاشتراك..." : "Subscribing...") : t.submit}
                        </button>

                        {feedback.text && (
                            <div
                                className={`omb-newsletter-feedback ${feedback.type === "success" ? "is-success" : "is-error"}`}
                                role="status"
                                aria-live="polite"
                            >
                                <span aria-hidden="true">{feedback.type === "success" ? "✓" : "!"}</span>
                                <strong>{feedback.text}</strong>
                            </div>
                        )}
                    </form>
                </Reveal>
            </div>
        </section>
    );
}
