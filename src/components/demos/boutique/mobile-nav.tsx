"use client";

import { useEffect, useId, useState } from "react";
import { argileNav, maison } from "./content";

/** Small-screen menu: a soft panel that drops under the demo bar. */
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
        className="relative z-50 inline-flex h-11 items-center gap-2.5 text-sm"
      >
        <span aria-hidden="true" className="flex w-4 flex-col gap-[5px]">
          <span className={`h-px bg-current transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`} />
          <span className={`h-px bg-current transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
        </span>
        {open ? "Close" : "Menu"}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-x-0 top-[6.75rem] bottom-0 z-40 overflow-y-auto bg-demo-bg px-5 pt-4 pb-8"
      >
        <nav aria-label="Maison Argile">
          <ul>
            {argileNav.map((item) => (
              <li key={item.href} className="border-b border-demo-fg/15">
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="argile-display flex items-center justify-between py-4 text-[2.25rem] leading-none"
                >
                  {item.label}
                  <span aria-hidden="true" className="text-xl text-demo-accent">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-10 rounded-[1.5rem] bg-[var(--argile-paper)] p-5 text-sm leading-relaxed">
          <p className="font-medium">The studio shop is open Thursday to Sunday.</p>
          <p className="mt-1 text-demo-fg/80">{maison.address.join(", ")}</p>
          <p className="mt-3">
            <a href={`mailto:${maison.email}`} className="underline underline-offset-4">
              {maison.email}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
