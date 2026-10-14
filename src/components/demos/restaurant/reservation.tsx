"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  ardoise,
  isSlotTaken,
  partySizes,
  reservationDays,
  reservationTimes,
} from "./content";

/**
 * The booking widget. In the demo it never leaves the page: submitting
 * shows a confirmation that says plainly no table was booked. A real site
 * would connect this to the restaurant's reservation system.
 */
export function Reservation() {
  const [party, setParty] = useState(2);
  const [day, setDay] = useState<string>(reservationDays[2]);
  const [time, setTime] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const ready = time !== "";

  /** Changing guests or day can make the chosen time unavailable. */
  function update(nextParty: number, nextDay: string) {
    setParty(nextParty);
    setDay(nextDay);
    if (time && isSlotTaken(nextDay, time, nextParty)) setTime("");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ready) setConfirmed(true);
  }

  if (confirmed) {
    return (
      <div role="status" className="border border-demo-accent/50 p-6 md:p-10">
        <p className="text-xs tracking-[0.22em] text-demo-accent uppercase">Table held</p>
        <p className="mt-4 font-ardoise-display text-4xl leading-tight italic md:text-5xl">
          {party === 1 ? "A table for one" : `A table for ${party}`}, {day} at {time}.
        </p>
        <p className="mt-6 max-w-md text-demo-fg/70">
          This is a demonstration: no reservation was made. On a live site, this is where
          the guest receives a confirmation and a reminder the day before.
        </p>
        <button
          type="button"
          onClick={() => {
            setConfirmed(false);
            setTime("");
          }}
          className="mt-8 border-b border-demo-fg/40 pb-1 text-sm tracking-[0.14em] uppercase transition-colors hover:border-demo-accent hover:text-demo-accent"
        >
          Change details
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <Options legend="Guests">
        {partySizes.map((size) => (
          <Choice
            key={size}
            name="party"
            checked={party === size}
            onChange={() => update(size, day)}
            className="w-12"
          >
            {size}
          </Choice>
        ))}
        <span className="self-center pl-2 text-sm text-demo-fg/60">
          More?{" "}
          <a href={ardoise.phone.href} className="underline underline-offset-4 hover:text-demo-accent">
            Call us
          </a>
        </span>
      </Options>

      <Options legend="This week">
        {reservationDays.map((value) => (
          <Choice key={value} name="day" checked={day === value} onChange={() => update(party, value)}>
            <span className="sm:hidden">{value.slice(0, 3)}</span>
            <span className="hidden sm:inline">{value}</span>
          </Choice>
        ))}
      </Options>

      <Options legend="Time">
        {reservationTimes.map((value) => {
          const taken = isSlotTaken(day, value, party);
          return (
            <Choice
              key={value}
              name="time"
              checked={time === value}
              onChange={() => setTime(value)}
              disabled={taken}
              className="tabular-nums"
            >
              {value}
              {taken ? <span className="sr-only"> (fully booked)</span> : null}
            </Choice>
          );
        })}
      </Options>

      <div className="flex flex-col gap-4 border-t border-demo-fg/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-demo-fg/60" aria-live="polite">
          {ready
            ? `${party} ${party === 1 ? "guest" : "guests"} · ${day} · ${time}`
            : "Choose a time to continue."}
        </p>
        <button
          type="submit"
          disabled={!ready}
          className="inline-flex min-h-13 items-center justify-center gap-3 bg-demo-accent px-8 text-sm font-medium tracking-[0.16em] text-demo-bg uppercase transition-[background-color,opacity] hover:bg-demo-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-demo-accent"
        >
          Hold this table
        </button>
      </div>
    </form>
  );
}

function Options({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-4 text-xs tracking-[0.22em] text-demo-fg/60 uppercase">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
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
      className={`relative inline-flex h-12 min-w-12 cursor-pointer items-center justify-center border px-4 text-base transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-demo-accent has-disabled:cursor-not-allowed has-disabled:border-demo-fg/10 has-disabled:text-demo-fg/30 has-disabled:line-through ${
        checked
          ? "border-demo-accent bg-demo-accent text-demo-bg"
          : "border-demo-fg/25 hover:border-demo-fg/70"
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
