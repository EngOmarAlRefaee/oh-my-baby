import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

const GUEST_KEY = "omb:support-guest";

function readGuestThread() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GUEST_KEY) || "null");
    return parsed?.id && parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

function saveGuestThread(value) {
  try {
    if (value) window.localStorage.setItem(GUEST_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(GUEST_KEY);
  } catch {}
}

function statusLabel(status, isAr) {
  if (status === "waiting_customer") return isAr ? "بانتظار ردك" : "Waiting for you";
  if (status === "closed") return isAr ? "مغلقة" : "Closed";
  return isAr ? "قيد المتابعة" : "Open";
}

function Message({ message, isAr }) {
  const fromStaff = message.sender_type === "staff";

  return (
    <div className={`flex ${fromStaff ? (isAr ? "justify-start" : "justify-start") : "justify-end"}`}>
      <div className={`max-w-[86%] rounded-2xl border px-4 py-3 text-sm leading-6 ${
        fromStaff
          ? "border-aubergine/15 bg-aubergine/5 text-espresso"
          : "border-espresso/10 bg-espresso text-milk"
      }`}>
        {fromStaff && (
          <p className="mb-1 text-[10px] font-black tracking-[.1em] text-aubergine/60">
            {message.sender_name || (isAr ? "فريق OH MY BABY" : "OH MY BABY team")}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p className={`mt-1 text-[10px] ${fromStaff ? "text-espresso/35" : "text-milk/55"}`}>
          {message.created_at ? new Date(message.created_at).toLocaleString(isAr ? "ar-SY" : "en-US") : ""}
        </p>
      </div>
    </div>
  );
}

export default function SupportChatLauncher({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState({ loading: true, user: null });
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [newMode, setNewMode] = useState(false);
  const [orderContext, setOrderContext] = useState(null);
  const [form, setForm] = useState({
    guest_name: "",
    guest_phone: "",
    subject: "",
    message: "",
    order_reference: "",
  });
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const customer = session.user?.role === "customer" ? session.user : null;
  const unread = useMemo(
    () => customer
      ? conversations.reduce((sum, item) => sum + Number(item.unread || 0), 0)
      : Number(active?.unread || 0),
    [conversations, active, customer?.id]
  );

  useEffect(() => {
    apiFetch("/auth/session")
      .then((data) => setSession({ loading: false, user: data.user || null }))
      .catch(() => setSession({ loading: false, user: null }));
  }, []);

  useEffect(() => {
    const onOpen = (event) => {
      const detail = event?.detail || {};
      setOpen(true);
      setError("");
      if (detail.orderId || detail.reference) {
        setOrderContext({
          orderId: detail.orderId || null,
          reference: detail.reference || null,
        });
        setNewMode(true);
      }
    };

    window.addEventListener("omb:support-open", onOpen);
    return () => window.removeEventListener("omb:support-open", onOpen);
  }, []);

  async function loadMine() {
    if (!customer) return;

    try {
      const data = await apiFetch("/api/support/mine");
      setConversations(data.conversations || []);
    } catch (e) {
      if (e.status !== 401 && e.status !== 403) setError(e.message);
    }
  }

  async function loadGuestThread() {
    if (customer) return;
    const saved = readGuestThread();
    if (!saved) return;

    try {
      const data = await apiFetch(`/api/support/conversations/${saved.id}?token=${encodeURIComponent(saved.token)}`);
      setActive(data.conversation);
    } catch {
      saveGuestThread(null);
      setActive(null);
    }
  }

  useEffect(() => {
    if (!open || session.loading) return;
    setError("");

    if (customer) loadMine();
    else loadGuestThread();
  }, [open, session.loading, customer?.id]);

  async function openConversation(item) {
    setBusy(true);
    setError("");
    try {
      const data = customer
        ? await apiFetch(`/api/support/conversations/${item.id}`)
        : await apiFetch(`/api/support/conversations/${item.id}?token=${encodeURIComponent(item.token)}`);
      setActive(data.conversation);
      setNewMode(false);
      if (customer) await loadMine();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function createConversation(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        subject: form.subject.trim() || null,
        message: form.message.trim(),
        order_id: customer ? orderContext?.orderId || null : null,
        order_reference: !customer ? (orderContext?.reference || form.order_reference.trim() || null) : null,
        guest_name: customer ? null : form.guest_name.trim(),
        guest_phone: customer ? null : form.guest_phone.trim(),
      };

      const data = await apiFetch("/api/support/conversations", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const conversation = data.conversation;
      setActive(conversation);
      setNewMode(false);
      setOrderContext(null);
      setForm((current) => ({ ...current, subject: "", message: "", order_reference: "" }));

      if (customer) {
        await loadMine();
      } else {
        saveGuestThread({ id: conversation.id, token: conversation.token });
      }
    } catch (e) {
      setError(e.data?.errors ? Object.values(e.data.errors).flat()[0] : e.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(event) {
    event.preventDefault();
    if (!active || !reply.trim()) return;

    setBusy(true);
    setError("");
    try {
      const options = {
        method: "POST",
        body: JSON.stringify({
          message: reply.trim(),
          token: customer ? undefined : active.token,
        }),
      };

      if (!customer && active.token) {
        options.headers = { "X-Support-Token": active.token };
      }

      const data = await apiFetch(`/api/support/conversations/${active.id}/messages`, options);
      setActive(data.conversation);
      setReply("");
      if (customer) await loadMine();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!open || !active || active.status === "closed") return undefined;

    const timer = window.setInterval(async () => {
      try {
        const data = customer
          ? await apiFetch(`/api/support/conversations/${active.id}`)
          : await apiFetch(`/api/support/conversations/${active.id}?token=${encodeURIComponent(active.token)}`);
        setActive(data.conversation);
        if (customer) loadMine();
      } catch {}
    }, 8000);

    return () => window.clearInterval(timer);
  }, [open, active?.id, active?.status, customer?.id]);

  function startNew() {
    setActive(null);
    setNewMode(true);
    setError("");
    setOrderContext(null);
  }

  const sideClass = "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`fixed bottom-6 z-[90] flex h-14 items-center gap-2 rounded-full border border-aubergine/20 bg-espresso px-5 text-sm font-black text-milk shadow-2xl transition hover:-translate-y-0.5`}
        style={{ left: "24px", right: "auto" }}
        aria-label={isAr ? "محادثة الدعم" : "Support chat"}
      >
        <span className="text-lg" aria-hidden="true">✦</span>
        <span>{isAr ? "تواصل معنا" : "Contact us"}</span>
        {unread > 0 && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-milk px-1.5 py-0.5 text-[10px] text-espresso">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <section
          className={`fixed bottom-24 z-[95] flex max-h-[72vh] w-[calc(100vw-2.5rem)] max-w-[420px] flex-col overflow-hidden rounded-[24px] border border-espresso/15 bg-milk shadow-2xl`}
          style={{ left: "24px", right: "auto" }}
          dir={isAr ? "rtl" : "ltr"}
        >
          <header className="flex items-center justify-between gap-3 border-b border-espresso/10 bg-oat/30 px-5 py-4">
            <div>
              <p className="text-[10px] font-black tracking-[.16em] text-aubergine/55">OH MY BABY SUPPORT</p>
              <h2 className="mt-1 text-lg font-black text-espresso">{isAr ? "محادثات العملاء" : "Customer support"}</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="h-9 w-9 rounded-full border border-espresso/10 text-lg font-black">×</button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {error && <p className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}

            {!active && !newMode && customer && (
              <>
                <button type="button" onClick={startNew} className="omb-btn omb-btn-primary w-full">
                  {isAr ? "بدء محادثة جديدة" : "Start a new conversation"}
                </button>

                <div className="mt-4 grid gap-2">
                  {conversations.length ? conversations.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openConversation(item)}
                      className="rounded-2xl border border-espresso/10 bg-oat/15 p-4 text-start transition hover:border-aubergine/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-sm text-espresso">
                          {item.subject || item.order?.reference || (isAr ? "محادثة دعم" : "Support conversation")}
                        </strong>
                        {item.unread > 0 && <span className="rounded-full bg-aubergine px-2 py-0.5 text-[10px] font-black text-milk">{item.unread}</span>}
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-espresso/50">{item.last_message?.body || "—"}</p>
                      <p className="mt-2 text-[10px] font-black text-aubergine/60">{statusLabel(item.status, isAr)}</p>
                    </button>
                  )) : (
                    <p className="rounded-2xl border border-espresso/10 p-4 text-sm text-espresso/50">
                      {isAr ? "ما عندك محادثات بعد." : "No conversations yet."}
                    </p>
                  )}
                </div>
              </>
            )}

            {!active && !newMode && !customer && (
              <form onSubmit={createConversation} className="grid gap-4">
                <p className="text-sm font-semibold leading-6 text-espresso/60">
                  {isAr ? "اكتب بيانات بسيطة ورسالتك، ومنرد عليك من داخل الموقع." : "Leave your contact details and message. We will reply here."}
                </p>

                <input required value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder={isAr ? "الاسم" : "Name"} className="h-11 rounded-xl border border-espresso/12 bg-oat/10 px-4 outline-none" />
                <input required type="tel" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} placeholder={isAr ? "رقم الهاتف" : "Phone"} className="h-11 rounded-xl border border-espresso/12 bg-oat/10 px-4 outline-none" />
                <input value={form.order_reference} onChange={(e) => setForm({ ...form, order_reference: e.target.value })} placeholder={isAr ? "رقم الطلب — اختياري" : "Order reference — optional"} className="h-11 rounded-xl border border-espresso/12 bg-oat/10 px-4 outline-none" />
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={isAr ? "عنوان الرسالة — اختياري" : "Subject — optional"} className="h-11 rounded-xl border border-espresso/12 bg-oat/10 px-4 outline-none" />
                <textarea required rows="4" maxLength={3000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={isAr ? "كيف فينا نساعدك؟" : "How can we help?"} className="rounded-xl border border-espresso/12 bg-oat/10 p-4 outline-none" />

                <button disabled={busy} className="omb-btn omb-btn-primary w-full disabled:opacity-40">
                  {busy ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الرسالة" : "Send message")}
                </button>
              </form>
            )}

            {!active && newMode && (
              <form onSubmit={createConversation} className="grid gap-4">
                <button type="button" onClick={() => { setNewMode(false); setOrderContext(null); }} className="w-fit text-xs font-black text-aubergine underline">
                  {isAr ? "رجوع للمحادثات" : "Back to conversations"}
                </button>

                {orderContext?.reference && (
                  <div className="rounded-xl border border-aubergine/15 bg-aubergine/5 p-3 text-xs font-bold">
                    {isAr ? `الاستفسار مرتبط بالطلب ${orderContext.reference}` : `Question about order ${orderContext.reference}`}
                  </div>
                )}

                {!customer && (
                  <>
                    <input required value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder={isAr ? "الاسم" : "Name"} className="h-11 rounded-xl border border-espresso/12 bg-oat/10 px-4 outline-none" />
                    <input required type="tel" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} placeholder={isAr ? "رقم الهاتف" : "Phone"} className="h-11 rounded-xl border border-espresso/12 bg-oat/10 px-4 outline-none" />
                  </>
                )}

                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={isAr ? "عنوان الرسالة — اختياري" : "Subject — optional"} className="h-11 rounded-xl border border-espresso/12 bg-oat/10 px-4 outline-none" />
                <textarea required rows="5" maxLength={3000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={isAr ? "اكتب رسالتك..." : "Write your message..."} className="rounded-xl border border-espresso/12 bg-oat/10 p-4 outline-none" />

                <button disabled={busy} className="omb-btn omb-btn-primary w-full disabled:opacity-40">
                  {busy ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "بدء المحادثة" : "Start conversation")}
                </button>
              </form>
            )}

            {active && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-espresso/10 pb-4">
                  <div>
                    <strong className="text-sm text-espresso">
                      {active.subject || active.order?.reference || (isAr ? "محادثة دعم" : "Support conversation")}
                    </strong>
                    {active.order?.reference && <p className="mt-1 text-[10px] text-espresso/45">{active.order.reference}</p>}
                  </div>
                  <span className="rounded-full border border-aubergine/15 bg-aubergine/5 px-3 py-1 text-[10px] font-black text-aubergine">
                    {statusLabel(active.status, isAr)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {(active.messages || []).map((message) => <Message key={message.id} message={message} isAr={isAr} />)}
                </div>

                {active.status !== "closed" ? (
                  <form onSubmit={sendReply} className="mt-5 border-t border-espresso/10 pt-4">
                    <textarea rows="3" maxLength={3000} required value={reply} onChange={(e) => setReply(e.target.value)} placeholder={isAr ? "اكتب ردك..." : "Write a reply..."} className="w-full rounded-xl border border-espresso/12 bg-oat/10 p-3 text-sm outline-none" />
                    <button disabled={busy || !reply.trim()} className="omb-btn omb-btn-primary mt-3 w-full disabled:opacity-40">
                      {isAr ? "إرسال الرد" : "Send reply"}
                    </button>
                  </form>
                ) : (
                  <div className="mt-5 rounded-xl border border-espresso/10 bg-oat/20 p-4 text-xs font-semibold leading-5 text-espresso/55">
                    {isAr ? "تم إغلاق هذه المحادثة. إذا احتجت مساعدة جديدة، ابدأ محادثة جديدة." : "This conversation is closed. Start a new one if you need more help."}
                  </div>
                )}

                <button type="button" onClick={() => { setActive(null); if (!customer) { saveGuestThread(null); setNewMode(false); } }} className="mt-4 text-xs font-black text-aubergine underline">
                  {customer ? (isAr ? "كل المحادثات" : "All conversations") : (isAr ? "بدء محادثة جديدة" : "Start a new conversation")}
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
