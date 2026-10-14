"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  bookingDays,
  bookingTimes,
  businessTypes,
  getService,
  halden,
  isTaken,
  services,
} from "./content";

/*
 * The consultation booking flow: service, time, details, confirmation.
 * In the demo nothing leaves the page. There is no calendar behind it, no
 * email is sent and the details are dropped as soon as the visitor leaves.
 * The confirmation says so plainly. A real site would connect this to the
 * practice's scheduling tool.
 */

const stepNames = ["Service", "Time", "Your details", "Confirmed"] as const;
type Step = 0 | 1 | 2 | 3;

type Booking = {
  step: Step;
  serviceId: string;
  dayId: string;
  time: string;
  summoned: number;
  /** Pre-select from elsewhere on the page, then bring the flow into view. */
  start: (choice: { serviceId?: string; dayId?: string; time?: string }) => void;
};

const BookingContext = createContext<Booking | null>(null);

type State = {
  step: Step;
  serviceId: string;
  dayId: string;
  time: string;
  /** Bumped when another part of the page sends the visitor here, to move focus. */
  summoned: number;
};

const BookingState = createContext<((update: (state: State) => State) => void) | null>(null);

const initial: State = { step: 0, serviceId: "", dayId: bookingDays[0].id, time: "", summoned: 0 };

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);

  function start(choice: { serviceId?: string; dayId?: string; time?: string }) {
    setState((current) => {
      const serviceId = choice.serviceId ?? current.serviceId;
      const dayId = choice.dayId ?? current.dayId;
      const time = choice.time ?? (choice.dayId ? "" : current.time);
      // Land on the first step that still needs an answer.
      const step: Step = !serviceId ? 0 : !time ? 1 : 2;
      return { step, serviceId, dayId, time, summoned: current.summoned + 1 };
    });
    document.getElementById("book")?.scrollIntoView({ block: "start" });
  }

  return (
    <BookingContext.Provider value={{ ...state, start }}>
      <BookingState.Provider value={setState}>{children}</BookingState.Provider>
    </BookingContext.Provider>
  );
}

function useBooking() {
  const booking = useContext(BookingContext);
  const setState = useContext(BookingState);
  if (!booking || !setState) throw new Error("Booking components need a BookingProvider.");
  return { booking, setState };
}

/* Entry points elsewhere on the page -------------------------------------- */

/** A button that opens the flow with some choices already made. */
export function BookTrigger({
  serviceId,
  dayId,
  time,
  className = "",
  children,
  label,
}: {
  serviceId?: string;
  dayId?: string;
  time?: string;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  const { booking } = useBooking();
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => booking.start({ serviceId, dayId, time })}
      className={className}
    >
      {children}
    </button>
  );
}

/* The flow ---------------------------------------------------------------- */

export function BookingFlow() {
  const { booking, setState } = useBooking();
  const { step, summoned } = booking;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previous = useRef({ step, summoned });

  // Move focus to the current step's heading when the step changes or the
  // visitor arrives from elsewhere on the page, but never on first render.
  useEffect(() => {
    if (previous.current.step !== step || previous.current.summoned !== summoned) {
      headingRef.current?.focus({ preventScroll: true });
    }
    previous.current = { step, summoned };
  }, [step, summoned]);

  const go = (next: Step) => setState((state) => ({ ...state, step: next }));

  return (
    <div className="border border-demo-fg/15 bg-[var(--halden-raised)]">
      <Progress step={step} />
      <div className="p-5 sm:p-8 lg:p-10">
        {step === 0 ? <ChooseService headingRef={headingRef} onNext={() => go(1)} /> : null}
        {step === 1 ? (
          <ChooseTime headingRef={headingRef} onBack={() => go(0)} onNext={() => go(2)} />
        ) : null}
        {step === 2 ? (
          <Details headingRef={headingRef} onBack={() => go(1)} onNext={() => go(3)} />
        ) : null}
        {step === 3 ? (
          <Confirmation
            headingRef={headingRef}
            onRestart={() => setState((state) => ({ ...initial, summoned: state.summoned }))}
          />
        ) : null}
      </div>
    </div>
  );
}

