"use client";

import { useEffect, useId, useState } from "react";
import { fieldNav, fieldOffice } from "./content";

/** Small-screen menu: a full panel under the demo bar and the sticky header. */
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
        className="relative z-50 inline-flex h-11 min-w-11 items-center justify-end gap-2 text-sm font-semibold"
      >
        {open ? "Close" : "Menu"}
        <span aria-hidden="true" className="grid size-3 grid-cols-2 gap-[2px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className={`bg-current transition-opacity ${open && i % 3 !== 0 ? "opacity-0" : ""}`}
            />
          ))}
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-x-0 top-[6.25rem] bottom-0 z-40 flex flex-col overflow-y-auto bg-demo-bg px-4 pt-6 pb-8"
      >
        <nav aria-label="Field Office">
          <ul className="border-t-2 border-demo-fg">
            {fieldNav.map((item, index) => (
              <li key={item.href} className="border-b border-demo-fg/20">
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 py-3 text-[2.75rem] leading-none font-black tracking-[-0.05em] uppercase hover:text-demo-accent"
                >
                  <span className="font-field-mono text-xs font-normal tracking-normal opacity-60">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto space-y-1 pt-8 text-sm">
          <p>
            <a href={`mailto:${fieldOffice.email}`} className="font-semibold underline underline-offset-4">
              {fieldOffice.email}
            </a>
          </p>
          <p className="opacity-60">{fieldOffice.address.join(", ")}</p>
        </div>
      </div>
    </div>
  );
}
