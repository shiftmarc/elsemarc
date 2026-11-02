import { VisibleViewport } from "@/components/brand/visible-viewport";
import { Wordmark } from "@/components/brand/wordmark";
import { WaterCanvas } from "@/components/brand/water/water-canvas";
import { TankContact } from "@/components/contact/tank-contact";
import { siteConfig } from "@/config/site";

/**
 * The pool: one dark screen of water that doesn't scroll. The wordmark
 * lies on the floor in the middle, with a short line just under it (on
 * the surface, not in the water); the contact form, one question at a
 * time, sits below; the email waits in a corner.
 *
 * The screen follows the visible viewport (VisibleViewport), so with a
 * phone keyboard open everything still fits above it. Touches anywhere
 * outside the form reach the water.
 */
export default function HomePage() {
  return (
    <div className="tank fixed inset-x-0 top-(--vv-top,0px) h-(--vv-h,100dvh) overflow-hidden">
      <VisibleViewport />
      <WaterCanvas />

      <div className="tank-content pointer-events-none relative flex h-full flex-col items-center justify-center-safe overflow-y-auto px-gutter pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(2.75rem+env(safe-area-inset-bottom))]">
        <div className="grid shrink-0 justify-items-center gap-[clamp(0.75rem,calc(var(--vv-h,100dvh)*0.022),1.5rem)]">
          <Wordmark />
          <p className="tank-statement type-label pointer-events-none text-center text-balance text-fg-muted select-none">
            {siteConfig.statement}
          </p>
        </div>
        <section id="contact" aria-label="Contact" className="pointer-events-auto w-full max-w-[30rem] shrink-0">
          <TankContact />
        </section>
      </div>

      <a
        href={`mailto:${siteConfig.email}`}
        className="tank-mail type-label absolute right-gutter bottom-[max(1rem,env(safe-area-inset-bottom))] text-fg-muted transition-colors hover:text-fg"
      >
        {siteConfig.email}
      </a>
    </div>
  );
}
