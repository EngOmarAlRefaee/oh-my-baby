import React from "react";
import { SOCIAL_LINKS, whatsappLink } from "../lib/social";

export const BRAND = {
  facebook: "#1877F2",
  whatsapp: "#25D366",
  instagram: "linear-gradient(45deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)",
};

const CONTENT = {
  shipping: {
    titleAr: "طرق الشحن", titleEn: "Shipping",
    descAr: "طريقتين لوصول طلبك، اختاري الأنسب إلك وقت إتمام الطلب.",
    descEn: "Two ways to receive your order — pick the one that suits you at checkout.",
    sections: [
      { ar: "توصيل داخل دمشق وريفها (مندوب)", en: "Delivery in Damascus area (courier)", bodyAr: ["يوصلك المندوب لحد باب البيت، وبيتواصل معك بالهاتف قبل الوصول.", "رسوم التوصيل داخل دمشق: 2.50$.", "المناطق البعيدة: 4$ (جرمانا، مليحة، صحنايا الجديدة، مشروع دمر، قدسيا، المعضمية الجديدة، عرطوز).", "الدفع عند الاستلام، بالدولار أو بالليرة السورية حسب سعر الصرف المعتمد بالموقع وقت الطلب."], bodyEn: ["Our courier brings the order to your door and calls you before arriving.", "Delivery fee inside Damascus: $2.50.", "Remote areas: $4 (Jaramana, Mleiha, New Sahnaya, Dummar Project, Qudsaya, New Muadamiyat, Artouz).", "Pay on delivery, in USD or SYP at the site's exchange rate at order time."] },
      { ar: "الشحن للمحافظات (شركة شحن)", en: "Shipping to other governorates (carrier)", bodyAr: ["اختاري المحافظة وشركة الشحن وسجّلي اسم المستلم ورقمه وعنوانه.", "ما في رسوم توصيل مضافة من الموقع، وأجرة الشحن بتكون حسب تسعيرة شركة الشحن المختارة."], bodyEn: ["Choose your governorate and carrier and enter the recipient's name, phone and address.", "The site adds no delivery fee; the carrier's own rates apply."] },
      { ar: "بعد تأكيد الطلب", en: "After you order", bodyAr: ["الإدارة بتراجع الطلب أولاً، وبعدها بيتعيّن مندوب وبتتابعي الحالة من حسابك.", "بعد التسليم بتأكدي الاستلام من حسابك، وإذا ما تأكد يدوياً بيتأكد تلقائياً بعد 12 ساعة."], bodyEn: ["Our team reviews your order, a courier is assigned, and you can follow the status from your account.", "After delivery, confirm receipt in your account; otherwise it is confirmed automatically after 12 hours."] },
    ],
  },
  returns: {
    titleAr: "سياسة الإرجاع", titleEn: "Return policy",
    descAr: "إرجاع بسيط وواضح للطلبات اللي تم تسليمها.",
    descEn: "A simple, clear return process for delivered orders.",
    sections: [
      { ar: "كيف بتطلبي الإرجاع؟", en: "How to request a return", bodyAr: ["الإرجاع متاح للطلبات اللي حالتها «تم التسليم» فقط، وخلال 3 أيام من تاريخ التسليم.", "من حسابك افتحي الطلب واضغطي «طلب إرجاع» واكتبي السبب.", "ما بنقبل أكثر من طلب إرجاع فعّال للطلب الواحد."], bodyEn: ["Returns are available for orders marked “Delivered”, within 3 days of delivery.", "Open the order in your account, tap “Request return” and write the reason.", "Only one active return request is allowed per order."] },
      { ar: "مراحل الإرجاع", en: "Return stages", bodyAr: ["1) تُراجع الإدارة الطلب وتوافق عليه أو ترفضه مع ذكر الملاحظة.", "2) عند الموافقة بيتعيّن مندوب لاستلام القطع منك.", "3) المندوب بيسجّل القطع اللي رجعت فعلياً، وبيمكن يكون الإرجاع جزئي (بعض القطع فقط).", "4) القطع المرجعة بترجع للمخزون، ومبلغها بيتعدّل من الطلب."], bodyEn: ["1) Our team reviews and approves or rejects the request with a note.", "2) If approved, a courier is assigned to collect the items.", "3) The courier records the pieces actually returned — partial returns are possible.", "4) Returned pieces go back to stock and the order amount is adjusted."] },
      { ar: "ملاحظات", en: "Notes", bodyAr: ["لازم تكون القطع بحالتها الأصلية.", "قرار الموافقة النهائي للإدارة بعد مراجعة السبب.", "للاستفسار تواصلي معنا عبر واتساب."], bodyEn: ["Items should be in their original condition.", "Final approval is up to our team after reviewing the reason.", "Questions? Message us on WhatsApp."] },
    ],
  },
  faq: {
    titleAr: "الأسئلة الشائعة", titleEn: "FAQ",
    descAr: "أجوبة سريعة على أكتر الأسئلة.", descEn: "Quick answers to the most common questions.",
    faqs: [
      ["كيف بطلب؟", "How do I order?", "ضيفي القطع للسلة، اضغطي إتمام الطلب، اختاري التوصيل أو الشحن وعبّي بياناتك.", "Add items to your bag, go to checkout, choose delivery or shipping and fill in your details."],
      ["هل لازم يكون عندي حساب؟", "Do I need an account?", "لا، بتقدري تطلبي كضيف، بس الحساب بيسهّل متابعة الطلبات والإرجاع.", "No, you can order as a guest, but an account makes tracking and returns easier."],
      ["كيف بدفع؟", "How do I pay?", "الدفع عند الاستلام، بالدولار أو بالليرة السورية.", "Payment on delivery, in USD or SYP."],
      ["كم رسوم التوصيل؟", "What is the delivery fee?", "2.50$ داخل دمشق و4$ للمناطق البعيدة. الشحن للمحافظات حسب شركة الشحن.", "$2.50 inside Damascus and $4 for remote areas. Other governorates follow the carrier's rates."],
      ["كيف بتابع طلبي؟", "How do I track my order?", "من حسابك بتشوفي حالة الطلب خطوة بخطوة.", "Your account shows the order status step by step."],
      ["كيف برجّع طلب؟", "How do I return an order?", "بعد التسليم اضغطي «طلب إرجاع» من حسابك. التفاصيل بصفحة سياسة الإرجاع.", "After delivery tap “Request return” in your account. See the Return policy page."],
      ["شو إذا ما أكدت الاستلام؟", "What if I don't confirm receipt?", "بيتأكد الاستلام تلقائياً بعد 12 ساعة من التسليم.", "Receipt is confirmed automatically 12 hours after delivery."],
      ["كيف بتواصل معكم؟", "How can I contact you?", "عبر واتساب أو صفحات فيسبوك وإنستغرام، أو من خلال الدردشة بالموقع.", "Via WhatsApp, our Facebook and Instagram pages, or the site chat."],
    ],
  },
};

