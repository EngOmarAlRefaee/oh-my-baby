import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

/** Live box listing products that ran out of stock (own products, or all when granted). */
export default function StockAlertsBox({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => apiFetch("/api/admin/stock-alerts")
      .then((next) => { if (!cancelled) setAlerts(next); })
      .catch(() => { if (!cancelled) setAlerts(null); });
    load();
    const timer = window.setInterval(load, 20000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  if (!alerts || !alerts.count) return null;

  return (
    <section className="mt-8 rounded-2xl border border-red-300/60 bg-red-50/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-red-800">
          {isAr ? `منتجات نفدت من المخزون (${alerts.count})` : `Out-of-stock products (${alerts.count})`}
        </h2>
        <a href="/admin/products" className="text-xs font-black text-aubergine underline">{isAr ? "إدارة المخزون" : "Manage stock"}</a>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {alerts.products.map((product) => (
          <a key={product.id} href="/admin/products" className="flex items-center gap-3 rounded-xl border border-red-200 bg-milk p-3">
            {product.image && <img src={product.image} alt="" className="h-14 w-12 rounded object-cover grayscale" />}
            <div className="min-w-0">
              <strong className="block truncate text-sm text-espresso">{product.name}</strong>
              <span className="text-xs text-espresso/50">{product.owner_name ? `${isAr ? "صاحبه: " : "Owner: "}${product.owner_name}` : (isAr ? "بدون صاحب" : "No owner")}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
