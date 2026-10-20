import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { hasPermission } from "../lib/permissions";

function MarketingIcon({ type }) {
  const common = {
    width: 34,
    height: 34,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.65,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    contacts: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="9" r="2.5"/><path d="M15 15.5a4.8 4.8 0 0 1 5.5 4.5"/></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    sms: <><rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="M9 5.5h6"/><path d="M8 10h8M8 13h5"/><circle cx="12" cy="18" r=".8"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></>,
    promo: <><path d="M4 8.5V5a2 2 0 0 1 2-2h3.5L21 14.5 14.5 21 3 9.5Z"/><circle cx="8" cy="8" r="1.2"/><path d="m10 16 6-6"/><circle cx="10" cy="11" r="1"/><circle cx="16" cy="15" r="1"/></>,
    polls: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/><path d="m4 7 5-4 6 5 5-4"/></>,
  };

  return <svg {...common}>{icons[type] || icons.polls}</svg>;
}

function HubCard({ icon, title, description, meta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[175px] w-full items-center justify-center overflow-hidden rounded-[24px] border border-espresso/10 bg-milk px-5 py-6 text-center shadow-[0_10px_32px_rgba(56,36,42,.045)] transition-[border-color,box-shadow,background-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:border-aubergine/20 hover:bg-milk hover:shadow-[0_20px_46px_rgba(56,36,42,.09)] focus:outline-none focus:ring-2 focus:ring-aubergine/25"
    >
      <span className="pointer-events-none absolute inset-[1px] rounded-[23px] border border-white/25 opacity-70" />
      <span className="pointer-events-none absolute inset-x-7 bottom-0 h-px origin-center scale-x-0 bg-aubergine/45 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100 motion-reduce:transition-none" />
      <span className="pointer-events-none absolute -top-14 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-aubergine/[.035] blur-2xl transition-[width,height,background-color] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:h-36 group-hover:w-36 group-hover:bg-aubergine/[.075] motion-reduce:transition-none" />
      <div className="relative flex flex-col items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-espresso/10 bg-oat/30 text-aubergine shadow-[inset_0_1px_0_rgba(255,255,255,.35)] transition-[transform,border-color,background-color,color,box-shadow] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06] group-hover:border-aubergine/25 group-hover:bg-aubergine group-hover:text-milk group-hover:shadow-[0_10px_25px_rgba(80,52,67,.16),inset_0_1px_0_rgba(255,255,255,.12)] motion-reduce:transform-none motion-reduce:transition-none">
          <MarketingIcon type={icon} />
        </span>
        <h2 className="text-[17px] font-black leading-tight text-espresso transition-colors duration-500 group-hover:text-aubergine sm:text-[18px]">{title}</h2>
        {description && <p className="max-w-[260px] text-xs leading-5 text-espresso/48">{description}</p>}
        {meta && <span className="rounded-full border border-espresso/10 bg-oat/20 px-3 py-1 text-[11px] font-black text-espresso/55">{meta}</span>}
      </div>
    </button>
  );
}

function DetailHeader({ title, description, isAr, onBack }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[.16em] text-aubergine/50">MARKETING</p>
        <h2 className="mt-1 text-2xl font-black text-espresso sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-3xl text-sm leading-7 text-espresso/50">{description}</p>}
      </div>
      <button type="button" onClick={onBack} className="omb-btn omb-btn-secondary">
        {isAr ? "العودة لأقسام التسويق" : "Back to marketing modules"}
      </button>
    </div>
  );
}

