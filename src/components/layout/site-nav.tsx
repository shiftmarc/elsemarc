"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { primaryNav, startProjectHref } from "@/config/site";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      {/* Desktop */}
      <nav aria-label="Primary" className="hidden items-center gap-10 lg:flex">
        <ul className="flex items-center gap-8">
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-small transition-colors hover:text-fg ${
                    active ? "text-fg" : "text-fg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href={startProjectHref}
          className="inline-flex min-h-10 items-center bg-accent px-4 text-small font-medium text-accent-fg transition-colors hover:bg-fg hover:text-surface"
        >
          Start a project
        </Link>
      </nav>

      {/* Mobile */}
      <button
        type="button"
        className="type-label -mr-2 inline-flex min-h-11 items-center px-2 lg:hidden"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close" : "Menu"}
      </button>

      <div
        id={menuId}
        hidden={!open}
        className="theme-ink fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t hairline lg:hidden"
      >
        <nav aria-label="Primary" className="flex min-h-full flex-col px-gutter pt-10 pb-12">
          <ul className="flex flex-col">
            {primaryNav.map((item, index) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="border-b hairline">
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className="flex items-baseline gap-4 py-4"
                  >
                    <span className="type-label text-fg-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`type-display text-display-md ${active ? "italic text-accent" : ""}`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={startProjectHref}
            onClick={close}
            className="mt-auto inline-flex min-h-14 items-center justify-between bg-accent px-5 font-medium text-accent-fg"
          >
            Start a project <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
