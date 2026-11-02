"use client";

import { useSyncExternalStore } from "react";
import type { FunctionId } from "@/content/capabilities";
import { getConcept } from "@/content/concepts";
import {
  EMPTY_DRAFT,
  MAX_IDEA_LENGTH,
  MAX_ASSETS,
  normalizeDraft,
  type CustomBrief,
  type IntakeDraft,
  type UploadedAsset,
  type WebsiteBrief,
} from "./brief";

export type { CustomBrief, IntakeDraft, UploadedAsset, WebsiteBrief } from "./brief";
export { EMPTY_DRAFT } from "./brief";

/**
 * The visitor's in-progress project brief, kept in this browser until the
 * intake is submitted. The homepage explorer and imagination section write
 * to it, a demo's "Choose this design" sets `design`, and the intake at
 * /start reads and completes it, saving on every change.
 *
 * `idea`, `functions` and `design` are shared with the rest of the site:
 * the idea becomes the custom project description, the explorer's choices
 * become its functionality, and the design is the website's starting point.
 *
 * The draft's shape and sanitising live in ./brief, shared with the server.
 *
 * Later, an idea analysis (scope notes, a preliminary estimate) can be added
 * as a server-side step that reads the submitted brief. Nothing here
 * pretends one exists.
 */
const STORAGE_KEY = "intake-draft:v1";

function parse(raw: string | null): IntakeDraft {
  if (!raw) return EMPTY_DRAFT;
  try {
    return normalizeDraft(JSON.parse(raw));
  } catch {
    return EMPTY_DRAFT;
  }
}

/* Store ------------------------------------------------------------------- */

let current: IntakeDraft | null = null;
const listeners = new Set<() => void>();

function read(): IntakeDraft {
  if (current) return current;
  try {
    current = parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage can be unavailable (private mode, blocked site data). Keep the draft in memory.
    current = EMPTY_DRAFT;
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
  /** Ignores slugs that are not a known concept. */
  setDesign(slug: string) {
    if (slug && !getConcept(slug)) return;
    write({ ...read(), design: slug });
  },
  /** Top-level fields: path, step, business name. */
  update(patch: Partial<Pick<IntakeDraft, "path" | "step" | "businessName">>) {
    write({ ...read(), ...patch });
  },
  updateContact(patch: Partial<IntakeDraft["contact"]>) {
    const draft = read();
    write({ ...draft, contact: { ...draft.contact, ...patch } });
  },
  updateWebsite(patch: Partial<WebsiteBrief>) {
    const draft = read();
    write({ ...draft, website: { ...draft.website, ...patch } });
  },
  updateCustom(patch: Partial<CustomBrief>) {
    const draft = read();
    write({ ...draft, custom: { ...draft.custom, ...patch } });
  },
  /** Brand assets: added once uploaded, removed from the brief only (the file stays in storage). */
  addAsset(asset: UploadedAsset) {
    const draft = read();
    const assets = [...draft.website.assets.filter((item) => item.path !== asset.path), asset].slice(0, MAX_ASSETS);
    write({ ...draft, website: { ...draft.website, assets } });
  },
  removeAsset(path: string) {
    const draft = read();
    write({ ...draft, website: { ...draft.website, assets: draft.website.assets.filter((item) => item.path !== path) } });
  },
  /** The id this brief is saved under; created on the first submit and reused for retries. */
  submissionId(): string {
    const draft = read();
    if (draft.submissionId) return draft.submissionId;
    const submissionId = crypto.randomUUID();
    write({ ...draft, submissionId });
    return submissionId;
  },
  /** Forget everything, including choices made elsewhere on the site. */
  reset() {
    write(EMPTY_DRAFT);
  },
  maxIdeaLength: MAX_IDEA_LENGTH,
};

/** Current draft. Renders empty on the server and before hydration. */
export function useIntakeDraft(): IntakeDraft {
  return useSyncExternalStore(subscribe, read, () => EMPTY_DRAFT);
}

const noop = () => () => {};

/** False on the server and during hydration, true once the saved draft can be read. */
export function useDraftReady(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
