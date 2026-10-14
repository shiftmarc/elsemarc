"use client";

import Link from "next/link";
import { useId, useRef } from "react";
import { ConceptPreview } from "@/components/concepts/concept-preview";
import { concepts, getConcept } from "@/content/concepts";
import {
  businessCategories,
  colourOptions,
  contentOptions,
  domainOptions,
  imageOptions,
  includedPages,
  logoOptions,
  pageOptions,
  yesNo,
  type WebsiteStepId,
} from "@/content/intake";
import { intakeDraft, type IntakeDraft } from "@/lib/intake/draft";
import type { FieldErrors } from "@/lib/intake/validate";
import {
  CheckboxGroup,
  FieldError,
  fieldId,
  RadioGroup,
  SelectField,
  TextArea,
  TextField,
  toggle,
} from "./fields";

type StepProps = { draft: IntakeDraft; errors: FieldErrors };

export function WebsiteStep({ step, ...props }: StepProps & { step: WebsiteStepId }) {
  switch (step) {
    case "design":
      return <DesignStep {...props} />;
    case "business":
      return <BusinessStep {...props} />;
    case "pages":
      return <PagesStep {...props} />;
    case "brand":
      return <BrandStep {...props} />;
    case "details":
      return <DetailsStep {...props} />;
    default:
      return null;
  }
}

const set = intakeDraft.updateWebsite;

/* Design ------------------------------------------------------------------ */

