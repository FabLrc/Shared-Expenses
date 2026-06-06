"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps the (server-rendered) dashboard in sync without a manual reload.
 * The page is `force-dynamic`, so `router.refresh()` re-executes the server
 * component and pulls fresh sessions/totals — useful when the partner changes
 * something while this tab is open.
 */
export function DashboardRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) router.refresh();
    };

    const interval = setInterval(refresh, 10_000);
    const onFocus = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
