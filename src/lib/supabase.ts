import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SPECIALTIES = ["Penal", "Familia", "Laboral", "Civil", "Comercial", "Administrativo"] as const;
export const CITIES = ["Bogotá", "Medellín", "Cali", "Barranquilla"] as const;

export type Specialty = typeof SPECIALTIES[number];
export type City = typeof CITIES[number];

export type Role = "client" | "lawyer" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type SubscriptionStatus = "active" | "expired";
export type CaseStatus = "open" | "matched" | "closed";

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Lawyer {
  profile_id: string;
  professional_card_number: string;
  verification_status: VerificationStatus;
  specialties: string[];
  subscription_status: SubscriptionStatus;
  subscription_renewed_at: string | null;
  bio: string | null;
  experience_years: number | null;
  headline: string | null;
  created_at: string;
}

/** A lawyer row joined with its profile, as returned by `lawyers` selects with `profiles(*)`. */
export interface LawyerWithProfile extends Lawyer {
  profiles: Profile;
}

export interface Case {
  id: string;
  client_id: string;
  description: string;
  suggested_branch: string | null;
  chosen_branch: string | null;
  status: CaseStatus;
  created_at: string;
}

export interface Application {
  id: string;
  case_id: string;
  lawyer_id: string;
  proposal: string | null;
  fee: string | null;
  created_at: string;
}

/** An application joined with the applying lawyer's profile, for the case-owner view. */
export interface ApplicationWithLawyer extends Application {
  lawyers: LawyerWithProfile;
}

export interface Match {
  case_id: string;
  lawyer_id: string;
  matched_at: string;
}

export interface Rating {
  id: string;
  match_case_id: string;
  client_id: string;
  rating: number;
  comment: string | null;
  contact_confirmed: boolean;
  created_at: string;
}
