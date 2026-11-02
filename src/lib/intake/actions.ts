"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import type { StepId } from "@/content/intake";
import { sendMail } from "@/lib/server/mailer";
import { allowRequest, clientIp, hashIp, userAgent } from "@/lib/server/request";
import { BRIEFS_TABLE, INTAKE_BUCKET, supabaseAdmin } from "@/lib/server/supabase";
import { assetProblem, assetTypes, extensionOf, normalizeDraft, type IntakeDraft, type UploadedAsset } from "./brief";
import { customerEmail, oneLine, ownerEmail, type AssetLink } from "./emails";
import { validateBrief, type FieldErrors } from "./validate";

/*
 * The intake's server side. Both actions are public POST endpoints, so
 * everything they receive is treated as untrusted and checked again here.
 * Supabase is reached only from this module, with the secret key.
 */

/* Uploads ----------------------------------------------------------------- */

export type UploadTicket =
  | { ok: true; path: string; signedUrl: string; contentType: string }
  | { ok: false; error: string };

const UPLOADS_PER_HOUR = 40;

/** "Logo Final (2).PNG" → "Logo-Final-2.png" */
function safeFileName(name: string): string {
  const extension = extensionOf(name);
  const base = name
    .slice(0, name.length - extension.length - 1)
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 100);
  return `${base || "file"}.${extension}`;
}

/**
 * A signed URL the browser uploads one brand asset to, directly into the
 * private bucket. It is valid for two hours and only for the path issued
 * here; the bucket itself enforces the size limit and file types.
 */
export async function requestAssetUpload(file: { name: unknown; size: unknown }): Promise<UploadTicket> {
  const name = typeof file?.name === "string" ? file.name.slice(0, 200) : "";
  const size = typeof file?.size === "number" ? file.size : -1;
  const problem = assetProblem(name, size);
  if (problem) return { ok: false, error: problem };

  if (!allowRequest(`upload:${hashIp(await clientIp())}`, UPLOADS_PER_HOUR, 60 * 60 * 1000)) {
    return { ok: false, error: "Too many uploads from this connection. Please try again in an hour." };
  }

  const path = `intake/${randomUUID()}/${safeFileName(name)}`;
  try {
    const { data, error } = await supabaseAdmin().storage.from(INTAKE_BUCKET).createSignedUploadUrl(path);
    if (error) throw error;
    return { ok: true, path, signedUrl: data.signedUrl, contentType: assetTypes[extensionOf(name)] };
  } catch (error) {
    console.error("[intake] Could not create a signed upload URL", error);
    return { ok: false, error: "This file couldn’t be uploaded just now. Please try again." };
  }
}

/* Submission -------------------------------------------------------------- */

export type SubmitResult =
  | { ok: true }
  | { ok: false; reason: "incomplete"; incomplete: { step: StepId; errors: FieldErrors }[] }
  | { ok: false; reason: "missing-files"; files: string[] }
  | { ok: false; reason: "rate-limited" }
  | { ok: false; reason: "error" };

/** Saved briefs per connection per hour, counted in the database. */
const BRIEFS_PER_HOUR = 5;
/** How long the file links in the notification email work. */
const LINK_DAYS = 7;

/**
 * Validates, stores and announces a brief. The brief is saved first; the
 * emails go out after the response, and a failure there is logged without
 * ever reaching the visitor, since their brief is already safe.
 */
