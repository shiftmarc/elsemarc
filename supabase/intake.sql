-- Stage 5b: project intake briefs and brand asset uploads.
-- Run once in the Supabase SQL editor. Safe to re-run.

-- 1. Briefs -----------------------------------------------------------------

create table if not exists public.intake_briefs (
  id                   uuid primary key default gen_random_uuid(),
  submitted_at         timestamptz not null default now(),
  status               text not null default 'new',
  path                 text not null check (path in ('website', 'custom')),
  business_name        text,
  contact_name         text not null,
  contact_email        text not null,
  design               text,                                  -- concept slug (website path)
  functions            text[] not null default '{}',          -- functionality explorer choices
  idea                 text,                                  -- the visitor's own description
  answers              jsonb not null default '{}'::jsonb,    -- the chosen path's answers
  assets               jsonb not null default '[]'::jsonb,    -- [{ path, name, size }] in intake-assets
  brief                jsonb not null,                        -- the whole brief as submitted
  ip_hash              text,                                  -- keyed hash, for rate limiting only
  user_agent           text,
  owner_notified_at    timestamptz,                           -- null: the notification email failed
  customer_notified_at timestamptz                            -- null: the confirmation email failed
);

create index if not exists intake_briefs_submitted_at_idx on public.intake_briefs (submitted_at desc);
create index if not exists intake_briefs_ip_hash_idx on public.intake_briefs (ip_hash, submitted_at);

-- RLS on with no policies: the publishable (anon) key can neither read nor write.
alter table public.intake_briefs enable row level security;

-- New tables are not exposed automatically in this project, so grant explicitly.
-- The secret key acts as service_role (which bypasses RLS but still needs privileges).
revoke all on table public.intake_briefs from anon, authenticated;
grant select, insert, update on table public.intake_briefs to service_role;

-- 2. Brand asset bucket -----------------------------------------------------
-- Private, 20 MB per file, and only these types. Keep in step with assetTypes
-- in src/lib/intake/brief.ts. Design files without a standard type
-- (InDesign, Sketch, Figma, XD) are stored as application/octet-stream.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'intake-assets',
  'intake-assets',
  false,
  20971520,
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
    'image/heic', 'image/heif', 'image/tiff', 'image/svg+xml',
    'application/pdf', 'application/postscript', 'image/vnd.adobe.photoshop',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No storage policies are added: with none, anon and authenticated users cannot
-- list, read or write the bucket. The server uses the secret key, and visitors
-- upload only through signed upload URLs it issues for one path each.
