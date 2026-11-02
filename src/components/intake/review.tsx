"use client";

import type { IntakePath, StepId } from "@/content/intake";
import type { IntakeDraft } from "@/lib/intake/brief";
import { summarize } from "@/lib/intake/summary";

/** The whole brief, grouped by step, each with a way back to edit it. */
export function Review({
  path,
  draft,
  onEdit,
}: {
  path: IntakePath;
  draft: IntakeDraft;
  onEdit: (step: StepId) => void;
}) {
  return (
    <div className="space-y-10">
      {summarize(path, draft).map(({ step, title, rows }) => {
        return (
          <section key={step} aria-labelledby={`review-${step}`} className="border-t hairline pt-5">
            <div className="flex items-baseline justify-between gap-4">
              <h3 id={`review-${step}`} className="type-label text-fg-muted">
                {title}
              </h3>
              <button
                type="button"
                onClick={() => onEdit(step)}
                className="min-h-11 text-small font-medium underline decoration-1 underline-offset-4 hover:text-accent"
              >
                Edit<span className="sr-only"> {title.toLowerCase()}</span>
              </button>
            </div>
            <dl className="mt-2">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="grid gap-1 border-b hairline py-3 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:gap-6"
                >
                  <dt className="text-small text-fg-muted">{row.label}</dt>
                  <dd className="min-w-0 break-words whitespace-pre-line">{row.value ?? <Empty />}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function Empty() {
  return <span className="text-fg-muted">Not given</span>;
}
