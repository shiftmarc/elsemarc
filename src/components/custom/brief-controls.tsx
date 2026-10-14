"use client";

import Link from "next/link";
import { functionLabel, type FunctionId } from "@/content/capabilities";
import { intakeDraft, useIntakeDraft } from "@/lib/intake/draft";

/**
 * Adds one of the explorer's functions to the visitor's brief, or takes it
 * out again. Shares the intake draft with the homepage explorer, so a choice
 * made in either place shows in both and prefills /start.
 */
export function BriefToggle({ functionId, title }: { functionId: FunctionId; title: string }) {
  const { functions } = useIntakeDraft();
  const added = functions.includes(functionId);
  return (
    <button
      type="button"
      aria-pressed={added}
      onClick={() => intakeDraft.toggleFunction(functionId)}
      className={`group inline-flex min-h-12 items-center gap-3 border px-4 text-small transition-colors ${
        added ? "border-fg bg-fg text-surface" : "border-current hover:bg-fg/5"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid size-5 shrink-0 place-items-center border text-[0.75rem] ${
          added ? "border-accent bg-accent text-accent-fg" : "border-current opacity-50"
        }`}
      >
        {added ? "✓" : "+"}
      </span>
      <span>
        {added ? "In your brief" : "Add to my brief"}
        <span className="sr-only">: {title}</span>
      </span>{" "}
      <span className={`hidden sm:inline ${added ? "text-surface/60" : "text-fg-muted"}`}>
        as “{functionLabel(functionId)}”
      </span>
    </button>
  );
}

/** What the brief holds so far, and the way into the intake. */
export function BriefSummary() {
  const { functions, idea } = useIntakeDraft();
  const count = functions.length;
  return (
    <div className="grid gap-6 md:grid-cols-12 md:items-center md:gap-x-gutter">
      <div className="md:col-span-7">
        <p className="type-label text-fg-muted" aria-live="polite">
          {count === 0 ? "Your brief is empty so far" : `${count} in your brief`}
        </p>
        {count > 0 ? (
          <p className="mt-2 max-w-[60ch]">{functions.map(functionLabel).join(", ")}.</p>
        ) : (
          <p className="mt-2 max-w-[60ch] text-fg-muted">
            Add anything above that sounds close, or simply describe your idea in the brief.
          </p>
        )}
        {idea ? (
          <p className="mt-2 max-w-[60ch] text-fg-muted">
            Plus your idea: <span className="italic">“{idea.length > 90 ? `${idea.slice(0, 90)}…` : idea}”</span>
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
        <Link
          href="/start"
          className="group inline-flex min-h-12 items-center gap-3 bg-accent px-5 text-small font-medium text-accent-fg transition-colors hover:bg-fg hover:text-surface"
        >
          <span>{count > 0 ? "Continue to your brief" : "Start a custom brief"}</span>
          <span aria-hidden="true" className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
