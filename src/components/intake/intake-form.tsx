"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { functionLabel } from "@/content/capabilities";
import { getConcept } from "@/content/concepts";
import {
  intakePaths,
  stepsFor,
  type CustomStepId,
  type IntakePath,
  type StepId,
  type WebsiteStepId,
} from "@/content/intake";
import { intakeDraft, useDraftReady, useIntakeDraft, type IntakeDraft } from "@/lib/intake/draft";
import { submitIntake } from "@/lib/intake/submit";
import { uploads, useUploads } from "@/lib/intake/uploads";
import { validateBrief, validateStep, type FieldErrors } from "@/lib/intake/validate";
import { CustomStep } from "./custom-steps";
import { fieldId, RadioGroup } from "./fields";
import { Review } from "./review";
import { WebsiteStep } from "./website-steps";

/*
 * The project intake. Every answer is written to the intake draft as it is
 * typed, so the visitor can leave and come back to the same step. Each step
 * is validated when they continue; submission goes through submitIntake().
 * The draft is cleared only once the server confirms the brief is saved.
 */

const intros: Record<StepId, string> = {
  design: "Choose your starting point.",
  business: "About your business, and how to reach you.",
  pages: "What your website needs to hold.",
  brand: "How it should look.",
  details: "A few last details.",
  project: "Tell us what you have in mind.",
  functionality: "What it needs to do.",
  people: "Who it’s for, and what it works with.",
  budget: "Budget and timing.",
  contact: "Where to send your scope and price.",
  review: "Check your brief, then send it.",
};

const STEP_HEADING = "intake-step-heading";
const UPLOADS_BUSY = "Wait for your files to finish uploading, or remove them.";

type ReceivedBrief = { draft: IntakeDraft; path: IntakePath };

/** The first step that still needs answers, or the review when none do. */
function firstIncomplete(path: IntakePath, draft: IntakeDraft): StepId {
  return validateBrief(path, draft)[0]?.step ?? "review";
}

/** Which path the rest of the site already points to, if it is clear. */
function inferPath(draft: IntakeDraft): IntakePath | "" {
  const custom = draft.idea.trim() !== "" || draft.functions.length > 0;
  const website = draft.design !== "";
  if (website && !custom) return "website";
  if (custom && !website) return "custom";
  return "";
}

export function IntakeForm() {
  const ready = useDraftReady();
  const draft = useIntakeDraft();
  const searchParams = useSearchParams();
  const initialised = useRef(false);
  // The saved brief, kept for the confirmation once the draft is cleared.
  const [received, setReceived] = useState<ReceivedBrief | null>(null);

  // Links from elsewhere (?design= from a demo, ?idea= from the homepage) win, then the draft decides.
  useEffect(() => {
    if (!ready || initialised.current) return;
    initialised.current = true;
    const ideaParam = searchParams.get("idea")?.trim();
    const designParam = searchParams.get("design");
    if (ideaParam) intakeDraft.setIdea(ideaParam);
    if (designParam && getConcept(designParam)) intakeDraft.setDesign(designParam);

    const saved = intakeDraft.get();
    const linked: IntakePath | "" =
      designParam && getConcept(designParam) ? "website" : ideaParam ? "custom" : "";
    const path = linked || saved.path || inferPath(saved);
    if (!path) return;
    if (path !== saved.path || !saved.step || !stepsFor(path).some((step) => step.id === saved.step)) {
      intakeDraft.update({ path, step: firstIncomplete(path, saved) });
    }
  }, [ready, searchParams]);

  if (!ready) {
    return (
      <p role="status" className="border-t hairline pt-8 text-fg-muted">
        Loading your brief…
      </p>
    );
  }

  if (received) return <Received {...received} onAnother={() => setReceived(null)} />;

  return draft.path ? (
    <Steps draft={draft} path={draft.path} onReceived={setReceived} />
  ) : (
    <ChoosePath draft={draft} />
  );
}

/* Step 0: the path -------------------------------------------------------- */

