import React from "react";

// Compatibility wrapper. The old scroll-driven light/dark transition was
// removed; dark/light mode is now a user-controlled site theme.
export default function ThemeScroll({ children, className = "" }) {
  return <section className={className}>{children}</section>;
}