export function BrandIcon({ name, size = 22 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "#fff", "aria-hidden": true };
  if (name === "facebook") return <svg {...p}><path d="M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-.9.4-1.7 1.8-1.7h1.6V3.8c-.3 0-1.3-.2-2.4-.2-2.5 0-4.1 1.5-4.1 4.2v2.7H7.6v3.3h2.8V22z" /></svg>;
  if (name === "instagram") return <svg {...p} fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="1" fill="#fff" stroke="none" /></svg>;
  return <svg {...p}><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.300c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.300.1.4.1.600-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.500z" /></svg>;
}

export function brandBg(name) {
  return name === "instagram" ? { background: BRAND.instagram } : { backgroundColor: BRAND[name] };
}

export function FollowPage({ locale }) {
  const isAr = locale === "ar";
  const items = [
    ["facebook", "Facebook", isAr ? "صفحتنا على فيسبوك" : "Our Facebook page", SOCIAL_LINKS.facebook],
    ["instagram", "Instagram", isAr ? "صفحتنا على إنستغرام" : "Our Instagram page", SOCIAL_LINKS.instagram],
    ["whatsapp", "WhatsApp", isAr ? "تواصلي معنا مباشرة" : "Chat with us directly", whatsappLink()],
  ];
  return (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      {items.map(([n, label, sub, href]) => (
        <a key={n} href={href} target="_blank" rel="noopener noreferrer" style={brandBg(n)} className="flex items-center gap-4 rounded-2xl p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <BrandIcon name={n} size={34} />
          <span><strong className="block text-lg">{label}</strong><span className="text-sm opacity-90">{sub}</span></span>
        </a>
      ))}
    </div>
  );
}

export function servicePage(key) { return CONTENT[key]; }

export function ServiceBody({ locale, kind }) {
  const isAr = locale === "ar";
  const c = CONTENT[kind];
  if (c.faqs) {
    return (
      <div className="max-w-3xl space-y-3">
        {c.faqs.map((f, i) => (
          <details key={i} className="group border border-espresso/10 bg-oat/20 p-5">
            <summary className="cursor-pointer text-base font-black text-espresso">{isAr ? f[0] : f[1]}</summary>
            <p className="mt-3 text-sm leading-7 text-espresso/70">{isAr ? f[2] : f[3]}</p>
          </details>
        ))}
      </div>
    );
  }
  return (
    <div className="max-w-3xl space-y-6">
      {c.sections.map((s, i) => (
        <div key={i} className="border border-espresso/10 bg-oat/20 p-6">
          <h2 className="text-xl font-black text-espresso">{isAr ? s.ar : s.en}</h2>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-espresso/70">
            {(isAr ? s.bodyAr : s.bodyEn).map((l, j) => <li key={j}>{l}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
