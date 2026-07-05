export type UserRole = 'civilian' | 'institution' | 'admin';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ReportStatus =
  | 'submitted'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'unassigned'
  | 'rejected';
export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';
export type AiStatus = 'pending' | 'completed' | 'failed';

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export interface Zone {
  id: string;
  label: string;
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
}

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string | null;
  civilian_verified: boolean;
  institution_id: string | null;
}

export interface Institution {
  id: string;
  name: string;
  official_email_domain: string;
  category_coverage: string[];
  zone_coverage: string[];
  status: ApplicationStatus;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  ai_category_suggestion: string | null;
  priority: ReportPriority;
  ai_priority_suggestion: ReportPriority | null;
  ai_confidence: number | null;
  ai_reason: string | null;
  ai_status: AiStatus;
  latitude: number;
  longitude: number;
  address_text: string | null;
  zone_id: string | null;
  image_url: string | null;
  civilian_user_id: string;
  assigned_institution_id: string | null;
  status: ReportStatus;
  support_count: number;
  created_at: string;
  updated_at: string;
}

export interface AiInteraction {
  id: string;
  institution_user_id: string;
  institution_id: string | null;
  question: string;
  answer: string;
  referenced_report_ids: string[];
  created_at: string;
}

export interface AiAnalysis {
  category: string;
  priority: ReportPriority;
  confidence: number;
  reason: string;
}
