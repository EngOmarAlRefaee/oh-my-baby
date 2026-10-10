import React, { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { hasPermission } from "../lib/permissions";
import { armSupportNotificationSound, playSupportNotificationSound } from "../lib/supportNotifications";

export default function SupportStaffNotifier({ locale = "ar", user: suppliedUser = undefined }) {
  const isAr = locale === "ar";
  const [user, setUser] = useState(suppliedUser ?? null);
  const [unread, setUnread] = useState(0);
  const previousUnread = useRef(null);
  const baseTitle = useRef(typeof document !== "undefined" ? document.title : "");

  useEffect(() => {
    armSupportNotificationSound();
  }, []);

  useEffect(() => {
    if (suppliedUser !== undefined) {
      setUser(suppliedUser || null);
      return undefined;
    }

    let alive = true;
    apiFetch("/auth/session")
      .then((payload) => { if (alive) setUser(payload?.user || null); })
      .catch(() => { if (alive) setUser(null); });

    return () => { alive = false; };
  }, [suppliedUser]);

  const allowed = user?.role === "owner"
    || (user?.role === "admin" && hasPermission(user, "support.notifications"));

  useEffect(() => {
    if (!allowed) {
      setUnread(0);
      previousUnread.current = null;
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const summary = await apiFetch("/api/support/staff/summary");
        if (cancelled) return;

        const nextUnread = Number(summary?.unread || 0);
        const previous = previousUnread.current;

        setUnread(nextUnread);
        previousUnread.current = nextUnread;

        if (previous !== null && nextUnread > previous) {
          playSupportNotificationSound();
        }
      } catch {
        if (!cancelled) setUnread(0);
      }
    };

    load();
    const timer = window.setInterval(load, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [allowed, user?.id]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    document.title = unread > 0 ? `(${unread}) ${baseTitle.current}` : baseTitle.current;
    return () => { document.title = baseTitle.current; };
  }, [unread]);

  if (!allowed) return null;

  const href = user?.role === "owner" ? "/owner/support" : "/admin/support";

  return (
    <a
      href={href}
      className="relative inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-espresso/12 bg-milk px-3 text-sm font-black text-espresso transition hover:border-aubergine/35 hover:bg-oat/25"
      title={isAr ? "إشعارات محادثات العملاء" : "Customer chat notifications"}
      aria-label={isAr ? `إشعارات المحادثات: ${unread}` : `Chat notifications: ${unread}`}
    >
      <span aria-hidden="true">🔔</span>
      {unread > 0 && (
        <span className="ms-1 inline-flex min-w-5 items-center justify-center rounded-full bg-aubergine px-1.5 py-0.5 text-[10px] text-milk">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </a>
  );
}
