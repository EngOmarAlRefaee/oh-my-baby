import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "../lib/api";
import { armSupportNotificationSound, playSupportNotificationSound } from "../lib/supportNotifications";

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

function replySenderLabel(replyTo, isAr) {
  if (replyTo?.sender_type === "staff") {
    return replyTo.sender_name || (isAr ? "فريق OH MY BABY" : "OH MY BABY team");
  }
  return isAr ? "أنت" : "You";
}

function Message({ message, isAr, onReply }) {
  const fromStaff = message.sender_type === "staff";
  const receipt = !fromStaff ? (message.read_at ? "✓✓" : "✓") : "";

  return (
    <div className={`flex ${fromStaff ? "justify-start" : "justify-end"}`}>
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

        {message.reply_to && (
          <div className={`mb-2 rounded-xl border-s-2 px-3 py-2 ${
            fromStaff ? "border-aubergine/35 bg-milk/60" : "border-milk/35 bg-milk/10"
          }`}>
            <p className={`text-[10px] font-black ${fromStaff ? "text-aubergine/70" : "text-milk/70"}`}>
              ↩ {replySenderLabel(message.reply_to, isAr)}
            </p>
            <p className={`line-clamp-2 text-xs ${fromStaff ? "text-espresso/55" : "text-milk/70"}`}>
              {message.reply_to.body}
            </p>
          </div>
        )}

        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <div className={`mt-1 flex items-center justify-between gap-3 text-[10px] ${fromStaff ? "text-espresso/35" : "text-milk/55"}`}>
          <span>
            {message.created_at ? new Date(message.created_at).toLocaleString(isAr ? "ar-SY" : "en-US") : ""}
            {receipt ? ` · ${receipt}` : ""}
          </span>
          {onReply && (
            <button type="button" onClick={() => onReply(message)} className="font-black underline underline-offset-2">
              ↩ {isAr ? "رد" : "Reply"}
            </button>
          )}
        </div>
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
  const [form, setForm] = useState({ guest_name: "", message: "" });
  const [reply, setReply] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const previousUnreadRef = useRef(null);
  const latestActiveMessageIdRef = useRef(null);

  const customer = session.user?.role === "customer" ? session.user : null;
  const unread = useMemo(
    () => customer
      ? conversations.reduce((sum, item) => sum + Number(item.unread || 0), 0)
      : Number(active?.unread || 0),
    [conversations, active, customer?.id]
  );

  useEffect(() => {
    armSupportNotificationSound();

    const loadSession = () => {
      apiFetch("/auth/session")
        .then((data) => setSession({ loading: false, user: data.user || null }))
        .catch(() => setSession({ loading: false, user: null }));
    };

    loadSession();
    window.addEventListener("omb:auth-updated", loadSession);
    return () => window.removeEventListener("omb:auth-updated", loadSession);
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
        setActive(null);
        setReplyTo(null);
        setNewMode(true);
      }
    };

    window.addEventListener("omb:support-open", onOpen);
    return () => window.removeEventListener("omb:support-open", onOpen);
  }, []);

  async function claimGuestThread() {
    if (!customer) return false;
    const saved = readGuestThread();
    if (!saved) return false;

    try {
      const data = await apiFetch(`/api/support/conversations/${saved.id}/claim`, {
        method: "POST",
        body: JSON.stringify({ token: saved.token }),
      });

      saveGuestThread(null);
      const conversation = data.conversation || null;
      if (conversation) {
        const messages = conversation.messages || [];
        latestActiveMessageIdRef.current = messages[messages.length - 1]?.id ?? null;
        previousUnreadRef.current = Number(conversation.unread || 0);
        setActive(conversation);
        setNewMode(false);
        setReplyTo(null);
      }
      return true;
    } catch (e) {
      // A forbidden/not-found token is no longer claimable. Other failures can retry later.
      if (e.status === 403 || e.status === 404) {
        saveGuestThread(null);
        setActive(null);
      }
      return false;
    }
  }

  async function loadMine({ notify = false } = {}) {
    if (!customer) return;

    try {
      const data = await apiFetch("/api/support/mine");
      const list = data.conversations || [];
      const nextUnread = list.reduce((sum, item) => sum + Number(item.unread || 0), 0);
      const previous = previousUnreadRef.current;

      setConversations(list);
      previousUnreadRef.current = nextUnread;

      if (notify && !open && previous !== null && nextUnread > previous) {
        playSupportNotificationSound();
      }
    } catch (e) {
      if (e.status !== 401 && e.status !== 403 && open) setError(e.message);
    }
  }

  async function loadGuestThread({ peek = false, notify = false } = {}) {
    if (customer) return;
    const saved = readGuestThread();
    if (!saved) return;

    try {
      const suffix = `token=${encodeURIComponent(saved.token)}${peek ? "&peek=1" : ""}`;
      const data = await apiFetch(`/api/support/conversations/${saved.id}?${suffix}`);
      const nextUnread = Number(data.conversation?.unread || 0);
      const previous = previousUnreadRef.current;

      setActive(data.conversation);
      previousUnreadRef.current = nextUnread;

      if (notify && previous !== null && nextUnread > previous) {
        playSupportNotificationSound();
      }
    } catch {
      saveGuestThread(null);
      setActive(null);
      previousUnreadRef.current = null;
    }
  }

  async function refreshActive({ notify = false } = {}) {
    if (!active?.id) return;

    try {
      const data = customer
        ? await apiFetch(`/api/support/conversations/${active.id}`)
        : await apiFetch(`/api/support/conversations/${active.id}?token=${encodeURIComponent(active.token)}`);

      const conversation = data.conversation;
      const messages = conversation?.messages || [];
      const latest = messages[messages.length - 1] || null;
      const previousId = latestActiveMessageIdRef.current;

      if (notify && latest?.sender_type === "staff" && previousId !== null && Number(latest.id) > Number(previousId)) {
        playSupportNotificationSound();
      }

      latestActiveMessageIdRef.current = latest?.id ?? previousId;
      previousUnreadRef.current = Number(conversation?.unread || 0);
      setActive(conversation);
      if (customer) loadMine();
    } catch {}
  }

  useEffect(() => {
    if (session.loading) return undefined;

    if (customer) {
      let cancelled = false;
      (async () => {
        await claimGuestThread();
        if (!cancelled) await loadMine();
      })();

      const timer = window.setInterval(() => loadMine({ notify: true }), 8000);
      return () => {
        cancelled = true;
        window.clearInterval(timer);
      };
    }

    loadGuestThread({ peek: !open });
    const timer = window.setInterval(() => {
      if (!open) loadGuestThread({ peek: true, notify: true });
    }, 8000);
    return () => window.clearInterval(timer);
  }, [session.loading, customer?.id, open]);

  useEffect(() => {
    if (!open || !active?.id) return undefined;

    refreshActive();
    const timer = window.setInterval(() => refreshActive({ notify: true }), 6000);
    return () => window.clearInterval(timer);
  }, [open, active?.id, customer?.id]);

  async function openConversation(item) {
    setBusy(true);
    setError("");
    try {
      const data = customer
        ? await apiFetch(`/api/support/conversations/${item.id}`)
        : await apiFetch(`/api/support/conversations/${item.id}?token=${encodeURIComponent(item.token)}`);
      const conversation = data.conversation;
      const messages = conversation?.messages || [];

      latestActiveMessageIdRef.current = messages[messages.length - 1]?.id ?? null;
      previousUnreadRef.current = Number(conversation?.unread || 0);
      setActive(conversation);
      setReplyTo(null);
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
    if (!form.message.trim()) return;

    setBusy(true);
    setError("");

    try {
      const payload = {
        message: form.message.trim(),
        order_id: customer ? orderContext?.orderId || null : null,
        guest_name: customer ? null : form.guest_name.trim(),
      };

      const data = await apiFetch("/api/support/conversations", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const conversation = data.conversation;
      const messages = conversation?.messages || [];
      latestActiveMessageIdRef.current = messages[messages.length - 1]?.id ?? null;
      previousUnreadRef.current = Number(conversation?.unread || 0);
      setActive(conversation);
      setReplyTo(null);
      setNewMode(false);
      setOrderContext(null);
      setForm((current) => ({ ...current, message: "" }));

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
          reply_to_message_id: replyTo?.id || null,
          token: customer ? undefined : active.token,
        }),
      };

      if (!customer && active.token) {
        options.headers = { "X-Support-Token": active.token };
      }

      const data = await apiFetch(`/api/support/conversations/${active.id}/messages`, options);
      const conversation = data.conversation;
      const messages = conversation?.messages || [];
      latestActiveMessageIdRef.current = messages[messages.length - 1]?.id ?? latestActiveMessageIdRef.current;
      setActive(conversation);
      setReply("");
      setReplyTo(null);
      if (customer) await loadMine();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!open || !active?.messages?.length) return undefined;

    const frame = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, active?.id, active?.messages?.length]);

  function startNew() {
    setActive(null);
    setReplyTo(null);
    setNewMode(true);
    setError("");
    setOrderContext(null);
  }

  if (typeof document === "undefined") return null;
  if (!session.loading && session.user && session.user.role !== "customer") return null;

  return createPortal(
    <div
      id="omb-support-floating-root"
      dir="ltr"
      style={{ position: "fixed", inset: 0, zIndex: 2147483000, pointerEvents: "none" }}
    >
      <button
        id="omb-support-launcher"
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 items-center gap-2 rounded-full border border-aubergine/20 bg-espresso px-5 text-sm font-black text-milk shadow-2xl"
        style={{
          position: "fixed",
          left: "max(16px, env(safe-area-inset-left))",
          right: "auto",
          bottom: "max(16px, env(safe-area-inset-bottom))",
          pointerEvents: "auto",
          zIndex: 2147483001,
        }}
        aria-label={isAr ? "محادثة الدعم" : "Support chat"}
      >
        <span className="text-lg" aria-hidden="true">✦</span>
        <span>{isAr ? "تواصل معنا" : "Contact us"}</span>
        {unread > 0 && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-milk px-1.5 py-0.5 text-[10px] text-espresso">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <section
          id="omb-support-panel"
          className="flex max-h-[72vh] w-[calc(100vw-2.5rem)] max-w-[420px] flex-col overflow-hidden rounded-[24px] border border-espresso/15 bg-milk shadow-2xl"
          dir={isAr ? "rtl" : "ltr"}
          style={{
            position: "fixed",
            left: "max(16px, env(safe-area-inset-left))",
            right: "auto",
            bottom: "calc(max(16px, env(safe-area-inset-bottom)) + 72px)",
            pointerEvents: "auto",
            zIndex: 2147483001,
          }}
        >
          <header className="flex items-center justify-between gap-3 border-b border-espresso/10 bg-oat/30 px-5 py-4">
            <div>
              <p className="text-[10px] font-black tracking-[.16em] text-aubergine/55">OH MY BABY SUPPORT</p>
              <h2 className="mt-1 text-lg font-black text-espresso">{isAr ? "المحادثات" : "Messages"}</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="h-9 w-9 rounded-full border border-espresso/10 text-lg font-black">×</button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {error && <p className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}

            {!active && !newMode && customer && (
              <>
                <button type="button" onClick={startNew} className="omb-btn omb-btn-primary w-full">
                  {isAr ? "محادثة جديدة" : "New conversation"}
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
                          {item.order?.reference || (isAr ? "محادثة دعم" : "Support conversation")}
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
                  {isAr ? "اكتب اسمك ورسالتك فقط، ومنرد عليك هون." : "Enter your name and message. We will reply here."}
                </p>
                <input required value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder={isAr ? "الاسم" : "Name"} className="h-11 rounded-xl border border-espresso/12 bg-oat/10 px-4 outline-none" />
                <textarea required rows="5" maxLength={3000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={isAr ? "اكتب رسالتك..." : "Write your message..."} className="rounded-xl border border-espresso/12 bg-oat/10 p-4 outline-none" />
                <button disabled={busy || !form.guest_name.trim() || !form.message.trim()} className="omb-btn omb-btn-primary w-full disabled:opacity-40">
                  {busy ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال" : "Send")}
                </button>
              </form>
            )}

            {!active && newMode && (
              <form onSubmit={createConversation} className="grid gap-4">
                {customer && (
                  <button type="button" onClick={() => { setNewMode(false); setOrderContext(null); }} className="w-fit text-xs font-black text-aubergine underline">
                    {isAr ? "رجوع للمحادثات" : "Back to conversations"}
                  </button>
                )}

                {orderContext?.reference && (
                  <div className="rounded-xl border border-aubergine/15 bg-aubergine/5 p-3 text-xs font-bold">
                    {isAr ? `مرتبطة بالطلب ${orderContext.reference}` : `Linked to order ${orderContext.reference}`}
                  </div>
                )}

                {!customer && (
                  <input required value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder={isAr ? "الاسم" : "Name"} className="h-11 rounded-xl border border-espresso/12 bg-oat/10 px-4 outline-none" />
                )}

                <textarea required rows="5" maxLength={3000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={isAr ? "اكتب رسالتك..." : "Write your message..."} className="rounded-xl border border-espresso/12 bg-oat/10 p-4 outline-none" />

                <button disabled={busy || !form.message.trim() || (!customer && !form.guest_name.trim())} className="omb-btn omb-btn-primary w-full disabled:opacity-40">
                  {busy ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال" : "Send")}
                </button>
              </form>
            )}

            {active && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-espresso/10 pb-4">
                  <div>
                    <strong className="text-sm text-espresso">
                      {active.order?.reference || (isAr ? "محادثة دعم" : "Support conversation")}
                    </strong>
                    {active.order?.reference && <p className="mt-1 text-[10px] text-espresso/45">{active.order.reference}</p>}
                  </div>
                  <span className="rounded-full border border-aubergine/15 bg-aubergine/5 px-3 py-1 text-[10px] font-black text-aubergine">
                    {statusLabel(active.status, isAr)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {(active.messages || []).map((message) => (
                    <Message key={message.id} message={message} isAr={isAr} onReply={setReplyTo} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendReply} className="mt-5 border-t border-espresso/10 pt-4">
                  {active.status === "closed" && (
                    <p className="mb-3 rounded-xl border border-espresso/10 bg-oat/20 p-3 text-xs font-semibold leading-5 text-espresso/55">
                      {isAr ? "إرسال رسالة جديدة يعيد فتح المحادثة تلقائياً." : "Sending a new message reopens the conversation automatically."}
                    </p>
                  )}
                  {replyTo && (
                    <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-aubergine/15 bg-aubergine/5 p-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-aubergine/70">
                          ↩ {isAr ? "الرد على" : "Replying to"} {replySenderLabel(replyTo, isAr)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-espresso/55">{replyTo.body}</p>
                      </div>
                      <button type="button" onClick={() => setReplyTo(null)} className="h-7 w-7 shrink-0 rounded-full border border-espresso/10 text-sm font-black">×</button>
                    </div>
                  )}
                  <textarea rows="3" maxLength={3000} required value={reply} onChange={(e) => setReply(e.target.value)} placeholder={isAr ? "اكتب رسالتك..." : "Write a message..."} className="w-full rounded-xl border border-espresso/12 bg-oat/10 p-3 text-sm outline-none" />
                  <button disabled={busy || !reply.trim()} className="omb-btn omb-btn-primary mt-3 w-full disabled:opacity-40">
                    {isAr ? "إرسال" : "Send"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setActive(null);
                    setReplyTo(null);
                    latestActiveMessageIdRef.current = null;
                    if (!customer) {
                      saveGuestThread(null);
                      previousUnreadRef.current = null;
                      setNewMode(false);
                    }
                  }}
                  className="mt-4 text-xs font-black text-aubergine underline"
                >
                  {customer ? (isAr ? "كل المحادثات" : "All conversations") : (isAr ? "محادثة جديدة" : "New conversation")}
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>,
    document.body
  );
}
