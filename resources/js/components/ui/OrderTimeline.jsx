import React from "react";

const steps = [
  { key: "pending_review", ar: "قيد المراجعة", en: "Under review" },
  { key: "accepted", ar: "تم قبول الطلب", en: "Order accepted" },
  { key: "out_for_delivery", ar: "في مرحلة التوصيل", en: "Out for delivery" },
  { key: "delivered", ar: "تم التسليم", en: "Delivered" },
];

const stage = {
  pending_review: 0,
  accepted: 1,
  assigned_to_driver: 1,
  out_for_delivery: 2,
  delivered: 3,
};

export default function OrderTimeline({ status, locale = "ar", compact = false, wasDelivered = false }) {
  const isAr = locale === "ar";
  if (["rejected", "cancelled"].includes(status)) {
    return (
      <div className="omb-order-timeline-terminal is-negative">
        <span className="omb-order-timeline-dot">×</span>
        <strong>{isAr ? (status === "rejected" ? "تم رفض الطلب" : "تم إلغاء الطلب") : (status === "rejected" ? "Order rejected" : "Order cancelled")}</strong>
      </div>
    );
  }

  const isReturn = ["return_requested", "return_approved", "return_assigned", "return_in_transit", "returned"].includes(status);
  const current = isReturn ? (wasDelivered ? 3 : 2) : (stage[status] ?? 0);
  return (
    <div className={`omb-order-timeline ${compact ? "is-compact" : ""}`}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <React.Fragment key={step.key}>
            <div className={`omb-order-step ${done ? "is-done" : ""} ${active ? "is-active" : ""}`}>
              <span className="omb-order-step-dot">{done ? "✓" : index + 1}</span>
              <span>{isAr ? step.ar : step.en}</span>
            </div>
            {index < steps.length - 1 && <span className={`omb-order-step-line ${index < current ? "is-done" : ""}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
