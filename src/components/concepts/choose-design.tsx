"use client";

import Link from "next/link";
import type { Concept } from "@/content/concepts";
import { intakeDraft, useIntakeDraft } from "@/lib/intake/draft";

/**
 * "Choose this design": saves the concept to the intake draft and goes to
 * /start. The `?design=` parameter carries the choice too, so the link still
 * works before hydration or without JavaScript.
 */
export function ChooseDesignLink({ concept, className = "" }: { concept: Concept; className?: string }) {
  return (
    <Link
      href={`/start?design=${concept.slug}`}
      onClick={() => intakeDraft.setDesign(concept.slug)}
      className={`group inline-flex min-h-12 items-center gap-3 bg-accent px-5 text-small font-medium text-accent-fg transition-colors hover:bg-fg hover:text-surface ${className}`}
    >
      <span>
        Choose this design<span className="sr-only">: {concept.title}</span>
      </span>
      <span
        aria-hidden="true"
        className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}

/** A quiet note when this concept is already the visitor's chosen design. */
export function ChosenDesignNote({ concept }: { concept: Concept }) {
  const { design } = useIntakeDraft();
  if (design !== concept.slug) return null;
  return (
    <p className="type-label flex items-center gap-2 text-accent">
      <span aria-hidden="true" className="size-1.5 bg-accent" />
      In your brief
    </p>
  );
}