function ChoosePath({ draft }: { draft: IntakeDraft }) {
  const [choice, setChoice] = useState<IntakePath | "">(inferPath(draft));
  const [error, setError] = useState(false);
  const design = getConcept(draft.design);
  const carried = [
    design ? `${design.title} design` : null,
    draft.functions.length > 0 ? `${draft.functions.length} ${draft.functions.length === 1 ? "function" : "functions"} you chose` : null,
    draft.idea.trim() ? "your idea" : null,
  ].filter((item): item is string => item !== null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!choice) {
      setError(true);
      document.getElementById(fieldId("path"))?.focus();
      return;
    }
    intakeDraft.update({ path: choice, step: firstIncomplete(choice, draft) });
    requestAnimationFrame(() => document.getElementById(STEP_HEADING)?.focus());
  }

  return (
    <form onSubmit={onSubmit} noValidate className="border-t hairline pt-8 md:pt-10">
      <p className="type-label text-fg-muted">First</p>
      <h2 className="type-display mt-3 text-heading md:text-display-md">What are you looking for?</h2>
      {carried.length > 0 ? (
        <p className="mt-4 max-w-[60ch] text-fg-muted">
          We’ve kept {joinList(carried)} from earlier. Both paths keep everything you’ve
          told us.
        </p>
      ) : null}
      <div className="mt-8 max-w-3xl">
        <RadioGroup
          name="path"
          label="Choose a path"
          options={intakePaths}
          value={choice}
          onValue={(value) => {
            setChoice(value as IntakePath);
            setError(false);
          }}
          error={error ? "Choose a website or custom development to continue." : undefined}
        />
      </div>
      <p className="mt-6 max-w-[60ch] text-small text-fg-muted">
        Want both? Start with the website. You can describe the extra functionality in its last
        step.
      </p>
      <div className="mt-10 border-t hairline pt-6">
        <PrimaryButton>Continue</PrimaryButton>
      </div>
    </form>
  );
}

/* The steps --------------------------------------------------------------- */

type SubmitState =
  | { status: "editing" }
  | { status: "submitting" }
  | { status: "incomplete"; steps: StepId[] }
  | { status: "missing-files"; files: string[] }
  | { status: "uploading" }
  | { status: "rate-limited" }
  | { status: "error" };

