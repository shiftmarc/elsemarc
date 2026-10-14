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
import { validateBrief, validateStep, type FieldErrors } from "@/lib/intake/validate";
import { CustomStep } from "./custom-steps";
import { fieldId, RadioGroup } from "./fields";
import { Review } from "./review";
import { WebsiteStep } from "./website-steps";

/*
 * The project intake. Every answer is written to the intake draft as it is
 * typed, so the visitor can leave and come back to the same step. Each step
 * is validated when they continue; submission goes through submitIntake().
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

  return draft.path ? <Steps draft={draft} path={draft.path} /> : <ChoosePath draft={draft} />;
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
  | { status: "received" };

function Steps({ draft, path }: { draft: IntakeDraft; path: IntakePath }) {
  const steps = stepsFor(path);
  const index = Math.max(0, steps.findIndex((step) => step.id === draft.step));
  const step = steps[index];
  const isReview = step.id === "review";

  const [attempted, setAttempted] = useState<ReadonlySet<StepId>>(new Set());
  const [submit, setSubmit] = useState<SubmitState>({ status: "editing" });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const shownStep = useRef(step.id);

  // Errors appear once the visitor tries to continue, then update as they fix them.
  const errors: FieldErrors = attempted.has(step.id) ? validateStep(path, step.id, draft) : {};
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
    const found = validateStep(path, step.id, draft);
    if (Object.keys(found).length > 0) {
      setAttempted((current) => new Set(current).add(step.id));
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    go(steps[index + 1].id);
  }

  async function onSubmitBrief() {
    setSubmit({ status: "submitting" });
    const result = await submitIntake(draft);
    if (result.ok) {
      setSubmit({ status: "received" });
    } else {
      setAttempted(new Set(result.incomplete.map((item) => item.step)));
      setSubmit({ status: "incomplete", steps: result.incomplete.map((item) => item.step) });
    }
  }

  if (submit.status === "received") {
    return <Received draft={draft} path={path} onBack={() => setSubmit({ status: "editing" })} />;
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
            <ReviewStep draft={draft} path={path} submit={submit} onEdit={go} />
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
              {submit.status === "submitting" ? "Checking your brief…" : "Submit brief"}
            </PrimaryButton>
          ) : (
            <PrimaryButton>{steps[index + 1].id === "review" ? "Review your brief" : "Continue"}</PrimaryButton>
          )}
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
}: {
  draft: IntakeDraft;
  path: IntakePath;
  submit: SubmitState;
  onEdit: (step: StepId) => void;
}) {
  const steps = stepsFor(path);
  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (submit.status === "incomplete") alertRef.current?.focus();
  }, [submit.status]);
  return (
    <div>
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

function Received({
  draft,
  path,
  onBack,
}: {
  draft: IntakeDraft;
  path: IntakePath;
  onBack: () => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "start" });
  }, []);
  const design = getConcept(draft.design);
  return (
    <div className="border-t hairline pt-8 md:pt-10">
      <div className="max-w-3xl">
        <p className="type-label flex items-center gap-2 text-accent">
          <span aria-hidden="true" className="size-1.5 bg-accent" />
          Preview of the intake
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="type-display mt-4 scroll-mt-28 text-display-md outline-none"
        >
          Your brief is complete.
        </h2>
        <div role="status" className="mt-6 space-y-4 text-lede text-fg-muted">
          <p>
            This is a preview of the intake, so your brief has <strong className="font-medium text-fg">not been sent</strong>{" "}
            or stored anywhere yet. It is still saved only in this browser, and no one has seen it.
          </p>
          <p>
            When the intake goes live, this is where your brief is received and a written scope and
            price follow by email.
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
            <dt className="text-fg-muted">Contact</dt>
            <dd className="mt-1 break-words">{draft.contact.email}</dd>
          </div>
        </dl>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <PrimaryButton type="button" onClick={onBack}>
            Back to your brief
          </PrimaryButton>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center self-start text-small font-medium text-fg-muted underline sm:self-auto sm:px-5 decoration-1 underline-offset-4 hover:text-fg"
          >
            Return home
          </Link>
        </div>

        <div className="mt-12 border-t hairline pt-6 text-small text-fg-muted">
          {confirmClear ? (
            <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
              Clear every answer, including choices made elsewhere on the site?
              <button
                type="button"
                onClick={() => intakeDraft.reset()}
                className="font-medium text-accent underline decoration-1 underline-offset-4"
              >
                Yes, clear my brief
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="underline decoration-1 underline-offset-4 hover:text-fg"
              >
                Keep it
              </button>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="underline decoration-1 underline-offset-4 hover:text-fg"
            >
              Start a new brief
            </button>
          )}
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
