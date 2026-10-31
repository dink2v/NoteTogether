-- NoteTogether shared workspace schema
create extension if not exists pgcrypto;

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default 'lavender',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.folders(id) on delete set null,
  title text not null default '',
  content text not null default '',
  favorite boolean not null default false,
  color text not null default 'lavender',
  author_name text not null default 'Udin',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_folder_id_idx on public.notes(folder_id);
create index if not exists notes_updated_at_idx on public.notes(updated_at desc);
create index if not exists notes_deleted_at_idx on public.notes(deleted_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at before update on public.notes
for each row execute function public.set_updated_at();

insert into public.folders (name, color, sort_order)
values ('Shared Space','lavender',0), ('Udin','peach',1), ('Teman','blue',2)
on conflict (name) do nothing;

alter table public.folders enable row level security;
alter table public.notes enable row level security;

drop policy if exists "Public shared folders access" on public.folders;
create policy "Public shared folders access" on public.folders
for all to anon using (true) with check (true);

drop policy if exists "Public shared notes access" on public.notes;
create policy "Public shared notes access" on public.notes
for all to anon using (true) with check (true);

grant usage on schema public to anon;
grant select, insert, update, delete on public.folders to anon;
grant select, insert, update, delete on public.notes to anon;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notes') then
    alter publication supabase_realtime add table public.notes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='folders') then
    alter publication supabase_realtime add table public.folders;
  end if;
end $$;

alter function public.set_updated_at() set search_path = public, pg_temp;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
