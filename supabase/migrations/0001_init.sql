-- Urbanfix v3.0 — initial schema, RLS, and storage
-- Run in the Supabase SQL editor or via `supabase db push`.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('civilian', 'institution', 'admin');
create type application_status as enum ('pending', 'approved', 'rejected');
create type report_status as enum ('submitted', 'assigned', 'in_progress', 'resolved', 'unassigned', 'rejected');
create type report_priority as enum ('low', 'medium', 'high', 'critical');
create type ai_status as enum ('pending', 'completed', 'failed');

-- ---------------------------------------------------------------------------
-- Reference data: categories and zones
-- ---------------------------------------------------------------------------
create table public.categories (
  id          text primary key,           -- e.g. 'flooding'
  label       text not null,              -- e.g. 'Flooding'
  icon        text not null default 'pin',-- icon key used by the map legend
  created_at  timestamptz not null default now()
);

create table public.zones (
  id          text primary key,           -- e.g. 'zone-3'
  label       text not null,
  -- simple bounding box (WGS84) to keep routing GIS-free
  min_lat     double precision not null,
  min_lng     double precision not null,
  max_lat     double precision not null,
  max_lng     double precision not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  role                  user_role not null default 'civilian',
  display_name          text,
  civilian_verified     boolean not null default false, -- true once MFA enrolled
  institution_id        uuid,                            -- set when role = institution
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Institutions
-- ---------------------------------------------------------------------------
create table public.institutions (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  official_email_domain text not null,     -- e.g. 'city.gov'
  category_coverage     text[] not null default '{}', -- category ids handled
  zone_coverage         text[] not null default '{}', -- zone ids handled
  status                application_status not null default 'approved',
  created_at            timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_institution_fk
  foreign key (institution_id) references public.institutions (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Institution applications
-- ---------------------------------------------------------------------------
create table public.institution_applications (
  id                uuid primary key default gen_random_uuid(),
  applicant_user_id uuid not null references auth.users (id) on delete cascade,
  institution_name  text not null,
  official_email    text not null,
  category_coverage text[] not null default '{}',
  zone_coverage     text[] not null default '{}',
  document_url      text,
  status            application_status not null default 'pending',
  admin_notes       text,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
create table public.reports (
  id                     uuid primary key default gen_random_uuid(),
  title                  text not null,
  description            text not null default '',
  category               text not null references public.categories (id),
  ai_category_suggestion text references public.categories (id),
  priority               report_priority not null default 'medium',
  ai_priority_suggestion report_priority,
  ai_confidence          double precision,
  ai_reason              text,
  ai_status              ai_status not null default 'pending',
  latitude               double precision not null,
  longitude              double precision not null,
  address_text           text,
  zone_id                text references public.zones (id),
  image_url              text,
  civilian_user_id       uuid not null references auth.users (id) on delete cascade,
  assigned_institution_id uuid references public.institutions (id) on delete set null,
  status                 report_status not null default 'submitted',
  support_count          integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index reports_category_idx on public.reports (category);
create index reports_zone_idx on public.reports (zone_id);
create index reports_assigned_idx on public.reports (assigned_institution_id);
create index reports_status_idx on public.reports (status);

-- ---------------------------------------------------------------------------
-- Report supports (one per user per report)
-- ---------------------------------------------------------------------------
create table public.report_supports (
  report_id        uuid not null references public.reports (id) on delete cascade,
  civilian_user_id uuid not null references auth.users (id) on delete cascade,
  created_at       timestamptz not null default now(),
  primary key (report_id, civilian_user_id)
);

-- Keep reports.support_count in sync
create or replace function public.sync_support_count() returns trigger
language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.reports set support_count = support_count + 1 where id = new.report_id;
  elsif (tg_op = 'DELETE') then
    update public.reports set support_count = greatest(support_count - 1, 0) where id = old.report_id;
  end if;
  return null;
end;
$$;

create trigger report_supports_count
after insert or delete on public.report_supports
for each row execute function public.sync_support_count();

-- ---------------------------------------------------------------------------
-- AI interactions (institution chat audit)
-- ---------------------------------------------------------------------------
create table public.ai_interactions (
  id                   uuid primary key default gen_random_uuid(),
  institution_user_id  uuid not null references auth.users (id) on delete cascade,
  institution_id       uuid references public.institutions (id) on delete set null,
  question             text not null,
  answer               text not null,
  referenced_report_ids uuid[] not null default '{}',
  created_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reports_touch before update on public.reports
for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Role helper (used by policies; security definer avoids RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.app_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.app_institution_id() returns uuid
language sql stable security definer set search_path = public as $$
  select institution_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.institutions enable row level security;
alter table public.institution_applications enable row level security;
alter table public.reports enable row level security;
alter table public.report_supports enable row level security;
alter table public.ai_interactions enable row level security;
alter table public.categories enable row level security;
alter table public.zones enable row level security;

-- Reference data: readable by everyone (including anon)
create policy "categories readable" on public.categories for select using (true);
create policy "zones readable" on public.zones for select using (true);

-- Profiles: a user can read/update their own; admins can read all
create policy "own profile read" on public.profiles
  for select using (id = auth.uid() or public.app_role() = 'admin');
create policy "own profile update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Institutions: readable by everyone (needed for routing labels)
create policy "institutions readable" on public.institutions for select using (true);
create policy "institutions admin write" on public.institutions
  for all using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- Applications: applicant can create + read own; admin can read/update all
create policy "application insert own" on public.institution_applications
  for insert with check (applicant_user_id = auth.uid());
create policy "application read own or admin" on public.institution_applications
  for select using (applicant_user_id = auth.uid() or public.app_role() = 'admin');
create policy "application admin update" on public.institution_applications
  for update using (public.app_role() = 'admin');

-- Reports: public read; civilians create their own; owner or assigned institution or admin can update
create policy "reports public read" on public.reports for select using (true);
create policy "reports insert own" on public.reports
  for insert with check (civilian_user_id = auth.uid());
create policy "reports update owner/institution/admin" on public.reports
  for update using (
    civilian_user_id = auth.uid()
    or public.app_role() = 'admin'
    or (public.app_role() = 'institution' and assigned_institution_id = public.app_institution_id())
  );

-- Supports: public read; a user manages only their own support row
create policy "supports public read" on public.report_supports for select using (true);
create policy "supports insert own" on public.report_supports
  for insert with check (civilian_user_id = auth.uid());
create policy "supports delete own" on public.report_supports
  for delete using (civilian_user_id = auth.uid());

-- AI interactions: an institution user reads/writes only their own institution's rows
create policy "ai read own institution" on public.ai_interactions
  for select using (
    institution_user_id = auth.uid()
    or (public.app_role() = 'institution' and institution_id = public.app_institution_id())
  );
create policy "ai insert own" on public.ai_interactions
  for insert with check (institution_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage bucket for report images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', true)
on conflict (id) do nothing;

create policy "report images public read" on storage.objects
  for select using (bucket_id = 'report-images');
create policy "report images authenticated upload" on storage.objects
  for insert with check (bucket_id = 'report-images' and auth.role() = 'authenticated');
