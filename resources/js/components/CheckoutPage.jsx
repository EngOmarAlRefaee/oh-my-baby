import React, { useEffect, useMemo, useState } from "react";
import OrderStatus from "./ui/OrderStatus";
import OrderTimeline from "./ui/OrderTimeline";
import { clearCart, getCartDetailed } from "../data/productStore";
import { apiFetch } from "../lib/api";
import useExchangeRate from "../hooks/useExchangeRate";

const DELIVERY_FEES = {
  damascus: 2.5,
  remote: 4,
};

const REMOTE_AREAS_AR = "جرمانا، مليحة، صحنايا الجديدة، مشروع دمر، قدسيا، المعضمية الجديدة، عرطوز";
const REMOTE_AREAS_EN = "Jaramana, Mleiha, New Sahnaya, Dummar Project, Qudsaya, New Muadamiyat, Artouz";

function formatUsd(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatSyp(value, locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SY" : "en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function CheckoutPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [session, setSession] = useState({ loading: true, user: null });
  const [items, setItems] = useState(() => getCartDetailed());
  const [form, setForm] = useState({
    customer_phone: "",
    delivery_address: "",
    customer_note: "",
    coupon_code: "",
    payment_currency: "usd",
    fulfillment_method: "delivery",
    delivery_zone: "damascus",
    shipping_full_name: "",
    shipping_governorate: "",
    shipping_company: "",
    shipping_address: "",
    shipping_phone: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const { data: rateData } = useExchangeRate();

  useEffect(() => {
    const load = () =>
      apiFetch("/auth/session")
        .then((data) => {
          const user = data.user || null;
          setSession({ loading: false, user });

          if (user) {
            setForm((current) => ({
              ...current,
              customer_phone: current.customer_phone || user.phone || "",
              shipping_full_name: current.shipping_full_name || user.name || "",
              shipping_phone: current.shipping_phone || user.phone || "",
            }));
          }
        })
        .catch(() => setSession({ loading: false, user: null }));

    load();
    window.addEventListener("omb:auth-updated", load);
    return () => window.removeEventListener("omb:auth-updated", load);
  }, []);

  const merchandiseSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
    [items]
  );

  const deliveryFee = form.fulfillment_method === "delivery"
    ? DELIVERY_FEES[form.delivery_zone] || DELIVERY_FEES.damascus
    : 0;

  const estimatedUsd = useMemo(
    () => Number((merchandiseSubtotal + deliveryFee).toFixed(2)),
    [merchandiseSubtotal, deliveryFee]
  );

  const liveRate = Number(rateData?.usd_to_syp || 0);
  const estimatedSyp = liveRate > 0 ? estimatedUsd * liveRate : null;

  function setMethod(method) {
    setError("");
    setForm((current) => ({
      ...current,
      fulfillment_method: method,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!items.length) return;

    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        coupon_code: form.coupon_code.trim() || null,
        customer_name: session.user?.name || null,
        customer_phone: form.fulfillment_method === "delivery" ? form.customer_phone : null,
        delivery_address: form.fulfillment_method === "delivery" ? form.delivery_address : null,
        delivery_zone: form.fulfillment_method === "delivery" ? form.delivery_zone : null,
        shipping_full_name: form.fulfillment_method === "shipping" ? form.shipping_full_name : null,
        shipping_governorate: form.fulfillment_method === "shipping" ? form.shipping_governorate : null,
        shipping_company: form.fulfillment_method === "shipping" ? form.shipping_company : null,
        shipping_address: form.fulfillment_method === "shipping" ? form.shipping_address : null,
        shipping_phone: form.fulfillment_method === "shipping" ? form.shipping_phone : null,
        items: items.map((item) => ({
          product_id: item.product.id,
          name_ar: item.product.name,
          name_en: item.product.nameEn || item.product.name,
          image: item.color?.image || item.product.image,
          color_id: item.color?.id || null,
          color_name: item.color ? (isAr ? item.color.nameAr : item.color.nameEn) : null,
          size: item.size === "default" ? null : item.size,
          quantity: item.quantity,
          unit_price_usd: item.price,
          category: item.product.category || null,
          sections: item.product.sections || [],
        })),
      };

      const data = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      clearCart();
      setItems([]);
      setSubmitted(data.order);
    } catch (err) {
      setError(
        err.data?.errors
          ? Object.values(err.data.errors).flat()[0]
          : err.message
      );
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    const currency = submitted.payment_currency || "usd";
    const rate = Number(submitted.exchange_rate || 0);
    const subtotalUsd = Number(submitted.subtotal_usd || 0);
    const discountUsd = Number(submitted.discount_usd || 0);
    const deliveryUsd = Number(submitted.delivery_fee_usd || 0);
    const finalUsd = Number(submitted.total_usd || 0);
    const finalSyp = Number(submitted.total_syp || 0);
    const isShipping = submitted.fulfillment_method === "shipping";
    const unverifiedCustomer =
      session.user?.role === "customer" &&
      session.user?.email_verification_required;

    const showAmount = (usd) => {
      if (currency === "syp") {
        return rate > 0
          ? `${formatSyp(Number(usd || 0) * rate, locale)} ${isAr ? "ل.س" : "SYP"}`
          : "—";
      }

      return formatUsd(usd);
    };

    return (
      <section className="min-h-[70vh] bg-milk px-5 py-16" dir={isAr ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-3xl border border-espresso/12 bg-oat/25 p-8 sm:p-12">
          <p className="omb-eyebrow-label text-aubergine/70">ORDER RECEIVED</p>
          <h1 className="mt-3 text-4xl font-black">
            {isAr ? "تم إرسال طلبك" : "Your order was submitted"}
          </h1>

          <p className="mt-4 text-espresso/65">
            {isAr ? "صار الطلب عند الإدارة، وحالته حالياً:" : "The order is now with the team. Its current status is:"}
          </p>

          <div className="mt-5">
            <OrderStatus status={submitted.status} locale={locale} audience="customer" />
          </div>

          <div className="mt-7 border border-espresso/10 bg-milk p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">{isAr ? "فاتورتك" : "Your invoice"}</h2>
              <span className="border border-aubergine/20 bg-aubergine/5 px-3 py-1.5 text-xs font-black text-aubergine">
                {currency === "syp"
                  ? (isAr ? "الدفع بالليرة السورية" : "Pay in SYP")
                  : (isAr ? "الدفع بالدولار" : "Pay in USD")}
              </span>
            </div>

            <div className="mt-4 border-b border-espresso/10 pb-4 text-sm">
              <p className="font-black">
                {isAr ? "طريقة الاستلام: " : "Fulfillment: "}
                {isShipping ? (isAr ? "شحن" : "Shipping") : (isAr ? "توصيل" : "Delivery")}
              </p>

              {isShipping ? (
                <div className="mt-2 grid gap-1 text-espresso/60">
                  <p>{isAr ? "الاسم الثلاثي: " : "Full name: "}{submitted.shipping_full_name}</p>
                  <p>{isAr ? "المحافظة: " : "Governorate: "}{submitted.shipping_governorate}</p>
                  <p>{isAr ? "شركة الشحن: " : "Shipping company: "}{submitted.shipping_company}</p>
                  <p>{isAr ? "العنوان: " : "Address: "}{submitted.shipping_address}</p>
                  <p>{isAr ? "الهاتف: " : "Phone: "}{submitted.shipping_phone}</p>
                </div>
              ) : (
                <div className="mt-2 grid gap-1 text-espresso/60">
                  <p>
                    {isAr ? "منطقة التوصيل: " : "Delivery zone: "}
                    {submitted.delivery_zone === "remote"
                      ? (isAr ? "منطقة بعيدة" : "Remote area")
                      : (isAr ? "ضمن دمشق" : "Damascus")}
                  </p>
                  <p>{isAr ? "العنوان: " : "Address: "}{submitted.delivery_address}</p>
                  <p>{isAr ? "الهاتف: " : "Phone: "}{submitted.customer_phone}</p>
                </div>
              )}
            </div>

            <div className="mt-2 divide-y divide-espresso/10 text-sm">
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="font-semibold text-espresso/65">
                  {isAr ? "قيمة المنتجات" : "Items subtotal"}
                </span>
                <strong>{showAmount(subtotalUsd)}</strong>
              </div>

              {discountUsd > 0 && (
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="font-semibold text-espresso/65">
                    {isAr ? "الحسم" : "Discount"}
                  </span>
                  <strong>- {showAmount(discountUsd)}</strong>
                </div>
              )}

              {!isShipping && (
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="font-semibold text-espresso/65">
                    {isAr ? "التوصيل" : "Delivery"}
                  </span>
                  <strong>{showAmount(deliveryUsd)}</strong>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 py-4 text-lg">
                <span className="font-black">
                  {isAr ? "الإجمالي النهائي" : "Final total"}
                </span>
                <strong className="text-aubergine">
                  {currency === "syp"
                    ? `${formatSyp(finalSyp, locale)} ${isAr ? "ل.س" : "SYP"}`
                    : formatUsd(finalUsd)}
                </strong>
              </div>
            </div>

            {currency === "syp" && rate > 0 && (
              <p className="mt-3 text-xs font-semibold text-espresso/45">
                {isAr
                  ? `تم تثبيت سعر الصرف لهذا الطلب: 1$ = ${formatSyp(rate, locale)} ل.س`
                  : `Exchange rate locked for this order: $1 = ${formatSyp(rate, locale)} SYP`}
              </p>
            )}
          </div>

          {unverifiedCustomer && (
            <div className="mt-5 border border-aubergine/20 bg-aubergine/5 p-4 text-sm font-bold leading-6 text-espresso/75">
              {isAr
                ? "وثّق بريدك لتستفيد من العروض والمكافآت والمزايا الخاصة بالحساب."
                : "Verify your email to unlock offers, rewards, and account perks."}
            </div>
          )}

          <div className="mt-6 border-t border-espresso/10 pt-5">
            <OrderTimeline status={submitted.status} locale={locale} />
          </div>

          <p className="mt-6 font-black">
            {isAr ? "رقم الطلب:" : "Order:"} {submitted.reference}
          </p>

          {submitted.user_id ? (
            <a href="/account" className="omb-btn omb-btn-primary mt-7">
              {isAr ? "متابعة الطلب من حسابي" : "Track in my account"}
            </a>
          ) : (
            <a href="/" className="omb-btn omb-btn-primary mt-7">
              {isAr ? "متابعة التسوق" : "Continue shopping"}
            </a>
          )}
        </div>
      </section>
    );
  }

  if (session.loading) {
    return (
      <section className="min-h-[60vh] bg-milk p-10">
        {isAr ? "جاري التحميل..." : "Loading..."}
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_400px]">
        <form onSubmit={submit} className="border border-espresso/10 bg-oat/20 p-6 sm:p-8">
          <p className="omb-eyebrow-label text-aubergine/65">CHECKOUT</p>
          <h1 className="mt-2 text-3xl font-black">
            {isAr ? "إتمام الطلب" : "Complete your order"}
          </h1>

          <div className="mt-6">
            <p className="text-sm font-black">
              {isAr ? "طريقة الاستلام" : "Fulfillment method"}
            </p>

            <div className="mt-3 grid grid-cols-2 rounded-full border border-espresso/15 bg-milk p-1">
              <button
                type="button"
                onClick={() => setMethod("delivery")}
                className={`rounded-full px-4 py-3 text-sm font-black transition ${
                  form.fulfillment_method === "delivery"
                    ? "bg-espresso text-milk"
                    : "text-espresso/60 hover:text-espresso"
                }`}
              >
                {isAr ? "توصيل" : "Delivery"}
              </button>
              <button
                type="button"
                onClick={() => setMethod("shipping")}
                className={`rounded-full px-4 py-3 text-sm font-black transition ${
                  form.fulfillment_method === "shipping"
                    ? "bg-espresso text-milk"
                    : "text-espresso/60 hover:text-espresso"
                }`}
              >
                {isAr ? "شحن" : "Shipping"}
              </button>
            </div>
          </div>

          {form.fulfillment_method === "delivery" ? (
            <div className="mt-7">
              <h2 className="text-lg font-black">{isAr ? "بيانات التوصيل" : "Delivery details"}</h2>

              <label className="mt-4 block text-sm font-black">
                {isAr ? "العنوان" : "Address"}
                <textarea
                  required
                  rows="4"
                  value={form.delivery_address}
                  onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                  className="mt-2 w-full border border-espresso/12 bg-milk p-4 outline-none"
                />
              </label>

              <label className="mt-5 block text-sm font-black">
                {isAr ? "رقم الهاتف" : "Phone"}
                <input
                  required
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none"
                />
              </label>

              <label className="mt-5 block text-sm font-black">
                {isAr ? "ملاحظة — اختياري" : "Note — optional"}
                <textarea
                  rows="3"
                  value={form.customer_note}
                  onChange={(e) => setForm({ ...form, customer_note: e.target.value })}
                  className="mt-2 w-full border border-espresso/12 bg-milk p-4 outline-none"
                />
              </label>

              <div className="mt-6">
                <p className="text-sm font-black">
                  {isAr ? "منطقة التوصيل" : "Delivery zone"}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, delivery_zone: "damascus" })}
                    className={`border p-4 text-start transition ${
                      form.delivery_zone === "damascus"
                        ? "border-aubergine bg-aubergine/5"
                        : "border-espresso/12 bg-milk hover:border-aubergine/40"
                    }`}
                  >
                    <strong className="block text-sm">
                      {isAr ? "ضمن دمشق" : "Damascus"}
                    </strong>
                    <span className="mt-1 block text-lg font-black text-aubergine">$2.50</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, delivery_zone: "remote" })}
                    className={`border p-4 text-start transition ${
                      form.delivery_zone === "remote"
                        ? "border-aubergine bg-aubergine/5"
                        : "border-espresso/12 bg-milk hover:border-aubergine/40"
                    }`}
                  >
                    <strong className="block text-sm">
                      {isAr ? "منطقة بعيدة" : "Remote area"}
                    </strong>
                    <span className="mt-1 block text-lg font-black text-aubergine">$4.00</span>
                  </button>
                </div>

                <p className="mt-3 text-xs font-semibold leading-6 text-espresso/50">
                  {isAr
                    ? `المناطق البعيدة تشمل: (${REMOTE_AREAS_AR}).`
                    : `Remote areas include: (${REMOTE_AREAS_EN}).`}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-7">
              <h2 className="text-lg font-black">{isAr ? "بيانات الشحن" : "Shipping details"}</h2>

              <label className="mt-4 block text-sm font-black">
                {isAr ? "الاسم الثلاثي" : "Full name"}
                <input
                  required
                  value={form.shipping_full_name}
                  onChange={(e) => setForm({ ...form, shipping_full_name: e.target.value })}
                  className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none"
                />
              </label>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-black">
                  {isAr ? "المحافظة" : "Governorate"}
                  <input
                    required
                    value={form.shipping_governorate}
                    onChange={(e) => setForm({ ...form, shipping_governorate: e.target.value })}
                    className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none"
                  />
                </label>

                <label className="block text-sm font-black">
                  {isAr ? "شركة الشحن" : "Shipping company"}
                  <input
                    required
                    value={form.shipping_company}
                    onChange={(e) => setForm({ ...form, shipping_company: e.target.value })}
                    className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none"
                  />
                </label>
              </div>

              <label className="mt-5 block text-sm font-black">
                {isAr ? "العنوان المراد الشحن إليه" : "Shipping address"}
                <textarea
                  required
                  rows="4"
                  value={form.shipping_address}
                  onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                  className="mt-2 w-full border border-espresso/12 bg-milk p-4 outline-none"
                />
              </label>

              <label className="mt-5 block text-sm font-black">
                {isAr ? "رقم الهاتف للتأكيد" : "Phone confirmation"}
                <input
                  required
                  type="tel"
                  value={form.shipping_phone}
                  onChange={(e) => setForm({ ...form, shipping_phone: e.target.value })}
                  className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none"
                />
              </label>

              <label className="mt-5 block text-sm font-black">
                {isAr ? "ملاحظة — اختياري" : "Note — optional"}
                <textarea
                  rows="3"
                  value={form.customer_note}
                  onChange={(e) => setForm({ ...form, customer_note: e.target.value })}
                  className="mt-2 w-full border border-espresso/12 bg-milk p-4 outline-none"
                />
              </label>
            </div>
          )}

          <label className="mt-6 block text-sm font-black">
            {isAr ? "كود الحسم أو كوبون المكافأة" : "Promo or reward coupon"}
            <input
              value={form.coupon_code}
              onChange={(e) => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })}
              placeholder={isAr ? "مثال: BABY10" : "Example: BABY10"}
              autoComplete="off"
              className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 font-black uppercase tracking-[0.12em] outline-none"
            />
          </label>

          <div className="mt-6 border-t border-espresso/10 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">{isAr ? "عملة الدفع" : "Payment currency"}</p>
                <p className="mt-1 text-xs font-semibold text-espresso/50">
                  {isAr ? "اختر دولار أو ليرة سورية." : "Choose USD or SYP."}
                </p>
              </div>

              <div className="inline-flex rounded-full border border-espresso/15 bg-milk p-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, payment_currency: "usd" })}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${
                    form.payment_currency === "usd"
                      ? "bg-espresso text-milk"
                      : "text-espresso/60 hover:text-espresso"
                  }`}
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, payment_currency: "syp" })}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${
                    form.payment_currency === "syp"
                      ? "bg-espresso text-milk"
                      : "text-espresso/60 hover:text-espresso"
                  }`}
                >
                  SYP
                </button>
              </div>
            </div>

            <div className="mt-4 border border-espresso/10 bg-milk p-4">
              <p className="text-xs font-bold text-espresso/45">
                {isAr ? "المبلغ الحالي قبل تطبيق الكوبون" : "Current amount before coupon"}
              </p>
              <p className="mt-2 text-2xl font-black text-aubergine">
                {form.payment_currency === "usd"
                  ? formatUsd(estimatedUsd)
                  : estimatedSyp !== null
                    ? `${formatSyp(estimatedSyp, locale)} ${isAr ? "ل.س" : "SYP"}`
                    : isAr ? "جاري تحديث سعر الصرف..." : "Updating exchange rate..."}
              </p>

              {form.fulfillment_method === "delivery" && (
                <p className="mt-2 text-xs font-semibold text-espresso/50">
                  {form.delivery_zone === "remote"
                    ? (isAr ? "المبلغ يشمل 4.00$ توصيل للمنطقة البعيدة." : "Includes $4.00 remote-area delivery.")
                    : (isAr ? "المبلغ يشمل 2.50$ توصيل ضمن دمشق." : "Includes $2.50 delivery inside Damascus.")}
                </p>
              )}
            </div>
          </div>

          {error && (
            <p className="mt-5 border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          <button
            disabled={busy || !items.length}
            className="omb-btn omb-btn-primary mt-7 w-full disabled:opacity-40"
          >
            {busy
              ? (isAr ? "جاري الإرسال..." : "Submitting...")
              : (isAr ? "إرسال الطلب للمراجعة" : "Submit order for review")}
          </button>
        </form>

        <aside className="h-fit border border-espresso/10 bg-milk p-6 lg:sticky lg:top-[190px]">
          <h2 className="text-xl font-black">{isAr ? "محتويات السلة" : "Bag contents"}</h2>

          <div className="mt-5 grid gap-4">
            {items.map((item) => (
              <div
                key={item.key}
                className="grid grid-cols-[64px_1fr] gap-3 border-b border-espresso/10 pb-4"
              >
                <img
                  src={item.color?.image || item.product.image}
                  className="aspect-[4/5] w-full object-cover"
                  alt=""
                />
                <div>
                  <p className="text-sm font-black">
                    {isAr ? item.product.name : item.product.nameEn || item.product.name}
                  </p>
                  <p className="mt-1 text-xs text-espresso/50">
                    × {item.quantity}
                    {item.size !== "default" ? ` · ${item.size}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 border-t border-espresso/10 pt-5 text-xs font-semibold leading-6 text-espresso/50">
            {isAr
              ? "تفاصيل الفاتورة النهائية تظهر بعد إرسال الطلب."
              : "The final invoice details appear after the order is submitted."}
          </p>
        </aside>
      </div>
    </section>
  );
}
