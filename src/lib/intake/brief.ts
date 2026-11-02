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
 * The shape of a project brief, shared by the browser draft and the server.
 * normalizeDraft() is the single sanitiser for both: the browser uses it on
 * stored drafts, the server on every submission, since neither is trusted.
 */

/** A brand asset already uploaded to the private intake bucket. */
export type UploadedAsset = {
  /** Object path in the bucket, issued by the server: intake/<uuid>/<file name>. */
  path: string;
  /** The file name as the visitor chose it. */
  name: string;
  size: number;
};

export type WebsiteBrief = {
  businessCategory: string;
  businessCategoryOther: string;
  hasWebsite: string;
  websiteUrl: string;
  pages: string[];
  otherPages: string;
  hasLogo: string;
  assets: UploadedAsset[];
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
  /**
   * Set when the visitor first submits, and kept until the brief is saved,
   * so a retry after a lost response cannot store the same brief twice.
   */
  submissionId: string;
};

export const MAX_IDEA_LENGTH = 2000;
const MAX_TEXT_LENGTH = 2000;

const EMPTY_WEBSITE: WebsiteBrief = {
  businessCategory: "",
  businessCategoryOther: "",
  hasWebsite: "",
  websiteUrl: "",
  pages: [],
  otherPages: "",
  hasLogo: "",
  assets: [],
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
  submissionId: "",
};

/* Brand asset uploads ----------------------------------------------------- */

export const MAX_ASSETS = 10;
export const MAX_ASSET_BYTES = 20 * 1024 * 1024;

/**
 * Accepted file types by extension, with the content type each is stored
 * as. The browser's own type is ignored: it is often empty for design files.
 * Keep in step with allowed_mime_types on the storage bucket.
 */
export const assetTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  tif: "image/tiff",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  ai: "application/postscript",
  eps: "application/postscript",
  psd: "image/vnd.adobe.photoshop",
  indd: "application/octet-stream",
  sketch: "application/octet-stream",
  fig: "application/octet-stream",
  xd: "application/octet-stream",
};

/** For the file input's accept attribute. */
export const assetAccept = Object.keys(assetTypes)
  .map((extension) => `.${extension}`)
  .join(",");

export const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

/** Why a file cannot be uploaded, or null when it can. */
export function assetProblem(name: string, size: number): string | null {
  if (!assetTypes[extensionOf(name)])
    return "This type of file isn’t accepted. Use an image, PDF, SVG or design file.";
  if (size > MAX_ASSET_BYTES) return `This file is over ${MAX_ASSET_BYTES / 1024 / 1024} MB.`;
  if (size === 0) return "This file is empty.";
  return null;
}

/** intake/<uuid>/<safe file name>, as issued by the server. */
export const ASSET_PATH = /^intake\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[A-Za-z0-9._-]{1,120}$/;

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Normalising: drafts from storage or the network are untrusted, and may predate newer fields. */

type Loose = Record<string, unknown>;

const record = (value: unknown): Loose =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Loose) : {};

const text = (value: unknown, max = MAX_TEXT_LENGTH) =>
  typeof value === "string" ? value.slice(0, max) : "";

const choice = (options: readonly Option[], value: unknown) =>
  typeof value === "string" && options.some((option) => option.value === value) ? value : "";

const choices = (options: readonly Option[], value: unknown) =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => options.some((option) => option.value === item)))]
    : [];

function assets(value: unknown): UploadedAsset[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: UploadedAsset[] = [];
  for (const item of value) {
    const asset = record(item);
    if (typeof asset.path !== "string" || !ASSET_PATH.test(asset.path) || seen.has(asset.path)) continue;
    seen.add(asset.path);
    result.push({
      path: asset.path,
      name: text(asset.name, 200) || asset.path.split("/").pop()!,
      size: typeof asset.size === "number" && Number.isFinite(asset.size) && asset.size > 0 ? Math.round(asset.size) : 0,
    });
  }
  return result.slice(0, MAX_ASSETS);
}

const stepIds = new Set<string>([...websiteSteps, ...customSteps].map((step) => step.id));

export function normalizeDraft(input: unknown): IntakeDraft {
  const value = record(input);
  const website = record(value.website);
  const custom = record(value.custom);
  const contact = record(value.contact);
  return {
    idea: text(value.idea, MAX_IDEA_LENGTH),
    functions: Array.isArray(value.functions) ? [...new Set(value.functions.filter(isFunctionId))] : [],
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
      assets: assets(website.assets),
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
    submissionId: typeof value.submissionId === "string" && UUID.test(value.submissionId) ? value.submissionId.toLowerCase() : "",
  };
}
