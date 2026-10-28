export type UserRole =
  | "admin"
  | "management"
  | "social_coordinator"
  | "teacher"
  | "mentor"
  | "student";

export type RoomKind = "private" | "central";
export type RoomState = "free" | "occupied";
export type VisitState = "open" | "follow_up" | "closed";
export type ApprovalState = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  grade_class: string | null;
  phone: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  kind: RoomKind;
}

export interface RoomStatusRow {
  room_id: string;
  status: RoomState;
  occupied_note: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface ScheduleSlot {
  id: string;
  user_id: string;
  day_of_week: number;
  period: number;
  subject: string;
  room_id: string | null;
}

export interface Visit {
  id: string;
  student_id: string;
  room_id: string | null;
  entry_time: string;
  exit_time: string | null;
  reported_by: string;
  reason_short: string | null;
  status: VisitState;
}

export interface TreatmentRecord {
  id: string;
  visit_id: string | null;
  student_id: string;
  date: string;
  handled_by: string;
  summary_short: string | null;
  full_notes: string | null;
  status: VisitState;
  next_step: string | null;
  created_at: string;
}

export interface MentorHours {
  id: string;
  mentor_id: string;
  date: string;
  hours: number;
  activity_description: string | null;
  confirmation_status: ApprovalState;
  confirmed_by: string | null;
  created_at: string;
}

export interface StudentFeedback {
  id: string;
  student_id: string;
  mentor_id: string | null;
  date: string;
  feeling_rating: number | null;
  comments: string | null;
  created_at: string;
}

export type SpecialtyKind = "treatment" | "subject";
export type MatchStatus = "proposed" | "approved" | "rejected";

export interface Specialty {
  id: string;
  name: string;
  kind: SpecialtyKind;
}

export interface Provider {
  id: string;
  full_name: string;
  linked_user_id: string | null;
  created_at: string;
}

export interface ProviderSpecialty {
  provider_id: string;
  specialty_id: string;
}

export interface StudentCandidate {
  id: string;
  full_name: string;
  linked_user_id: string | null;
  created_at: string;
}

export interface StudentNeed {
  student_id: string;
  specialty_id: string;
}

export interface AvailabilitySlot {
  id: string;
  user_id: string;
  day_of_week: number;
  period: number;
}

export interface ProviderAvailabilitySlot {
  id: string;
  provider_id: string;
  day_of_week: number;
  period: number;
}

export interface StudentCandidateAvailabilitySlot {
  id: string;
  student_id: string;
  day_of_week: number;
  period: number;
}

export interface Match {
  id: string;
  kind: SpecialtyKind;
  specialty_id: string;
  provider_id: string;
  student_id: string;
  day_of_week: number;
  period: number;
  status: MatchStatus;
  created_at: string;
}

// Minimal typed surface for @supabase/ssr generics - not a full generated schema.
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; full_name: string; role: UserRole }; Update: Partial<Profile> };
      rooms: { Row: Room; Insert: Partial<Room> & { name: string; kind: RoomKind }; Update: Partial<Room> };
      room_status: { Row: RoomStatusRow; Insert: Partial<RoomStatusRow> & { room_id: string }; Update: Partial<RoomStatusRow> };
      schedule_slots: { Row: ScheduleSlot; Insert: Partial<ScheduleSlot> & { user_id: string; day_of_week: number; period: number; subject: string }; Update: Partial<ScheduleSlot> };
      visits: { Row: Visit; Insert: Partial<Visit> & { student_id: string; reported_by: string }; Update: Partial<Visit> };
      treatment_records: { Row: TreatmentRecord; Insert: Partial<TreatmentRecord> & { student_id: string; handled_by: string }; Update: Partial<TreatmentRecord> };
      mentor_hours: { Row: MentorHours; Insert: Partial<MentorHours> & { mentor_id: string; hours: number }; Update: Partial<MentorHours> };
      student_feedback: { Row: StudentFeedback; Insert: Partial<StudentFeedback> & { student_id: string }; Update: Partial<StudentFeedback> };
    };
  };
};
