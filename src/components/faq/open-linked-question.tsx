"use client";

import { useEffect } from "react";

/**
 * Opens the question a link points at, e.g. /faq#refunds. Browsers open
 * <details> for find-in-page, but not for a plain fragment link.
 */
export function OpenLinkedQuestion() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (target instanceof HTMLDetailsElement && !target.open) {
        target.open = true;
        target.scrollIntoView({ block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  return null;
}
