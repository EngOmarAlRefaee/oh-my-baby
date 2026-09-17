import React from "react";

// Kept as a compatibility wrapper so existing section imports remain safe.
// The site-wide scroll motion is now handled by ScrollMotion.
export default function Reveal({ children, className = "", as: Tag = "div" }) {
  return <Tag className={className}>{children}</Tag>;
}
