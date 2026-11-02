import { Wordmark } from "@/components/brand/wordmark";
import { ContactForm } from "@/components/contact/contact-form";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <>
      <section className="flex min-h-svh flex-col px-gutter pb-10">
        <div className="grid flex-1 place-items-center">
          <Wordmark />
        </div>
        <p className="type-display text-center text-heading">{siteConfig.tagline}</p>
      </section>

      <section id="contact" aria-labelledby="contact-title" className="mx-auto w-full max-w-prose scroll-mt-8 px-gutter py-16 md:py-24">
        <h2 id="contact-title" className="sr-only">
          Contact
        </h2>
        <ContactForm />
      </section>
    </>
  );
}
