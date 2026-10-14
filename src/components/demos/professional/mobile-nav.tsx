"use client";

import { useEffect, useId, useState } from "react";
import { halden, haldenNav } from "./content";

/** Small-screen menu: a panel under the demo bar and the sticky header. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="relative z-50 inline-flex size-11 items-center justify-center border border-demo-fg/25"
      >
        <span aria-hidden="true" className="relative block h-2 w-4">
          <span
            className={`absolute left-0 h-px w-full bg-current transition-transform duration-300 ${open ? "top-1/2 rotate-45" : "top-0"}`}
          />
          <span
            className={`absolute left-0 h-px w-full bg-current transition-transform duration-300 ${open ? "top-1/2 -rotate-45" : "bottom-0"}`}
          />
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-x-0 top-[7.25rem] bottom-0 z-40 flex flex-col overflow-y-auto bg-demo-bg px-5 pt-8 pb-10 sm:px-8"
      >
        <nav aria-label={halden.name}>
          <ol className="border-t border-demo-fg/15">
            {[...haldenNav, { label: "Book a consultation", href: "#book" }].map((item, index) => (
              <li key={item.href} className="border-b border-demo-fg/15">
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-5 py-5 text-3xl font-medium tracking-[-0.02em] hover:text-demo-accent"
                >
                  <span className="font-halden-serif text-base text-demo-accent tabular-nums">
                    0{index + 1}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="mt-auto space-y-1 pt-10 text-sm text-demo-fg/70">
          <p>{halden.hours}</p>
          <p>
            <a href={halden.phone.href}>{halden.phone.label}</a>
            <span className="text-demo-fg/45"> · fictional number</span>
          </p>
        </div>
      </div>
    </div>
  );
}
