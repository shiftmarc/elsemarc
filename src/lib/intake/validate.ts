import { getConcept } from "@/content/concepts";
import { stepsFor, type IntakePath, type StepId } from "@/content/intake";
import type { IntakeDraft } from "./draft";

/**
 * Validation for the project intake. Shared by the form (one step at a time)
 * and submitIntake (the whole brief), so the rules live in one place.
 * Keys name the field; the form uses them for ids and error messages.
 */
export type FieldErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** A bare domain or a URL: example.com, www.example.ca/menu, https://example.com */
const WEB_ADDRESS = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;
const DOMAIN = /^([a-z0-9-]+\.)+[a-z]{2,}$/i;

const blank = (value: string) => value.trim() === "";

function contactErrors(draft: IntakeDraft, errors: FieldErrors) {
  if (blank(draft.contact.name)) errors.contactName = "Enter your name.";
  if (blank(draft.contact.email)) errors.email = "Enter your email address, so we can send your scope and price.";
  else if (!EMAIL.test(draft.contact.email.trim()))
    errors.email = "Enter an email address in the format name@example.com.";
}

export function validateStep(path: IntakePath, step: StepId, draft: IntakeDraft): FieldErrors {
  const errors: FieldErrors = {};
  const { website: w, custom: c } = draft;

  if (path === "website") {
    switch (step) {
      case "design":
        if (!getConcept(draft.design)) errors.design = "Choose the design you would like to start from.";
        break;
      case "business":
        if (blank(draft.businessName)) errors.businessName = "Enter your business name.";
        if (!w.businessCategory) errors.businessCategory = "Choose the kind of business that fits best.";
        else if (w.businessCategory === "other" && blank(w.businessCategoryOther))
          errors.businessCategoryOther = "Describe your kind of business in a few words.";
        contactErrors(draft, errors);
        if (!w.hasWebsite) errors.hasWebsite = "Tell us whether you have a website now.";
        else if (w.hasWebsite === "yes") {
          if (blank(w.websiteUrl)) errors.websiteUrl = "Enter your current website’s address.";
          else if (!WEB_ADDRESS.test(w.websiteUrl.trim()))
            errors.websiteUrl = "Enter an address like example.com or https://example.com.";
        }
        break;
      case "pages":
        if (w.pages.length === 0 && blank(w.otherPages))
          errors.pages = "Choose at least one page, or describe the pages you need.";
        if (!w.content) errors.content = "Tell us whether your text is ready.";
        if (!w.images) errors.images = "Tell us whether you have images.";
        break;
      case "brand":
        if (!w.hasLogo) errors.hasLogo = "Tell us whether you have a logo.";
        if (!w.colours) errors.colours = "Choose how you would like to handle colours.";
        else if (w.colours === "brand" && blank(w.brandColours))
          errors.brandColours = "Describe your brand colours, or give their codes.";
        break;
      case "details":
        if (!w.domain) errors.domain = "Tell us about your domain.";
        else if (w.domain === "own") {
          if (blank(w.domainName)) errors.domainName = "Enter the domain you own.";
          else if (!DOMAIN.test(w.domainName.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "")))
            errors.domainName = "Enter a domain like example.com.";
        }
        break;
    }
  } else {
    switch (step) {
      case "project":
        if (draft.idea.trim().length < 10)
          errors.idea = "Describe your project in at least a sentence. Plain words are perfect.";
        break;
      case "functionality":
        if (draft.functions.length === 0 && blank(c.functionNotes))
          errors.functions = "Choose at least one thing it should do, or describe it in your own words.";
        break;
      case "people":
        if (c.users.length === 0) errors.users = "Choose who will use it.";
        break;
      case "budget":
        if (!c.budget) errors.budget = "Choose a budget range. “Not sure yet” is fine.";
        if (!c.timeline) errors.timeline = "Choose when you would like it ready.";
        break;
      case "contact":
        contactErrors(draft, errors);
        break;
    }
  }
  return errors;
}

/** Every step before review, in order, with its errors. Empty when the brief is complete. */
export function validateBrief(path: IntakePath, draft: IntakeDraft) {
  return stepsFor(path)
    .filter((step) => step.id !== "review")
    .map((step) => ({ step: step.id, errors: validateStep(path, step.id, draft) }))
    .filter((result) => Object.keys(result.errors).length > 0);
}
