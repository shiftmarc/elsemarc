import type { IntakePath, StepId } from "@/content/intake";
import type { IntakeDraft } from "./draft";
import { validateBrief, type FieldErrors } from "./validate";

export type SubmitResult =
  | { ok: true; path: IntakePath }
  /** `incomplete` lists the steps still needing answers; empty when no path was chosen. */
  | { ok: false; incomplete: { step: StepId; errors: FieldErrors }[] };

/**
 * The single place a finished brief leaves the intake.
 *
 * PREVIEW ONLY: for now this validates the brief and nothing else. It does
 * not send, store or upload anything, and the confirmation the visitor sees
 * says so. Stage 5b connects it: persist the brief (Supabase), upload brand
 * assets to file storage, and send the transactional emails. Keep every
 * side effect of submission inside this function so the form never changes.
 */
export async function submitIntake(draft: IntakeDraft): Promise<SubmitResult> {
  const path = draft.path;
  if (!path) return { ok: false, incomplete: [] };
  const incomplete = validateBrief(path, draft);
  if (incomplete.length > 0) return { ok: false, incomplete };
  return { ok: true, path };
}