function Steps({
  draft,
  path,
  onReceived,
}: {
  draft: IntakeDraft;
  path: IntakePath;
  onReceived: (received: ReceivedBrief) => void;
}) {
  const steps = stepsFor(path);
  const index = Math.max(0, steps.findIndex((step) => step.id === draft.step));
  const step = steps[index];
  const isReview = step.id === "review";

  const [attempted, setAttempted] = useState<ReadonlySet<StepId>>(new Set());
  const [submit, setSubmit] = useState<SubmitState>({ status: "editing" });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const shownStep = useRef(step.id);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const uploading = useUploads().some((item) => item.status !== "failed");

  function stepErrors(id: StepId): FieldErrors {
    const found = validateStep(path, id, draft);
    if (id === "brand" && uploading) found.assets = UPLOADS_BUSY;
    return found;
  }

  // Errors appear once the visitor tries to continue, then update as they fix them.
  const errors: FieldErrors = attempted.has(step.id) ? stepErrors(step.id) : {};
  const errorCount = Object.keys(errors).length;

  // A new step: bring its heading into view and give it focus.
  useEffect(() => {
    if (shownStep.current === step.id) return;
    shownStep.current = step.id;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "start" });
  }, [step.id]);

  function go(next: StepId) {
    setSubmit({ status: "editing" });
    intakeDraft.update({ step: next });
  }

  function onContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = stepErrors(step.id);
    if (Object.keys(found).length > 0) {
      setAttempted((current) => new Set(current).add(step.id));
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    go(steps[index + 1].id);
  }

  async function onSubmitBrief() {
    if (submit.status === "submitting") return;
    if (uploads.busy()) {
      setSubmit({ status: "uploading" });
      return;
    }
    setSubmit({ status: "submitting" });
    // Created once and kept with the draft, so a retry can never save the brief twice.
    intakeDraft.submissionId();
    const sent = intakeDraft.get();
    const result = await submitIntake(sent, honeypotRef.current?.value ?? "");
    if (result.ok) {
      onReceived({ draft: sent, path });
      return;
    }
    switch (result.reason) {
      case "incomplete":
        setAttempted(new Set(result.incomplete.map((item) => item.step)));
        setSubmit({ status: "incomplete", steps: result.incomplete.map((item) => item.step) });
        break;
      case "missing-files":
        setSubmit({ status: "missing-files", files: result.files });
        break;
      default:
        setSubmit({ status: result.reason });
    }
  }

  return (
    <div className="grid gap-10 border-t hairline pt-8 md:pt-10 lg:grid-cols-12 lg:gap-x-gutter">
      <Progress path={path} steps={steps} index={index} onGo={go} />

      <form onSubmit={onContinue} noValidate className="min-w-0 lg:col-span-8 lg:col-start-5">
        <p className="type-label text-fg-muted">
          Step {index + 1} of {steps.length} · {step.title}
        </p>
        <h2
          id={STEP_HEADING}
          ref={headingRef}
          tabIndex={-1}
          className="type-display mt-3 scroll-mt-28 text-heading outline-none md:text-display-md"
        >
          {intros[step.id]}
        </h2>

        {errorCount > 0 ? (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="mt-8 border-l-2 border-accent bg-accent/[0.06] px-5 py-4 outline-none"
          >
            <p className="font-medium">
              {errorCount === 1 ? "One answer needs attention" : `${errorCount} answers need attention`}
            </p>
            <ul className="mt-2 space-y-1 text-small">
              {Object.entries(errors).map(([name, message]) => (
                <li key={name}>
                  <a
                    href={`#${fieldId(name)}`}
                    onClick={(event) => {
                      event.preventDefault();
                      const target = document.getElementById(fieldId(name));
                      target?.focus();
                      target?.scrollIntoView({ block: "center" });
                    }}
                    className="underline decoration-1 underline-offset-4 hover:text-accent"
                  >
                    {message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-10">
          {isReview ? (
            <ReviewStep draft={draft} path={path} submit={submit} onEdit={go} onRetry={onSubmitBrief} />
          ) : path === "website" ? (
            <WebsiteStep step={step.id as WebsiteStepId} draft={draft} errors={errors} />
          ) : (
            <CustomStep step={step.id as CustomStepId} draft={draft} errors={errors} />
          )}
        </div>

        <div className="mt-12 flex flex-col-reverse gap-4 border-t hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => (index === 0 ? intakeDraft.update({ path: "", step: "" }) : go(steps[index - 1].id))}
            className="inline-flex min-h-12 items-center gap-2 self-start text-small text-fg-muted transition-colors hover:text-fg"
          >
            <span aria-hidden="true">←</span>
            {index === 0 ? "Change path" : `Back to ${steps[index - 1].title.toLowerCase()}`}
          </button>
          {isReview ? (
            <PrimaryButton type="button" onClick={onSubmitBrief} disabled={submit.status === "submitting"}>
              {submit.status === "submitting" ? "Sending your brief…" : submit.status === "error" ? "Try again" : "Submit brief"}
            </PrimaryButton>
          ) : (
            <PrimaryButton>{steps[index + 1].id === "review" ? "Review your brief" : "Continue"}</PrimaryButton>
          )}
        </div>

        {/* Honeypot: hidden from people and assistive technology; a bot that fills every field gives itself away. */}
        <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
          <label htmlFor="intake-hp">Leave this field empty</label>
          <input ref={honeypotRef} id="intake-hp" name="hp_confirm" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
      </form>
    </div>
  );
}

/* Progress ---------------------------------------------------------------- */

function Progress({
  path,
  steps,
  index,
  onGo,
}: {
  path: IntakePath;
  steps: ReturnType<typeof stepsFor>;
  index: number;
  onGo: (step: StepId) => void;
}) {
  const pathLabel = intakePaths.find((option) => option.value === path)?.label ?? path;
  return (
    <aside aria-label="Your progress" className="lg:col-span-3">
      <div className="lg:sticky lg:top-28">
        <div className="flex items-baseline justify-between gap-4">
          <p className="type-label text-fg-muted">
            Your brief · <span className="text-fg">{pathLabel}</span>
          </p>
          <button
            type="button"
            onClick={() => intakeDraft.update({ path: "", step: "" })}
            className="text-small text-fg-muted underline decoration-1 underline-offset-4 hover:text-fg"
          >
            Change<span className="sr-only"> path</span>
          </button>
        </div>

        {/* Small screens: a segmented bar */}
        <div aria-hidden="true" className="mt-4 flex gap-1 lg:hidden">
          {steps.map((step, position) => (
            <span key={step.id} className={`h-1 flex-1 ${position <= index ? "bg-accent" : "bg-fg/15"}`} />
          ))}
        </div>

        {/* Large screens: every step, earlier ones to go back to */}
        <ol className="mt-6 hidden border-t hairline lg:block">
          {steps.map((step, position) => {
            const done = position < index;
            const current = position === index;
            const content = (
              <>
                <span className={`type-label w-6 ${current ? "text-accent" : "text-fg-muted"}`}>
                  {String(position + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{step.title}</span>
                {done ? (
                  <span aria-hidden="true" className="text-fg-muted">
                    ✓
                  </span>
                ) : null}
              </>
            );
            return (
              <li key={step.id} className="border-b hairline" aria-current={current ? "step" : undefined}>
                {done ? (
                  <button
                    type="button"
                    onClick={() => onGo(step.id)}
                    className="flex w-full items-baseline gap-3 py-3 text-left transition-colors hover:text-accent"
                  >
                    {content}
                    <span className="sr-only"> (completed, go back)</span>
                  </button>
                ) : (
                  <span className={`flex items-baseline gap-3 py-3 ${current ? "font-medium" : "text-fg-muted"}`}>
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <p className="mt-4 flex items-center gap-2 text-small text-fg-muted lg:mt-6">
          <span aria-hidden="true" className="size-1.5 bg-accent-quiet" />
          Saved in this browser as you go
        </p>
      </div>
    </aside>
  );
}

/* Review ------------------------------------------------------------------ */

function ReviewStep({
  draft,
  path,
  submit,
  onEdit,
  onRetry,
}: {
  draft: IntakeDraft;
  path: IntakePath;
  submit: SubmitState;
  onEdit: (step: StepId) => void;
  onRetry: () => void;
}) {
  const steps = stepsFor(path);
  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (submit.status !== "editing" && submit.status !== "submitting") alertRef.current?.focus();
  }, [submit]);
  const alertClass = "mb-10 scroll-mt-28 border-l-2 border-accent bg-accent/[0.06] px-5 py-4 outline-none";
  const link = "underline decoration-1 underline-offset-4 hover:text-accent";
  const email = (
    <a href="mailto:hello@elsemarc.com" className={link}>
      hello@elsemarc.com
    </a>
  );
  return (
    <div>
      {submit.status === "error" ? (
        <div ref={alertRef} tabIndex={-1} role="alert" className={alertClass}>
          <p className="font-medium">Your brief couldn’t be sent</p>
          <p className="mt-2 text-small">
            Something went wrong while sending it. Your answers are still saved in this browser, so
            nothing is lost.{" "}
            <button type="button" onClick={onRetry} className={`font-medium ${link}`}>
              Try again
            </button>
            , and if it keeps happening, email {email}.
          </p>
        </div>
      ) : null}
      {submit.status === "rate-limited" ? (
        <div ref={alertRef} tabIndex={-1} role="alert" className={alertClass}>
          <p className="font-medium">Too many briefs from this connection</p>
          <p className="mt-2 text-small">
            Please try again in an hour. Your answers are still saved in this browser. To reach us
            sooner, email {email}.
          </p>
        </div>
      ) : null}
      {submit.status === "uploading" ? (
        <div ref={alertRef} tabIndex={-1} role="alert" className={alertClass}>
          <p className="font-medium">Your files are still uploading</p>
          <p className="mt-2 text-small">
            Submit again once they finish, or{" "}
            <button type="button" onClick={() => onEdit("brand")} className={`font-medium ${link}`}>
              check them in the brand step
            </button>
            .
          </p>
        </div>
      ) : null}
      {submit.status === "missing-files" ? (
        <div ref={alertRef} tabIndex={-1} role="alert" className={alertClass}>
          <p className="font-medium">Some uploaded files couldn’t be found</p>
          <p className="mt-2 text-small">
            {joinList(submit.files)} {submit.files.length === 1 ? "needs" : "need"} to be added
            again.{" "}
            <button type="button" onClick={() => onEdit("brand")} className={`font-medium ${link}`}>
              Remove and re-add {submit.files.length === 1 ? "it" : "them"} in the brand step
            </button>
            , then submit.
          </p>
        </div>
      ) : null}
      {submit.status === "incomplete" ? (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="mb-10 scroll-mt-28 border-l-2 border-accent bg-accent/[0.06] px-5 py-4 outline-none"
        >
          <p className="font-medium">A few answers are still needed</p>
          <ul className="mt-2 space-y-1 text-small">
            {submit.steps.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onEdit(id)}
                  className="underline decoration-1 underline-offset-4 hover:text-accent"
                >
                  Complete {steps.find((step) => step.id === id)?.title.toLowerCase()}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Review path={path} draft={draft} onEdit={onEdit} />
      <p className="mt-10 max-w-[60ch] text-small text-fg-muted">
        Submitting asks for nothing more than a written scope and price. No call, meeting or
        payment is involved.
      </p>
    </div>
  );
}

/* Confirmation ------------------------------------------------------------ */

function Received({ draft, path, onAnother }: ReceivedBrief & { onAnother: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    // The server has confirmed the save: only now is the draft cleared.
    intakeDraft.reset();
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "start" });
  }, []);
  const design = getConcept(draft.design);
  return (
    <div className="border-t hairline pt-8 md:pt-10">
      <div className="max-w-3xl">
        <p className="type-label flex items-center gap-2 text-accent">
          <span aria-hidden="true" className="size-1.5 bg-accent" />
          Brief received
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="type-display mt-4 scroll-mt-28 text-display-md outline-none"
        >
          Thank you, {draft.contact.name.trim()}.
        </h2>
        <div role="status" className="mt-6 space-y-4 text-lede text-fg-muted">
          <p>
            Your brief has been received. A written scope and price will follow by email to{" "}
            <strong className="font-medium break-words text-fg">{draft.contact.email.trim()}</strong>.
          </p>
          <p>
            A short confirmation is on its way to the same address. If you don’t see it, check your
            spam folder; your brief is safely with us either way.
          </p>
        </div>

        <dl className="mt-10 grid gap-4 border-y hairline py-6 text-small sm:grid-cols-3">
          <div>
            <dt className="text-fg-muted">Path</dt>
            <dd className="mt-1">{path === "website" ? "A website" : "Custom development"}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">{path === "website" ? "Design" : "Functions"}</dt>
            <dd className="mt-1">
              {path === "website"
                ? design?.title ?? "—"
                : draft.functions.length
                  ? draft.functions.slice(0, 3).map(functionLabel).join(", ") + (draft.functions.length > 3 ? "…" : "")
                  : "Described in your words"}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">{path === "website" ? "Files" : "Contact"}</dt>
            <dd className="mt-1 break-words">
              {path === "website"
                ? draft.website.assets.length
                  ? `${draft.website.assets.length} uploaded`
                  : "None"
                : draft.contact.email}
            </dd>
          </div>
        </dl>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="group inline-flex min-h-13 items-center justify-center gap-3 self-start bg-accent px-6 font-medium text-accent-fg transition-colors hover:bg-fg hover:text-surface"
          >
            Return home
            <span aria-hidden="true" className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
              →
            </span>
          </Link>
          <button
            type="button"
            onClick={onAnother}
            className="inline-flex min-h-12 items-center self-start text-small font-medium text-fg-muted underline decoration-1 underline-offset-4 hover:text-fg sm:self-auto sm:px-5"
          >
            Start another brief
          </button>
        </div>
      </div>
    </div>
  );
}

/* Shared ------------------------------------------------------------------ */

/** "a", "a and b", "a, b and c" */
function joinList(items: string[]) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function PrimaryButton({
  children,
  type = "submit",
  ...props
}: { children: ReactNode } & ComponentProps<"button">) {
  return (
    <button
      type={type}
      className="group inline-flex min-h-13 items-center justify-center gap-3 bg-accent px-6 font-medium text-accent-fg transition-colors hover:bg-fg hover:text-surface disabled:cursor-wait disabled:opacity-60"
      {...props}
    >
      {children}
      <span aria-hidden="true" className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
        →
      </span>
    </button>
  );
}
