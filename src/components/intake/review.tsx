"use client";

import type { ReactNode } from "react";
import { functionLabel } from "@/content/capabilities";
import { getConcept } from "@/content/concepts";
import {
  budgetOptions,
  businessCategories,
  colourOptions,
  contentOptions,
  customSteps,
  domainOptions,
  imageOptions,
  labelOf,
  logoOptions,
  pageOptions,
  timelineOptions,
  userOptions,
  websiteSteps,
  type IntakePath,
  type StepId,
} from "@/content/intake";
import type { IntakeDraft } from "@/lib/intake/draft";

type Row = { label: string; value: ReactNode };

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
  const sections = path === "website" ? websiteSections(draft) : customSections(draft);
  const steps = path === "website" ? websiteSteps : customSteps;
  return (
    <div className="space-y-10">
      {sections.map(({ step, rows }) => {
        const title = steps.find((value) => value.id === step)?.title ?? step;
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
                  <dd className="min-w-0 break-words whitespace-pre-line">{row.value}</dd>
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

const or = (value: string): ReactNode => (value.trim() ? value.trim() : <Empty />);
const list = (values: string[]): ReactNode => (values.length ? values.join(", ") : <Empty />);

function websiteSections(draft: IntakeDraft): { step: StepId; rows: Row[] }[] {
  const w = draft.website;
  const design = getConcept(draft.design);
  return [
    {
      step: "design",
      rows: [{ label: "Design", value: design ? `${design.index} — ${design.title}` : <Empty /> }],
    },
    {
      step: "business",
      rows: [
        { label: "Business name", value: or(draft.businessName) },
        {
          label: "Kind of business",
          value:
            w.businessCategory === "other"
              ? or(w.businessCategoryOther)
              : w.businessCategory
                ? labelOf(businessCategories, w.businessCategory)
                : <Empty />,
        },
        { label: "Your name", value: or(draft.contact.name) },
        { label: "Email", value: or(draft.contact.email) },
        {
          label: "Current website",
          value: w.hasWebsite === "yes" ? or(w.websiteUrl) : w.hasWebsite === "no" ? "None" : <Empty />,
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
        { label: "Text", value: w.content ? labelOf(contentOptions, w.content) : <Empty /> },
        { label: "Images", value: w.images ? labelOf(imageOptions, w.images) : <Empty /> },
      ],
    },
    {
      step: "brand",
      rows: [
        { label: "Logo", value: w.hasLogo ? labelOf(logoOptions, w.hasLogo) : <Empty /> },
        {
          label: "Files noted",
          value: w.assetNames.length ? (
            <>
              {w.assetNames.join(", ")}
              <span className="mt-1 block text-small text-fg-muted">Not uploaded in this preview.</span>
            </>
          ) : (
            <Empty />
          ),
        },
        {
          label: "Colours",
          value:
            w.colours === "brand"
              ? `${labelOf(colourOptions, w.colours)}: ${w.brandColours.trim()}`
              : w.colours
                ? labelOf(colourOptions, w.colours)
                : <Empty />,
        },
      ],
    },
    {
      step: "details",
      rows: [
        {
          label: "Domain",
          value:
            w.domain === "own" ? `${labelOf(domainOptions, w.domain)}: ${w.domainName.trim()}` : w.domain ? labelOf(domainOptions, w.domain) : <Empty />,
        },
        { label: "Anything else", value: or(w.notes) },
      ],
    },
  ];
}

function customSections(draft: IntakeDraft): { step: StepId; rows: Row[] }[] {
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
          value: !c.budget ? <Empty /> : c.budget === "unsure" ? labelOf(budgetOptions, c.budget) : `${labelOf(budgetOptions, c.budget)} CAD`,
        },
        { label: "Ready", value: c.timeline ? labelOf(timelineOptions, c.timeline) : <Empty /> },
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
