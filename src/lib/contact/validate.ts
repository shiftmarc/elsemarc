/**
 * Validation for the contact form. The browser checks first with the native
 * required/type attributes; the server action runs these rules, so they are
 * the ones that count.
 */

export type ContactFields = { name: string; email: string; message: string; link: string };
export type FieldErrors = Partial<Record<keyof ContactFields, string>>;

export const LIMITS = { name: 100, email: 254, message: 5000, link: 500 } as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** A bare domain or a URL: example.com, www.example.ca/menu, https://example.com */
const WEB_ADDRESS = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

/** Reads the four fields from a submitted form, trimmed. Anything missing is "". */
export function readFields(form: FormData): ContactFields {
  const read = (key: keyof ContactFields) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  return { name: read("name"), email: read("email"), message: read("message"), link: read("link") };
}

export function validateContact(fields: ContactFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.name) errors.name = "Enter your name.";
  else if (fields.name.length > LIMITS.name) errors.name = `Keep your name under ${LIMITS.name} characters.`;

  if (!fields.email) errors.email = "Enter your email address, so we can reply.";
  else if (fields.email.length > LIMITS.email || !EMAIL.test(fields.email))
    errors.email = "Enter an email address in the format name@example.com.";

  if (!fields.message) errors.message = "Tell us what you have in mind. A sentence or two is plenty.";
  else if (fields.message.length > LIMITS.message)
    errors.message = `Keep it under ${LIMITS.message.toLocaleString("en-CA")} characters; we can go into detail by email.`;

  if (fields.link && (fields.link.length > LIMITS.link || !WEB_ADDRESS.test(fields.link)))
    errors.link = "Enter an address like example.com or https://example.com.";

  return errors;
}
