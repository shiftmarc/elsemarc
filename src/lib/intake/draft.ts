"use client";

import { useSyncExternalStore } from "react";
import { isFunctionId, type FunctionId } from "@/content/capabilities";
import { getConcept } from "@/content/concepts";
import {
  budgetOptions,
  businessCategories,
  colourOptions,
  contentOptions,
  customSteps,
  domainOptions,
  imageOptions,
  intakePaths,
  logoOptions,
  pageOptions,
  timelineOptions,
  userOptions,
  websiteSteps,
  yesNo,
  type IntakePath,
  type Option,
  type StepId,
} from "@/content/intake";

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
 * Later, an idea analysis (scope notes, a preliminary estimate) can be added
 * as a server-side step that reads the submitted brief. Nothing here
 * pretends one exists.
 */
export type WebsiteBrief = {
  businessCategory: string;
  businessCategoryOther: string;
  hasWebsite: string;
  websiteUrl: string;
  pages: string[];
  otherPages: string;
  hasLogo: string;
  /** Names of files chosen in the picker. Nothing is uploaded yet. */
  assetNames: string[];
  colours: string;
  brandColours: string;
  content: string;
  images: string;
  domain: string;
  domainName: string;
  notes: string;
};

export type CustomBrief = {
  functionNotes: string;
  users: string[];
  userNotes: string;
  integrations: string;
  budget: string;
  timeline: string;
  deadline: string;
};

export type IntakeDraft = {
  /** Free-text description from "What if your website could…"; the custom project description. */
  idea: string;
  /** Selections from the functionality explorer, in the order chosen. */
  functions: FunctionId[];
  /** Slug of the chosen demonstration concept, or "" for none. */
  design: string;
  /** The intake path, or "" until chosen. */
  path: IntakePath | "";
  /** The step the visitor was last on, so they return to it. */
  step: StepId | "";
  businessName: string;
  contact: { name: string; email: string };
  website: WebsiteBrief;
  custom: CustomBrief;
};

const STORAGE_KEY = "intake-draft:v1";
const MAX_IDEA_LENGTH = 2000;
const MAX_TEXT_LENGTH = 2000;

const EMPTY_WEBSITE: WebsiteBrief = {
  businessCategory: "",
  businessCategoryOther: "",
  hasWebsite: "",
  websiteUrl: "",
  pages: [],
  otherPages: "",
  hasLogo: "",
  assetNames: [],
  colours: "",
  brandColours: "",
  content: "",
  images: "",
  domain: "",
  domainName: "",
  notes: "",
};

const EMPTY_CUSTOM: CustomBrief = {
  functionNotes: "",
  users: [],
  userNotes: "",
  integrations: "",
  budget: "",
  timeline: "",
  deadline: "",
};

export const EMPTY_DRAFT: IntakeDraft = {
  idea: "",
  functions: [],
  design: "",
  path: "",
  step: "",
  businessName: "",
  contact: { name: "", email: "" },
  website: EMPTY_WEBSITE,
  custom: EMPTY_CUSTOM,
};

/* Parsing: stored drafts are untrusted, and may predate newer fields. ------ */

type Loose = Record<string, unknown>;

const record = (value: unknown): Loose =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Loose) : {};

const text = (value: unknown, max = MAX_TEXT_LENGTH) =>
  typeof value === "string" ? value.slice(0, max) : "";

const choice = (options: readonly Option[], value: unknown) =>
  typeof value === "string" && options.some((option) => option.value === value) ? value : "";

const choices = (options: readonly Option[], value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => options.some((option) => option.value === item))
    : [];

const names = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 20).map((item) => item.slice(0, 200))
    : [];

const stepIds = new Set<string>([...websiteSteps, ...customSteps].map((step) => step.id));

function parse(raw: string | null): IntakeDraft {
  if (!raw) return EMPTY_DRAFT;
  try {
    const value = record(JSON.parse(raw));
    const website = record(value.website);
    const custom = record(value.custom);
    const contact = record(value.contact);
    return {
      idea: text(value.idea, MAX_IDEA_LENGTH),
      functions: Array.isArray(value.functions) ? value.functions.filter(isFunctionId) : [],
      design: typeof value.design === "string" && getConcept(value.design) ? value.design : "",
      path: choice(intakePaths, value.path) as IntakePath | "",
      step: typeof value.step === "string" && stepIds.has(value.step) ? (value.step as StepId) : "",
      businessName: text(value.businessName, 200),
      contact: { name: text(contact.name, 200), email: text(contact.email, 254) },
      website: {
        businessCategory: choice(businessCategories, website.businessCategory),
        businessCategoryOther: text(website.businessCategoryOther, 200),
        hasWebsite: choice(yesNo, website.hasWebsite),
        websiteUrl: text(website.websiteUrl, 500),
        pages: choices(pageOptions, website.pages),
        otherPages: text(website.otherPages, 500),
        hasLogo: choice(logoOptions, website.hasLogo),
        assetNames: names(website.assetNames),
        colours: choice(colourOptions, website.colours),
        brandColours: text(website.brandColours, 500),
        content: choice(contentOptions, website.content),
        images: choice(imageOptions, website.images),
        domain: choice(domainOptions, website.domain),
        domainName: text(website.domainName, 253),
        notes: text(website.notes),
      },
      custom: {
        functionNotes: text(custom.functionNotes),
        users: choices(userOptions, custom.users),
        userNotes: text(custom.userNotes),
        integrations: text(custom.integrations),
        budget: choice(budgetOptions, custom.budget),
        timeline: choice(timelineOptions, custom.timeline),
        deadline: text(custom.deadline, 200),
      },
    };
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
