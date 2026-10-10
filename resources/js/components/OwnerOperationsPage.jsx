import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

const money = (value) => `${Number(value || 0).toFixed(2)}$`;
const signedMoney = (value) => `${Number(value || 0) >= 0 ? "+" : ""}${Number(value || 0).toFixed(2)}$`;

const entryLabel = (type, isAr) => ({
  commission: isAr ? "عمولة طلب" : "Order commission",
  settlement: isAr ? "تسديد مؤكد" : "Confirmed settlement",
  commission_reversal: isAr ? "عكس عمولة" : "Commission reversal",
}[type] || type);

export default function OwnerOperationsPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState({});
  const [manual, setManual] = useState({ amount_usd: "", provider_transaction_id: "", note: "" });

  async function load() {
    try {
      const result = await apiFetch("/api/owner/commissions");
      setData(result);
      setError("");
      setSelectedAccountId((current) => current || result.accounts?.[0]?.id || null);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  const selectedAccount = useMemo(
    () => data?.accounts?.find((item) => Number(item.id) === Number(selectedAccountId)) || data?.accounts?.[0] || null,
    [data, selectedAccountId],
  );

  const visibleEntries = useMemo(
    () => (data?.entries || []).filter((entry) => !selectedAccount || Number(entry.account_user_id) === Number(selectedAccount.id)),
    [data, selectedAccount],
  );

  const visibleSettlements = useMemo(
    () => (data?.settlements || []).filter((row) => !selectedAccount || Number(row.account_user_id) === Number(selectedAccount.id)),
    [data, selectedAccount],
  );

  async function confirmClaim(claim) {
    if (busyId) return;
    const ok = window.confirm(
      isAr
        ? `هل تؤكد وصول تحويل ${money(claim.amount_usd)} من ${claim.account?.name || "الحساب"}؟`
        : `Confirm receipt of ${money(claim.amount_usd)} from ${claim.account?.name || "this account"}?`,
    );
    if (!ok) return;

    setBusyId(`confirm-${claim.id}`);
    setError("");
    setMessage("");
    try {
      const result = await apiFetch(`/api/owner/finance/transfer-claims/${claim.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setMessage(result.message || (isAr ? "تم تأكيد الاستلام." : "Receipt confirmed."));
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function rejectClaim(claim) {
    if (busyId) return;
    const note = String(rejectNotes[claim.id] || "").trim();
    if (note.length < 2) {
      setError(isAr ? "اكتب ملاحظة قصيرة للأدمن قبل الرفض." : "Enter a short note for the admin before rejecting.");
      return;
    }

    setBusyId(`reject-${claim.id}`);
    setError("");
    setMessage("");
    try {
      const result = await apiFetch(`/api/owner/finance/transfer-claims/${claim.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ note }),
      });
      setMessage(result.message || (isAr ? "تم رفض التأكيد وإرسال الملاحظة." : "Claim rejected and note sent."));
      setRejectNotes((current) => ({ ...current, [claim.id]: "" }));
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function submitManualSettlement(event) {
    event.preventDefault();
    if (!selectedAccount || busyId) return;
    setBusyId("manual");
    setError("");
    setMessage("");
    try {
      const result = await apiFetch(`/api/owner/finance/accounts/${selectedAccount.id}/settlements`, {
        method: "POST",
        body: JSON.stringify({
          amount_usd: Number(manual.amount_usd),
          provider_transaction_id: manual.provider_transaction_id.trim() || null,
          note: manual.note.trim() || null,
        }),
      });
      setMessage(result.message || (isAr ? "تم تسجيل التسديد." : "Settlement recorded."));
      setManual({ amount_usd: "", provider_transaction_id: "", note: "" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-[75vh] bg-milk px-4 py-8 sm:px-6 sm:py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="omb-eyebrow-label text-aubergine/60">OWNER FINANCE</p>
            <h1 className="mt-2 text-3xl font-black text-espresso sm:text-4xl">{isAr ? "العمولات والتسويات الأسبوعية" : "Commissions & weekly settlements"}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-espresso/55">
              {isAr
                ? "كل Admin يظهر بالمستحق الحالي وإجمالي ما تم تحصيله منه تاريخياً. تأكيد الأدمن أنه حوّل لا يغيّر الرصيد حتى تؤكد أنت وصول المبلغ."
                : "Each Admin shows current due and lifetime confirmed collections. An Admin transfer claim never changes the ledger until you confirm receipt."}
            </p>
          </div>
          <a href="/owner" className="omb-btn omb-btn-secondary">{isAr ? "لوحة الأونر" : "Owner dashboard"}</a>
        </div>

        {error && <p className="mt-6 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        {message && <p className="mt-6 rounded-xl border border-green-300 bg-green-50 p-3 text-sm font-bold text-green-800">{message}</p>}
        {!data && !error && <p className="mt-8 text-sm font-black text-espresso/45">{isAr ? "جاري تحميل الحسابات المالية..." : "Loading financial accounts..."}</p>}

        {data && (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-espresso/10 bg-oat/20 p-5">
                <p className="text-xs font-black text-aubergine/60">{isAr ? "إجمالي المستحق الآن" : "Total due now"}</p>
                <strong className="mt-2 block text-3xl font-black text-espresso">{money(data.summary.total_due_usd)}</strong>
              </div>
              <div className="rounded-2xl border border-espresso/10 bg-oat/20 p-5">
                <p className="text-xs font-black text-aubergine/60">{isAr ? "إجمالي المحصل تاريخياً" : "Lifetime collected"}</p>
                <strong className="mt-2 block text-3xl font-black text-espresso">{money(data.summary.confirmed_settlements_usd)}</strong>
              </div>
              <div className="rounded-2xl border border-espresso/10 bg-oat/20 p-5">
                <p className="text-xs font-black text-aubergine/60">{isAr ? "حسابات عليها مستحق" : "Accounts owing"}</p>
                <strong className="mt-2 block text-3xl font-black text-espresso">{data.summary.accounts_in_debt}</strong>
              </div>
              <div className="rounded-2xl border border-espresso/10 bg-oat/20 p-5">
                <p className="text-xs font-black text-aubergine/60">{isAr ? "تحويلات بانتظار قرارك" : "Pending transfer claims"}</p>
                <strong className="mt-2 block text-3xl font-black text-espresso">{data.summary.pending_claims_count}</strong>
              </div>
            </section>

            {(data.pending_claims || []).length > 0 && (
              <section className="mt-8 rounded-2xl border border-amber-300 bg-amber-50/60 p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-amber-800">WEEKLY CLAIMS</p>
                    <h2 className="mt-1 text-xl font-black text-espresso">{isAr ? "تحويلات قال الأدمن إنها تمت" : "Transfers reported by Admins"}</h2>
                  </div>
                  <span className="text-xs font-black text-amber-800">{data.pending_claims.length}</span>
                </div>
                <div className="mt-5 grid gap-4">
                  {data.pending_claims.map((claim) => (
                    <article key={claim.id} className="rounded-xl border border-amber-300 bg-milk p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <strong className="text-lg text-espresso">{claim.account?.name || `Admin #${claim.account_user_id}`}</strong>
                          <p className="mt-1 text-xs text-espresso/50">{claim.account?.email || claim.account?.phone || "—"}</p>
                          <p className="mt-2 text-xs font-bold text-espresso/55">{isAr ? "المستحق الحالي" : "Current due"}: {money(claim.current_due_usd)}</p>
                        </div>
                        <div className="text-end">
                          <p className="text-xs font-black text-amber-800">{isAr ? "قال إنه حوّل" : "Reported transfer"}</p>
                          <strong className="mt-1 block text-3xl font-black text-espresso">{money(claim.amount_usd)}</strong>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                        <label className="text-xs font-black text-espresso/65">
                          {isAr ? "ملاحظة في حال لم يصل" : "Note if not received"}
                          <input
                            value={rejectNotes[claim.id] || ""}
                            onChange={(e) => setRejectNotes((current) => ({ ...current, [claim.id]: e.target.value }))}
                            placeholder={isAr ? "مثلاً: لم يصل التحويل، تأكد من العملية" : "Example: transfer not received, please verify"}
                            className="mt-2 h-11 w-full rounded-xl border border-espresso/10 bg-milk px-3 outline-none focus:border-aubergine"
                          />
                        </label>
                        <button type="button" disabled={Boolean(busyId)} onClick={() => confirmClaim(claim)} className="omb-btn omb-btn-primary disabled:opacity-40">
                          {busyId === `confirm-${claim.id}` ? "..." : (isAr ? "تم الاستلام" : "Received")}
                        </button>
                        <button type="button" disabled={Boolean(busyId)} onClick={() => rejectClaim(claim)} className="omb-btn omb-btn-secondary border-red-300 text-red-700 disabled:opacity-40">
                          {busyId === `reject-${claim.id}` ? "..." : (isAr ? "لم يصل" : "Not received")}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {data.summary.unassigned_commissions_count > 0 && (
              <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                {isAr ? `يوجد ${data.summary.unassigned_commissions_count} عمولة غير مرتبطة بحساب Admin.` : `${data.summary.unassigned_commissions_count} commission(s) are not assigned to an Admin.`}
              </p>
            )}

            <section className="mt-8 grid gap-4 lg:grid-cols-[330px_1fr]">
              <aside className="rounded-2xl border border-espresso/10 bg-oat/15 p-4">
                <h2 className="text-lg font-black text-espresso">{isAr ? "حسابات الأدمن" : "Admin accounts"}</h2>
                <div className="mt-4 grid gap-2">
                  {(data.accounts || []).map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`rounded-xl border p-4 text-start transition ${Number(selectedAccount?.id) === Number(account.id) ? "border-aubergine/30 bg-aubergine/[.06]" : "border-espresso/10 bg-milk hover:border-aubergine/20"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong className="block text-sm font-black text-espresso">{account.name}</strong>
                        {account.pending_claim && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">{isAr ? "بانتظارك" : "Pending"}</span>}
                      </div>
                      <span className="mt-2 block text-xs font-black text-red-700">{isAr ? "عليه الآن" : "Due now"}: {money(account.amount_due_usd)}</span>
                      <span className="mt-1 block text-xs font-bold text-espresso/50">{isAr ? "حصلت منه" : "Collected"}: {money(account.total_collected_usd)}</span>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="min-w-0">
                {selectedAccount ? (
                  <>
                    <div className="rounded-2xl border border-espresso/10 bg-oat/15 p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black text-aubergine/60">{isAr ? "الحساب الحالي" : "Current account"}</p>
                          <h2 className="mt-1 text-2xl font-black text-espresso">{selectedAccount.name}</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-5 text-end">
                          <div><p className="text-xs font-black text-espresso/45">{isAr ? "المستحق الآن" : "Due now"}</p><strong className="mt-1 block text-2xl font-black text-red-700">{money(selectedAccount.amount_due_usd)}</strong></div>
                          <div><p className="text-xs font-black text-espresso/45">{isAr ? "المحصل تاريخياً" : "Collected"}</p><strong className="mt-1 block text-2xl font-black text-green-700">{money(selectedAccount.total_collected_usd)}</strong></div>
                        </div>
                      </div>

                      {Number(selectedAccount.amount_due_usd) > 0 && (
                        <details className="mt-6 border-t border-espresso/10 pt-5">
                          <summary className="cursor-pointer text-sm font-black text-aubergine">{isAr ? "تسجيل تسديد يدوي كحل احتياطي" : "Record manual settlement as fallback"}</summary>
                          <form onSubmit={submitManualSettlement} className="mt-4 grid gap-3 sm:grid-cols-2">
                            <label className="text-xs font-black text-espresso/70">
                              {isAr ? "المبلغ" : "Amount"}
                              <input type="number" min="0.0001" step="0.0001" max={selectedAccount.amount_due_usd} required value={manual.amount_usd} onChange={(e) => setManual((x) => ({ ...x, amount_usd: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-espresso/10 bg-milk px-3" />
                            </label>
                            <label className="text-xs font-black text-espresso/70">
                              {isAr ? "رقم مرجع — اختياري" : "Reference — optional"}
                              <input value={manual.provider_transaction_id} onChange={(e) => setManual((x) => ({ ...x, provider_transaction_id: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-espresso/10 bg-milk px-3" />
                            </label>
                            <label className="text-xs font-black text-espresso/70 sm:col-span-2">
                              {isAr ? "ملاحظة — اختياري" : "Note — optional"}
                              <input value={manual.note} onChange={(e) => setManual((x) => ({ ...x, note: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-espresso/10 bg-milk px-3" />
                            </label>
                            <button disabled={Boolean(busyId)} className="omb-btn omb-btn-secondary sm:col-span-2 disabled:opacity-40">{busyId === "manual" ? "..." : (isAr ? "تسجيل التسديد اليدوي" : "Record manual settlement")}</button>
                          </form>
                        </details>
                      )}
                    </div>

                    <div className="mt-6 overflow-x-auto rounded-2xl border border-espresso/10">
                      <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-oat/30 text-xs font-black text-espresso/60">
                          <tr><th className="p-3 text-start">{isAr ? "الحركة" : "Entry"}</th><th className="p-3 text-start">{isAr ? "الطلب" : "Order"}</th><th className="p-3 text-center">{isAr ? "القيمة" : "Amount"}</th><th className="p-3 text-start">{isAr ? "التاريخ" : "Date"}</th></tr>
                        </thead>
                        <tbody>
                          {visibleEntries.length ? visibleEntries.map((entry) => (
                            <tr key={entry.id} className="border-t border-espresso/10">
                              <td className="p-3 font-black text-espresso">{entryLabel(entry.type, isAr)}</td>
                              <td className="p-3 text-espresso/60">{entry.order?.reference || "—"}</td>
                              <td className={`p-3 text-center font-black ${Number(entry.amount_usd) < 0 ? "text-red-700" : "text-green-700"}`}>{signedMoney(entry.amount_usd)}</td>
                              <td className="p-3 text-xs text-espresso/50">{new Date(entry.created_at).toLocaleString(isAr ? "ar" : "en")}</td>
                            </tr>
                          )) : <tr><td colSpan="4" className="p-6 text-center text-espresso/45">{isAr ? "لا توجد حركات مالية بعد." : "No financial entries yet."}</td></tr>}
                        </tbody>
                      </table>
                    </div>

                    {visibleSettlements.length > 0 && (
                      <div className="mt-6 rounded-2xl border border-espresso/10 bg-oat/10 p-5">
                        <h3 className="font-black text-espresso">{isAr ? "سجل التحصيل — للأونر فقط" : "Collection history — owner only"}</h3>
                        <div className="mt-3 grid gap-2">
                          {visibleSettlements.slice(0, 12).map((row) => (
                            <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-espresso/10 bg-milk p-3 text-xs">
                              <span className="font-black text-green-700">{money(row.amount_usd)}</span>
                              <span className="text-espresso/55">{isAr ? `${row.orders_count} طلب/حركة` : `${row.orders_count} order entries`}</span>
                              <span className="text-espresso/45">{row.confirmed_at ? new Date(row.confirmed_at).toLocaleString(isAr ? "ar" : "en") : "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : <div className="rounded-2xl border border-espresso/10 p-8 text-center text-espresso/45">{isAr ? "لا توجد حسابات Admin." : "No Admin accounts."}</div>}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
