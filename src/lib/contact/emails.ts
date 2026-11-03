import "server-only";
import { PROMPTS, type PromptKey } from "./prompts";
import type { ContactFields } from "./validate";

/**
 * The two emails a saved message sends: the message to the studio, and a
 * short confirmation to the sender. Every submitted value is escaped for
 * HTML; nodemailer encodes headers.
 */

type Email = { subject: string; text: string; html: string };

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Header-safe: one line, trimmed. */
export const oneLine = (value: string, max = 120) => value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

const page = (body: string) =>
  `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55"><div style="max-width:640px">${body}</div></body></html>`;

export function notificationEmail(input: { id: string; values: ContactFields; prompt: PromptKey; submittedAt: Date }): Email {
  const { id, values, prompt, submittedAt } = input;
  const question = PROMPTS[prompt];
  const who = values.name || values.email;
  const when = submittedAt.toLocaleString("en-CA", { timeZone: "America/Toronto", dateStyle: "long", timeStyle: "short" });

  const text = [
    `New message from ${values.name ? `${values.name} <${values.email}>` : values.email}.`,
    `Sent ${when} (Toronto). Message ${id}.`,
    `Reply to this email to answer them directly.`,
    "",
    `They answered: “${question}”`,
    "",
    values.message,
    "",
    `Link: ${values.link || "Not given"}`,
  ].join("\n");

  const html = page(
    [
      `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b6b6b">New message</p>`,
      `<h1 style="margin:0 0 8px;font-size:22px;font-weight:600">${escape(who)}</h1>`,
      `<p style="margin:0 0 24px;color:#6b6b6b"><a href="mailto:${escape(values.email)}" style="color:#1a1a1a">${escape(values.email)}</a><br>Sent ${escape(when)} (Toronto) · Message ${escape(id)}<br>Reply to this email to answer them directly.</p>`,
      `<p style="margin:0 0 8px;border-top:1px solid #e5e5e5;padding-top:16px;font-size:13px;color:#6b6b6b">They answered: “${escape(question)}”</p>`,
      `<p style="margin:0 0 24px;white-space:pre-line">${escape(values.message)}</p>`,
      `<p style="margin:0;color:#6b6b6b">Link: ${values.link ? `<span style="color:#1a1a1a">${escape(values.link)}</span>` : "Not given"}</p>`,
    ].join(""),
  );

  return { subject: oneLine(`New message: ${who}`), text, html };
}

export function confirmationEmail(values: ContactFields): Email {
  const paragraphs = [
    values.name ? `Hi ${values.name},` : "Hello,",
    `Thank you for your message. It has arrived safely, and we’ll reply by email soon.`,
    `If you think of anything to add in the meantime, simply reply to this email.`,
    `Warmly,\nelsemarc`,
  ];

  return {
    subject: "We’ve received your message",
    text: paragraphs.join("\n\n"),
    html: page(paragraphs.map((paragraph) => `<p style="margin:0 0 16px;white-space:pre-line">${escape(paragraph)}</p>`).join("")),
  };
}
