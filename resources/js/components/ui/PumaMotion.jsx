import React from "react";

// Compatibility wrapper. Scroll-linked PumaMotion was removed to avoid
// duplicated per-section scroll work and scrolling jank.
export default function PumaMotion({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}
