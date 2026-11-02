import { functionLabel } from "@/content/capabilities";
import { getConcept } from "@/content/concepts";
import {
  budgetOptions,
  businessCategories,
  colourOptions,
  contentOptions,
  domainOptions,
  imageOptions,
  labelOf,
  logoOptions,
  pageOptions,
  stepsFor,
  timelineOptions,
  userOptions,
  type IntakePath,
  type StepId,
} from "@/content/intake";
import type { IntakeDraft } from "./brief";

/**
 * The brief in words, grouped by step. Shared by the review step and the
 * notification email, so both describe a brief the same way. A null value
 * means the question was not answered.
 */
export type SummaryRow = { label: string; value: string | null };
export type SummarySection = { step: StepId; title: string; rows: SummaryRow[] };

const or = (value: string) => value.trim() || null;
const list = (values: string[]) => (values.length ? values.join(", ") : null);
const option = (options: Parameters<typeof labelOf>[0], value: string) => (value ? labelOf(options, value) : null);

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function summarize(path: IntakePath, draft: IntakeDraft): SummarySection[] {
  const sections = path === "website" ? websiteSections(draft) : customSections(draft);
  const steps = stepsFor(path);
  return sections.map((section) => ({
    ...section,
    title: steps.find((step) => step.id === section.step)?.title ?? section.step,
  }));
}

function websiteSections(draft: IntakeDraft): Omit<SummarySection, "title">[] {
  const w = draft.website;
  const design = getConcept(draft.design);
  return [
    {
      step: "design",
      rows: [{ label: "Design", value: design ? `${design.index} — ${design.title}` : null }],
    },
    {
      step: "business",
      rows: [
        { label: "Business name", value: or(draft.businessName) },
        {
          label: "Kind of business",
          value: w.businessCategory === "other" ? or(w.businessCategoryOther) : option(businessCategories, w.businessCategory),
        },
        { label: "Your name", value: or(draft.contact.name) },
        { label: "Email", value: or(draft.contact.email) },
        {
          label: "Current website",
          value: w.hasWebsite === "yes" ? or(w.websiteUrl) : w.hasWebsite === "no" ? "None" : null,
        },
      ],
    },
    {
      step: "pages",
      rows: [
        {
          label: "Pages",
          value: list([...w.pages.map((page) => labelOf(pageOptions, page)), ...(w.otherPages.trim() ? [w.otherPages.trim()] : [])]),
        },
        { label: "Text", value: option(contentOptions, w.content) },
        { label: "Images", value: option(imageOptions, w.images) },
      ],
    },
    {
      step: "brand",
      rows: [
        { label: "Logo", value: option(logoOptions, w.hasLogo) },
        {
          label: "Files",
          value: list(w.assets.map((asset) => (asset.size ? `${asset.name} (${formatBytes(asset.size)})` : asset.name))),
        },
        {
          label: "Colours",
          value:
            w.colours === "brand"
              ? `${labelOf(colourOptions, w.colours)}: ${w.brandColours.trim()}`
              : option(colourOptions, w.colours),
        },
      ],
    },
    {
      step: "details",
      rows: [
        {
          label: "Domain",
          value: w.domain === "own" ? `${labelOf(domainOptions, w.domain)}: ${w.domainName.trim()}` : option(domainOptions, w.domain),
        },
        { label: "Anything else", value: or(w.notes) },
      ],
    },
  ];
}

function customSections(draft: IntakeDraft): Omit<SummarySection, "title">[] {
  const c = draft.custom;
  return [
    { step: "project", rows: [{ label: "Your project", value: or(draft.idea) }] },
    {
      step: "functionality",
      rows: [
        { label: "It should", value: list(draft.functions.map(functionLabel)) },
        { label: "More specifically", value: or(c.functionNotes) },
      ],
    },
    {
      step: "people",
      rows: [
        { label: "Used by", value: list(c.users.map((user) => labelOf(userOptions, user))) },
        { label: "About them", value: or(c.userNotes) },
        { label: "Works with", value: or(c.integrations) },
      ],
    },
    {
      step: "budget",
      rows: [
        {
          label: "Budget",
          value: !c.budget ? null : c.budget === "unsure" ? labelOf(budgetOptions, c.budget) : `${labelOf(budgetOptions, c.budget)} CAD`,
        },
        { label: "Ready", value: option(timelineOptions, c.timeline) },
        { label: "Date or reason", value: or(c.deadline) },
      ],
    },
    {
      step: "contact",
      rows: [
        { label: "Your name", value: or(draft.contact.name) },
        { label: "Email", value: or(draft.contact.email) },
        { label: "Business name", value: or(draft.businessName) },
      ],
    },
  ];
}
