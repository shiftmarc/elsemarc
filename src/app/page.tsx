import { Wordmark } from "@/components/brand/wordmark";
import { WaterCanvas } from "@/components/brand/water/water-canvas";
import { TankContact } from "@/components/contact/tank-contact";
import { siteConfig } from "@/config/site";

/**
 * The tank: one dark screen that doesn't scroll. The water wordmark sits in
 * the middle, the contact form just below it, the email in a corner.
 * Touches anywhere outside the form move the water (touch-action: none).
 */
export default function HomePage() {
  return (
    <div className="tank fixed inset-0 touch-none overflow-hidden">
      <WaterCanvas />

      <div className="pointer-events-none relative grid h-full place-items-center px-gutter">
        <div className="relative">
          <Wordmark />
          <section
            id="contact"
            aria-label="Contact"
            className="pointer-events-auto absolute top-full left-1/2 mt-[clamp(1.75rem,6svh,4.5rem)] w-[min(30rem,calc(100vw-2*var(--spacing-gutter)))] -translate-x-1/2 touch-manipulation"
          >
            <TankContact />
          </section>
        </div>
      </div>

      <a
        href={`mailto:${siteConfig.email}`}
        className="type-label absolute right-gutter bottom-[max(1rem,env(safe-area-inset-bottom))] text-fg-muted transition-colors hover:text-fg"
      >
        {siteConfig.email}
      </a>
    </div>
  );
}
