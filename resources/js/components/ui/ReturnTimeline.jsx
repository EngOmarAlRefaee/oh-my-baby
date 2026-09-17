import React from "react";

const steps = [
  { key: "return_requested", ar: "طلب الإرجاع", en: "Return requested" },
  { key: "return_approved", ar: "تمت الموافقة", en: "Return approved" },
  { key: "return_in_transit", ar: "المرتجع بالطريق", en: "Return in transit" },
  { key: "returned", ar: "تم استلام المرتجع", en: "Returned to store" },
];

const stage = {
  return_requested: 0,
  return_approved: 1,
  return_assigned: 1,
  return_in_transit: 2,
  returned: 3,
};

export default function ReturnTimeline({ status, locale = "ar", compact = false }) {
  if (!(status in stage)) return null;
  const isAr = locale === "ar";
  const current = stage[status];

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
