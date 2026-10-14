"use client";

import { functionOptions, isFunctionId } from "@/content/capabilities";
import {
  budgetOptions,
  timelineOptions,
  userOptions,
  type CustomStepId,
} from "@/content/intake";
import { intakeDraft, type IntakeDraft } from "@/lib/intake/draft";
import type { FieldErrors } from "@/lib/intake/validate";
import { CheckboxGroup, RadioGroup, TextArea, TextField, toggle } from "./fields";

type StepProps = { draft: IntakeDraft; errors: FieldErrors };

export function CustomStep({ step, ...props }: StepProps & { step: CustomStepId }) {
  switch (step) {
    case "project":
      return <ProjectStep {...props} />;
    case "functionality":
      return <FunctionalityStep {...props} />;
    case "people":
      return <PeopleStep {...props} />;
    case "budget":
      return <BudgetStep {...props} />;
    case "contact":
      return <ContactStep {...props} />;
    default:
      return null;
  }
}

const set = intakeDraft.updateCustom;

/** The homepage explorer's options, as checkbox options. */
const functionChoices = functionOptions.map((option) => ({ value: option.id, label: option.label }));

function ProjectStep({ draft, errors }: StepProps) {
  return (
    <TextArea
      name="idea"
      label="Describe your project"
      hint="What should it do, and what problem does it solve? Plain words are perfect; the details come later."
      rows={6}
      maxLength={intakeDraft.maxIdeaLength}
      placeholder="Automatically take bookings, send confirmations, and remember my customers…"
      value={draft.idea}
      onValue={intakeDraft.setIdea}
      error={errors.idea}
    />
  );
}

function FunctionalityStep({ draft, errors }: StepProps) {
  return (
    <div className="space-y-8">
      <CheckboxGroup
        name="functions"
        label="What should it do?"
        hint="Choose any that apply. Choices made elsewhere on the site are already here."
        options={functionChoices}
        values={draft.functions}
        onToggle={(id) => {
          if (isFunctionId(id)) intakeDraft.toggleFunction(id);
        }}
        error={errors.functions}
      />
      <TextArea
        name="functionNotes"
        label="Anything more specific?"
        optional
        rows={3}
        value={draft.custom.functionNotes}
        onValue={(functionNotes) => set({ functionNotes })}
      />
    </div>
  );
}

function PeopleStep({ draft, errors }: StepProps) {
  const c = draft.custom;
  return (
    <div className="space-y-8">
      <CheckboxGroup
        name="users"
        label="Who will use it?"
        options={userOptions}
        columns={3}
        values={c.users}
        onToggle={(user) => set({ users: toggle(c.users, user) })}
        error={errors.users}
      />
      <TextField
        name="userNotes"
        label="Anything about them we should know?"
        optional
        placeholder="For example: about 40 regular clients, mostly on phones"
        value={c.userNotes}
        onValue={(userNotes) => set({ userNotes })}
      />
      <div className="border-t hairline pt-8">
        <TextArea
          name="integrations"
          label="Software it needs to work with"
          optional
          hint="Calendars, accounting, email, payments, stock: whatever you already use. Leave blank if none."
          rows={3}
          value={c.integrations}
          onValue={(integrations) => set({ integrations })}
        />
      </div>
    </div>
  );
}

function BudgetStep({ draft, errors }: StepProps) {
  const c = draft.custom;
  return (
    <div className="space-y-8">
      <RadioGroup
        name="budget"
        label="Budget range"
        hint="In Canadian dollars. A range helps us suggest what fits; it is not a price."
        options={budgetOptions}
        columns={3}
        value={c.budget}
        onValue={(budget) => set({ budget })}
        error={errors.budget}
      />
      <RadioGroup
        name="timeline"
        label="When would you like it ready?"
        options={timelineOptions}
        value={c.timeline}
        onValue={(timeline) => set({ timeline })}
        error={errors.timeline}
      />
      <TextField
        name="deadline"
        label="A specific date or reason?"
        optional
        placeholder="For example: before our spring opening"
        value={c.deadline}
        onValue={(deadline) => set({ deadline })}
      />
    </div>
  );
}

function ContactStep({ draft, errors }: StepProps) {
  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2 md:gap-x-6">
        <TextField
          name="contactName"
          label="Your name"
          autoComplete="name"
          value={draft.contact.name}
          onValue={(name) => intakeDraft.updateContact({ name })}
          error={errors.contactName}
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          hint="Your scope and price are sent here."
          value={draft.contact.email}
          onValue={(email) => intakeDraft.updateContact({ email })}
          error={errors.email}
        />
      </div>
      <TextField
        name="businessName"
        label="Business name"
        optional
        autoComplete="organization"
        value={draft.businessName}
        onValue={(businessName) => intakeDraft.update({ businessName })}
      />
    </div>
  );
}
