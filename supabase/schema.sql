-- Text-to-Comic App Supabase schema
-- Run in Supabase SQL Editor after creating the project.

create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  original_text text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'storyboard', 'generating', 'done', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  role text not null default 'Supporting role',
  description text not null,
  color text not null default '#8b5cf6',
  reference_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  order_index integer not null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, order_index)
);

create table if not exists public.panels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  page_id uuid references public.pages(id) on delete cascade,
  order_index integer not null,
  scene_prompt text not null,
  dialogue text not null,
  character_ids text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'generating', 'success', 'error')),
  image_tone text not null default 'from-slate-900 via-zinc-800 to-indigo-950',
  image_url text,
  error_message text,
  speech_bubbles jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, order_index)
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists characters_project_id_idx on public.characters(project_id);
create index if not exists pages_project_id_idx on public.pages(project_id);
create index if not exists panels_project_id_idx on public.panels(project_id);
create index if not exists panels_page_id_idx on public.panels(page_id);
create index if not exists panels_page_order_idx on public.panels(page_id, order_index);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists characters_set_updated_at on public.characters;
create trigger characters_set_updated_at
before update on public.characters
for each row execute function public.set_updated_at();

drop trigger if exists panels_set_updated_at on public.panels;
create trigger panels_set_updated_at
before update on public.panels
for each row execute function public.set_updated_at();

drop trigger if exists pages_set_updated_at on public.pages;
create trigger pages_set_updated_at
before update on public.pages
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.pages enable row level security;
alter table public.characters enable row level security;
alter table public.panels enable row level security;

drop policy if exists "Users can manage own projects" on public.projects;
create policy "Users can manage own projects"
on public.projects
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage characters through project ownership" on public.characters;
create policy "Users can manage characters through project ownership"
on public.characters
for all
using (
  exists (
    select 1 from public.projects
    where projects.id = characters.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = characters.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage panels through project ownership" on public.panels;
create policy "Users can manage panels through project ownership"
on public.panels
for all
using (
  exists (
    select 1 from public.projects
    where projects.id = panels.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = panels.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage pages through project ownership" on public.pages;
create policy "Users can manage pages through project ownership"
on public.pages
for all
using (
  exists (
    select 1 from public.projects
    where projects.id = pages.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = pages.project_id
      and projects.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('comic-panels', 'comic-panels', true)
on conflict (id) do nothing;
