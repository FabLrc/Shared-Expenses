"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(false);

  // Quand le pathname change → navigation terminée
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    const t = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 450);
    return () => clearTimeout(t);
  }, [pathname]);

  // Démarrer la barre sur clic d'un lien interne
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (!href || /^(https?:\/\/|\/\/|#|mailto:|tel:)/.test(href)) return;
      if (href === pathname || href === window.location.pathname + window.location.search) return;

      if (intervalRef.current) clearInterval(intervalRef.current);
      setActive(true);
      setProgress(6);
      let p = 6;
      intervalRef.current = setInterval(() => {
        p = Math.min(p + Math.random() * 14 + 4, 82);
        setProgress(p);
      }, 380);
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pathname]);

  if (!active && progress === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed top-0 left-0 right-0 z-[9999] h-[2px]">
      <div
        className="h-full bg-blue-500 dark:bg-blue-400 rounded-r-full"
        style={{
          width: `${progress}%`,
          transition:
            progress === 0
              ? "none"
              : progress === 100
              ? "width 0.2s ease-out"
              : "width 0.38s ease-out",
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: progress === 100 ? "width, opacity" : "width",
          transitionDelay: progress === 100 ? "0s, 0.15s" : "0s",
          transitionDuration: progress === 100 ? "0.2s, 0.3s" : "0.38s",
        }}
      />
    </div>
  );
}
