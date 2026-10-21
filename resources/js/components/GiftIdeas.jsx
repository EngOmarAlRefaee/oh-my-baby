import React, { useEffect, useState } from "react";
import Reveal from "./ui/Reveal";
import { apiFetch } from "../lib/api";

const POLL_CHOICES = {
  interested: {
    ar: "مهتم",
    en: "Interested",
    arHint: "حابب أشوف هالقسم بالموقع",
    enHint: "I'd like to see this section on the site",
  },
  very_interested: {
    ar: "مهتم جدًا",
    en: "Very interested",
    arHint: "هذا القسم مهم إلي وناطره",
    enHint: "This section matters to me and I'm waiting for it",
  },
};

function normalizePollChoice(choice) {
  if (choice === "yes") return "interested";
  if (choice === "no") return "very_interested";
  return choice || "";
}

function PollResults({ locale, results }) {
  const isAr = locale === "ar";
  if (!results) return null;

  const interestedPercent = Number(results.interested_percent ?? results.yes_percent ?? 0);
  const veryInterestedPercent = Number(results.very_interested_percent ?? results.no_percent ?? 0);
  const rows = [
    { key: "interested", percent: interestedPercent },
    { key: "very_interested", percent: veryInterestedPercent },
  ];

  return (
    <div className="omb-poll-standard-results" aria-live="polite">
      <div className="omb-poll-standard-results-head">
        <strong>{isAr ? "نتائج الاستفتاء" : "Poll results"}</strong>
      </div>

      <div className="omb-poll-standard-bars">
        {rows.map((row) => (
          <div key={row.key} className="omb-poll-standard-result-row">
            <div className="omb-poll-standard-result-copy">
              <span>{POLL_CHOICES[row.key][isAr ? "ar" : "en"]}</span>
              <strong>{row.percent}%</strong>
            </div>
            <div className="omb-poll-standard-track" aria-hidden="true">
              <span style={{ width: `${row.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterestPoll({ locale, section = "baby-world" }) {
  const isAr = locale === "ar";
  const [state, setState] = useState({
    busy: false,
    choice: "",
    message: "",
    results: null,
    showResults: false,
  });

  useEffect(() => {
    let active = true;
    apiFetch(`/api/interest-polls/results?section=${encodeURIComponent(section)}`)
      .then((payload) => {
        if (!active) return;
        const savedChoice = normalizePollChoice(payload?.choice);
        setState((current) => ({
          ...current,
          choice: savedChoice,
          results: payload?.results || null,
          showResults: Boolean(savedChoice),
        }));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [section]);

  async function submitVote(choice) {
    if (state.busy || !choice || choice === state.choice) return;

    setState((current) => ({
      ...current,
      busy: true,
      message: isAr ? "جاري تسجيل التصويت..." : "Saving your vote...",
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
        message: isAr ? "تم تسجيل تصويتك، شكرًا لمشاركتك." : "Your vote was recorded. Thank you.",
        results: payload?.results || current.results,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        busy: false,
        message: error?.status === 429
          ? (isAr ? "تمت محاولات كثيرة بسرعة. جرّب بعد لحظات." : "Too many attempts. Please try again shortly.")
          : (isAr ? "تعذر تسجيل التصويت الآن. جرّب مرة ثانية." : "We couldn't save your vote. Please try again."),
      }));
    }
  }

  const choices = ["interested", "very_interested"];

  return (
    <section className="omb-poll-standard mx-auto mt-10 max-w-4xl" dir={isAr ? "rtl" : "ltr"}>
      <div className="omb-poll-standard-head">
        <span className="omb-poll-standard-label">{isAr ? "استفتاء" : "POLL"}</span>
        <div>
          <h3>{isAr ? "ما مدى اهتمامك بقسم عالم الطفل؟" : "How interested are you in Baby World?"}</h3>
          <p>{isAr ? "اختر إجابة واحدة، وسيتم تسجيلها مباشرة." : "Choose one answer and it will be saved immediately."}</p>
        </div>
      </div>

      <div className="omb-poll-standard-form">
        <fieldset disabled={state.busy} className="omb-poll-standard-options">
          {choices.map((choice) => {
            const selected = state.choice === choice;
            const copy = POLL_CHOICES[choice];
            return (
              <label key={choice} className={`omb-poll-standard-option ${selected ? "is-selected" : ""}`}>
                <input
                  type="radio"
                  name={`interest-poll-${section}`}
                  value={choice}
                  checked={selected}
                  onChange={() => submitVote(choice)}
                />
                <span className="omb-poll-standard-radio" aria-hidden="true" />
                <span className="omb-poll-standard-option-copy">
                  <strong>{copy[isAr ? "ar" : "en"]}</strong>
                  <small>{copy[isAr ? "arHint" : "enHint"]}</small>
                </span>
              </label>
            );
          })}
        </fieldset>

        {state.message && <p className="omb-poll-standard-message">{state.message}</p>}
      </div>

      {state.showResults && state.results && <PollResults locale={locale} results={state.results} />}
    </section>
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
        <img src={image} decoding="async" alt={isAr ? titleAr : titleEn} className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.035]" />
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
