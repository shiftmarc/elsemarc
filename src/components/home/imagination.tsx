"use client";

import Form from "next/form";
import { useId, useState } from "react";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { intakeDraft, useIntakeDraft } from "@/lib/intake/draft";

const suggestions = [
  "take deposits for private events and remind guests the day before",
  "let clients upload documents and see where their file is at",
  "build a quote from a few questions and email it instantly",
];

/**
 * Captures the visitor's idea in their own words. Submitting navigates to
 * /start?idea=… (works without JavaScript) and saves the idea to the intake
 * draft. No analysis happens here; see lib/intake/draft for where it would go.
 */
export function Imagination() {
  const { idea } = useIntakeDraft();
  const [error, setError] = useState(false);
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  return (
    <section id="imagine" aria-labelledby="imagine-title" className="py-section">
      <Container>
        <SectionLabel index="04">Imagine</SectionLabel>
        <h2 id="imagine-title" className="type-display mt-6 text-display-xl">
          What if your website <span className="italic">could…</span>
        </h2>

        <Form
          action="/start"
          noValidate
          onSubmit={(event) => {
            const value = new FormData(event.currentTarget).get("idea");
            if (typeof value !== "string" || value.trim() === "") {
              event.preventDefault();
              setError(true);
              document.getElementById(inputId)?.focus();
              return;
            }
            intakeDraft.setIdea(value.trim());
          }}
          className="mt-12 md:mt-20"
        >
          <label htmlFor={inputId} className="sr-only">
            Describe what you want your website to do
          </label>
          <textarea
            id={inputId}
            name="idea"
            rows={3}
            maxLength={intakeDraft.maxIdeaLength}
            value={idea}
            onChange={(event) => {
              intakeDraft.setIdea(event.target.value);
              if (error) setError(false);
            }}
            placeholder="Automatically take bookings, send confirmations, and remember my customers…"
            aria-describedby={error ? `${errorId} ${hintId}` : hintId}
            aria-invalid={error || undefined}
            className="type-display field-sizing-content block min-h-[3lh] w-full resize-none border-b-2 border-fg/25 bg-transparent pb-6 text-heading text-fg italic md:text-display-md transition-colors placeholder:text-fg/40 focus:border-accent focus:outline-none focus-visible:outline-none"
          />

          {error ? (
            <p id={errorId} className="mt-4 text-small text-accent">
              Write a few words about your idea first. A single sentence is plenty.
            </p>
          ) : null}

          <div className="mt-8 grid gap-10 md:grid-cols-12 md:gap-x-gutter">
            <div className="md:col-span-7">
              <p className="type-label text-fg-muted">Or start from</p>
              <ul className="mt-4 flex flex-col items-start gap-2">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => {
                        intakeDraft.setIdea(suggestion.charAt(0).toUpperCase() + suggestion.slice(1));
                        setError(false);
                      }}
                      className="text-left text-fg-muted underline decoration-line decoration-1 underline-offset-4 transition-colors hover:text-fg hover:decoration-current"
                    >
                      …{suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-start gap-4 md:col-span-5 md:items-end">
              <button
                type="submit"
                className="group inline-flex min-h-14 items-center gap-4 bg-accent px-6 text-lede font-medium text-accent-fg transition-colors hover:bg-fg hover:text-surface"
              >
                Explore your idea
                <span
                  aria-hidden="true"
                  className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
                >
                  →
                </span>
              </button>
              <p id={hintId} className="max-w-[36ch] text-small text-fg-muted md:text-right">
                Your idea becomes the start of a short project brief. Scope and price come back to
                you in writing.
              </p>
            </div>
          </div>
        </Form>
      </Container>
    </section>
  );
}
