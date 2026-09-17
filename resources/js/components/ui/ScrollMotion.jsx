import React, { useEffect, useRef } from "react";

const roots = new Set();
let observer = null;

function getObserver() {
  if (observer || typeof IntersectionObserver === "undefined") return observer;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer?.unobserve(entry.target);
        roots.delete(entry.target);
      });
    },
    { threshold: 0.10, rootMargin: "0px 0px -9% 0px" },
  );
  return observer;
}

function prepareTargets(root) {
  const targets = root.querySelectorAll('[data-motion="media"], [data-motion="copy"], [data-motion="heading"], [data-scroll-item]');
  targets.forEach((node, index) => {
    if (node.dataset.scrollMotionPrepared) return;
    node.dataset.scrollMotionPrepared = "true";
    if (!node.style.getPropertyValue("--omb-motion-delay")) {
      node.style.setProperty("--omb-motion-delay", `${Math.min(index * 55, 220)}ms`);
    }
  });
}

export default function ScrollMotion({ children, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    prepareTargets(root);
    root.classList.add("is-prepared");

    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      root.classList.add("is-visible");
      return undefined;
    }

    const io = getObserver();
    if (!io) {
      root.classList.add("is-visible");
      return undefined;
    }

    roots.add(root);
    io.observe(root);
    return () => {
      roots.delete(root);
      io.unobserve(root);
      if (roots.size === 0) {
        io.disconnect();
        observer = null;
      }
    };
  }, []);

  return <div ref={ref} className={`omb-scroll-motion ${className}`.trim()}>{children}</div>;
}
