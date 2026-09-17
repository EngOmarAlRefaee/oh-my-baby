import React from "react";

const copy = {
  pending_review: { ar: "قيد المراجعة من OH MY BABY", en: "Under OH MY BABY review" },
  accepted: { ar: "تم قبول الطلب", en: "Order accepted" },
  assigned_to_driver: { ar: "تم إرساله للسائق", en: "Sent to driver" },
  out_for_delivery: { ar: "في مرحلة التوصيل", en: "Out for delivery" },
  delivered: { ar: "تم التسليم", en: "Delivered" },
  return_requested: { ar: "طلب إرجاع قيد المراجعة", en: "Return under review" },
  return_approved: { ar: "تمت الموافقة على الإرجاع", en: "Return approved" },
  return_assigned: { ar: "تم إرسال سائق للمرتجع", en: "Return driver assigned" },
  return_in_transit: { ar: "المرتجع في الطريق", en: "Return in transit" },
  returned: { ar: "تم استلام المرتجع", en: "Returned to store" },
  rejected: { ar: "تم رفض الطلب", en: "Order rejected" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
};

export function orderStatusText(status, locale = "ar", audience = "internal") {
  if (audience === "customer" && status === "assigned_to_driver") {
    return locale === "ar" ? "تم قبول الطلب" : "Order accepted";
  }
  return copy[status]?.[locale] || status;
}

export default function OrderStatus({ status, locale = "ar", audience = "internal" }) {
  const visualStatus = audience === "customer" && status === "assigned_to_driver" ? "accepted" : status;
  return <span className={`omb-order-status is-${visualStatus}`}>{orderStatusText(status, locale, audience)}</span>;
}
