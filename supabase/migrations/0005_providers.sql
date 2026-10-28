-- מחליף teacher_specialties: "ספקי טיפול/הוראה" פנימיים, בלי חשבון התחברות (עם אפשרות לקשר בעתיד)

drop table if exists teacher_specialties;

create table providers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  linked_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table providers enable row level security;

create policy "providers: leadership manages" on providers
  for all using (is_leadership()) with check (is_leadership());

create table provider_specialties (
  provider_id uuid not null references providers(id) on delete cascade,
  specialty_id uuid not null references specialties(id) on delete cascade,
  primary key (provider_id, specialty_id)
);

alter table provider_specialties enable row level security;

create policy "provider_specialties: leadership manages" on provider_specialties
  for all using (is_leadership()) with check (is_leadership());

create table provider_availability_slots (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  period smallint not null,
  unique (provider_id, day_of_week, period)
);

alter table provider_availability_slots enable row level security;

create policy "provider_availability: leadership manages" on provider_availability_slots
  for all using (is_leadership()) with check (is_leadership());

-- matches.teacher_id הפך להצביע על providers, לא profiles
alter table matches drop constraint matches_teacher_id_fkey;
alter table matches rename column teacher_id to provider_id;
alter table matches add constraint matches_provider_id_fkey
  foreign key (provider_id) references providers(id) on delete cascade;
