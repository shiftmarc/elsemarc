-- Single-page site: contact form messages.
-- Run once in the Supabase SQL editor. Safe to re-run.

create table if not exists public.contact_messages (
  id                   uuid primary key default gen_random_uuid(),
  submitted_at         timestamptz not null default now(),
  status               text not null default 'new',
  name                 text not null,
  email                text not null,
  message              text not null,
  link                 text,
  ip_hash              text,                                  -- keyed hash, for rate limiting only
  user_agent           text,
  owner_notified_at    timestamptz,                           -- null: the notification email failed
  customer_notified_at timestamptz                            -- null: the confirmation email failed
);
grant select, insert, update, delete on public.contact_messages to authenticated;
grant select, insert, update, delete on public.contact_messages to service_role;
-- No anon grant: logged-out visitors never reach this table through the API.

create index if not exists contact_messages_submitted_at_idx on public.contact_messages (submitted_at desc);
create index if not exists contact_messages_ip_hash_idx on public.contact_messages (ip_hash, submitted_at);

-- RLS on with no policies: only the secret key (service_role) can read or write rows.
alter table public.contact_messages enable row level security;

-- Optional clean-up of the multi-step intake (Stage 5b). Only if you ran
-- intake.sql earlier and don't need what it stored. Uncomment to run.
-- Empty the bucket first in Storage, or the bucket delete fails.
-- drop table if exists public.intake_briefs;
-- delete from storage.buckets where id = 'intake-assets';
