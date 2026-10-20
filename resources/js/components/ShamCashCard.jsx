import React, { useState } from "react";

// Shows a Sham Cash account (QR + address) so the owner can match the weekly transfer.
export default function ShamCashCard({ account, isAr, title, amount }) {
  const [copied, setCopied] = useState(false);
  if (!account || !account.address) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(account.address); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <div className="mt-5 flex flex-wrap items-center gap-5 rounded-2xl border border-espresso/10 bg-milk p-5">
      {account.qr && <img src={account.qr} alt="Sham Cash QR" className="h-36 w-36 rounded-xl border border-espresso/10 bg-white object-contain" loading="lazy" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-aubergine/60">{title || (isAr ? "حساب شام كاش (اللي بيتحوّل منه للأونر)" : "Sham Cash account (transfers to the owner)")}</p>
        {account.name && <strong className="mt-1 block text-base font-black text-espresso">{account.name}</strong>}
        <p dir="ltr" className="mt-2 break-all rounded-lg bg-oat/30 p-2 text-start font-mono text-xs text-espresso/80">{account.address}</p>
        {amount ? <p className="mt-3 text-sm font-black text-espresso">{isAr ? "المبلغ المطلوب تحويله" : "Amount to send"}: <span dir="ltr">{amount}</span></p> : null}
        <button type="button" onClick={copy} className="omb-btn omb-btn-secondary mt-3">{copied ? (isAr ? "تم النسخ ✓" : "Copied ✓") : (isAr ? "نسخ العنوان" : "Copy address")}</button>
      </div>
    </div>
  );
}