export async function submitBrief(input: unknown, honeypot: unknown): Promise<SubmitResult> {
  // A filled honeypot is a bot. Answer as if it worked, and keep nothing.
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    console.warn("[intake] Honeypot filled; brief discarded.");
    return { ok: true };
  }

  const draft = normalizeDraft(input);
  const path = draft.path;
  if (!path) return { ok: false, reason: "incomplete", incomplete: [] };
  if (!draft.submissionId) return { ok: false, reason: "error" };

  const incomplete = validateBrief(path, draft);
  if (incomplete.length > 0) return { ok: false, reason: "incomplete", incomplete };

  let supabase;
  try {
    supabase = supabaseAdmin();
  } catch (error) {
    console.error("[intake] Supabase is not configured", error);
    return { ok: false, reason: "error" };
  }
  const id = draft.submissionId;

  // A retry of a brief already saved (the first response was lost) succeeds without saving twice.
  const existing = await supabase.from(BRIEFS_TABLE).select("id").eq("id", id).maybeSingle();
  if (existing.data) return { ok: true };

  const ipHash = hashIp(await clientIp());
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await supabase
    .from(BRIEFS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("submitted_at", since);
  if (recent.error) console.error("[intake] Rate limit check failed; continuing", recent.error);
  else if ((recent.count ?? 0) >= BRIEFS_PER_HOUR) return { ok: false, reason: "rate-limited" };

  // Uploaded files must really be in the bucket; their stored size is the one recorded.
  const assets: UploadedAsset[] = [];
  if (path === "website" && draft.website.assets.length > 0) {
    const bucket = supabase.storage.from(INTAKE_BUCKET);
    const checked = await Promise.all(
      draft.website.assets.map(async (asset) => ({ asset, info: await bucket.info(asset.path) })),
    );
    const missing = checked.filter(({ info }) => info.error || !info.data);
    if (missing.length > 0) {
      console.warn("[intake] Brief references missing files", missing.map(({ asset, info }) => [asset.path, info.error?.message]));
      return { ok: false, reason: "missing-files", files: missing.map(({ asset }) => asset.name) };
    }
    for (const { asset, info } of checked) assets.push({ ...asset, size: info.data?.size ?? asset.size });
  }

  const brief: Omit<IntakeDraft, "step" | "submissionId"> = {
    idea: draft.idea,
    functions: draft.functions,
    design: draft.design,
    path,
    businessName: draft.businessName,
    contact: { name: draft.contact.name.trim(), email: draft.contact.email.trim() },
    website: { ...draft.website, assets },
    custom: draft.custom,
  };
  const submittedAt = new Date();

  const { error } = await supabase.from(BRIEFS_TABLE).insert({
    id,
    submitted_at: submittedAt.toISOString(),
    path,
    business_name: brief.businessName.trim() || null,
    contact_name: brief.contact.name,
    contact_email: brief.contact.email,
    design: path === "website" ? brief.design || null : null,
    functions: brief.functions,
    idea: brief.idea.trim() || null,
    answers: path === "website" ? { ...brief.website, assets: undefined } : brief.custom,
    assets,
    brief,
    ip_hash: ipHash,
    user_agent: await userAgent(),
  });
  if (error) {
    // 23505: the same brief arrived twice at once, and the other request saved it.
    if (error.code === "23505") return { ok: true };
    console.error("[intake] Could not save brief", error);
    return { ok: false, reason: "error" };
  }

  const saved: IntakeDraft = { ...brief, step: "", submissionId: id };
  after(() => sendBriefEmails(id, saved, submittedAt));
  return { ok: true };
}

async function sendBriefEmails(id: string, draft: IntakeDraft, submittedAt: Date) {
  const path = draft.path || "website";
  const supabase = supabaseAdmin();
  const assets = draft.website.assets;

  const owner = (async () => {
    const to = process.env.NOTIFY_EMAIL;
    if (!to) throw new Error("NOTIFY_EMAIL is not set.");
    let links: AssetLink[] = [];
    if (assets.length > 0) {
      const { data, error } = await supabase.storage
        .from(INTAKE_BUCKET)
        .createSignedUrls(assets.map((asset) => asset.path), LINK_DAYS * 24 * 60 * 60);
      if (error) console.error("[intake] Could not sign file links", error);
      links = assets.map((asset) => ({
        name: asset.name,
        size: asset.size,
        url: data?.find((item) => item.path === asset.path)?.signedUrl ?? null,
      }));
    }
    const email = ownerEmail({ id, path, draft, submittedAt, assets: links, linkDays: LINK_DAYS });
    await sendMail({
      to,
      replyTo: { name: oneLine(draft.contact.name, 100), address: draft.contact.email },
      ...email,
    });
    return "owner_notified_at";
  })();

  const customer = (async () => {
    const email = customerEmail({ path, draft });
    await sendMail({ to: { name: oneLine(draft.contact.name, 100), address: draft.contact.email }, ...email });
    return "customer_notified_at";
  })();

  const results = await Promise.allSettled([owner, customer]);
  const sent: Record<string, string> = {};
  results.forEach((result, index) => {
    if (result.status === "fulfilled") sent[result.value] = new Date().toISOString();
    else console.error(`[intake] ${index === 0 ? "Notification" : "Confirmation"} email failed for brief ${id}`, result.reason);
  });
  if (Object.keys(sent).length > 0) {
    const { error } = await supabase.from(BRIEFS_TABLE).update(sent).eq("id", id);
    if (error) console.error("[intake] Could not record sent emails", error);
  }
}
