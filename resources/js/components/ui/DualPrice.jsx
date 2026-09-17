import React from "react";
import useExchangeRate from "../../hooks/useExchangeRate";

function formatSyp(value, locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SY" : "en-US", { maximumFractionDigits: 1 }).format(value);
}

export default function DualPrice({ usd, compareUsd = null, locale = "ar", compact = false, light = false, className = "" }) {
  const amount = Number(usd || 0);
  const compare = compareUsd ? Number(compareUsd) : null;
  const { data } = useExchangeRate();
  const syp = data?.usd_to_syp ? amount * Number(data.usd_to_syp) : null;
  const isAr = locale === "ar";

  return (
    <div className={`omb-dual-price ${compact ? "is-compact" : ""} ${light ? "is-light" : ""} ${className}`.trim()}>
      <div className="omb-dual-price-usd">
        <span>${amount.toFixed(2)}</span>
        {compare && compare > amount ? <span className="omb-dual-price-compare">${compare.toFixed(2)}</span> : null}
      </div>
      {syp !== null ? (
        <div className="omb-dual-price-syp" title={isAr ? "الليرة السورية الجديدة" : "New Syrian pound"}>
          <span className="omb-syp-mark" aria-hidden="true">س</span>
          <span>{formatSyp(syp, locale)}</span>
          <small>{isAr ? "ل.س جديدة" : "New SYP"}</small>
        </div>
      ) : (
        <div className="omb-dual-price-syp is-loading"><span className="omb-syp-mark">س</span><small>{isAr ? "جاري تحديث الليرة" : "Updating SYP"}</small></div>
      )}
    </div>
  );
}
