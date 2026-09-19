-- TalentSync AI Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'hr')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee profiles
CREATE TABLE IF NOT EXISTS employee_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  headline TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  job_title TEXT DEFAULT '',
  department TEXT DEFAULT '',
  years_experience INTEGER DEFAULT 0,
  location TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  proficiency TEXT DEFAULT 'intermediate' CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'resume', 'ai_inferred')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  role_in_project TEXT DEFAULT '',
  technologies TEXT[] DEFAULT '{}',
  start_date TEXT DEFAULT '',
  end_date TEXT,
  key_achievements TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experience
CREATE TABLE IF NOT EXISTS experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT,
  is_current BOOLEAN DEFAULT false,
  technologies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT DEFAULT '',
  date_obtained TEXT DEFAULT '',
  expiry_date TEXT,
  credential_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Activities
CREATE TABLE IF NOT EXISTS learning_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  provider TEXT DEFAULT '',
  type TEXT DEFAULT 'course' CHECK (type IN ('course', 'workshop', 'bootcamp', 'self_study', 'conference', 'other')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'planned')),
  skills_learned TEXT[] DEFAULT '{}',
  completion_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities (internal roles/projects)
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT DEFAULT 'full_time' CHECK (type IN ('full_time', 'project', 'temporary', 'team')),
  department TEXT DEFAULT '',
  required_skills TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',
  required_experience_years INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Insights (cached AI analysis results)
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('talent_dna', 'hidden_capabilities', 'skill_adjacency', 'career_roadmap', 'match_analysis')),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  alignment TEXT NOT NULL CHECK (alignment IN ('strong', 'partial', 'development_needed')),
  similarity_score REAL DEFAULT 0,
  matching_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  explanation TEXT DEFAULT '',
  recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, update own
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Employee Profiles: Employees see own, HR sees all
CREATE POLICY "Employee profiles viewable by all authenticated" ON employee_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own employee profile" ON employee_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employee profile" ON employee_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Skills: viewable by all, editable by owner
CREATE POLICY "Skills viewable by all authenticated" ON skills FOR SELECT USING (true);
CREATE POLICY "Users can insert own skills" ON skills FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = skills.employee_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own skills" ON skills FOR UPDATE USING (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = skills.employee_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own skills" ON skills FOR DELETE USING (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = skills.employee_id AND user_id = auth.uid())
);

-- Projects: viewable by all, editable by owner
CREATE POLICY "Projects viewable by all authenticated" ON projects FOR SELECT USING (true);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = projects.employee_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = projects.employee_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = projects.employee_id AND user_id = auth.uid())
);

-- Experience: viewable by all, editable by owner
CREATE POLICY "Experience viewable by all authenticated" ON experience FOR SELECT USING (true);
CREATE POLICY "Users can insert own experience" ON experience FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = experience.employee_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own experience" ON experience FOR UPDATE USING (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = experience.employee_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own experience" ON experience FOR DELETE USING (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = experience.employee_id AND user_id = auth.uid())
);

-- Certifications: viewable by all, editable by owner
CREATE POLICY "Certifications viewable by all" ON certifications FOR SELECT USING (true);
CREATE POLICY "Users can insert own certifications" ON certifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = certifications.employee_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own certifications" ON certifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = certifications.employee_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own certifications" ON certifications FOR DELETE USING (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = certifications.employee_id AND user_id = auth.uid())
);

-- Learning Activities: viewable by all, editable by owner
CREATE POLICY "Learning viewable by all" ON learning_activities FOR SELECT USING (true);
CREATE POLICY "Users can insert own learning" ON learning_activities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = learning_activities.employee_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own learning" ON learning_activities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = learning_activities.employee_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own learning" ON learning_activities FOR DELETE USING (
  EXISTS (SELECT 1 FROM employee_profiles WHERE id = learning_activities.employee_id AND user_id = auth.uid())
);

-- Opportunities: viewable by all, created/managed by HR
CREATE POLICY "Opportunities viewable by all" ON opportunities FOR SELECT USING (true);
CREATE POLICY "HR can insert opportunities" ON opportunities FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "HR can update own opportunities" ON opportunities FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "HR can delete own opportunities" ON opportunities FOR DELETE USING (auth.uid() = created_by);

-- AI Insights: viewable by all, created via system
CREATE POLICY "AI insights viewable by all" ON ai_insights FOR SELECT USING (true);
CREATE POLICY "AI insights insertable by authenticated" ON ai_insights FOR INSERT WITH CHECK (true);
CREATE POLICY "AI insights updatable by authenticated" ON ai_insights FOR UPDATE USING (true);

-- Matches: viewable by all
CREATE POLICY "Matches viewable by all" ON matches FOR SELECT USING (true);
CREATE POLICY "Matches insertable by authenticated" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Matches updatable by authenticated" ON matches FOR UPDATE USING (true);
CREATE POLICY "Matches deletable by authenticated" ON matches FOR DELETE USING (true);
