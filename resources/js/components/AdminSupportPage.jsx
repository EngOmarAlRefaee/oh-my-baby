import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { hasPermission } from "../lib/permissions";

function statusLabel(status, isAr) {
  if (status === "waiting_customer") return isAr ? "بانتظار رد الزبون" : "Waiting for customer";
  if (status === "closed") return isAr ? "مغلقة" : "Closed";
  return isAr ? "مفتوحة" : "Open";
}

function replySenderLabel(replyTo, isAr) {
  if (replyTo?.sender_type === "staff") {
    return replyTo.sender_name || (isAr ? "فريق الدعم" : "Support team");
  }
  return isAr ? "الزبون" : "Customer";
}

function Message({ message, isAr, onReply }) {
  const staff = message.sender_type === "staff";
  const receipt = staff ? (message.read_at ? "✓✓" : "✓") : "";

  return (
    <div className={`flex ${staff ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] rounded-2xl border px-4 py-3 text-sm leading-6 ${
        staff
          ? "border-aubergine/20 bg-aubergine/5"
          : "border-espresso/10 bg-oat/20"
      }`}>
        <p className="mb-1 text-[10px] font-black tracking-[.1em] text-aubergine/55">
          {staff
            ? (message.sender_name || (isAr ? "فريق الدعم" : "Support team"))
            : (isAr ? "الزبون" : "Customer")}
        </p>

        {message.reply_to && (
          <div className="mb-2 rounded-xl border-s-2 border-aubergine/30 bg-milk/60 px-3 py-2">
            <p className="text-[10px] font-black text-aubergine/65">
              ↩ {replySenderLabel(message.reply_to, isAr)}
            </p>
            <p className="line-clamp-2 text-xs text-espresso/50">{message.reply_to.body}</p>
          </div>
        )}

        <p className="whitespace-pre-wrap break-words text-espresso">{message.body}</p>
        <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-espresso/35">
          <span>
            {message.created_at ? new Date(message.created_at).toLocaleString(isAr ? "ar-SY" : "en-US") : ""}
            {receipt ? ` · ${receipt}` : ""}
          </span>
          {onReply && (
            <button type="button" onClick={() => onReply(message)} className="font-black text-aubergine underline underline-offset-2">
              ↩ {isAr ? "رد" : "Reply"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSupportPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [session, setSession] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [summary, setSummary] = useState({ unread: 0, open: 0, waiting_customer: 0, closed: 0 });
  const [active, setActive] = useState(null);
  const [filter, setFilter] = useState("all");
  const [assignees, setAssignees] = useState([]);
  const [reply, setReply] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const user = session?.user || null;
  const canReply = hasPermission(user, "support.reply");
  const canAssign = hasPermission(user, "support.assign");
  const canClose = hasPermission(user, "support.close");

  const visibleConversations = useMemo(() => {
    if (filter === "all") return conversations;
    return conversations.filter((item) => item.status === filter);
  }, [conversations, filter]);

  async function loadInbox() {
    try {
      const data = await apiFetch("/api/support/staff");
      setConversations(data.conversations || []);
      setSummary(data.summary || summary);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadActive(id) {
    if (!id) return;
    setBusy("open");
    try {
      const data = await apiFetch(`/api/support/staff/${id}`);
      setActive(data.conversation);
      setConversations((current) => current.map((item) => item.id === id ? { ...item, unread: 0 } : item));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    apiFetch("/auth/session")
      .then(setSession)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    loadInbox();

    if (canAssign) {
      apiFetch("/api/support/staff/assignees")
        .then((data) => setAssignees(data.users || []))
        .catch(() => setAssignees([]));
    }

    const timer = window.setInterval(() => {
      loadInbox();
      if (active?.id) loadActive(active.id);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [user?.id, canAssign, active?.id]);

  useEffect(() => {
    if (!active?.messages?.length) return undefined;

    const frame = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [active?.id, active?.messages?.length]);

  async function sendReply(event) {
    event.preventDefault();
    if (!active || !reply.trim() || !canReply) return;

    setBusy("reply");
    try {
      const data = await apiFetch(`/api/support/staff/${active.id}/messages`, {
        method: "POST",
        body: JSON.stringify({
          message: reply.trim(),
          reply_to_message_id: replyTo?.id || null,
        }),
      });
      setActive(data.conversation);
      setReply("");
      setReplyTo(null);
      await loadInbox();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function assignTo(value) {
    if (!active || !canAssign) return;
    setBusy("assign");
    try {
      const data = await apiFetch(`/api/support/staff/${active.id}/assign`, {
        method: "POST",
        body: JSON.stringify({ assigned_to_user_id: value ? Number(value) : null }),
      });
      setActive(data.conversation);
      await loadInbox();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function toggleClosed() {
    if (!active || !canClose) return;
    const action = active.status === "closed" ? "reopen" : "close";
    setBusy(action);
    try {
      const data = await apiFetch(`/api/support/staff/${active.id}/${action}`, {
        method: "POST",
        body: "{}",
      });
      setActive(data.conversation);
      if (action === "close") setReplyTo(null);
      await loadInbox();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="min-h-[75vh] bg-milk px-4 py-8 sm:px-6 sm:py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-black tracking-[.16em] text-aubergine/55">CUSTOMER SUPPORT</p>
            <h1 className="mt-2 text-3xl font-black text-espresso sm:text-4xl">
              {isAr ? "محادثات العملاء" : "Customer conversations"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-espresso/50">
              {isAr ? "صندوق واحد لمحادثات الزباين والزوار، مع ربط الطلب عند توفره." : "One inbox for customer and guest conversations, with optional order links."}
            </p>
          </div>

          <button type="button" onClick={loadInbox} className="omb-btn omb-btn-secondary">
            {isAr ? "تحديث" : "Refresh"}
          </button>
        </div>

        {error && <p className="mt-5 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["unread", isAr ? "غير مقروء" : "Unread", summary.unread],
            ["open", isAr ? "مفتوح" : "Open", summary.open],
            ["waiting_customer", isAr ? "بانتظار الزبون" : "Waiting customer", summary.waiting_customer],
            ["closed", isAr ? "مغلق" : "Closed", summary.closed],
          ].map(([key, label, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key === "unread" ? "all" : key)}
              className="rounded-2xl border border-espresso/10 bg-oat/20 p-4 text-start transition hover:border-aubergine/30"
            >
              <p className="text-xs font-black text-aubergine/55">{label}</p>
              <strong className="mt-2 block text-2xl text-espresso">{value}</strong>
            </button>
          ))}
        </section>

        <section className="mt-7 grid min-h-[620px] overflow-hidden rounded-[28px] border border-espresso/10 bg-oat/10 lg:grid-cols-[360px_1fr]">
          <aside className="border-b border-espresso/10 bg-milk lg:border-b-0 lg:border-e">
            <div className="flex flex-wrap gap-2 border-b border-espresso/10 p-4">
              {[
                ["all", isAr ? "الكل" : "All"],
                ["open", isAr ? "مفتوح" : "Open"],
                ["waiting_customer", isAr ? "بانتظار الزبون" : "Waiting"],
                ["closed", isAr ? "مغلق" : "Closed"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black ${
                    filter === key ? "bg-espresso text-milk" : "border border-espresso/10 text-espresso/55"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="max-h-[570px] overflow-y-auto p-3">
              {visibleConversations.length ? visibleConversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setReplyTo(null); loadActive(item.id); }}
                  className={`mb-2 w-full rounded-2xl border p-4 text-start transition ${
                    active?.id === item.id
                      ? "border-aubergine/35 bg-aubergine/5"
                      : "border-espresso/10 bg-oat/10 hover:border-aubergine/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="truncate text-sm text-espresso">{item.customer?.name || (isAr ? "زائر" : "Guest")}</strong>
                    {item.unread > 0 && <span className="rounded-full bg-aubergine px-2 py-0.5 text-[10px] font-black text-milk">{item.unread}</span>}
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-aubergine/55">{statusLabel(item.status, isAr)}</p>
                  {item.order?.reference && <p className="mt-1 text-[10px] text-espresso/40">{item.order.reference}</p>}
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-espresso/50">{item.last_message?.body || "—"}</p>
                </button>
              )) : (
                <p className="p-4 text-sm text-espresso/45">{isAr ? "ما في محادثات بهالحالة." : "No conversations in this state."}</p>
              )}
            </div>
          </aside>

          <div className="min-w-0">
            {!active ? (
              <div className="flex h-full min-h-[500px] items-center justify-center p-8 text-center text-espresso/40">
                <div>
                  <div className="text-4xl">✦</div>
                  <p className="mt-3 font-black">{isAr ? "اختر محادثة من القائمة" : "Choose a conversation"}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[620px] flex-col">
                <header className="border-b border-espresso/10 bg-milk p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-espresso">{active.customer?.name || (isAr ? "زائر" : "Guest")}</h2>
                      <div className="mt-2 grid gap-1 text-xs text-espresso/50">
                        {active.customer?.phone && <p>{isAr ? "الهاتف: " : "Phone: "}{active.customer.phone}</p>}
                        {active.customer?.email && <p>{isAr ? "البريد: " : "Email: "}{active.customer.email}</p>}
                        {active.order?.reference && <p>{isAr ? "الطلب: " : "Order: "}{active.order.reference}</p>}
                      </div>
                    </div>
                    <span className="rounded-full border border-aubergine/15 bg-aubergine/5 px-3 py-1.5 text-xs font-black text-aubergine">
                      {statusLabel(active.status, isAr)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {canAssign && (
                      <select
                        value={active.assigned_to?.id || ""}
                        onChange={(e) => assignTo(e.target.value)}
                        disabled={busy === "assign"}
                        className="h-10 rounded-xl border border-espresso/12 bg-milk px-3 text-xs font-bold outline-none"
                      >
                        <option value="">{isAr ? "غير معيّن" : "Unassigned"}</option>
                        {assignees.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} · {item.role}
                          </option>
                        ))}
                      </select>
                    )}

                    {canClose && (
                      <button type="button" onClick={toggleClosed} disabled={busy === "close" || busy === "reopen"} className="omb-btn omb-btn-secondary">
                        {active.status === "closed"
                          ? (isAr ? "إعادة فتح" : "Reopen")
                          : (isAr ? "إغلاق المحادثة" : "Close conversation")}
                      </button>
                    )}
                  </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  <div className="grid gap-3">
                    {(active.messages || []).map((message) => (
                      <Message
                        key={message.id}
                        message={message}
                        isAr={isAr}
                        onReply={canReply && active.status !== "closed" ? setReplyTo : null}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <footer className="border-t border-espresso/10 bg-milk p-5">
                  {canReply && active.status !== "closed" ? (
                    <form onSubmit={sendReply}>
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
                      <textarea
                        required
                        maxLength={3000}
                        rows="3"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder={isAr ? "اكتب رد فريق الدعم..." : "Write the support reply..."}
                        className="w-full rounded-2xl border border-espresso/12 bg-oat/10 p-4 text-sm outline-none"
                      />
                      <button disabled={busy === "reply" || !reply.trim()} className="omb-btn omb-btn-primary mt-3 disabled:opacity-40">
                        {busy === "reply" ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الرد" : "Send reply")}
                      </button>
                    </form>
                  ) : (
                    <p className="text-sm font-semibold text-espresso/45">
                      {active.status === "closed"
                        ? (isAr ? "المحادثة مغلقة." : "Conversation is closed.")
                        : (isAr ? "هذا الحساب يملك مشاهدة المحادثات فقط." : "This account has view-only support access.")}
                    </p>
                  )}
                </footer>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}


