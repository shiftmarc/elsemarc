"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { functionLabel } from "@/content/capabilities";
import { intakeDraft, useIntakeDraft } from "@/lib/intake/draft";

/**
 * What the visitor has told us so far, from the homepage explorer and the
 * imagination section. An `?idea=` param (the imagination form, or a shared
 * link) takes precedence and is saved to the draft.
 *
 * Temporary: the multi-step intake will absorb this as its first step.
 */
export function BriefSoFar() {
  const ideaParam = useSearchParams().get("idea")?.trim();
  const draft = useIntakeDraft();

  useEffect(() => {
    if (ideaParam && ideaParam !== intakeDraft.get().idea) intakeDraft.setIdea(ideaParam);
  }, [ideaParam]);

  const idea = ideaParam || draft.idea;
  const { functions } = draft;

  if (!idea && functions.length === 0) {
    return (
      <p className="text-fg-muted">
        Nothing yet.{" "}
        <Link href="/#imagine" className="text-fg underline decoration-1 underline-offset-4 hover:text-accent">
          Describe your idea
        </Link>{" "}
        or{" "}
        <Link href="/websites" className="text-fg underline decoration-1 underline-offset-4 hover:text-accent">
          choose a design
        </Link>
        .
      </p>
    );
  }

  return (
    <dl className="grid gap-8 md:grid-cols-12 md:gap-x-gutter">
      {idea ? (
        <div className="md:col-span-7">
          <dt className="type-label text-fg-muted">Your idea</dt>
          <dd className="type-display mt-3 text-heading italic">“{idea}”</dd>
        </div>
      ) : null}
      {functions.length > 0 ? (
        <div className="md:col-span-4 md:col-start-9">
          <dt className="type-label text-fg-muted">Your website should</dt>
          <dd className="mt-3">
            <ul>
              {functions.map((id) => (
                <li key={id} className="border-b hairline py-2">
                  {functionLabel(id)}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
