-- הופך גם תלמידים ברשימת השיבוצים לרשימה פנימית פשוטה (שם בלבד), כמו providers

create table student_candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  linked_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table student_candidates enable row level security;

create policy "student_candidates: leadership manages" on student_candidates
  for all using (is_leadership()) with check (is_leadership());

create table student_candidate_availability_slots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references student_candidates(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  period smallint not null,
  unique (student_id, day_of_week, period)
);

alter table student_candidate_availability_slots enable row level security;

create policy "student_candidate_availability: leadership manages" on student_candidate_availability_slots
  for all using (is_leadership()) with check (is_leadership());

alter table student_needs drop constraint student_needs_student_id_fkey;
alter table student_needs add constraint student_needs_student_id_fkey
  foreign key (student_id) references student_candidates(id) on delete cascade;

alter table matches drop constraint matches_student_id_fkey;
alter table matches add constraint matches_student_id_fkey
  foreign key (student_id) references student_candidates(id) on delete cascade;
