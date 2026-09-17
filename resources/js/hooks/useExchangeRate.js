import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const CACHE_KEY = "omb:exchange-rate";
const CLIENT_TTL = 5 * 60 * 1000;
let memory = null;
let pending = null;

function readCache() {
  if (memory && Date.now() - memory.savedAt < CLIENT_TTL) return memory;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(CACHE_KEY) || "null");
    if (parsed?.data?.usd_to_syp && Date.now() - parsed.savedAt < CLIENT_TTL) {
      memory = parsed;
      return parsed;
    }
  } catch {}
  return null;
}

async function loadRate({ force = false } = {}) {
  const cached = force ? null : readCache();
  if (cached) return cached.data;
  if (!pending) {
    pending = apiFetch("/api/exchange-rate")
      .then((data) => {
        memory = { data, savedAt: Date.now() };
        try { window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(memory)); } catch {}
        return data;
      })
      .finally(() => { pending = null; });
  }
  return pending;
}

export default function useExchangeRate() {
  const cached = readCache();
  const [state, setState] = useState({ data: cached?.data || null, loading: !cached, error: null });

  useEffect(() => {
    let alive = true;

    const refresh = (force = false) => {
      loadRate({ force })
        .then((data) => alive && setState({ data, loading: false, error: null }))
        .catch((error) => alive && setState((current) => ({ ...current, loading: false, error })));
    };

    refresh(false);

    // Keep an already-open storefront in sync with the live exchange source.
    const intervalId = window.setInterval(() => refresh(true), CLIENT_TTL);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh(false);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return state;
}
