import "server-only";
import type { IntakePath } from "@/content/intake";
import type { IntakeDraft } from "./brief";
import { formatBytes, summarize } from "./summary";

/**
 * The two emails a saved brief sends: the full brief to the studio, and a
 * short confirmation to the visitor. Every value from the brief is escaped
 * for HTML; nodemailer encodes headers.
 */

type Email = { subject: string; text: string; html: string };

export type AssetLink = { name: string; size: number; url: string | null };

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Header-safe: one line, trimmed. */
export const oneLine = (value: string, max = 120) => value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

const pathLabel = (path: IntakePath) => (path === "website" ? "Website" : "Custom development");

const page = (body: string) =>
  `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55"><div style="max-width:640px">${body}</div></body></html>`;

export function ownerEmail(input: {
  id: string;
  path: IntakePath;
  draft: IntakeDraft;
  submittedAt: Date;
  assets: AssetLink[];
  linkDays: number;
}): Email {
  const { id, path, draft, submittedAt, assets, linkDays } = input;
  const who = draft.businessName.trim() || draft.contact.name.trim();
  const subject = oneLine(`New brief: ${who} (${pathLabel(path)})`);
  const when = submittedAt.toLocaleString("en-CA", { timeZone: "America/Toronto", dateStyle: "long", timeStyle: "short" });
  const sections = summarize(path, draft);

  const text = [
    `New ${pathLabel(path).toLowerCase()} brief from ${draft.contact.name.trim()} <${draft.contact.email.trim()}>.`,
    `Submitted ${when} (Toronto). Brief ${id}.`,
    `Reply to this email to answer them directly.`,
    "",
    ...sections.flatMap((section) => [
      section.title.toUpperCase(),
      ...section.rows.map((row) => `${row.label}: ${row.value ?? "Not given"}`),
      "",
    ]),
    ...(assets.length
      ? [
          `UPLOADED FILES (links expire in ${linkDays} days)`,
          ...assets.map((asset) => `${asset.name} (${formatBytes(asset.size)}): ${asset.url ?? "link unavailable, open it in Supabase Storage"}`),
          "",
        ]
      : []),
  ].join("\n");

  const html = page(
    [
      `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b6b6b">New brief · ${escape(pathLabel(path))}</p>`,
      `<h1 style="margin:0 0 8px;font-size:22px;font-weight:600">${escape(who)}</h1>`,
      `<p style="margin:0 0 24px;color:#6b6b6b">${escape(draft.contact.name.trim())} · <a href="mailto:${escape(draft.contact.email.trim())}" style="color:#1a1a1a">${escape(draft.contact.email.trim())}</a><br>Submitted ${escape(when)} (Toronto) · Brief ${escape(id)}<br>Reply to this email to answer them directly.</p>`,
      ...sections.map(
        (section) =>
          `<h2 style="margin:24px 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b6b6b;border-top:1px solid #e5e5e5;padding-top:16px">${escape(section.title)}</h2>` +
          `<table role="presentation" style="width:100%;border-collapse:collapse">${section.rows
            .map(
              (row) =>
                `<tr><td style="padding:6px 16px 6px 0;vertical-align:top;width:160px;color:#6b6b6b">${escape(row.label)}</td><td style="padding:6px 0;vertical-align:top;white-space:pre-line">${row.value ? escape(row.value) : '<span style="color:#9a9a9a">Not given</span>'}</td></tr>`,
            )
            .join("")}</table>`,
      ),
      assets.length
        ? `<h2 style="margin:24px 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b6b6b;border-top:1px solid #e5e5e5;padding-top:16px">Uploaded files</h2><ul style="margin:0;padding-left:20px">${assets
            .map(
              (asset) =>
                `<li style="margin:4px 0">${asset.url ? `<a href="${escape(asset.url)}" style="color:#1a1a1a">${escape(asset.name)}</a>` : escape(asset.name)} <span style="color:#6b6b6b">(${formatBytes(asset.size)})</span></li>`,
            )
            .join("")}</ul><p style="margin:8px 0 0;font-size:13px;color:#6b6b6b">Links expire in ${linkDays} days. The files stay in the intake-assets bucket in Supabase Storage.</p>`
        : "",
    ].join(""),
  );

  return { subject, text, html };
}

export function customerEmail(input: { path: IntakePath; draft: IntakeDraft }): Email {
  const { path, draft } = input;
  const name = draft.contact.name.trim();
  const business = draft.businessName.trim();
  const what = path === "website" ? (business ? `the ${business} website` : "your website") : business ? `${business}’s project` : "your project";

  const paragraphs = [
    `Hi ${name},`,
    `Thank you for sending your brief for ${what}. It has arrived safely.`,
    `We’ll read it carefully and send you a written scope and price by email. There is nothing more you need to do, and no call or meeting is required.`,
    `If you think of anything to add in the meantime, simply reply to this email.`,
    `Warmly,\nelsemarc`,
  ];

  return {
    subject: "We’ve received your brief",
    text: paragraphs.join("\n\n"),
    html: page(paragraphs.map((paragraph) => `<p style="margin:0 0 16px;white-space:pre-line">${escape(paragraph)}</p>`).join("")),
  };
}
