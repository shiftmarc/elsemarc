# elsemarc

Studio website. Next.js (App Router), TypeScript, Tailwind CSS v4, deployed on Vercel. See `SPEC.md` for the full brief.

## Develop

```sh
npm install
cp .env.example .env.local   # fill in values as features need them
npm run dev
```

`npm run build` and `npm run lint` must pass before merging.

## Structure

A single page. The full multi-page site is archived at the git tag `v1-full-site`; its old URLs redirect to `/` (see `next.config.ts`).

```
src/
  app/
    layout.tsx            root: fonts, metadata, theme, footer
    page.tsx              the page: hero wordmark, one line, contact form
    globals.css           design tokens (palette, themes, type scale, spacing, motion)
  components/
    brand/wordmark.tsx    the hero wordmark (becomes the water simulation)
    contact/              the contact form
  config/site.ts          business name, tagline, email
  lib/
    contact/              validation, server action, emails
    server/               Supabase, SMTP and request helpers (server only)
supabase/contact.sql      table for contact messages; run once in the SQL editor
```
