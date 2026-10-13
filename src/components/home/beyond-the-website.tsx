"use client";

import { useId, useState } from "react";
import { Container } from "@/components/ui/container";
import { SectionLabel } from "@/components/ui/section-label";
import { capabilities, type Capability } from "@/content/capabilities";
import { CapabilitySpecimen } from "./capability-specimen";

/**
 * An index of capabilities. One entry is always open: on large screens its
 * illustration sits in a sticky column, on small screens it opens in place.
 */
export function BeyondTheWebsite() {
  const [active, setActive] = useState<Capability["id"]>(capabilities[0].id);
  const baseId = useId();

  return (
    <section aria-labelledby="beyond-title" className="theme-paper py-section">
      <Container>
        <SectionLabel index="02">Beyond the website</SectionLabel>
        <div className="mt-6 grid gap-8 md:grid-cols-12 md:gap-x-gutter">
          <h2 id="beyond-title" className="type-display text-display-lg md:col-span-8">
            What if your website could do <span className="italic text-accent">more?</span>
          </h2>
          <p className="text-lede text-fg-muted md:col-span-4 md:self-end">
            Reservations. Payments. Appointments. Customer portals. Automations. Or something
            nobody’s built before.
          </p>
        </div>

        <div className="mt-16 grid gap-12 md:mt-24 lg:grid-cols-12 lg:gap-x-gutter">
          <ul className="border-t hairline lg:col-span-6">
            {capabilities.map((capability, index) => {
              const open = capability.id === active;
              const panelId = `${baseId}-${capability.id}`;
              return (
                <li key={capability.id} className="border-b hairline">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => setActive(capability.id)}
                      className="group flex w-full items-baseline gap-4 py-5 text-left md:gap-6 md:py-6"
                    >
                      <span aria-hidden="true" className={`type-label w-6 shrink-0 ${open ? "text-accent" : "text-fg-muted"}`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`type-display text-heading transition-[color,translate] duration-500 ease-out-expo ${
                          open ? "translate-x-1 italic" : "text-fg-muted group-hover:text-fg"
                        }`}
                      >
                        {capability.title}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`ml-auto self-center transition-[opacity,translate] duration-500 ease-out-expo ${
                          open ? "opacity-100" : "-translate-x-2 opacity-0"
                        }`}
                      >
                        →
                      </span>
                    </button>
                  </h3>
                  <div id={panelId} hidden={!open} className="pb-6 pl-10 md:pl-12">
                    <p className="max-w-[44ch] text-fg-muted">{capability.description}</p>
                    <div key={capability.id} className="animate-rise mt-6 lg:hidden" aria-hidden="true">
                      <CapabilitySpecimen id={capability.id} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div aria-hidden="true" className="hidden lg:col-span-5 lg:col-start-8 lg:block">
            <div className="sticky top-28">
              <div key={active} className="animate-rise">
                <CapabilitySpecimen id={active} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
