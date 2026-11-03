/**
 * The questions the contact form can ask first. The visitor picks one (the
 * form starts with "website"); the choice is sent with the message as
 * `prompt`, so the notification email can say which one they answered.
 */
export const PROMPTS = {
  website: "What should your website do?",
  business: "Tell us about your business",
} as const;

export type PromptKey = keyof typeof PROMPTS;

/** The submitted choice, from untrusted input: anything unknown is the default question. */
export function readPrompt(value: unknown): PromptKey {
  return value === "business" ? "business" : "website";
}
