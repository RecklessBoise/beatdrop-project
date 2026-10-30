-- BeatDrop Project — schéma de base de données
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.

create extension if not exists "pgcrypto";

create table if not exists public.folders (
  id               uuid primary key default gen_random_uuid(),
  parent_id        uuid references public.folders(id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 120),
  description      text not null default '',
  share_slug       text not null unique,
  download_enabled boolean not null default false,
  cover_key        text,
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists folders_parent_idx on public.folders(parent_id, position);

create table if not exists public.tracks (
  id           uuid primary key default gen_random_uuid(),
  folder_id    uuid not null references public.folders(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  file_key     text not null,
  file_name    text not null,
  content_type text not null,
  size_bytes   bigint not null default 0,
  duration_sec real,
  peaks        jsonb,
  bpm          integer,
  music_key    text,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists tracks_folder_idx on public.tracks(folder_id, position);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists folders_touch on public.folders;
create trigger folders_touch before update on public.folders
  for each row execute function public.touch_updated_at();

-- Sécurité : RLS activé SANS aucune policy => les clés publiques (anon) n'ont
-- accès à rien. Seul le serveur Next.js, avec la clé service_role, lit/écrit.
alter table public.folders enable row level security;
alter table public.tracks  enable row level security;
