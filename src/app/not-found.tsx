import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grid min-h-[70svh] place-content-center gap-6 px-gutter text-center">
      <p className="type-label text-fg-muted">404</p>
      <h1 className="type-display text-display-md">This page doesn’t exist.</h1>
      <Link href="/" className="justify-self-center underline decoration-1 underline-offset-4 hover:text-accent">
        Back to the beginning
      </Link>
    </section>
  );
}
