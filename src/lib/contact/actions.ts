"use server";

import { after } from "next/server";
import { sendMail } from "@/lib/server/mailer";
import { allowRequest, clientIp, hashIp, userAgent } from "@/lib/server/request";
import { MESSAGES_TABLE, supabaseAdmin } from "@/lib/server/supabase";
import { confirmationEmail, notificationEmail, oneLine } from "./emails";
import { readFields, validateContact, type ContactFields, type FieldErrors } from "./validate";

/*
 * The contact form's server side. It is a public POST endpoint, so
 * everything it receives is treated as untrusted and checked here.
 * Supabase is reached only from this module, with the secret key.
 */

export type ContactState =
  | { status: "idle" | "rate-limited" | "error"; values: ContactFields }
  | { status: "invalid"; values: ContactFields; errors: FieldErrors }
  | { status: "sent" };

/** Saved messages per connection per hour, counted in the database. */
const MESSAGES_PER_HOUR = 5;

/**
 * Validates, stores and announces a message. The message is saved first;
 * the emails go out after the response, and a failure there is logged
 * without reaching the visitor, since their message is already safe.
 */
export async function sendContact(_previous: ContactState, form: FormData): Promise<ContactState> {
  const values = readFields(form);

  // A filled honeypot is a bot. Answer as if it worked, and keep nothing.
  const honeypot = form.get("hp_confirm");
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    console.warn("[contact] Honeypot filled; message discarded.");
    return { status: "sent" };
  }

  const errors = validateContact(values);
  if (Object.keys(errors).length > 0) return { status: "invalid", values, errors };

  // In-memory speed bump for bursts; the database count below is the durable limit.
  const ipHash = hashIp(await clientIp());
  if (!allowRequest(`contact:${ipHash}`, MESSAGES_PER_HOUR * 2, 60 * 60 * 1000)) return { status: "rate-limited", values };

  let supabase;
  try {
    supabase = supabaseAdmin();
  } catch (error) {
    console.error("[contact] Supabase is not configured", error);
    return { status: "error", values };
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await supabase
    .from(MESSAGES_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("submitted_at", since);
  if (recent.error) console.error("[contact] Rate limit check failed; continuing", recent.error);
  else if ((recent.count ?? 0) >= MESSAGES_PER_HOUR) return { status: "rate-limited", values };

  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .insert({
      name: values.name,
      email: values.email,
      message: values.message,
      link: values.link || null,
      ip_hash: ipHash,
      user_agent: await userAgent(),
    })
    .select("id, submitted_at")
    .single();
  if (error || !data) {
    console.error("[contact] Could not save message", error);
    return { status: "error", values };
  }

  after(() => sendContactEmails(data.id, values, new Date(data.submitted_at)));
  return { status: "sent" };
}

async function sendContactEmails(id: string, values: ContactFields, submittedAt: Date) {
  const name = oneLine(values.name, 100);
  const sender = name ? { name, address: values.email } : values.email;

  const owner = (async () => {
    const to = process.env.NOTIFY_EMAIL;
    if (!to) throw new Error("NOTIFY_EMAIL is not set.");
    await sendMail({ to, replyTo: sender, ...notificationEmail({ id, values, submittedAt }) });
    return "owner_notified_at";
  })();

  const customer = (async () => {
    await sendMail({ to: sender, ...confirmationEmail(values) });
    return "customer_notified_at";
  })();

  const results = await Promise.allSettled([owner, customer]);
  const sent: Record<string, string> = {};
  results.forEach((result, index) => {
    if (result.status === "fulfilled") sent[result.value] = new Date().toISOString();
    else console.error(`[contact] ${index === 0 ? "Notification" : "Confirmation"} email failed for message ${id}`, result.reason);
  });
  if (Object.keys(sent).length > 0) {
    const { error } = await supabaseAdmin().from(MESSAGES_TABLE).update(sent).eq("id", id);
    if (error) console.error("[contact] Could not record sent emails", error);
  }
}
