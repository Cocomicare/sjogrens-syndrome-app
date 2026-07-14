"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "mysjogrens-splash-seen";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) return;
    setVisible(true);
    requestAnimationFrame(() => setShown(true));
  }, []);

  function dismiss() {
    sessionStorage.setItem(SEEN_KEY, "1");
    setShown(false);
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={dismiss}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") dismiss();
      }}
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-white transition-opacity duration-300"
      style={{ opacity: shown ? 1 : 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo/full-lockup.png"
        alt="My Sjogren's — Track, Understand, Thrive"
        className="w-64 max-w-[70vw] transition-transform duration-300"
        style={{ transform: shown ? "scale(1)" : "scale(0.96)" }}
      />
    </div>
  );
}
