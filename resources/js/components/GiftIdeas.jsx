import React, { useEffect, useState } from "react";
import Reveal from "./ui/Reveal";
import { apiFetch } from "../lib/api";

const POLL_CHOICES = {
  interested: {
    ar: "مهتمين بهالقسم 🤍",
    en: "Interested 🤍",
  },
  very_interested: {
    ar: "كتير مهتمين وناطرينو ✨",
    en: "Very interested — can't wait ✨",
  },
};

function PollResults({ locale, results }) {
  const isAr = locale === "ar";
  if (!results) return null;

  const interested = Number(results.interested || results.yes || 0);
  const veryInterested = Number(results.very_interested || results.no || 0);
  const total = Number(results.total || 0);
  const interestedPercent = Number(results.interested_percent ?? results.yes_percent ?? 0);
  const veryInterestedPercent = Number(results.very_interested_percent ?? results.no_percent ?? 0);

  const rows = [
    [POLL_CHOICES.interested[isAr ? "ar" : "en"], interested, interestedPercent, "bg-aubergine"],
    [POLL_CHOICES.very_interested[isAr ? "ar" : "en"], veryInterested, veryInterestedPercent, "bg-butter"],
  ];

  return (
    <div className="mt-6 border-t border-espresso/10 pt-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-espresso/75">{isAr ? "نبض آراء الزباين" : "Customer interest"}</p>
        <span className="rounded-full bg-espresso/5 px-3 py-1 text-xs font-bold text-espresso/45">
          {isAr ? `${total} مشاركة` : `${total} votes`}
        </span>
      </div>

      <div className="mt-4 grid gap-4">
        {rows.map(([label, value, percent, color]) => (
          <div key={label}>
            <div className="flex items-center justify-between gap-3 text-sm font-bold text-espresso/70">
              <span>{label}</span>
              <span>{percent}% · {value}</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-espresso/10">
              <div className={`h-full rounded-full ${color} transition-[width] duration-500`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterestPoll({ locale, section = "baby-world" }) {
  const isAr = locale === "ar";
  const [state, setState] = useState({ busy: false, choice: "", message: "", results: null, showResults: false });

  useEffect(() => {
    let active = true;
    apiFetch(`/api/interest-polls/results?section=${encodeURIComponent(section)}`)
      .then((payload) => {
        if (!active) return;
        setState((current) => ({
          ...current,
          choice: payload?.choice || current.choice,
          results: payload?.results || null,
          showResults: Boolean(payload?.choice) || current.showResults,
        }));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [section]);

  async function vote(choice) {
    if (state.busy) return;
    setState((current) => ({
      ...current,
      busy: true,
      choice,
      showResults: true,
      message: isAr ? "عم نسجل رأيك اللطيف..." : "Saving your vote...",
    }));

    try {
      const payload = await apiFetch("/api/interest-polls/vote", {
        method: "POST",
        body: JSON.stringify({ section, choice }),
      });
      setState((current) => ({
        ...current,
        busy: false,
        choice,
        showResults: true,
        message: isAr ? "وصلنا رأيك، شكراً من القلب 🤍" : "Your vote was saved. Thank you 🤍",
        results: payload?.results || current.results,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        busy: false,
        choice,
        showResults: true,
        message: error?.status === 429
          ? (isAr ? "اختيارك ظاهر هون، لحظة صغيرة قبل الحفظ مرة تانية." : "Your choice is shown here. Please wait a moment before saving again.")
          : (isAr ? "اختيارك واضح هون، وإذا ما انحفظ جرّب مرة تانية." : "Your choice is shown here. Try again if it was not saved."),
      }));
    }
  }

  const choices = ["interested", "very_interested"];

  return (
    <div className="omb-baby-poll mx-auto mt-10 max-w-4xl text-espresso" dir={isAr ? "rtl" : "ltr"}>
      <div className="omb-baby-poll-inner">
        <div className="omb-poll-kicker-row">
          <span className="omb-poll-badge">{isAr ? "استفتاء سريع" : "Quick poll"}</span>
          <span className="omb-soft-eyebrow">{isAr ? "رأيكم بيفرق معنا" : "Your opinion matters"}</span>
        </div>
        <h3>{isAr ? "صوّتوا لعالم الطفل… شو درجة حماسكم؟" : "Vote for Baby World… how excited are you?"}</h3>
        <p>
          {isAr
            ? "اختاروا درجة حماسكم من الزرين تحت. الاستفتاء واحد فقط وبيساعدنا نعرف بأي قسم نبدأ."
            : "Pick your excitement level below. One poll helps us choose what to launch first."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {choices.map((choice) => {
            const active = state.choice === choice || (choice === "interested" && state.choice === "yes") || (choice === "very_interested" && state.choice === "no");
            return (
              <button
                key={choice}
                type="button"
                disabled={state.busy}
                onClick={() => vote(choice)}
                className={`omb-poll-choice ${active ? "is-active" : ""}`}
              >
                <span>{POLL_CHOICES[choice][isAr ? "ar" : "en"]}</span>
                <small>{choice === "interested" ? (isAr ? "اضغط هون إذا حابين الفكرة" : "Tap if you like the idea") : (isAr ? "اضغط هون إذا ناطرينو بجد" : "Tap if you really want it")}</small>
                <em>{active ? (isAr ? "تم الاختيار" : "Selected") : (isAr ? "اختيار" : "Choose")}</em>
              </button>
            );
          })}
        </div>

        {state.message && <p className="mt-4 text-sm font-bold text-aubergine">{state.message}</p>}
        {state.showResults && state.results && <PollResults locale={locale} results={state.results} />}
      </div>
    </div>
  );
}

function FeedbackBox({ locale }) {
  const isAr = locale === "ar";
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitFeedback(event) {
    event.preventDefault();
    if (busy) return;
    if (note.trim().length < 3) {
      setStatus(isAr ? "اكتب ملاحظة صغيرة قبل الإرسال." : "Please write a short note before sending.");
      return;
    }

    setBusy(true);
    setStatus(isAr ? "عم نوصل ملاحظتك للإدارة..." : "Sending your note...");

    try {
      await apiFetch("/api/customer-feedback", {
        method: "POST",
        body: JSON.stringify({ source: "baby-world", message: note.trim() }),
      });
      setNote("");
      setStatus(isAr ? "وصلت ملاحظتك للإدارة، شكراً إلك 🤍" : "Your note reached the admin team. Thank you 🤍");
    } catch (error) {
      setStatus(isAr ? "تعذر إرسال الملاحظة حالياً. جرّب مرة تانية." : "We couldn't send the note right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submitFeedback} className="omb-feedback-card mx-auto mt-5 max-w-4xl" dir={isAr ? "rtl" : "ltr"}>
      <div className="omb-feedback-head">
        <span>{isAr ? "💌" : "💌"}</span>
        <div>
          <h3>{isAr ? "عندك فكرة أو ملاحظة؟" : "Have an idea or note?"}</h3>
          <p>
            {isAr
              ? "اكتبلنا شو بتحب تشوف بهالقسم… منتجات، خدمات، أفكار، أو أي ملاحظة بتخطر ببالك."
              : "Tell us what you'd love to see in this section — products, services, ideas, or any note."}
          </p>
        </div>
      </div>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={4}
        maxLength={1200}
        placeholder={isAr ? "اكتب ملاحظتك هون… نحن منقرأها بعناية 🤍" : "Write your note here… we'll read it carefully 🤍"}
        className="omb-feedback-textarea"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold text-espresso/45">{isAr ? `${note.length}/1200 حرف` : `${note.length}/1200 characters`}</p>
        <button type="submit" disabled={busy} className="omb-feedback-submit">
          {busy ? (isAr ? "جاري الإرسال..." : "Sending...") : isAr ? "إرسال الملاحظة" : "Send note"}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      {status && <p className="mt-3 text-sm font-bold text-aubergine">{status}</p>}
    </form>
  );
}

function ComingSoonCard({ locale, image, titleAr, titleEn, descriptionAr, descriptionEn, mediaClassName = "", size = "regular" }) {
  const isAr = locale === "ar";
  return (
    <article className={`omb-baby-card group relative overflow-hidden bg-espresso ${size === "hero" ? "is-hero" : ""}`}>
      <div className={`relative min-h-[280px] overflow-hidden ${mediaClassName}`}>
        <img src={image} loading="lazy" decoding="async" alt={isAr ? titleAr : titleEn} className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.035]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <span className={`absolute top-5 z-20 bg-butter px-4 py-2 text-xs font-black text-espresso ${isAr ? "left-5" : "right-5"}`}>{isAr ? "قريباً" : "COMING SOON"}</span>
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
          <h3 className="max-w-xl text-[28px] font-black leading-tight sm:text-[34px] lg:text-[40px]">{isAr ? titleAr : titleEn}</h3>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-7 text-white/75 sm:text-base">{isAr ? descriptionAr : descriptionEn}</p>
        </div>
      </div>
    </article>
  );
}

export default function GiftIdeas({ locale = "ar" }) {
  const isAr = locale === "ar";

  return (
    <section id="baby-world" className="relative overflow-hidden bg-milk py-20 sm:py-28" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[1560px] px-5 sm:px-8 lg:px-10">
        <Reveal>
          <div className="mb-12 sm:mb-16">
            <div className="flex items-center gap-4">
              <span className="text-[13px] font-bold uppercase tracking-[0.25em] text-aubergine">OH MY BABY WORLD</span>
              <span className="h-px w-20 bg-espresso/20" />
            </div>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
              <h2 className="max-w-4xl text-[40px] font-black leading-[1.08] tracking-tight text-espresso sm:text-[52px] lg:text-[62px]">
                {isAr ? "عالم الطفل… تفاصيل أدفى من الملابس." : "Baby World… beyond clothing."}
              </h2>
              <p className="max-w-xl text-[19px] font-semibold leading-8 text-espresso/75">
                {isAr ? "أقسام جديدة عم نجهزها حسب اهتمامكم، من استقبال المولود لاحتياجاته اليومية." : "New sections we're shaping around what you want most."}
              </p>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-12">
          <Reveal className="lg:col-span-7 lg:row-span-2" delay={0}>
            <ComingSoonCard
              locale={locale}
              size="hero"
              image="/images/home/services/newborn-welcome-optimized.webp"
              titleAr="تزيين استقبال المولود"
              titleEn="Newborn welcome decoration"
              descriptionAr="القسم الأكبر لعالم الطفل: ثيمات استقبال، تزيين، تنسيق هدايا، ولمسات مرتبة ليوم لا ينسى."
              descriptionEn="The largest Baby World section: welcome themes, decoration, gift styling, and curated details."
              mediaClassName="min-h-[520px] sm:min-h-[640px] lg:min-h-[780px]"
            />
          </Reveal>
          <Reveal className="lg:col-span-5" delay={70}>
            <ComingSoonCard
              locale={locale}
              image="/images/home/categories/mobility-optimized.webp"
              titleAr="عربايات ومقاعد أطفال"
              titleEn="Strollers & Car Seats"
              descriptionAr="اختيارات عملية وآمنة للتنقل اليومي مع الطفل براحة وأناقة."
              descriptionEn="Practical and safe picks for everyday movement with your baby."
              mediaClassName="min-h-[360px] sm:min-h-[420px] lg:min-h-[450px]"
            />
          </Reveal>
          <Reveal className="lg:col-span-5" delay={120}>
            <div className="grid gap-5 sm:grid-cols-2">
              <ComingSoonCard locale={locale} image="/images/home/categories/newborn-gifts-optimized.webp" titleAr="هدايا" titleEn="Gifts" descriptionAr="هدايا ناعمة ومرتبة للمولود والأم." descriptionEn="Soft curated gifts for newborns and moms." mediaClassName="min-h-[300px] sm:min-h-[330px] lg:min-h-[290px]" />
              <ComingSoonCard locale={locale} image="/images/home/categories/toys-essentials-optimized.webp" titleAr="ألعاب ومستلزمات الطفل" titleEn="Toys & Essentials" descriptionAr="ألعاب ومستلزمات يومية مختارة بعناية." descriptionEn="Toys and daily essentials selected with care." mediaClassName="min-h-[300px] sm:min-h-[330px] lg:min-h-[290px]" />
            </div>
          </Reveal>
        </div>

        <Reveal delay={160}>
          <InterestPoll locale={locale} section="baby-world" />
          <FeedbackBox locale={locale} />
        </Reveal>
      </div>
    </section>
  );
}