export default function MarketingPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [activeSection, setActiveSection] = useState("hub");
  const [data, setData] = useState({ promo_codes: [], polls: [], feedback: [] });
  const [contacts, setContacts] = useState({ emails: [], phones: [], broadcasts: [], email_total: 0, phone_total: 0, email_marketable: 0, phone_marketable: 0 });
  const [form, setForm] = useState({ code: "BABY10", discount_percent: 10, active: true, first_order_only: true });
  const [emailForm, setEmailForm] = useState({ subject: "", message: "" });
  const [smsMessage, setSmsMessage] = useState("");
  const [smsGateway, setSmsGateway] = useState({ devices: [], campaigns: [] });
  const [pairing, setPairing] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [session, setSession] = useState(null);

  const canManage = hasPermission(session?.user, "marketing.manage");
  const canViewContacts = hasPermission(session?.user, "marketing.contacts.view");
  const canSendEmail = hasPermission(session?.user, "marketing.email.send");
  const canSendSms = hasPermission(session?.user, "marketing.sms.send");
  const canManageSmsGateway = hasPermission(session?.user, "marketing.sms.gateway.manage");

  function loadMain() {
    apiFetch("/api/admin/marketing").then((payload) => {
      setData(payload);
      const current = payload.promo_codes?.find((item) => item.active) || payload.promo_codes?.[0];
      if (current) setForm({ code: current.code, discount_percent: Number(current.discount_percent), active: Boolean(current.active), first_order_only: Boolean(current.first_order_only) });
    }).catch((error) => setMessage(error.message));
  }

  function loadContacts() {
    if (!canViewContacts) return;
    apiFetch("/api/admin/marketing/contacts").then(setContacts).catch((error) => setMessage(error.message));
  }

  useEffect(() => {
    loadMain();
    apiFetch("/auth/session").then(setSession).catch(() => {});
  }, []);

  function loadSmsGateway() {
    if (!canSendSms && !canManageSmsGateway) return;
    apiFetch("/api/admin/marketing/sms-gateway").then(setSmsGateway).catch((error) => setMessage(error.message));
  }

  useEffect(() => { loadContacts(); }, [canViewContacts]);
  useEffect(() => { loadSmsGateway(); }, [canSendSms, canManageSmsGateway]);

  async function savePromo(event) {
    event.preventDefault();
    setMessage("");
    try {
      await apiFetch("/api/admin/marketing/promo", { method: "POST", body: JSON.stringify(form) });
      setMessage(isAr ? "تم حفظ كود الحسم." : "Promo code saved.");
      loadMain();
    } catch (error) {
      setMessage(error.data?.errors ? Object.values(error.data.errors).flat()[0] : error.message);
    }
  }

  async function sendEmail(event) {
    event.preventDefault();
    setBusy("email"); setMessage("");
    try {
      const result = await apiFetch("/api/admin/marketing/broadcast/email", { method: "POST", body: JSON.stringify(emailForm) });
      setMessage(isAr ? `تمت العملية: نجح ${result.success} وفشل ${result.failed}.` : `Completed: ${result.success} sent, ${result.failed} failed.`);
      setEmailForm({ subject: "", message: "" });
      loadContacts();
    } catch (error) {
      setMessage(error.data?.message || (error.data?.errors ? Object.values(error.data.errors).flat()[0] : error.message));
    } finally { setBusy(""); }
  }

  async function createPairingCode() {
    setBusy("pair"); setMessage("");
    try {
      const result = await apiFetch("/api/admin/marketing/sms-gateway/pairing-code", { method: "POST" });
      setPairing(result);
      setMessage(isAr ? "تم إنشاء رمز ربط صالح لعشر دقائق." : "A 10-minute pairing code was created.");
    } catch (error) {
      setMessage(error.data?.message || error.message);
    } finally { setBusy(""); }
  }

  async function createSmsCampaign(event) {
    event.preventDefault();
    setBusy("sms"); setMessage("");
    try {
      const result = await apiFetch("/api/admin/marketing/broadcast/sms", { method: "POST", body: JSON.stringify({ message: smsMessage }) });
      setMessage(isAr ? `تم تجهيز الحملة لـ ${result.recipients} رقم. افتح تطبيق الهاتف واضغط تأكيد وإرسال مرة واحدة.` : `Campaign prepared for ${result.recipients} numbers. Open the phone app and confirm once.`);
      setSmsMessage("");
      loadSmsGateway();
    } catch (error) {
      setMessage(error.data?.message || (error.data?.errors ? Object.values(error.data.errors).flat()[0] : error.message));
    } finally { setBusy(""); }
  }

  const pollRows = useMemo(() => {
    const map = new Map();
    (data.polls || []).forEach((row) => {
      const current = map.get(row.section) || { section: row.section, interested: 0, very_interested: 0 };
      const normalizedChoice = row.choice === "yes" ? "interested" : row.choice === "no" ? "very_interested" : row.choice;
      if (normalizedChoice === "interested" || normalizedChoice === "very_interested") current[normalizedChoice] += Number(row.votes || 0);
      map.set(row.section, current);
    });
    return Array.from(map.values());
  }, [data.polls]);

  const hubCards = [
    canViewContacts && {
      key: "contacts",
      icon: "contacts",
      title: isAr ? "إيميلات وأرقام الزبائن" : "Customer contacts",
      description: isAr ? "قائمة البريد الإلكتروني وأرقام الهاتف وحالة الموافقة التسويقية." : "Email and phone lists with marketing opt-in status.",
      meta: isAr ? `${contacts.email_total} إيميل · ${contacts.phone_total} رقم` : `${contacts.email_total} emails · ${contacts.phone_total} phones`,
    },
    canSendEmail && {
      key: "email",
      icon: "email",
      title: isAr ? "إرسال بريد جماعي" : "Bulk email",
      description: isAr ? "اكتب عنوان الرسالة ونصها وأرسلها للزبائن المسموح مراسلتهم." : "Write a subject and message for opted-in customers.",
      meta: isAr ? `${contacts.email_marketable} مستلم متاح` : `${contacts.email_marketable} eligible recipients`,
    },
    (canSendSms || canManageSmsGateway) && {
      key: "sms",
      icon: "sms",
      title: isAr ? "إرسال SMS من الموبايل" : "SMS through phone gateway",
      description: isAr ? "اكتب الرسالة بالموقع، أكدها مرة واحدة على الهاتف، والهاتف يرسل الباقي تلقائياً من الشريحة." : "Write on the site, confirm once on the phone, then the phone sends automatically from the SIM.",
      meta: isAr ? `${contacts.phone_marketable} رقم متاح` : `${contacts.phone_marketable} eligible numbers`,
    },
    canViewContacts && {
      key: "history",
      icon: "history",
      title: isAr ? "سجل الرسائل الجماعية" : "Broadcast history",
      description: isAr ? "راجع عمليات الإرسال والنجاح والفشل لكل حملة." : "Review recipients, successes and failures for each broadcast.",
      meta: isAr ? `${contacts.broadcasts?.length || 0} عملية` : `${contacts.broadcasts?.length || 0} broadcasts`,
    },
    canManage && {
      key: "promo",
      icon: "promo",
      title: isAr ? "العروض وكود الحسم" : "Offers & promo code",
      description: isAr ? "إدارة كود الحسم العام ونسبة الخصم وشروط تطبيقه." : "Manage the public promo code, discount and eligibility.",
      meta: form.active ? (isAr ? "مفعّل حالياً" : "Currently enabled") : (isAr ? "متوقف حالياً" : "Currently disabled"),
    },
    {
      key: "polls",
      icon: "polls",
      title: isAr ? "نتائج الاستفتاءات" : "Poll results",
      description: isAr ? "عرض اهتمام الزبائن بالأقسام والنتائج المسجلة." : "View recorded customer interest and poll results.",
      meta: isAr ? `${pollRows.length} قسم` : `${pollRows.length} sections`,
    },
  ].filter(Boolean);

  const backToHub = () => {
    setMessage("");
    setActiveSection("hub");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openSection = (key) => {
    setMessage("");
    setActiveSection(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-[75vh] bg-milk px-4 py-8 sm:px-6 sm:py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        {activeSection === "hub" ? (
          <>
            <section className="overflow-hidden rounded-[32px] border border-espresso/10 bg-oat/15 px-5 py-7 sm:px-8 sm:py-9">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="omb-eyebrow-label text-aubergine/60">OH MY BABY — MARKETING</p>
                  <h1 className="mt-2 text-3xl font-black text-espresso sm:text-4xl">{isAr ? "التسويق والرسائل الجماعية" : "Marketing & broadcasts"}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-espresso/55">
                    {isAr
                      ? "كل وظيفة بمربع مستقل مثل لوحة الـOwner. افتح القسم الذي تحتاجه فقط، وما يظهر للحساب يتحدد من الصلاحيات التي أعطاها الـOwner."
                      : "Each feature has its own module like the Owner dashboard. Open only what you need; visible modules follow Owner-granted permissions."}
                  </p>
                </div>
                <a href="/owner" className="omb-btn omb-btn-secondary">{isAr ? "العودة للوحة Owner" : "Back to Owner dashboard"}</a>
              </div>
            </section>

            <section className="mt-9">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.16em] text-aubergine/50">MARKETING WORKSPACE</p>
                <h2 className="mt-1 text-2xl font-black text-espresso">{isAr ? "الأقسام" : "Modules"}</h2>
                <p className="mt-2 text-sm text-espresso/50">{isAr ? "اختار القسم المطلوب، وبعدها بتظهر تفاصيله لحاله بدون زحمة بالواجهة." : "Choose a module to open its details without crowding the page."}</p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {hubCards.map((card) => (
                  <HubCard key={card.key} {...card} onClick={() => openSection(card.key)} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {message && <div className="mb-5 rounded-2xl border border-aubergine/20 bg-aubergine/[.05] p-4 text-sm font-black text-aubergine">{message}</div>}

            {activeSection === "contacts" && canViewContacts && (
              <section>
                <DetailHeader
                  isAr={isAr}
                  onBack={backToHub}
                  title={isAr ? "إيميلات وأرقام الزبائن" : "Customer contacts"}
                  description={isAr ? "كل الإيميلات (من حسابات الزبائن) وكل الأرقام (من الطلبات، حتى لو ضيف)." : "All emails from accounts and all phone numbers from orders, guests included."}
                />
                <div className="mt-7 grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border border-espresso/10 bg-milk p-6">
                    <div className="flex items-center justify-between gap-3"><h3 className="text-xl font-black">{isAr ? "إيميلات الزبائن" : "Customer emails"}</h3><strong className="text-2xl text-aubergine">{contacts.email_total}</strong></div>
                    <p className="mt-2 text-xs text-espresso/50">{isAr ? `المسموح مراسلتهم تسويقيًا: ${contacts.email_marketable}` : `Marketing opt-in: ${contacts.email_marketable}`}</p>
                    <div className="mt-4 max-h-[420px] overflow-auto border-t border-espresso/10">{(contacts.emails || []).map((row) => <div key={row.value} className="flex items-center justify-between gap-3 border-b border-espresso/10 py-2 text-sm"><span className="min-w-0 break-all">{row.value}</span><span className="shrink-0 text-xs text-espresso/45">{row.marketing_opt_in ? (isAr ? "جاهز" : "ready") : (isAr ? "جاهز" : "ready")}</span></div>)}</div>
                  </div>
                  <div className="rounded-2xl border border-espresso/10 bg-milk p-6">
                    <div className="flex items-center justify-between gap-3"><h3 className="text-xl font-black">{isAr ? "أرقام الزبائن" : "Customer phones"}</h3><strong className="text-2xl text-aubergine">{contacts.phone_total}</strong></div>
                    <p className="mt-2 text-xs text-espresso/50">{isAr ? `المسموح مراسلتهم تسويقيًا: ${contacts.phone_marketable}` : `Marketing opt-in: ${contacts.phone_marketable}`}</p>
                    <div className="mt-4 max-h-[420px] overflow-auto border-t border-espresso/10">{(contacts.phones || []).map((row) => <div key={row.value} className="flex items-center justify-between gap-3 border-b border-espresso/10 py-2 text-sm"><span>{row.value}</span><span className="shrink-0 text-xs text-espresso/45">{row.marketing_opt_in ? (isAr ? "جاهز" : "ready") : (isAr ? "جاهز" : "ready")}</span></div>)}</div>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "email" && canSendEmail && (
              <section>
                <DetailHeader
                  isAr={isAr}
                  onBack={backToHub}
                  title={isAr ? "إرسال بريد جماعي" : "Bulk email"}
                  description={isAr ? `الإرسال سيكون للحسابات المسموح مراسلتها تسويقيًا. المتاح حالياً: ${contacts.email_marketable}.` : `Messages are sent only to opted-in accounts. Currently eligible: ${contacts.email_marketable}.`}
                />
                <form onSubmit={sendEmail} className="mt-7 max-w-3xl rounded-2xl border border-espresso/10 bg-oat/20 p-5 sm:p-6">
                  <label className="text-xs font-black text-espresso/70">{isAr ? "عنوان الرسالة" : "Subject"}
                    <input required value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} placeholder={isAr ? "عنوان الرسالة" : "Subject"} className="mt-2 h-12 w-full rounded-xl border border-espresso/12 bg-milk px-4 outline-none focus:border-aubergine" />
                  </label>
                  <label className="mt-4 block text-xs font-black text-espresso/70">{isAr ? "نص الرسالة" : "Message"}
                    <textarea required value={emailForm.message} onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })} placeholder={isAr ? "اكتب الرسالة..." : "Write message..."} className="mt-2 min-h-56 w-full rounded-xl border border-espresso/12 bg-milk p-4 outline-none focus:border-aubergine" />
                  </label>
                  <button disabled={busy === "email"} className="omb-btn omb-btn-primary mt-4 w-full sm:w-auto">{busy === "email" ? (isAr ? "جارٍ الإرسال..." : "Sending...") : (isAr ? "إرسال للبريد" : "Send email")}</button>
                </form>
              </section>
            )}

            {activeSection === "sms" && (canSendSms || canManageSmsGateway) && (
              <section>
                <DetailHeader
                  isAr={isAr}
                  onBack={backToHub}
                  title={isAr ? "SMS جماعي عبر هاتف Android" : "Bulk SMS through Android"}
                  description={isAr ? "الموقع يجهز الحملة فقط. على الهاتف تضغط تأكيد وإرسال مرة واحدة، وبعدها التطبيق يرسل للأرقام تلقائياً من شريحة SIM." : "The site prepares the campaign. On the phone, confirm once and the app sends the numbers automatically from the SIM."}
                />

                <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
                  {canSendSms && (
                    <form onSubmit={createSmsCampaign} className="rounded-2xl border border-espresso/10 bg-oat/20 p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-black text-espresso">{isAr ? "رسالة SMS" : "SMS message"}</h3>
                        <span className="rounded-full border border-espresso/10 bg-milk px-3 py-1 text-xs font-black text-espresso/55">{isAr ? `${contacts.phone_marketable} مستلم` : `${contacts.phone_marketable} recipients`}</span>
                      </div>
                      <textarea required maxLength={1200} value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} placeholder={isAr ? "اكتب الرسالة هنا..." : "Write the message..."} className="mt-4 min-h-56 w-full rounded-xl border border-espresso/12 bg-milk p-4 outline-none focus:border-aubergine" />
                      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-espresso/50"><span>{isAr ? "سيطلب الهاتف تأكيداً واحداً فقط لكل حملة." : "The phone asks for one confirmation per campaign."}</span><span>{smsMessage.length}/1200</span></div>
                      <button disabled={busy === "sms" || contacts.phone_marketable < 1} className="omb-btn omb-btn-primary mt-4 w-full sm:w-auto">{busy === "sms" ? (isAr ? "جارٍ التجهيز..." : "Preparing...") : (isAr ? "تجهيز الحملة" : "Prepare campaign")}</button>
                    </form>
                  )}

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-espresso/10 bg-milk p-5">
                      <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-espresso">{isAr ? "هاتف الإرسال" : "Sending phone"}</h3><p className="mt-1 text-xs leading-5 text-espresso/50">{isAr ? "Android + شريحة SIM. لا يوجد اشتراك API؛ تكلفة الرسائل فقط من شركة الاتصالات." : "Android + SIM. No messaging API subscription; carrier SMS cost only."}</p></div><span className={`mt-1 h-3 w-3 rounded-full ${smsGateway.devices?.[0]?.last_seen_at ? "bg-emerald-500" : "bg-espresso/20"}`} /></div>
                      {smsGateway.devices?.[0] ? <div className="mt-4 rounded-xl bg-oat/25 p-3 text-sm"><b>{smsGateway.devices[0].name}</b><p className="mt-1 text-xs text-espresso/50">{isAr ? `آخر اتصال: ${smsGateway.devices[0].last_seen_at || "—"}` : `Last seen: ${smsGateway.devices[0].last_seen_at || "—"}`}</p></div> : <p className="mt-4 text-sm font-bold text-espresso/50">{isAr ? "لا يوجد هاتف مربوط بعد." : "No phone paired yet."}</p>}
                      {canManageSmsGateway && <button type="button" onClick={createPairingCode} disabled={busy === "pair"} className="omb-btn omb-btn-secondary mt-4 w-full">{busy === "pair" ? (isAr ? "جارٍ إنشاء الرمز..." : "Creating...") : (isAr ? "إنشاء رمز ربط للهاتف" : "Create phone pairing code")}</button>}
                      {pairing?.code && <div className="mt-4 rounded-2xl border border-aubergine/15 bg-aubergine/[.045] p-4 text-center"><p className="text-xs font-black text-espresso/50">{isAr ? "اكتب هذا الرمز في تطبيق الهاتف" : "Enter this code in the phone app"}</p><strong className="mt-2 block text-4xl tracking-[.25em] text-aubergine" dir="ltr">{pairing.code}</strong><p className="mt-2 text-xs text-espresso/45">{isAr ? "صالح لمدة 10 دقائق ولمرة واحدة" : "Valid for 10 minutes and one use"}</p></div>}
                    </div>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-espresso/10 bg-milk p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3"><h3 className="font-black text-espresso">{isAr ? "آخر حملات SMS" : "Recent SMS campaigns"}</h3><button type="button" onClick={loadSmsGateway} className="text-xs font-black text-aubergine">{isAr ? "تحديث" : "Refresh"}</button></div>
                  <div className="mt-4 overflow-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b border-espresso/10"><th className="p-2 text-start">#</th><th className="p-2 text-start">{isAr ? "الحالة" : "Status"}</th><th className="p-2 text-start">{isAr ? "المستلمين" : "Recipients"}</th><th className="p-2 text-start">{isAr ? "تم" : "Sent"}</th><th className="p-2 text-start">{isAr ? "فشل" : "Failed"}</th><th className="p-2 text-start">{isAr ? "التاريخ" : "Date"}</th></tr></thead><tbody>{(smsGateway.campaigns || []).map((row) => <tr key={row.id} className="border-b border-espresso/10"><td className="p-2 font-black">{row.id}</td><td className="p-2">{row.status}</td><td className="p-2">{row.recipients_count}</td><td className="p-2">{row.sent_count}</td><td className="p-2">{row.failed_count}</td><td className="p-2 text-xs">{row.created_at}</td></tr>)}</tbody></table></div>
                  {(smsGateway.campaigns || []).length === 0 && <p className="py-8 text-center text-sm font-black text-espresso/40">{isAr ? "لا توجد حملات SMS حتى الآن." : "No SMS campaigns yet."}</p>}
                </div>
              </section>
            )}

            {activeSection === "history" && canViewContacts && (
              <section>
                <DetailHeader
                  isAr={isAr}
                  onBack={backToHub}
                  title={isAr ? "سجل الرسائل الجماعية" : "Broadcast history"}
                  description={isAr ? "كل عملية إرسال مع عدد المستلمين والرسائل الناجحة والفاشلة." : "Every broadcast with recipient, success and failure counts."}
                />
                <div className="mt-7 overflow-hidden rounded-2xl border border-espresso/10 bg-milk p-4 sm:p-6">
                  <div className="overflow-auto"><table className="w-full min-w-[650px] text-sm"><thead><tr className="border-b border-espresso/10 text-start"><th className="p-2">{isAr ? "النوع" : "Channel"}</th><th className="p-2">{isAr ? "المستلمين" : "Recipients"}</th><th className="p-2">{isAr ? "نجح" : "Success"}</th><th className="p-2">{isAr ? "فشل" : "Failed"}</th><th className="p-2">{isAr ? "التاريخ" : "Date"}</th></tr></thead><tbody>{(contacts.broadcasts || []).map((row) => <tr key={row.id} className="border-b border-espresso/10"><td className="p-2 font-black">{row.channel}</td><td className="p-2">{row.recipients_count}</td><td className="p-2">{row.success_count}</td><td className="p-2">{row.failed_count}</td><td className="p-2 text-xs">{row.created_at}</td></tr>)}</tbody></table></div>
                  {(contacts.broadcasts || []).length === 0 && <p className="py-8 text-center text-sm font-black text-espresso/40">{isAr ? "لا توجد عمليات إرسال حتى الآن." : "No broadcasts yet."}</p>}
                </div>
              </section>
            )}

            {activeSection === "promo" && canManage && (
              <section>
                <DetailHeader
                  isAr={isAr}
                  onBack={backToHub}
                  title={isAr ? "العروض وكود الحسم" : "Offers & promo code"}
                  description={isAr ? "إدارة الكود العام ونسبة الحسم وحالة التفعيل." : "Manage the public code, discount percentage and availability."}
                />
                <form onSubmit={savePromo} className="mt-7 max-w-3xl rounded-2xl border border-espresso/10 bg-oat/20 p-5 sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-black text-espresso/70">{isAr ? "كود الحسم" : "Promo code"}<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="mt-2 h-12 w-full rounded-xl border border-espresso/12 bg-milk px-4 font-black uppercase outline-none focus:border-aubergine" /></label>
                    <label className="text-xs font-black text-espresso/70">{isAr ? "نسبة الحسم %" : "Discount %"}<input type="number" min="0.01" max="100" step="0.01" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} className="mt-2 h-12 w-full rounded-xl border border-espresso/12 bg-milk px-4 outline-none focus:border-aubergine" /></label>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setForm({ ...form, active: !form.active })} className="rounded-xl border border-espresso/12 p-3 font-black transition hover:border-aubergine/25">{form.active ? (isAr ? "مفعّل" : "Enabled") : (isAr ? "متوقف" : "Disabled")}</button><button type="button" onClick={() => setForm({ ...form, first_order_only: !form.first_order_only })} className="rounded-xl border border-espresso/12 p-3 font-black transition hover:border-aubergine/25">{form.first_order_only ? (isAr ? "أول طلب فقط" : "First order only") : (isAr ? "كل الطلبات" : "All orders")}</button></div>
                  <button className="omb-btn omb-btn-primary mt-4">{isAr ? "حفظ الكود" : "Save promo"}</button>
                </form>
              </section>
            )}

            {activeSection === "polls" && (
              <section>
                <DetailHeader
                  isAr={isAr}
                  onBack={backToHub}
                  title={isAr ? "نتائج الاستفتاءات" : "Poll results"}
                  description={isAr ? "ملخص تفاعل واهتمام الزبائن بالأقسام المسجلة." : "Summary of recorded customer interest by section."}
                />
                <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{pollRows.map((row) => <div key={row.section} className="rounded-2xl border border-espresso/10 bg-oat/20 p-5"><strong className="text-base font-black text-espresso">{row.section}</strong><p className="mt-3 text-sm text-espresso/65">{isAr ? "مهتم" : "Interested"}: <b>{row.interested}</b></p><p className="mt-1 text-sm text-espresso/65">{isAr ? "مهتم جدًا" : "Very interested"}: <b>{row.very_interested}</b></p></div>)}</div>
                {pollRows.length === 0 && <p className="mt-7 rounded-2xl border border-espresso/10 bg-oat/20 p-8 text-center text-sm font-black text-espresso/40">{isAr ? "لا توجد نتائج استفتاءات حتى الآن." : "No poll results yet."}</p>}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
