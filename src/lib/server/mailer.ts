import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

/**
 * Outgoing mail through the Porkbun mailbox over SMTP. Port 465 uses TLS
 * from the start; any other port (587) upgrades with STARTTLS.
 */

/** Every email is sent from this address; SMTP_USER must be allowed to send as it. */
export const MAIL_FROM = { name: "elsemarc", address: "hello@elsemarc.com" };

let transport: Transporter | null = null;

function transporter(): Transporter {
  if (transport) return transport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("SMTP_HOST, SMTP_USER and SMTP_PASSWORD must be set.");
  }
  const port = Number(SMTP_PORT) || 587;
  transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  return transport;
}

export async function sendMail(message: Omit<Mail.Options, "from">) {
  await transporter().sendMail({ from: MAIL_FROM, ...message });
}
