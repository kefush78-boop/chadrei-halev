-- חדרי הלב — סכמת בסיס נתונים
-- הרצה: Supabase SQL editor או migration file

-- ========== enums ==========
create type user_role as enum (
  'admin', 'management', 'social_coordinator', 'teacher', 'mentor', 'student'
);

create type room_kind as enum ('private', 'central');
create type room_state as enum ('free', 'occupied');
create type visit_state as enum ('open', 'follow_up', 'closed');
create type approval_state as enum ('pending', 'approved', 'rejected');

-- ========== profiles (1:1 with auth.users) ==========
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null,
  grade_class text, -- e.g. 'ט1', 'יב3' for students/mentors
  phone text,
  created_at timestamptz not null default now()
);

-- helper: current user's role, used inside RLS policies
create function app_role() returns user_role
language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

create function is_leadership() returns boolean
language sql stable security definer as $$
  select app_role() in ('admin', 'management', 'social_coordinator')
$$;

alter table profiles enable row level security;

create policy "profiles: read all authenticated" on profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles: admin manages" on profiles
  for all using (app_role() = 'admin')
  with check (app_role() = 'admin');

create policy "profiles: self update basic fields" on profiles
  for update using (id = auth.uid());

-- ========== rooms ==========
create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind room_kind not null
);

create table room_status (
  room_id uuid primary key references rooms(id) on delete cascade,
  status room_state not null default 'free',
  occupied_note text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

alter table rooms enable row level security;
alter table room_status enable row level security;

create policy "rooms: read all authenticated" on rooms
  for select using (auth.role() = 'authenticated');
create policy "rooms: admin writes" on rooms
  for all using (app_role() = 'admin') with check (app_role() = 'admin');

create policy "room_status: read all authenticated" on room_status
  for select using (auth.role() = 'authenticated');
create policy "room_status: staff+mentors update" on room_status
  for update using (app_role() <> 'student')
  with check (app_role() <> 'student');
create policy "room_status: admin inserts" on room_status
  for insert with check (app_role() = 'admin');

-- ========== schedule_slots ==========
create table schedule_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Sunday
  period smallint not null,
  subject text not null,
  room_id uuid references rooms(id)
);

alter table schedule_slots enable row level security;

create policy "schedule: owner or leadership read" on schedule_slots
  for select using (user_id = auth.uid() or is_leadership() or app_role() = 'teacher');
create policy "schedule: admin writes all" on schedule_slots
  for all using (app_role() = 'admin') with check (app_role() = 'admin');
create policy "schedule: owner writes own" on schedule_slots
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ========== visits (מרכז — כניסות תלמידים) ==========
create table visits (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  room_id uuid references rooms(id),
  entry_time timestamptz not null default now(),
  exit_time timestamptz,
  reported_by uuid not null references profiles(id),
  reason_short text,
  status visit_state not null default 'open'
);

alter table visits enable row level security;

create policy "visits: staff+mentors read" on visits
  for select using (app_role() <> 'student');
create policy "visits: own record read" on visits
  for select using (student_id = auth.uid());
create policy "visits: staff+mentors write" on visits
  for insert with check (app_role() <> 'student');
create policy "visits: staff+mentors update" on visits
  for update using (app_role() <> 'student');

-- ========== treatment_records (מוגבל!) ==========
create table treatment_records (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id),
  student_id uuid not null references profiles(id),
  date date not null default current_date,
  handled_by uuid not null references profiles(id),
  summary_short text,
  full_notes text,
  status visit_state not null default 'open',
  next_step text,
  created_at timestamptz not null default now()
);

alter table treatment_records enable row level security;

-- full row (including full_notes) only visible to leadership roles
create policy "treatment: leadership full read" on treatment_records
  for select using (is_leadership());
create policy "treatment: leadership writes" on treatment_records
  for all using (is_leadership()) with check (is_leadership());

-- ========== mentor_hours (מעורבות חברתית — שעות מלווים) ==========
create table mentor_hours (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references profiles(id),
  date date not null default current_date,
  hours numeric(4,2) not null,
  activity_description text,
  confirmation_status approval_state not null default 'pending',
  confirmed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table mentor_hours enable row level security;

create policy "mentor_hours: own read/write" on mentor_hours
  for all using (mentor_id = auth.uid()) with check (mentor_id = auth.uid());
create policy "mentor_hours: leadership read/approve" on mentor_hours
  for all using (is_leadership()) with check (is_leadership());

-- ========== student_feedback (משוב תלמידי ט) ==========
create table student_feedback (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  mentor_id uuid references profiles(id),
  date date not null default current_date,
  feeling_rating smallint check (feeling_rating between 1 and 5),
  comments text,
  created_at timestamptz not null default now()
);

alter table student_feedback enable row level security;

create policy "feedback: own read/write" on student_feedback
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "feedback: leadership read" on student_feedback
  for select using (is_leadership());

-- ========== realtime ==========
alter publication supabase_realtime add table room_status;
