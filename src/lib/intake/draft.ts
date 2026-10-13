"use client";

import { useSyncExternalStore } from "react";
import { isFunctionId, type FunctionId } from "@/content/capabilities";

/**
 * The visitor's in-progress project brief, kept in this browser until the
 * intake is submitted. The homepage explorer and imagination section write
 * to it; the intake at /start reads it to prefill the custom project inquiry.
 *
 * Later, an idea analysis (scope notes, a preliminary estimate) can be added
 * as a server-side step that reads `idea` and `functions` from the submitted
 * brief. Nothing here pretends one exists.
 */
export type IntakeDraft = {
  /** Free-text description from "What if your website could…" */
  idea: string;
  /** Selections from the functionality explorer, in the order chosen. */
  functions: FunctionId[];
};

const STORAGE_KEY = "intake-draft:v1";
const MAX_IDEA_LENGTH = 2000;
const EMPTY: IntakeDraft = { idea: "", functions: [] };

let current: IntakeDraft | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): IntakeDraft {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return EMPTY;
    const { idea, functions } = value as Record<string, unknown>;
    return {
      idea: typeof idea === "string" ? idea.slice(0, MAX_IDEA_LENGTH) : "",
      functions: Array.isArray(functions) ? functions.filter(isFunctionId) : [],
    };
  } catch {
    return EMPTY;
  }
}

function read(): IntakeDraft {
  if (current) return current;
  try {
    current = parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage can be unavailable (private mode, blocked site data). Keep the draft in memory.
    current = EMPTY;
  }
  return current;
}

function write(next: IntakeDraft) {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // In-memory state still works for this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep tabs in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    current = parse(event.newValue);
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const intakeDraft = {
  get: read,
  setIdea(idea: string) {
    write({ ...read(), idea: idea.slice(0, MAX_IDEA_LENGTH) });
  },
  toggleFunction(id: FunctionId) {
    const { functions } = read();
    write({
      ...read(),
      functions: functions.includes(id)
        ? functions.filter((value) => value !== id)
        : [...functions, id],
    });
  },
  clearFunctions() {
    write({ ...read(), functions: [] });
  },
  maxIdeaLength: MAX_IDEA_LENGTH,
};

/** Current draft. Renders empty on the server and before hydration. */
export function useIntakeDraft(): IntakeDraft {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
