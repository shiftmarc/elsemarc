"use client";

import { useRef, type MouseEvent } from "react";

/**
 * "info & pricing": a small link in the bottom-left corner (styled like the
 * corner email) that opens a panel over the pool.
 *
 * The panel is a native <dialog> opened with showModal(), which traps
 * focus, closes on Escape, makes the page behind inert, and returns focus
 * to the link. Tapping outside it or the × closes it too.
 *
 * Without JavaScript the link and × are plain anchors (#pricing and #), and
 * CSS shows the dialog while it's the URL's target, so it still opens.
 */
export function PricingPanel() {
  const dialog = useRef<HTMLDialogElement>(null);

  const open = (e: MouseEvent) => {
    const d = dialog.current;
    if (!d?.showModal) return; // no <dialog> support: let the #pricing link do it
    e.preventDefault();
    d.showModal();
  };

  const close = (e: MouseEvent) => {
    const d = dialog.current;
    if (!d?.open) return;
    e.preventDefault();
    d.close();
  };

  // A click on the dialog element itself (not its content) is on the backdrop.
  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) e.currentTarget.close();
  };

  return (
    <>
      <a
        href="#pricing"
        onClick={open}
        aria-haspopup="dialog"
        className="tank-corner absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-gutter text-fg-muted transition-colors hover:text-fg"
      >
        info &amp; pricing
      </a>

      <dialog ref={dialog} id="pricing" aria-labelledby="pricing-title" onClick={onDialogClick} className="pricing-panel">
        <div className="grid gap-6 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id="pricing-title" className="type-display text-heading text-fg">
              Info &amp; pricing
            </h2>
            <a
              href="#"
              onClick={close}
              aria-label="Close"
              className="-mt-1 -mr-2 grid size-10 shrink-0 place-items-center text-2xl leading-none text-fg-muted transition-colors hover:text-fg"
            >
              <span aria-hidden="true">×</span>
            </a>
          </div>

          <dl className="grid gap-5">
            <div className="grid gap-1">
              <dt className="type-label text-fg-muted">Websites</dt>
              <dd className="type-display text-lede text-fg">from $999 CAD</dd>
              <dd className="text-small text-fg-muted">Designed for you, up to 5 pages, mobile-ready, 10 rounds of revisions.</dd>
            </div>
            <div className="grid gap-1">
              <dt className="type-label text-fg-muted">Custom features</dt>
              <dd className="type-display text-lede text-fg">priced individually</dd>
              <dd className="text-small text-fg-muted">Bookings, payments, accounts and more.</dd>
            </div>
            <div className="grid gap-1">
              <dt className="type-label text-fg-muted">Care &amp; hosting</dt>
              <dd className="type-display text-lede text-fg">from $59 CAD/month</dd>
              <dd className="text-small text-fg-muted">Optional.</dd>
            </div>
          </dl>

          <div className="grid gap-3 border-t border-line pt-5">
            <h3 className="type-label text-fg-muted">How it works</h3>
            <ol className="pricing-steps grid gap-2 text-small text-fg">
              <li>Tell us your idea.</li>
              <li>Receive a written scope and price.</li>
              <li>50% deposit to start.</li>
              <li>Built in about 2–3 weeks.</li>
              <li>50% at launch.</li>
            </ol>
          </div>

          <p className="text-small text-fg-muted">Domain and third-party fees not included.</p>
        </div>
      </dialog>
    </>
  );
}
