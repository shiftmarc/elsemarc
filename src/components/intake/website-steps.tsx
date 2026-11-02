"use client";

import Link from "next/link";
import { useRef, useState } from "react";
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
import { assetAccept, MAX_ASSET_BYTES, MAX_ASSETS, type UploadedAsset } from "@/lib/intake/brief";
import { intakeDraft, type IntakeDraft } from "@/lib/intake/draft";
import { formatBytes } from "@/lib/intake/summary";
import { uploads, useUploads } from "@/lib/intake/uploads";
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
      <AssetPicker assets={w.assets} error={errors.assets} />
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
 * Logos and brand assets, uploaded as soon as they are chosen to the private
 * intake bucket (see lib/intake/uploads). Finished files are kept in the
 * draft; removing one only takes it out of the brief.
 */
function AssetPicker({ assets, error }: { assets: UploadedAsset[]; error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pending = useUploads();
  const [problems, setProblems] = useState<string[]>([]);
  const count = assets.length + pending.filter((item) => item.status !== "failed").length;
  const uploading = pending.filter((item) => item.status !== "failed").length;
  const hintId = `${fieldId("assets")}-hint`;
  const errorId = `${fieldId("assets")}-error`;
  return (
    <div>
      <p className="font-medium">
        Logo and brand assets <span className="ml-2 text-small font-normal text-fg-muted">Optional</span>
      </p>
      <p id={hintId} className="mt-1.5 text-small text-fg-muted">
        Logo files, brand guidelines or photos: images, PDF, SVG, or AI, EPS, PSD, InDesign, Figma,
        Sketch and XD files. Up to {MAX_ASSETS} files, {MAX_ASSET_BYTES / 1024 / 1024} MB each. Files
        are stored privately and only used for your project.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label
          htmlFor={fieldId("assets")}
          className={`inline-flex min-h-12 items-center gap-3 border px-5 text-small font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
            count >= MAX_ASSETS
              ? "cursor-not-allowed border-line text-fg-muted"
              : `cursor-pointer hover:bg-fg hover:text-surface ${error ? "border-accent" : "border-current"}`
          }`}
        >
          <span aria-hidden="true">+</span>
          Choose files
          <input
            ref={inputRef}
            id={fieldId("assets")}
            type="file"
            multiple
            accept={assetAccept}
            disabled={count >= MAX_ASSETS}
            aria-describedby={[hintId, error ? errorId : null].filter(Boolean).join(" ")}
            aria-invalid={error ? true : undefined}
            onChange={(event) => {
              setProblems(uploads.add(Array.from(event.target.files ?? [])));
              // The files are queued: clear the input so the same file can be chosen again.
              event.target.value = "";
            }}
            className="sr-only"
          />
        </label>
        <span className="text-small text-fg-muted" aria-live="polite">
          {uploading > 0
            ? `Uploading ${uploading} ${uploading === 1 ? "file" : "files"}…`
            : assets.length === 0
              ? "No files added"
              : `${assets.length} ${assets.length === 1 ? "file" : "files"} uploaded`}
        </span>
      </div>
      {error ? (
        <p id={errorId} className="mt-2 flex gap-2 text-small text-accent">
          <span aria-hidden="true">!</span>
          {error}
        </p>
      ) : null}
      {problems.length > 0 ? (
        <ul role="alert" className="mt-3 space-y-1 text-small text-accent">
          {problems.map((problem) => (
            <li key={problem} className="flex gap-2">
              <span aria-hidden="true">!</span>
              {problem}
            </li>
          ))}
        </ul>
      ) : null}
      {assets.length + pending.length > 0 ? (
        <ul className="mt-4 border-t hairline text-small">
          {assets.map((asset) => (
            <li key={asset.path} className="flex items-center justify-between gap-4 border-b hairline py-2.5">
              <span className="flex min-w-0 items-baseline gap-3">
                <span aria-hidden="true" className="text-accent">✓</span>
                <span className="min-w-0 truncate">{asset.name}</span>
                <span className="shrink-0 text-fg-muted">{formatBytes(asset.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  intakeDraft.removeAsset(asset.path);
                  inputRef.current?.focus();
                }}
                className="shrink-0 text-fg-muted underline decoration-1 underline-offset-4 hover:text-accent"
              >
                Remove<span className="sr-only"> {asset.name}</span>
              </button>
            </li>
          ))}
          {pending.map((item) => (
            <li key={item.id} className="border-b hairline py-2.5">
              <div className="flex items-center justify-between gap-4">
                <span className="min-w-0 truncate">{item.name}</span>
                {item.status === "failed" ? (
                  <span className="flex shrink-0 gap-4">
                    <button
                      type="button"
                      onClick={() => uploads.retry(item.id)}
                      className="font-medium underline decoration-1 underline-offset-4 hover:text-accent"
                    >
                      Retry<span className="sr-only"> {item.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        uploads.dismiss(item.id);
                        inputRef.current?.focus();
                      }}
                      className="text-fg-muted underline decoration-1 underline-offset-4 hover:text-accent"
                    >
                      Remove<span className="sr-only"> {item.name}</span>
                    </button>
                  </span>
                ) : (
                  <span className="shrink-0 text-fg-muted">
                    {item.status === "queued" ? "Waiting…" : `${Math.round(item.progress * 100)}%`}
                  </span>
                )}
              </div>
              {item.status === "failed" ? (
                <p className="mt-1 text-accent">{item.error}</p>
              ) : (
                <div
                  role="progressbar"
                  aria-label={`Uploading ${item.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(item.progress * 100)}
                  className="mt-2 h-0.5 bg-fg/15"
                >
                  <div className="h-full bg-accent transition-[width]" style={{ width: `${item.progress * 100}%` }} />
                </div>
              )}
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