function Progress({ step }: { step: Step }) {
  return (
    <ol className="grid grid-cols-4 border-b border-demo-fg/15 text-xs sm:text-sm">
      {stepNames.map((name, index) => {
        const state = index < step ? "done" : index === step ? "current" : "todo";
        return (
          <li
            key={name}
            aria-current={state === "current" ? "step" : undefined}
            className={`relative px-3 py-4 sm:px-5 ${state === "todo" ? "text-demo-fg/45" : ""}`}
          >
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 bottom-[-1px] h-0.5 ${
                state === "todo" ? "bg-transparent" : "bg-demo-accent"
              }`}
            />
            <span className="font-halden-serif text-demo-accent tabular-nums">{index + 1}</span>
            <span className="ml-2 hidden sm:inline">{name}</span>
            <span className="sr-only sm:hidden">{name}</span>
            {state === "done" ? <span className="sr-only"> (completed)</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

type StepProps = { headingRef: RefObject<HTMLHeadingElement | null> };

function StepHeading({ headingRef, children }: StepProps & { children: ReactNode }) {
  return (
    <h3
      ref={headingRef}
      tabIndex={-1}
      className="text-2xl font-medium tracking-[-0.02em] outline-none md:text-3xl"
    >
      {children}
    </h3>
  );
}

/* Step 1 */
function ChooseService({ headingRef, onNext }: StepProps & { onNext: () => void }) {
  const { booking, setState } = useBooking();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (booking.serviceId) onNext();
      }}
    >
      <StepHeading headingRef={headingRef}>What would you like to talk about?</StepHeading>
      <fieldset className="mt-6">
        <legend className="sr-only">Service</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((service) => {
            const checked = booking.serviceId === service.id;
            return (
              <label
                key={service.id}
                className={`flex cursor-pointer flex-col gap-2 border p-5 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-demo-accent ${
                  checked
                    ? "border-demo-accent bg-demo-accent/10"
                    : "border-demo-fg/20 hover:border-demo-fg/50"
                }`}
              >
                <input
                  type="radio"
                  name="service"
                  value={service.id}
                  checked={checked}
                  onChange={() => setState((state) => ({ ...state, serviceId: service.id }))}
                  className="sr-only"
                />
                <span className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{service.title}</span>
                  <span className="shrink-0 text-sm text-demo-fg/70 tabular-nums">{service.fee}</span>
                </span>
                <span className="text-sm leading-relaxed text-demo-fg/70">{service.summary}</span>
                <span className="mt-auto pt-2 text-xs tracking-[0.08em] text-demo-fg/55 uppercase">
                  {service.duration} · {service.format}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <Actions
        status={booking.serviceId ? getService(booking.serviceId)?.title : "Choose a service to continue."}
        next="Choose a time"
        disabled={!booking.serviceId}
      />
    </form>
  );
}

/* Step 2 */
function ChooseTime({
  headingRef,
  onBack,
  onNext,
}: StepProps & { onBack: () => void; onNext: () => void }) {
  const { booking, setState } = useBooking();
  const day = bookingDays.find((value) => value.id === booking.dayId) ?? bookingDays[0];
  const weeks = ["This week", "Next week"] as const;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (booking.time) onNext();
      }}
    >
      <StepHeading headingRef={headingRef}>Pick a time that suits you.</StepHeading>
      <p className="mt-2 text-sm text-demo-fg/65">
        All times are {halden.timezone}. Sample availability for the demonstration.
      </p>

      <fieldset className="mt-6">
        <legend className="mb-3 text-xs tracking-[0.12em] text-demo-fg/60 uppercase">Day</legend>
        <div className="space-y-4">
          {weeks.map((week) => (
            <div key={week} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="w-24 shrink-0 text-sm text-demo-fg/60">{week}</span>
              <div className="flex flex-wrap gap-2">
                {bookingDays
                  .filter((value) => value.week === week)
                  .map((value) => {
                    const full = bookingTimes.every((time) => isTaken(value.id, time));
                    return (
                      <Choice
                        key={value.id}
                        name="day"
                        checked={booking.dayId === value.id}
                        disabled={full}
                        onChange={() =>
                          setState((state) => ({ ...state, dayId: value.id, time: "" }))
                        }
                        className="w-16"
                      >
                        {value.short}
                        <span className="sr-only">
                          {" "}
                          {value.label}, {week.toLowerCase()}
                          {full ? " (fully booked)" : ""}
                        </span>
                      </Choice>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="mb-3 text-xs tracking-[0.12em] text-demo-fg/60 uppercase">
          {day.label}, {day.week.toLowerCase()}
        </legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {bookingTimes.map((time) => {
            const taken = isTaken(day.id, time);
            return (
              <Choice
                key={time}
                name="time"
                checked={booking.time === time}
                disabled={taken}
                onChange={() => setState((state) => ({ ...state, time }))}
                className="tabular-nums"
              >
                {time}
                {taken ? <span className="sr-only"> (taken)</span> : null}
              </Choice>
            );
          })}
        </div>
      </fieldset>

      <Actions
        onBack={onBack}
        status={booking.time ? `${day.label} ${day.week.toLowerCase()}, ${booking.time}` : "Choose a time to continue."}
        next="Add your details"
        disabled={!booking.time}
      />
    </form>
  );
}

/* Step 3 */
function Details({
  headingRef,
  onBack,
  onNext,
}: StepProps & { onBack: () => void; onNext: () => void }) {
  const id = useId();
  const field =
    "mt-2 block h-12 w-full border border-demo-fg/25 bg-demo-bg/60 px-4 text-base text-demo-fg placeholder:text-demo-fg/40 transition-colors hover:border-demo-fg/50 focus:border-demo-accent focus:outline-none";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Nothing is kept: the fields are cleared before moving on.
    event.currentTarget.reset();
    onNext();
  }

  return (
    <form onSubmit={onSubmit}>
      <StepHeading headingRef={headingRef}>A few details, so we can prepare.</StepHeading>
      <p className="mt-2 max-w-xl text-sm text-demo-fg/65">
        This is a demonstration. Nothing you type here is sent or saved.
      </p>
      <Summary />

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="text-sm">
            Your name
          </label>
          <input id={`${id}-name`} name="name" required autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="text-sm">
            Email
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={field}
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor={`${id}-type`} className="text-sm">
            Your business
          </label>
          <select id={`${id}-type`} name="business" required defaultValue="" className={field}>
            <option value="" disabled>
              Choose one
            </option>
            {businessTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor={`${id}-note`} className="text-sm">
            Anything we should know? <span className="text-demo-fg/55">Optional</span>
          </label>
          <textarea
            id={`${id}-note`}
            name="note"
            rows={3}
            className={`${field} h-auto py-3 leading-relaxed`}
          />
        </div>
      </div>

      <Actions onBack={onBack} next="Request this time" />
    </form>
  );
}

/* Step 4 */
function Confirmation({ headingRef, onRestart }: StepProps & { onRestart: () => void }) {
  return (
    <div role="status">
      <p className="text-xs tracking-[0.12em] text-demo-accent uppercase">Demonstration only</p>
      <div className="mt-3">
        <StepHeading headingRef={headingRef}>Your time is held. In a real site, that is.</StepHeading>
      </div>
      <Summary />
      <p className="mt-6 max-w-xl leading-relaxed text-demo-fg/75">
        Nothing was booked and no email was sent. The details you entered were cleared and never
        left this page. On a live site, this is where the client receives a calendar invitation,
        a short note on what to bring and a reminder the day before.
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="mt-8 inline-flex h-12 items-center border border-demo-fg/30 px-6 text-sm transition-colors hover:border-demo-fg"
      >
        Start again
      </button>
    </div>
  );
}

/** The current choice, repeated so it is never in doubt. */
function Summary() {
  const { booking } = useBooking();
  const service = getService(booking.serviceId);
  const day = bookingDays.find((value) => value.id === booking.dayId);
  if (!service || !day || !booking.time) return null;
  return (
    <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-demo-fg/15 py-5 text-sm sm:grid-cols-4">
      <div>
        <dt className="text-demo-fg/55">Service</dt>
        <dd className="mt-1 font-medium">{service.title}</dd>
      </div>
      <div>
        <dt className="text-demo-fg/55">When</dt>
        <dd className="mt-1 font-medium">
          {day.label} {day.week.toLowerCase()}, {booking.time}
        </dd>
      </div>
      <div>
        <dt className="text-demo-fg/55">Length</dt>
        <dd className="mt-1 font-medium">{service.duration}</dd>
      </div>
      <div>
        <dt className="text-demo-fg/55">Fee</dt>
        <dd className="mt-1 font-medium">{service.fee}</dd>
      </div>
    </dl>
  );
}

/* Shared controls --------------------------------------------------------- */

function Actions({
  onBack,
  status,
  next,
  disabled = false,
}: {
  onBack?: () => void;
  status?: string;
  next: string;
  disabled?: boolean;
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-4 border-t border-demo-fg/15 pt-6 sm:flex-row sm:items-center">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-12 items-center text-sm text-demo-fg/75 transition-colors hover:text-demo-fg"
        >
          <span aria-hidden="true" className="mr-2">
            ←
          </span>
          Back
        </button>
      ) : null}
      {status ? (
        <p aria-live="polite" className="text-sm text-demo-fg/65 sm:ml-2">
          {status}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex h-12 items-center justify-center gap-3 bg-demo-accent px-6 text-sm font-medium text-demo-bg transition-[background-color,opacity] hover:bg-demo-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-demo-accent sm:ml-auto"
      >
        {next}
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

type ChoiceProps = {
  name: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

function Choice({ name, checked, onChange, disabled, className = "", children }: ChoiceProps) {
  return (
    <label
      className={`relative inline-flex h-12 cursor-pointer items-center justify-center border px-3 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-demo-accent has-disabled:cursor-not-allowed has-disabled:border-dashed has-disabled:border-demo-fg/15 has-disabled:text-demo-fg/30 ${
        checked
          ? "border-demo-accent bg-demo-accent font-medium text-demo-bg"
          : "border-demo-fg/25 hover:border-demo-fg/60"
      } ${className}`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      {children}
    </label>
  );
}
