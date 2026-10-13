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

```
src/
  app/
    layout.tsx            root: fonts, metadata, theme
    globals.css           design tokens (palette, themes, type scale, spacing, motion)
    (site)/               marketing pages, wrapped in header + footer
  components/
    brand/wordmark.tsx    the temporary wordmark (swap here)
    layout/               header, nav, footer, placeholders
    ui/                   primitives
  config/site.ts          business name, tagline, navigation
  content/                static content (demo concepts)
```