function DesignStep({ draft, errors }: StepProps) {
  return (
    <fieldset aria-describedby={errors.design ? `${fieldId("design")}-error` : undefined}>
      <legend className="font-medium">Which design would you like to start from?</legend>
      <p className="mt-1.5 text-small text-fg-muted">
        Every design is customised with your name, words, colours and images.{" "}
        <Link href="/websites" className="text-fg underline decoration-1 underline-offset-4 hover:text-accent">
          Compare them in the collection
        </Link>
        .
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {concepts.map((concept, index) => {
          const checked = draft.design === concept.slug;
          const id = index === 0 ? fieldId("design") : `${fieldId("design")}-${concept.slug}`;
          return (
            <label
              key={concept.slug}
              htmlFor={id}
              className={`group cursor-pointer border p-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                checked ? "border-fg bg-fg/[0.06]" : `${errors.design ? "border-accent/60" : "border-line"} hover:border-fg/40`
              }`}
            >
              <input
                id={id}
                type="radio"
                name="design"
                checked={checked}
                onChange={() => intakeDraft.setDesign(concept.slug)}
                className="sr-only"
              />
              <span aria-hidden="true" className="block ring-1 ring-line">
                <ConceptPreview concept={concept} />
              </span>
              <span className="mt-3 flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`mt-1 grid size-4 shrink-0 place-items-center rounded-full border ${
                    checked ? "border-accent bg-accent" : "border-fg/40"
                  }`}
                >
                  {checked ? <span className="size-1.5 rounded-full bg-accent-fg" /> : null}
                </span>
                <span>
                  <span className="block font-medium">
                    {concept.index} — {concept.title}
                  </span>
                  <span className="mt-0.5 block text-small text-fg-muted">
                    Made for {concept.suits.slice(0, 3).join(", ").toLowerCase()}
                  </span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <FieldError name="design" error={errors.design} />
      <p className="mt-6 text-small text-fg-muted">
        Websites start from $999 CAD, including up to five pages. All demonstration concepts are
        designed for fictional businesses.
      </p>
    </fieldset>
  );
}

/* Business ---------------------------------------------------------------- */

function BusinessStep({ draft, errors }: StepProps) {
  const w = draft.website;
  return (
    <div className="space-y-8">
      <TextField
        name="businessName"
        label="Business name"
        autoComplete="organization"
        value={draft.businessName}
        onValue={(businessName) => intakeDraft.update({ businessName })}
        error={errors.businessName}
      />
      <SelectField
        name="businessCategory"
        label="What kind of business is it?"
        options={businessCategories}
        value={w.businessCategory}
        onValue={(businessCategory) => set({ businessCategory })}
        error={errors.businessCategory}
      />
      {w.businessCategory === "other" ? (
        <TextField
          name="businessCategoryOther"
          label="Describe your business in a few words"
          value={w.businessCategoryOther}
          onValue={(businessCategoryOther) => set({ businessCategoryOther })}
          error={errors.businessCategoryOther}
        />
      ) : null}

      <div className="grid gap-8 border-t hairline pt-8 md:grid-cols-2 md:gap-x-6">
        <TextField
          name="contactName"
          label="Your name"
          autoComplete="name"
          value={draft.contact.name}
          onValue={(name) => intakeDraft.updateContact({ name })}
          error={errors.contactName}
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          hint="Your scope and price are sent here."
          value={draft.contact.email}
          onValue={(email) => intakeDraft.updateContact({ email })}
          error={errors.email}
        />
      </div>

      <div className="space-y-6 border-t hairline pt-8">
        <RadioGroup
          name="hasWebsite"
          label="Do you have a website now?"
          options={yesNo}
          value={w.hasWebsite}
          onValue={(hasWebsite) => set({ hasWebsite })}
          error={errors.hasWebsite}
        />
        {w.hasWebsite === "yes" ? (
          <TextField
            name="websiteUrl"
            label="Its address"
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder="example.com"
            value={w.websiteUrl}
            onValue={(websiteUrl) => set({ websiteUrl })}
            error={errors.websiteUrl}
          />
        ) : null}
      </div>
    </div>
  );
}

/* Pages and content ------------------------------------------------------- */

function PagesStep({ draft, errors }: StepProps) {
  const w = draft.website;
  const count = w.pages.length;
  return (
    <div className="space-y-8">
      <div>
        <CheckboxGroup
          name="pages"
          label="Which pages do you need?"
          hint={`Up to ${includedPages} pages are included. More can be added and are quoted separately.`}
          options={pageOptions}
          columns={3}
          values={w.pages}
          onToggle={(page) => set({ pages: toggle(w.pages, page) })}
          error={errors.pages}
        />
        <p aria-live="polite" className={`mt-3 text-small ${count > includedPages ? "text-fg" : "text-fg-muted"}`}>
          {count === 0
            ? null
            : count > includedPages
              ? `${count} pages chosen. ${count - includedPages} beyond the included ${includedPages} will be quoted in your scope.`
              : `${count} of ${includedPages} included pages chosen.`}
        </p>
      </div>
      <TextField
        name="otherPages"
        label="Any other pages?"
        optional
        placeholder="For example: Events, Gift cards"
        value={w.otherPages}
        onValue={(otherPages) => set({ otherPages })}
      />
      <div className="space-y-8 border-t hairline pt-8">
        <RadioGroup
          name="content"
          label="Is the text for your website ready?"
          options={contentOptions}
          columns={3}
          value={w.content}
          onValue={(content) => set({ content })}
          error={errors.content}
        />
        <RadioGroup
          name="images"
          label="Do you have images or photos?"
          options={imageOptions}
          columns={3}
          value={w.images}
          onValue={(images) => set({ images })}
          error={errors.images}
        />
      </div>
    </div>
  );
}

/* Brand ------------------------------------------------------------------- */

function BrandStep({ draft, errors }: StepProps) {
  const w = draft.website;
  const concept = getConcept(draft.design);
  const colourChoices = colourOptions.map((option) =>
    option.value === "design" && concept
      ? { ...option, hint: `The palette of ${concept.title}.` }
      : option,
  );
  return (
    <div className="space-y-8">
      <RadioGroup
        name="hasLogo"
        label="Do you have a logo?"
        options={logoOptions}
        columns={3}
        value={w.hasLogo}
        onValue={(hasLogo) => set({ hasLogo })}
        error={errors.hasLogo}
      />
      <AssetPicker names={w.assetNames} />
      <div className="space-y-6 border-t hairline pt-8">
        <RadioGroup
          name="colours"
          label="Colours"
          options={colourChoices}
          columns={3}
          value={w.colours}
          onValue={(colours) => set({ colours })}
          error={errors.colours}
        />
        {concept && w.colours === "design" ? (
          <p className="flex items-center gap-3 text-small text-fg-muted">
            <span aria-hidden="true" className="flex">
              {Object.values(concept.palette).map((colour) => (
                <span key={colour} className="size-5 ring-1 ring-line" style={{ backgroundColor: colour }} />
              ))}
            </span>
            {concept.title}
          </p>
        ) : null}
        {w.colours === "brand" ? (
          <TextField
            name="brandColours"
            label="Your brand colours"
            hint="Names or codes are both fine, e.g. deep green, #1F4D3A."
            value={w.brandColours}
            onValue={(brandColours) => set({ brandColours })}
            error={errors.brandColours}
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * A file picker for logos and brand assets. PREVIEW ONLY: files are not
 * uploaded or stored; only their names are kept in the draft so they appear
 * in the summary. Uploading arrives with stage 5b.
 */
function AssetPicker({ names }: { names: string[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  return (
    <div>
      <p id={`${id}-label`} className="font-medium">
        Logo and brand assets <span className="ml-2 text-small font-normal text-fg-muted">Optional</span>
      </p>
      <p id={`${id}-hint`} className="mt-1.5 text-small text-fg-muted">
        Logo files, brand guidelines or photos. In this preview nothing is uploaded: only the file
        names are noted, and you can send the files later.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label
          htmlFor={id}
          className="inline-flex min-h-12 cursor-pointer items-center gap-3 border border-current px-5 text-small font-medium transition-colors hover:bg-fg hover:text-surface has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
        >
          <span aria-hidden="true">+</span>
          Choose files
          <input
            ref={inputRef}
            id={id}
            type="file"
            multiple
            accept="image/*,.pdf,.svg,.ai,.eps"
            aria-describedby={`${id}-hint`}
            onChange={(event) => {
              const chosen = Array.from(event.target.files ?? [], (file) => file.name);
              intakeDraft.updateWebsite({ assetNames: [...new Set([...names, ...chosen])].slice(0, 20) });
              // Nothing is held: clear the input so the same file can be chosen again.
              event.target.value = "";
            }}
            className="sr-only"
          />
        </label>
        <span className="text-small text-fg-muted" aria-live="polite">
          {names.length === 0 ? "No files chosen" : `${names.length} ${names.length === 1 ? "file" : "files"} noted`}
        </span>
      </div>
      {names.length > 0 ? (
        <ul className="mt-4 border-t hairline text-small">
          {names.map((name) => (
            <li key={name} className="flex items-center justify-between gap-4 border-b hairline py-2.5">
              <span className="min-w-0 truncate">{name}</span>
              <button
                type="button"
                onClick={() => {
                  intakeDraft.updateWebsite({ assetNames: names.filter((value) => value !== name) });
                  inputRef.current?.focus();
                }}
                className="shrink-0 text-fg-muted underline decoration-1 underline-offset-4 hover:text-accent"
              >
                Remove<span className="sr-only"> {name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* Domain and details ------------------------------------------------------ */

function DetailsStep({ draft, errors }: StepProps) {
  const w = draft.website;
  return (
    <div className="space-y-8">
      <RadioGroup
        name="domain"
        label="Your domain"
        hint="Your website’s address, like yourbusiness.ca. Domain registration is not included in the website price."
        options={domainOptions}
        columns={3}
        value={w.domain}
        onValue={(domain) => set({ domain })}
        error={errors.domain}
      />
      {w.domain === "own" ? (
        <TextField
          name="domainName"
          label="Which domain?"
          inputMode="url"
          spellCheck={false}
          placeholder="yourbusiness.ca"
          value={w.domainName}
          onValue={(domainName) => set({ domainName })}
          error={errors.domainName}
        />
      ) : null}
      <div className="border-t hairline pt-8">
        <TextArea
          name="notes"
          label="Anything else we should know?"
          optional
          hint="Features you have in mind, websites you like, dates that matter, anything at all."
          value={w.notes}
          onValue={(notes) => set({ notes })}
        />
      </div>
    </div>
  );
}
