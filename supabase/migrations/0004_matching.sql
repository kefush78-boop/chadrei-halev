-- שיבוץ אוטומטי: מטפלים/מורי-מקצוע <-> תלמידים

create type specialty_kind as enum ('treatment', 'subject');
create type match_status as enum ('proposed', 'approved', 'rejected');

-- ========== specialties (תגיות תחום/מקצוע) ==========
create table specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind specialty_kind not null,
  unique (name, kind)
);

alter table specialties enable row level security;

create policy "specialties: leadership manages" on specialties
  for all using (is_leadership()) with check (is_leadership());

-- ========== teacher_specialties ==========
create table teacher_specialties (
  teacher_id uuid not null references profiles(id) on delete cascade,
  specialty_id uuid not null references specialties(id) on delete cascade,
  primary key (teacher_id, specialty_id)
);

alter table teacher_specialties enable row level security;

create policy "teacher_specialties: leadership manages" on teacher_specialties
  for all using (is_leadership()) with check (is_leadership());

-- ========== student_needs ==========
create table student_needs (
  student_id uuid not null references profiles(id) on delete cascade,
  specialty_id uuid not null references specialties(id) on delete cascade,
  primary key (student_id, specialty_id)
);

alter table student_needs enable row level security;

create policy "student_needs: leadership manages" on student_needs
  for all using (is_leadership()) with check (is_leadership());

-- ========== availability_slots (זמינות שבועית, פנוי/ה בלבד) ==========
create table availability_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  period smallint not null,
  unique (user_id, day_of_week, period)
);

alter table availability_slots enable row level security;

create policy "availability: read all authenticated" on availability_slots
  for select using (auth.role() = 'authenticated');
create policy "availability: leadership manages all" on availability_slots
  for all using (is_leadership()) with check (is_leadership());
create policy "availability: owner manages own" on availability_slots
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ========== matches (הצעות/שיבוצים) ==========
create table matches (
  id uuid primary key default gen_random_uuid(),
  kind specialty_kind not null,
  specialty_id uuid not null references specialties(id),
  teacher_id uuid not null references profiles(id),
  student_id uuid not null references profiles(id),
  day_of_week smallint not null,
  period smallint not null,
  status match_status not null default 'proposed',
  created_at timestamptz not null default now()
);

alter table matches enable row level security;

create policy "matches: leadership manages" on matches
  for all using (is_leadership()) with check (is_leadership());
