"use client";

import { useId, useState, type FormEvent } from "react";

/**
 * The newsletter sign-up. In the demo nothing is sent or stored: the
 * address is discarded and the message says so.
 */
export function KilnLetter() {
  const [done, setDone] = useState(false);
  const emailId = useId();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setDone(true);
  }

  if (done) {
    return (
      <p role="status" className="leading-relaxed">
        <span className="argile-display block text-2xl italic">Merci.</span>
        <span className="mt-2 block text-demo-fg/85">
          This is a demonstration, so nothing was sent and your address was not saved.
        </span>
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor={emailId} className="sr-only">
        Email address
      </label>
      <input
        id={emailId}
        type="email"
        required
        autoComplete="email"
        placeholder="Your email address"
        className="h-12 min-w-0 flex-1 rounded-full border border-demo-fg/25 bg-[var(--argile-paper)] px-5 text-demo-fg placeholder:text-demo-fg/60"
      />
      <button
        type="submit"
        className="h-12 shrink-0 rounded-full bg-demo-fg px-6 font-medium text-[var(--argile-paper)] transition-colors hover:bg-demo-accent"
      >
        Sign up
      </button>
    </form>
  );
}
