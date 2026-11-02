"use client";

import { useActionState, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { rippleUnder, sinkIntoPool } from "@/components/brand/water/pool-events";
import { siteConfig } from "@/config/site";
import { sendContact, type ContactState } from "@/lib/contact/actions";
import { LIMITS, type FieldErrors } from "@/lib/contact/validate";

/*
 * Contact, inside the tank, in two steps:
 *
 * 1. "What should your website do?" The visitor types in place; each
 *    keystroke drops a small ripple in the pool. On send, the words sink
 *    to the pool floor (or simply fade, without the pool).
 * 2. Where to reply: email, and an optional name. This submits everything
 *    to the existing sendContact server action (honeypot, rate limit and
 *    both emails unchanged).
 *
 * Without JavaScript both steps show at once as one ordinary form, so it
 * still works: the steps are hidden only under html[data-js] (globals.css).
 */

type Step = "message" | "email";

const initialState: ContactState = { status: "idle", values: { name: "", email: "", message: "", link: "" } };

const line =
  "block w-full border-0 border-b bg-transparent px-0 text-fg caret-accent transition-colors placeholder:text-fg-muted/60 focus:outline-none focus-visible:outline-none";

export function TankContact() {
  const [state, action, pending] = useActionState(sendContact, initialState);
  const [step, setStep] = useState<Step>("message");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [sinking, setSinking] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);
  const timer = useRef(0);
  const focusStep = useRef(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  // After the visitor moves between steps, focus the new step's field once it's shown.
  useEffect(() => {
    if (!focusStep.current) return;
    focusStep.current = false;
    (step === "email" ? emailRef : messageRef).current?.focus();
  }, [step]);

  // After a response, move focus to what changed.
  useEffect(() => {
    if (state.status === "sent") doneRef.current?.focus();
    else if (state.status === "invalid") formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [state]);

  if (state.status === "sent") {
    return (
      <p ref={doneRef} tabIndex={-1} role="status" className="type-display text-center text-lede text-balance outline-none">
        Thank you. It’s in the water now, and a confirmation is on its way to your inbox.
      </p>
    );
  }

  const errors: FieldErrors = state.status === "invalid" ? state.errors : {};
  const shownMessageError = messageError ?? errors.message;

  /** Step 1 → 2: check the message, let it dissolve, then ask where to reply. */
  const sendMessage = () => {
    const text = message.trim();
    if (!text) {
      setMessageError("Tell us in a few words. A sentence is plenty.");
      messageRef.current?.focus();
      return;
    }
    if (text.length > LIMITS.message) {
      setMessageError(`Keep it under ${LIMITS.message.toLocaleString("en-CA")} characters; we can go into detail by email.`);
      return;
    }
    setMessageError(null);
    const inPool = messageRef.current ? sinkIntoPool(messageRef.current) : false;
    setSinking(true);
    timer.current = window.setTimeout(
      () => {
        setSinking(false);
        focusStep.current = true;
        setStep("email");
      },
      inPool ? 900 : 300,
    );
  };

  const onMessageKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter makes a new line.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  const editMessage = () => {
    focusStep.current = true;
    setStep("message");
  };

  return (
    <form ref={formRef} action={action} data-step={step} className="tank-contact relative grid gap-6">
      {/* Step 1: the message */}
      <div data-panel="message" className="grid gap-3">
        <label htmlFor="contact-message" className="type-display text-center text-lede text-fg-muted">
          What should your website do?
        </label>
        <textarea
          ref={messageRef}
          id="contact-message"
          name="message"
          rows={1}
          required
          maxLength={LIMITS.message}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            rippleUnder(e.target);
            if (messageError) setMessageError(null);
          }}
          onKeyDown={onMessageKey}
          aria-invalid={shownMessageError ? true : undefined}
          aria-describedby={shownMessageError ? "contact-message-error" : undefined}
          enterKeyHint="send"
          className={`${line} type-display field-sizing-content max-h-[calc(var(--vv-h,100dvh)*0.22)] min-h-[1lh] resize-none py-2 text-center text-lede leading-snug ${
            shownMessageError ? "border-accent" : "border-line focus:border-fg/50"
          } ${sinking ? "text-transparent transition-none" : ""}`}
        />
        {shownMessageError ? (
          <p id="contact-message-error" className="text-center text-small text-accent">
            {shownMessageError}
          </p>
        ) : null}
        <button
          type="button"
          data-js-only=""
          onClick={sendMessage}
          disabled={sinking}
          className="justify-self-center px-3 py-2 type-label text-fg-muted transition-colors hover:text-fg disabled:opacity-50"
        >
          Send <span aria-hidden="true">→</span>
        </button>
      </div>

      {/* Step 2: where to reply */}
      <div data-panel="email" className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="contact-email" className="type-display text-center text-lede text-fg-muted">
            Where should we reply?
          </label>
          <input
            ref={emailRef}
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            maxLength={LIMITS.email}
            defaultValue={state.values.email}
            onInput={(e) => rippleUnder(e.currentTarget)}
            placeholder="you@example.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={`${line} h-11 text-center text-body ${errors.email ? "border-accent" : "border-line focus:border-fg/50"}`}
          />
          {errors.email ? (
            <p id="contact-email-error" className="text-center text-small text-accent">
              {errors.email}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <label htmlFor="contact-name" className="text-center text-small text-fg-muted">
            Your name <span className="text-fg-muted/70">(optional)</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={LIMITS.name}
            defaultValue={state.values.name}
            onInput={(e) => rippleUnder(e.currentTarget)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={`${line} h-10 text-center text-body ${errors.name ? "border-accent" : "border-line focus:border-fg/50"}`}
          />
          {errors.name ? (
            <p id="contact-name-error" className="text-center text-small text-accent">
              {errors.name}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-center gap-6">
          <button type="button" data-js-only="" onClick={editMessage} className="px-2 py-2 type-label text-fg-muted transition-colors hover:text-fg">
            <span aria-hidden="true">←</span> Edit message
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center gap-2 bg-accent px-5 text-small font-medium text-accent-fg transition-colors hover:bg-fg hover:text-surface disabled:cursor-progress disabled:opacity-70"
          >
            {pending ? "Sending…" : "Send"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive technology; a bot that fills every field gives itself away. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="contact-hp">Leave this field empty</label>
        <input id="contact-hp" name="hp_confirm" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <p role="alert" className="text-center text-small text-accent empty:hidden">
        {state.status === "rate-limited"
          ? `Too many messages from this connection. Please try again in an hour, or write to ${siteConfig.email}.`
          : state.status === "error"
            ? `Your message couldn’t be sent just now. Please try again, or write to ${siteConfig.email}.`
            : step === "email" && errors.message
              ? errors.message
              : null}
      </p>
    </form>
  );
}
