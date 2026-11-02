"use client";

import { useActionState, useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { sendContact, type ContactState } from "@/lib/contact/actions";
import { LIMITS, type ContactFields } from "@/lib/contact/validate";

/*
 * The contact form. It posts to a server action, so it also works before
 * (or without) JavaScript. Every control has a visible label and an inline
 * error wired up with aria-describedby and aria-invalid.
 */

const initialState: ContactState = { status: "idle", values: { name: "", email: "", message: "", link: "" } };

const fieldId = (name: keyof ContactFields) => `contact-${name}`;
const errorId = (name: keyof ContactFields) => `contact-${name}-error`;

const control =
  "mt-3 block w-full border bg-surface-raised px-4 text-body text-fg transition-colors placeholder:text-fg-muted/70 hover:border-fg/40 focus:border-fg";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContact, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);

  // After a response, move focus to what changed: the confirmation, or the first field to fix.
  useEffect(() => {
    if (state.status === "sent") doneRef.current?.focus();
    else if (state.status === "invalid") formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [state]);

  if (state.status === "sent") {
    return (
      <p ref={doneRef} tabIndex={-1} role="status" className="type-display mt-2 text-heading outline-none">
        Thank you. Your message has arrived, and a confirmation is on its way to your inbox.
      </p>
    );
  }

  const { values } = state;
  const errors = state.status === "invalid" ? state.errors : {};

  return (
    <form ref={formRef} action={action} className="relative grid gap-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <Field name="name" label="Name" error={errors.name}>
          <input
            type="text"
            autoComplete="name"
            required
            maxLength={LIMITS.name}
            defaultValue={values.name}
            {...controlProps("name", errors.name)}
            className={`${control} h-13 ${border(errors.name)}`}
          />
        </Field>
        <Field name="email" label="Email" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            maxLength={LIMITS.email}
            defaultValue={values.email}
            {...controlProps("email", errors.email)}
            className={`${control} h-13 ${border(errors.email)}`}
          />
        </Field>
      </div>

      <Field name="message" label="What do you have in mind?" error={errors.message}>
        <textarea
          rows={5}
          required
          maxLength={LIMITS.message}
          defaultValue={values.message}
          {...controlProps("message", errors.message)}
          className={`${control} field-sizing-content min-h-[calc(var(--spacing)*6+5lh)] resize-y py-3 leading-relaxed ${border(errors.message)}`}
        />
      </Field>

      <Field name="link" label="A link" optional error={errors.link}>
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          placeholder="example.com"
          maxLength={LIMITS.link}
          defaultValue={values.link}
          {...controlProps("link", errors.link)}
          className={`${control} h-13 ${border(errors.link)}`}
        />
      </Field>

      {/* Honeypot: hidden from people and assistive technology; a bot that fills every field gives itself away. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="contact-hp">Leave this field empty</label>
        <input id="contact-hp" name="hp_confirm" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex min-h-12 items-center gap-3 self-start bg-accent px-5 text-small font-medium text-accent-fg transition-colors hover:bg-fg hover:text-surface disabled:cursor-progress disabled:opacity-70"
        >
          <span>{pending ? "Sending…" : "Send"}</span>
          <span aria-hidden="true" className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
            →
          </span>
        </button>
        <p role="alert" className="text-small text-accent">
          {state.status === "rate-limited"
            ? `Too many messages from this connection. Please try again in an hour, or write to ${siteConfig.email}.`
            : state.status === "error"
              ? `Your message couldn’t be sent just now. Please try again, or write to ${siteConfig.email}.`
              : null}
        </p>
      </div>
    </form>
  );
}

function controlProps(name: keyof ContactFields, error?: string): ComponentProps<"input"> & ComponentProps<"textarea"> {
  return {
    id: fieldId(name),
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId(name) : undefined,
  };
}

const border = (error?: string) => (error ? "border-accent" : "border-line");

function Field({
  name,
  label,
  optional,
  error,
  children,
}: {
  name: keyof ContactFields;
  label: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={fieldId(name)} className="font-medium">
        {label}
        {optional ? <span className="ml-2 text-small font-normal text-fg-muted">Optional</span> : null}
      </label>
      {children}
      {error ? (
        <p id={errorId(name)} className="mt-2 flex gap-2 text-small text-accent">
          <span aria-hidden="true">!</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}
