-- TechnoCraft Supabase schema
-- Run this in Supabase SQL Editor after creating your project.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('student', 'coordinator', 'admin');
create type public.event_status as enum ('draft', 'published', 'closed', 'cancelled');
create type public.registration_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.payment_status as enum ('free', 'pending', 'paid', 'failed', 'refunded');

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#0F766E',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'student',
  full_name text not null,
  email text not null unique,
  student_id text unique,
  department_id uuid references public.departments(id),
  year int check (year between 1 and 5),
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  category_id uuid references public.categories(id),
  department_id uuid references public.departments(id),
  coordinator_id uuid not null references public.profiles(id),
  venue text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null check (capacity > 0),
  fee numeric(10,2) not null default 0 check (fee >= 0),
  rules text,
  schedule text,
  image_url text,
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  team_name text,
  docs_url text,
  qr_code text not null unique default encode(gen_random_bytes(24), 'hex'),
  status public.registration_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  payment_reference text,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, student_id)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  checked_in_by uuid not null references public.profiles(id),
  checked_in_at timestamptz not null default now(),
  method text not null default 'qr'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  certificate_url text,
  issued_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (event_id, student_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger events_updated_at before update on public.events
for each row execute function public.set_updated_at();

create trigger registrations_updated_at before update on public.registrations
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'
$$;

create or replace function public.is_coordinator_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('coordinator', 'admin')
$$;

alter table public.departments enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.attendance enable row level security;
alter table public.notifications enable row level security;
alter table public.certificates enable row level security;
alter table public.feedback enable row level security;

create policy "Everyone can read departments" on public.departments
for select to authenticated using (true);

create policy "Admins manage departments" on public.departments
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Everyone can read categories" on public.categories
for select to authenticated using (true);

create policy "Admins manage categories" on public.categories
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Users read own profile" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_coordinator_or_admin());

create policy "Users create own profile" on public.profiles
for insert to authenticated with check (id = auth.uid());

create policy "Users update own profile" on public.profiles
for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "Published events visible to all users" on public.events
for select to authenticated using (status = 'published' or coordinator_id = auth.uid() or public.is_admin());

create policy "Coordinators create events" on public.events
for insert to authenticated with check (public.is_coordinator_or_admin() and coordinator_id = auth.uid());

create policy "Coordinators update own events" on public.events
for update to authenticated using (coordinator_id = auth.uid() or public.is_admin()) with check (coordinator_id = auth.uid() or public.is_admin());

create policy "Students read own registrations" on public.registrations
for select to authenticated using (
  student_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.events e
    where e.id = event_id and e.coordinator_id = auth.uid()
  )
);

create policy "Students create own registrations" on public.registrations
for insert to authenticated with check (student_id = auth.uid());

create policy "Coordinators approve registrations" on public.registrations
for update to authenticated using (
  public.is_admin()
  or exists (
    select 1 from public.events e
    where e.id = event_id and e.coordinator_id = auth.uid()
  )
) with check (
  public.is_admin()
  or exists (
    select 1 from public.events e
    where e.id = event_id and e.coordinator_id = auth.uid()
  )
);

create policy "Attendance visible by owner or staff" on public.attendance
for select to authenticated using (student_id = auth.uid() or public.is_coordinator_or_admin());

create policy "Staff create attendance" on public.attendance
for insert to authenticated with check (public.is_coordinator_or_admin());

create policy "Users read own notifications" on public.notifications
for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "Staff create notifications" on public.notifications
for insert to authenticated with check (public.is_coordinator_or_admin());

create policy "Users update own notifications" on public.notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Certificates visible by owner or staff" on public.certificates
for select to authenticated using (student_id = auth.uid() or public.is_coordinator_or_admin());

create policy "Staff create certificates" on public.certificates
for insert to authenticated with check (public.is_coordinator_or_admin());

create policy "Feedback visible to staff and owner" on public.feedback
for select to authenticated using (student_id = auth.uid() or public.is_coordinator_or_admin());

create policy "Students create own feedback" on public.feedback
for insert to authenticated with check (student_id = auth.uid());

insert into public.departments (name, code) values
  ('Computer Science', 'CSE'),
  ('Information Technology', 'IT'),
  ('Electronics and Communication', 'ECE'),
  ('Mechanical Engineering', 'MECH'),
  ('Civil Engineering', 'CIVIL')
on conflict do nothing;

insert into public.categories (name, color) values
  ('Technical', '#0F766E'),
  ('Non-Technical', '#2563EB'),
  ('Workshop', '#7C3AED'),
  ('Cultural', '#F59E0B'),
  ('Sports', '#DC2626'),
  ('Career', '#0891B2')
on conflict do nothing;
