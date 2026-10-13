"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { functionLabel, functionOptions } from "@/content/capabilities";
import { intakeDraft, useIntakeDraft } from "@/lib/intake/draft";

/**
 * Toggle what the website should do. Choices are saved to the intake draft
 * immediately, so they survive navigation and prefill the project brief.
 */
export function FunctionalityExplorer() {
  const { functions } = useIntakeDraft();
  const count = functions.length;

  return (
    <section aria-labelledby="explorer-title" className="theme-paper pb-section">
      <Container>
        <div className="border-t hairline pt-section">
          <div className="grid gap-8 md:grid-cols-12 md:gap-x-gutter">
            <div className="md:col-span-8">
              <SectionLabel index="03">Functionality</SectionLabel>
              <h2 id="explorer-title" className="type-display mt-6 text-display-md">
                What do you want your website to do?
              </h2>
            </div>
            <p className="text-fg-muted md:col-span-4 md:self-end">
              Choose as many as you like. Your choices are saved in this browser and carried into
              your project brief.
            </p>
          </div>

          <ul
            aria-label="Website functions"
            className="mt-12 grid border-t hairline sm:grid-cols-2 sm:gap-x-gutter md:mt-16"
          >
            {functionOptions.map((option, index) => {
              const selected = functions.includes(option.id);
              return (
                <li key={option.id} className="border-b hairline">
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => intakeDraft.toggleFunction(option.id)}
                    className={`group -mx-3 flex min-h-16 w-[calc(100%+1.5rem)] items-center gap-4 px-3 text-left transition-colors duration-300 ${
                      selected ? "bg-fg text-surface" : "hover:bg-fg/5"
                    }`}
                  >
                    <span aria-hidden="true" className={`type-label w-6 shrink-0 ${selected ? "text-surface/60" : "text-fg-muted"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-lede">{option.label}</span>
                    <span
                      aria-hidden="true"
                      className={`grid size-6 shrink-0 place-items-center border text-[0.8125rem] transition-colors ${
                        selected ? "border-accent bg-accent text-accent-fg" : "border-current opacity-40 group-hover:opacity-80"
                      }`}
                    >
                      {selected ? "✓" : "+"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-10 grid gap-6 md:grid-cols-12 md:items-center md:gap-x-gutter">
            <div className="md:col-span-7">
              <p className="type-label text-fg-muted" aria-live="polite">
                {count === 0 ? "Nothing selected yet" : `${count} selected`}
              </p>
              {count > 0 ? (
                <p className="mt-2 max-w-[60ch]">
                  {functions.map(functionLabel).join(", ")}.
                </p>
              ) : null}
              {functions.includes("other") ? (
                <p className="mt-2 text-fg-muted">
                  Something different?{" "}
                  <Link href="/#imagine" className="text-fg underline decoration-1 underline-offset-4 hover:text-accent">
                    Describe it in your own words.
                  </Link>
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:col-span-5 md:justify-end">
              {count > 0 ? (
                <button
                  type="button"
                  onClick={intakeDraft.clearFunctions}
                  className="min-h-12 px-5 text-small text-fg-muted underline decoration-1 underline-offset-4 hover:text-fg"
                >
                  Clear
                </button>
              ) : null}
              <ButtonLink href="/start">
                {count > 0 ? "Continue with these" : "Start a project brief"}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
