"use client";

import { useEffect, useId, useState } from "react";
import { ardoise, ardoiseNav } from "./content";

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
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="relative z-50 inline-flex h-11 items-center gap-3 text-xs tracking-[0.22em] uppercase"
      >
        {open ? "Close" : "Menu"}
        <span aria-hidden="true" className="relative block h-2.5 w-5">
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
        className="fixed inset-x-0 top-[6.75rem] bottom-0 z-40 flex flex-col overflow-y-auto bg-demo-bg px-5 pt-10 pb-10"
      >
        <nav aria-label="Ardoise">
          <ul className="space-y-2">
            {[...ardoiseNav, { label: "Reserve", href: "#reserve" }].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="font-ardoise-display text-5xl leading-tight italic hover:text-demo-accent"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto space-y-1 border-t border-demo-fg/15 pt-6 text-sm text-demo-fg/70">
          <p>{ardoise.address.join(", ")}</p>
          <p>
            <a href={ardoise.phone.href}>{ardoise.phone.label}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
