import type { Capability } from "@/content/capabilities";

/**
 * Small illustrative interfaces for each capability, drawn in the site's own
 * tokens. They show the shape of a feature, not a real product, and are
 * labelled as illustrations wherever they appear.
 */
export function CapabilitySpecimen({ id }: { id: Capability["id"] }) {
  const Specimen = specimens[id];
  return (
    <div className="flex aspect-[5/4] flex-col border hairline bg-surface-raised p-5 sm:p-7">
      <p className="type-label flex justify-between text-fg-muted">
        <span>Illustration</span>
        <span>{labels[id]}</span>
      </p>
      <div className="flex flex-1 flex-col justify-center pt-5">
        <Specimen />
      </div>
    </div>
  );
}

const labels: Record<Capability["id"], string> = {
  reservations: "Table booking",
  payments: "Checkout",
  appointments: "Scheduling",
  portals: "Client area",
  automations: "Workflow",
  unknown: "Your idea",
};

function Reservations() {
  const times = ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
  return (
    <div>
      <div className="flex items-end justify-between border-b hairline pb-4">
        <div>
          <p className="type-label text-fg-muted">Friday 14 November</p>
          <p className="type-display mt-1 text-heading">Party of 4</p>
        </div>
        <p className="type-label text-fg-muted">− 4 +</p>
      </div>
      <ul className="mt-5 grid grid-cols-4 gap-2 text-small">
        {times.map((time) => (
          <li
            key={time}
            className={`py-2 text-center ${
              time === "19:00"
                ? "bg-accent text-accent-fg"
                : time === "18:30" || time === "20:30"
                  ? "text-fg-muted line-through decoration-1"
                  : "border hairline"
            }`}
          >
            {time}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-small text-fg-muted">Confirmation sent by email and text.</p>
    </div>
  );
}

function Payments() {
  const lines = [
    ["Tasting menu × 2", "$190.00"],
    ["Wine pairing × 2", "$110.00"],
    ["Deposit (25%)", "$75.00"],
  ];
  return (
    <div>
      <ul className="text-small">
        {lines.map(([label, amount]) => (
          <li key={label} className="flex justify-between border-b hairline py-2.5">
            <span>{label}</span>
            <span className="tabular-nums text-fg-muted">{amount}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="type-label text-fg-muted">Due today</span>
        <span className="type-display text-heading tabular-nums">$75.00</span>
      </div>
      <div className="mt-5 flex items-center justify-between bg-fg px-4 py-3 text-small text-surface">
        <span>Pay deposit</span>
        <span aria-hidden="true">→</span>
      </div>
    </div>
  );
}

function Appointments() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const booked: Record<string, number[]> = { Mon: [0, 1], Tue: [2], Wed: [0, 3], Thu: [1, 2], Fri: [3] };
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {days.map((day) => (
          <div key={day}>
            <p className="type-label text-fg-muted">{day}</p>
            <ul className="mt-3 space-y-2">
              {[0, 1, 2, 3].map((slot) => {
                const taken = booked[day]?.includes(slot);
                const chosen = day === "Wed" && slot === 1;
                return (
                  <li
                    key={slot}
                    className={`h-8 ${
                      chosen ? "bg-accent" : taken ? "bg-fg/10" : "border border-dashed hairline"
                    }`}
                  />
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-5 text-small">
        Wednesday, 10:30 <span className="text-fg-muted">· Reminder the day before</span>
      </p>
    </div>
  );
}

function Portals() {
  const steps = ["Received", "In progress", "Ready for review", "Complete"];
  return (
    <div>
      <p className="type-label text-fg-muted">Welcome back</p>
      <p className="type-display mt-1 text-heading">Order 0142</p>
      <ol className="mt-6 grid grid-cols-4 gap-2">
        {steps.map((step, index) => (
          <li key={step}>
            <span className={`block h-1 ${index <= 2 ? "bg-accent" : "bg-fg/15"}`} />
            <span className={`mt-2 block text-[0.6875rem] leading-tight ${index === 2 ? "" : "text-fg-muted"}`}>
              {step}
            </span>
          </li>
        ))}
      </ol>
      <ul className="mt-6 text-small">
        {["Proof v2.pdf", "Invoice 0142.pdf"].map((file) => (
          <li key={file} className="flex justify-between border-t hairline py-2.5">
            <span>{file}</span>
            <span className="text-fg-muted">View</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Automations() {
  const steps = ["New booking", "Send confirmation", "Add to calendar", "Remind 24 h before"];
  return (
    <ol className="relative space-y-3">
      <span aria-hidden="true" className="absolute top-4 bottom-4 left-[0.6875rem] w-px bg-line" />
      {steps.map((step, index) => (
        <li key={step} className="relative flex items-center gap-4">
          <span
            className={`relative grid size-6 shrink-0 place-items-center text-[0.625rem] ${
              index === 0 ? "bg-accent text-accent-fg" : "border hairline bg-surface-raised"
            }`}
          >
            {index + 1}
          </span>
          <span className="flex-1 border hairline px-3 py-2.5 text-small">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function Unknown() {
  return (
    <div className="grid h-full min-h-40 place-items-center border border-dashed hairline">
      <p className="type-display px-6 text-center text-heading italic">
        Describe it.
        <br />
        <span className="text-fg-muted">We’ll work out the rest.</span>
      </p>
    </div>
  );
}

const specimens: Record<Capability["id"], () => React.ReactNode> = {
  reservations: Reservations,
  payments: Payments,
  appointments: Appointments,
  portals: Portals,
  automations: Automations,
  unknown: Unknown,
};
