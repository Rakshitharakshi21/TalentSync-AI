export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'employee' | 'hr';
  created_at: string;
}

export interface EmployeeProfile {
  id: string;
  user_id: string;
  headline: string;
  summary: string;
  job_title: string;
  current_role?: string;
  department: string;
  years_experience: number;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  employee_id: string;
  name: string;
  category: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  source: 'manual' | 'resume' | 'ai_inferred';
  created_at: string;
}

export interface Project {
  id: string;
  employee_id: string;
  name: string;
  description: string;
  role_in_project: string;
  technologies: string[];
  start_date: string;
  end_date: string | null;
  key_achievements: string;
  created_at: string;
}

export interface Experience {
  id: string;
  employee_id: string;
  company: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  technologies: string[];
  created_at: string;
}

export interface Certification {
  id: string;
  employee_id: string;
  name: string;
  issuer: string;
  date_obtained: string;
  expiry_date: string | null;
  credential_id: string;
  created_at: string;
}

export interface LearningActivity {
  id: string;
  employee_id: string;
  title: string;
  provider: string;
  type: 'course' | 'workshop' | 'bootcamp' | 'self_study' | 'conference' | 'other';
  status: 'completed' | 'in_progress' | 'planned';
  skills_learned: string[];
  completion_date: string | null;
  created_at: string;
}

export interface Opportunity {
  id: string;
  created_by: string;
  title: string;
  description: string;
  type: 'full_time' | 'project' | 'temporary' | 'team';
  department: string;
  required_skills: string[];
  preferred_skills: string[];
  required_experience_years: number;
  status: 'open' | 'closed' | 'filled';
  created_at: string;
  updated_at: string;
}

export interface AIInsight {
  id: string;
  employee_id: string;
  type: 'talent_dna' | 'hidden_capabilities' | 'skill_adjacency' | 'career_roadmap' | 'match_analysis';
  data: any;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  employee_id: string;
  opportunity_id: string;
  alignment: 'strong' | 'partial' | 'development_needed';
  similarity_score: number;
  matching_skills: string[];
  missing_skills: string[];
  explanation: string;
  recommendations: string[];
  created_at: string;
}

// AI Response Types
export interface TalentDNA {
  dimensions: {
    name: string;
    level: number; // 0-100
    evidence: string[];
    description: string;
  }[];
  summary: string;
  emerging_capabilities: string[];
}

export interface HiddenCapability {
  capability: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
  potential_roles: string[];
  description: string;
}

export interface SkillAdjacency {
  current_skills: string[];
  adjacent_capabilities: {
    capability: string;
    based_on: string[];
    description: string;
  }[];
  potential_roles: {
    role: string;
    readiness: 'ready_now' | 'near_ready' | 'development_needed';
    explanation: string;
  }[];
}

export interface CareerRoadmap {
  current_state: {
    role: string;
    strengths: string[];
  };
  now: {
    title: string;
    actions: string[];
    skills_to_strengthen: string[];
  };
  next: {
    title: string;
    actions: string[];
    skills_to_build: string[];
    timeline: string;
  };
  then: {
    title: string;
    target_role: string;
    requirements: string[];
    timeline: string;
  };
}

export interface SkillGapAnalysis {
  target_role: string;
  already_have: { skill: string; evidence: string }[];
  partially_developed: { skill: string; current_level: string; needed_level: string }[];
  need_to_develop: { skill: string; priority: 'high' | 'medium' | 'low'; recommendations: string[] }[];
}
