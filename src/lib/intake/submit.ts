import { submitBrief, type SubmitResult } from "./actions";
import type { IntakeDraft } from "./brief";
import { validateBrief } from "./validate";

export type { SubmitResult } from "./actions";

/**
 * The single place a finished brief leaves the intake. It checks the brief
 * here first for a quick answer, then sends it to submitBrief, which checks
 * it again, stores it with any uploaded files and sends the emails. Every
 * side effect of submission lives behind that call.
 *
 * Never throws: a network failure or a stale deployment comes back as
 * { reason: "error" }, so the form can offer a retry with the draft intact.
 */
export async function submitIntake(draft: IntakeDraft, honeypot: string): Promise<SubmitResult> {
  const path = draft.path;
  if (!path) return { ok: false, reason: "incomplete", incomplete: [] };
  const incomplete = validateBrief(path, draft);
  if (incomplete.length > 0) return { ok: false, reason: "incomplete", incomplete };
  try {
    return await submitBrief(draft, honeypot);
  } catch (error) {
    console.error("Submitting the brief failed", error);
    return { ok: false, reason: "error" };
  }
}
