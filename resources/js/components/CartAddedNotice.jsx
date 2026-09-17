import React, { useEffect, useRef, useState } from "react";

export default function CartAddedNotice({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [item, setItem] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    const show = (event) => {
      window.clearTimeout(timer.current);
      setItem(event.detail || {});
      timer.current = window.setTimeout(() => setItem(null), 7500);
    };
    window.addEventListener("omb:cart-added", show);
    return () => {
      window.clearTimeout(timer.current);
      window.removeEventListener("omb:cart-added", show);
    };
  }, []);

  if (!item) return null;
  const name = isAr ? item.productName : item.productNameEn || item.productName;

  return (
    <div className="omb-cart-added-notice" role="status" aria-live="polite" dir={isAr ? "rtl" : "ltr"}>
      <div className="omb-cart-added-copy">
        <strong>{isAr ? "تمت إضافة المنتج للسلة بنجاح" : "Added to your bag"}</strong>
        <span>
          {name ? `${name} — ` : ""}
          {isAr ? "الطلب لسا ما انرسل. اضغط لإتمام العملية." : "Your order has not been submitted yet. Continue to finish checkout."}
        </span>
      </div>
      <div className="omb-cart-added-actions">
        <a href="/checkout" className="omb-btn omb-btn-primary omb-cart-added-cta">{isAr ? "إتمام الطلب" : "Checkout"}</a>
        <button type="button" onClick={() => setItem(null)} className="omb-cart-added-close" aria-label={isAr ? "إغلاق" : "Close"}>×</button>
      </div>
    </div>
  );
}
