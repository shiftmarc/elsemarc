"use client";

import type { ComponentProps, ReactNode } from "react";
import type { Option } from "@/content/intake";

/*
 * Form primitives for the intake. Every control has a visible label, an
 * optional hint and an inline error, wired up with aria-describedby and
 * aria-invalid. The id of a field (or of a group's first option) is
 * fieldId(name), which the error summary links to.
 */

export const fieldId = (name: string) => `intake-${name}`;
const hintId = (name: string) => `intake-${name}-hint`;
const errorId = (name: string) => `intake-${name}-error`;

function describedBy(name: string, hint?: ReactNode, error?: string) {
  return [hint ? hintId(name) : null, error ? errorId(name) : null].filter(Boolean).join(" ") || undefined;
}

function Hint({ name, children }: { name: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={hintId(name)} className="mt-1.5 text-small text-fg-muted">
      {children}
    </p>
  );
}

export function FieldError({ name, error }: { name: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={errorId(name)} className="mt-2 flex gap-2 text-small text-accent">
      <span aria-hidden="true">!</span>
      {error}
    </p>
  );
}

function Optional() {
  return <span className="ml-2 text-small font-normal text-fg-muted">Optional</span>;
}

const control =
  "mt-3 block w-full border bg-surface-raised px-4 text-body text-fg transition-colors placeholder:text-fg-muted/70 hover:border-fg/40 focus:border-fg";

const controlBorder = (error?: string) => (error ? "border-accent" : "border-line");

type Base = {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
};

export function TextField({
  name,
  label,
  hint,
  error,
  optional,
  value,
  onValue,
  ...props
}: Base & { value: string; onValue: (value: string) => void } & Omit<
    ComponentProps<"input">,
    "name" | "value" | "onChange"
  >) {
  return (
    <div>
      <label htmlFor={fieldId(name)} className="font-medium">
        {label}
        {optional ? <Optional /> : null}
      </label>
      <Hint name={name}>{hint}</Hint>
      <input
        id={fieldId(name)}
        name={name}
        value={value}
        onChange={(event) => onValue(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        className={`${control} h-13 ${controlBorder(error)}`}
        {...props}
      />
      <FieldError name={name} error={error} />
    </div>
  );
}

export function TextArea({
  name,
  label,
  hint,
  error,
  optional,
  value,
  onValue,
  rows = 4,
  ...props
}: Base & { value: string; onValue: (value: string) => void } & Omit<
    ComponentProps<"textarea">,
    "name" | "value" | "onChange"
  >) {
  return (
    <div>
      <label htmlFor={fieldId(name)} className="font-medium">
        {label}
        {optional ? <Optional /> : null}
      </label>
      <Hint name={name}>{hint}</Hint>
      <textarea
        id={fieldId(name)}
        name={name}
        rows={rows}
        value={value}
        onChange={(event) => onValue(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        className={`${control} field-sizing-content min-h-[calc(var(--spacing)*4+4lh)] resize-y py-3 leading-relaxed ${controlBorder(error)}`}
        {...props}
      />
      <FieldError name={name} error={error} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  hint,
  error,
  optional,
  value,
  onValue,
  options,
  placeholder = "Choose one",
}: Base & {
  value: string;
  onValue: (value: string) => void;
  options: readonly Option[];
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={fieldId(name)} className="font-medium">
        {label}
        {optional ? <Optional /> : null}
      </label>
      <Hint name={name}>{hint}</Hint>
      <div className="relative">
        <select
          id={fieldId(name)}
          name={name}
          value={value}
          onChange={(event) => onValue(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(name, hint, error)}
          className={`${control} h-13 appearance-none pr-12 ${controlBorder(error)} ${value ? "" : "text-fg-muted"}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="pointer-events-none absolute right-4 bottom-3.5 text-fg-muted">
          ↓
        </span>
      </div>
      <FieldError name={name} error={error} />
    </div>
  );
}

type GroupProps = Base & {
  options: readonly Option[];
  /** Grid columns from the sm breakpoint. */
  columns?: 1 | 2 | 3;
};

const columnClass = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" } as const;

function Group({
  name,
  label,
  hint,
  error,
  optional,
  columns = 2,
  children,
}: Omit<GroupProps, "options"> & { children: ReactNode }) {
  return (
    <fieldset aria-describedby={describedBy(name, hint, error)} aria-invalid={error ? true : undefined}>
      <legend className="font-medium">
        {label}
        {optional ? <Optional /> : null}
      </legend>
      <Hint name={name}>{hint}</Hint>
      <div className={`mt-3 grid gap-2 ${columnClass[columns]}`}>{children}</div>
      <FieldError name={name} error={error} />
    </fieldset>
  );
}

function OptionTile({
  id,
  type,
  name,
  checked,
  onChange,
  option,
  error,
}: {
  id: string;
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: () => void;
  option: Option;
  error?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex min-h-13 cursor-pointer items-start gap-3 border px-4 py-3.5 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
        checked ? "border-fg bg-fg/[0.06]" : `${error ? "border-accent/60" : "border-line"} hover:border-fg/40`
      }`}
    >
      <input id={id} type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden="true"
        className={`mt-1 grid size-4 shrink-0 place-items-center border ${type === "radio" ? "rounded-full" : ""} ${
          checked ? "border-accent bg-accent" : "border-fg/40"
        }`}
      >
        {checked ? (
          type === "radio" ? (
            <span className="size-1.5 rounded-full bg-accent-fg" />
          ) : (
            <span className="text-[0.625rem] leading-none text-accent-fg">✓</span>
          )
        ) : null}
      </span>
      <span>
        <span className="block">{option.label}</span>
        {option.hint ? <span className="mt-1 block text-small text-fg-muted">{option.hint}</span> : null}
      </span>
    </label>
  );
}

export function RadioGroup({
  value,
  onValue,
  ...props
}: GroupProps & { value: string; onValue: (value: string) => void }) {
  return (
    <Group {...props}>
      {props.options.map((option, index) => (
        <OptionTile
          key={option.value}
          id={index === 0 ? fieldId(props.name) : `${fieldId(props.name)}-${option.value}`}
          type="radio"
          name={props.name}
          checked={value === option.value}
          onChange={() => onValue(option.value)}
          option={option}
          error={props.error}
        />
      ))}
    </Group>
  );
}

export function CheckboxGroup({
  values,
  onToggle,
  ...props
}: GroupProps & { values: readonly string[]; onToggle: (value: string) => void }) {
  return (
    <Group {...props}>
      {props.options.map((option, index) => (
        <OptionTile
          key={option.value}
          id={index === 0 ? fieldId(props.name) : `${fieldId(props.name)}-${option.value}`}
          type="checkbox"
          name={props.name}
          checked={values.includes(option.value)}
          onChange={() => onToggle(option.value)}
          option={option}
          error={props.error}
        />
      ))}
    </Group>
  );
}

/** Adds or removes a value, keeping the order chosen. */
export function toggle<T extends string>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
