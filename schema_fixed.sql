-- Profiler
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  about text,
  pin_sha256 text,
  created_at timestamptz default now()
);

-- Oppdrag
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  owner uuid references profiles(id) on delete cascade,
  owner_name text,
  title text not null,
  description text,
  price_cents int,
  price_type text check (price_type in ('hourly','fixed')) default 'fixed',
  currency text default 'NOK',
  status text check (status in ('open','assigned','completed','cancelled')) default 'open',
  category text,
  job_type text check (job_type in ('one_time','recurring')) default 'one_time',
  latitude double precision,
  longitude double precision,
  address text,
  location text,
  requires_car boolean default false,
  requires_tools text check (requires_tools in ('no','some','yes')) default 'no',
  images text[] default '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

-- Søknader
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  applicant uuid references profiles(id) on delete cascade,
  message text,
  price_cents int,
  status text check (status in ('pending','accepted','rejected')) default 'pending',
  created_at timestamptz default now(),
  unique(job_id, applicant)
);

-- Meldinger (chat)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  sender uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- Varsler
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade,
  from_user uuid references profiles(id) on delete cascade,
  type text check (type in ('interest','message','application')) not null,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table jobs enable row level security;
alter table applications enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

-- Drop existing policies first
drop policy if exists "read own profile" on profiles;
drop policy if exists "read related profiles (job participants)" on profiles;
drop policy if exists "insert own profile" on profiles;
drop policy if exists "update own profile" on profiles;

drop policy if exists "read open jobs or own" on jobs;
drop policy if exists "create job as self" on jobs;
drop policy if exists "owner can update" on jobs;
drop policy if exists "owner can delete" on jobs;

drop policy if exists "applicant can insert" on applications;
drop policy if exists "applicant reads own or job owner" on applications;
drop policy if exists "applicant can update own pending" on applications;

drop policy if exists "insert message if related user" on messages;
drop policy if exists "read messages if related user" on messages;

drop policy if exists "read own notifications" on notifications;
drop policy if exists "insert notifications as self" on notifications;
drop policy if exists "update own notifications" on notifications;

-- Create policies
create policy "read own profile" on profiles
for select using (auth.uid() = id);

create policy "read related profiles (job participants)" on profiles
for select using (
  id = auth.uid() OR
  exists (
    select 1 from jobs j
    where j.owner = auth.uid() and (
      profiles.id = j.owner or exists (
        select 1 from applications a where a.job_id = j.id and a.applicant = profiles.id
      )
    )
  ) OR
  exists (
    select 1 from applications a
    join jobs j on j.id = a.job_id
    where a.applicant = auth.uid() and profiles.id = j.owner
  )
);

create policy "insert own profile" on profiles
for insert with check (auth.uid() = id);

create policy "update own profile" on profiles
for update using (auth.uid() = id);

create policy "read open jobs or own" on jobs
for select using (status = 'open' or owner = auth.uid());

create policy "create job as self" on jobs
for insert with check (owner = auth.uid());

create policy "owner can update" on jobs
for update using (owner = auth.uid());

create policy "owner can delete" on jobs
for delete using (owner = auth.uid());

create policy "applicant can insert" on applications
for insert with check (applicant = auth.uid());

create policy "applicant reads own or job owner" on applications
for select using (
  applicant = auth.uid()
  or exists(select 1 from jobs j where j.id = applications.job_id and j.owner = auth.uid())
);

create policy "applicant can update own pending" on applications
for update using (applicant = auth.uid() and status='pending')
with check (applicant = auth.uid());

create policy "insert message if related user" on messages
for insert with check (
  sender = auth.uid() and
  exists(
    select 1 from jobs j
    where j.id = messages.job_id
      and (j.owner = auth.uid()
           or exists(select 1 from applications a where a.job_id=j.id and a.applicant=auth.uid()))
  )
);

create policy "read messages if related user" on messages
for select using (
  exists(
    select 1 from jobs j
    where j.id = messages.job_id
      and (j.owner = auth.uid()
           or exists(select 1 from applications a where a.job_id=j.id and a.applicant=auth.uid()))
  )
);

create policy "read own notifications" on notifications
for select using (user_id = auth.uid());

create policy "insert notifications as self" on notifications
for insert with check (from_user = auth.uid());

create policy "update own notifications" on notifications
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Trigger for å lage profil automatisk
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
