import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const money = (value) => `${Number(value || 0).toFixed(2)}$`;

export default function AdminCommissionsPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const result = await apiFetch("/api/admin/my-commissions");
      setData(result);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function claimTransfer() {
    if (busy || !data) return;
    const ok = window.confirm(
      isAr
        ? `هل تؤكد أنك حوّلت ${money(data.amount_due_usd)} للأونر؟ لن ينخفض المبلغ حتى يؤكد الأونر وصوله.`
        : `Confirm that you transferred ${money(data.amount_due_usd)} to the owner? The balance will not change until the owner confirms receipt.`,
    );
    if (!ok) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await apiFetch("/api/admin/my-commissions/claim-transfer", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setMessage(result.message || (isAr ? "تم إرسال التأكيد للأونر." : "Transfer claim sent to owner."));
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const claim = data?.active_claim || null;
  const pending = claim?.status === "pending";
  const rejected = claim?.status === "rejected";
  const due = Number(data?.amount_due_usd || 0);
  const windowOpen = Boolean(data?.claim_window?.open);

  return (
    <main className="min-h-[75vh] bg-milk px-4 py-10 sm:px-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="omb-eyebrow-label text-aubergine/60">MY COMMISSIONS</p>
            <h1 className="mt-2 text-3xl font-black text-espresso sm:text-4xl">{isAr ? "عمولاتي ومستحقاتي" : "My commissions & dues"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-espresso/55">
              {isAr
                ? "هنا يظهر فقط المبلغ المستحق عليك حالياً وتفاصيل الطلبات التي كوّنته. سجل المبالغ التي دفعتها سابقاً يبقى عند الأونر فقط."
                : "This page shows only your current amount due and the orders that created it. Historical payments remain visible only to the owner."}
            </p>
          </div>
          <a href="/admin" className="omb-btn omb-btn-secondary">{isAr ? "لوحة التحكم" : "Dashboard"}</a>
        </div>

        {error && <p className="mt-6 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        {message && <p className="mt-6 rounded-xl border border-green-300 bg-green-50 p-3 text-sm font-bold text-green-800">{message}</p>}

        {!data && !error && <p className="mt-8 text-sm font-black text-espresso/45">{isAr ? "جاري التحميل..." : "Loading..."}</p>}

        {data && (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-espresso/10 bg-oat/20 p-6">
                <p className="text-xs font-black text-aubergine/60">{isAr ? "المستحق عليك حالياً" : "Current amount due"}</p>
                <strong className={`mt-3 block text-4xl font-black ${due > 0 ? "text-red-700" : "text-espresso"}`}>{money(due)}</strong>
                <p className="mt-2 text-xs text-espresso/50">{isAr ? "يتغير تلقائياً مع الطلبات المكتملة والمرتجعات المؤهلة." : "Updates automatically from completed orders and eligible returns."}</p>
              </div>
              <div className="rounded-2xl border border-espresso/10 bg-oat/20 p-6">
                <p className="text-xs font-black text-aubergine/60">{isAr ? "طلبات مفتوحة ضمن المستحق" : "Open order shares"}</p>
                <strong className="mt-3 block text-4xl font-black text-espresso">{data.open_orders_count}</strong>
                <p className="mt-2 text-xs text-espresso/50">{isAr ? "كل طلب يظهر بحصتك فقط إذا أعطاك الأونر صلاحية التفاصيل." : "Order details appear only when the owner grants that permission."}</p>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-espresso/10 bg-oat/15 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-aubergine/60">WEEKLY SETTLEMENT</p>
                  <h2 className="mt-1 text-xl font-black text-espresso">{isAr ? "تسوية يوم الجمعة" : "Friday settlement"}</h2>
                  <p className="mt-2 text-sm leading-6 text-espresso/55">
                    {isAr
                      ? "بعد ما تحول المبلغ، اضغط مرة واحدة «تم التحويل». الأونر إما يؤكد وصوله فينخفض المستحق، أو يرفضه مع ملاحظة ويبقى المبلغ عليك."
                      : "After sending the money, press ‘Transferred’ once. The owner confirms receipt to reduce your due, or rejects it with a note while the amount remains due."}
                  </p>
                </div>
                <span className="rounded-full border border-espresso/10 bg-milk px-3 py-1 text-xs font-black text-espresso/60">
                  {isAr ? `الجمعة القادمة: ${data.claim_window.next_friday}` : `Next Friday: ${data.claim_window.next_friday}`}
                </span>
              </div>

              {pending && (
                <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                  {isAr
                    ? `تم تسجيل أنك حولت ${money(claim.amount_usd)}. بانتظار تأكيد الأونر، والمستحق لن ينخفض قبل التأكيد.`
                    : `You reported a ${money(claim.amount_usd)} transfer. Waiting for owner confirmation; your due remains unchanged until then.`}
                </div>
              )}

              {rejected && (
                <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">
                  <p>{isAr ? "الأونر قال إن التحويل لم يصل. المستحق بقي كما هو." : "The owner reported that the transfer was not received. Your due remains unchanged."}</p>
                  {claim.owner_note && <p className="mt-2">{isAr ? "ملاحظة الأونر: " : "Owner note: "}{claim.owner_note}</p>}
                </div>
              )}

              {data.can_claim_transfer && due > 0 && !pending && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={busy || !windowOpen}
                    onClick={claimTransfer}
                    className="omb-btn omb-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "تم التحويل" : "Transferred")}
                  </button>
                  {!windowOpen && <span className="text-xs font-bold text-espresso/50">{isAr ? "الزر يفتح يوم الجمعة فقط." : "This action opens on Fridays only."}</span>}
                  {data.claim_window.local_testing_override && !data.claim_window.is_friday && (
                    <span className="text-xs font-bold text-amber-700">{isAr ? "وضع الاختبار المحلي: الزر متاح الآن للتجربة." : "Local testing mode: available now for testing."}</span>
                  )}
                </div>
              )}

              {due <= 0 && <p className="mt-5 rounded-xl border border-green-300 bg-green-50 p-4 text-sm font-bold text-green-800">{isAr ? "ما عليك أي مبلغ حالياً." : "You currently have no amount due."}</p>}
            </section>

            {data.can_view_orders && (
              <section className="mt-6 overflow-hidden rounded-2xl border border-espresso/10">
                <div className="bg-oat/20 p-4"><h2 className="font-black text-espresso">{isAr ? "تفاصيل الطلبات التي كوّنت المستحق" : "Orders contributing to the current due"}</h2></div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-milk text-xs font-black text-espresso/55">
                      <tr>
                        <th className="p-3 text-start">{isAr ? "الطلب" : "Order"}</th>
                        <th className="p-3 text-center">{isAr ? "حصتك الأصلية" : "Original share"}</th>
                        <th className="p-3 text-center">{isAr ? "المتبقي من الطلب" : "Remaining"}</th>
                        <th className="p-3 text-start">{isAr ? "التاريخ" : "Date"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.order_shares || []).length ? data.order_shares.map((row) => (
                        <tr key={row.id} className="border-t border-espresso/10">
                          <td className="p-3 font-black text-espresso">{row.order_reference || `#${row.order_id}`}</td>
                          <td className="p-3 text-center font-bold text-espresso/65">{money(row.share_usd)}</td>
                          <td className="p-3 text-center font-black text-red-700">{money(row.remaining_usd)}</td>
                          <td className="p-3 text-xs text-espresso/45">{new Date(row.created_at).toLocaleString(isAr ? "ar" : "en")}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" className="p-6 text-center text-espresso/45">{isAr ? "لا توجد طلبات مستحقة حالياً." : "No open commission orders."}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
