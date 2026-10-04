-- ===================================================================
-- SmartCRM AI - Complete Supabase PostgreSQL Schema
-- Tables: users, contacts, companies, leads, deals, tasks, notes, activities
-- Includes: Foreign keys, cascade rules, indexes, and Row Level Security (RLS)
-- ===================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Sales Executive',
  company_name TEXT DEFAULT 'SmartCRM Tech',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT DEFAULT 'Technology',
  size TEXT DEFAULT '10-50',
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  annual_revenue NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'customer', 'partner', 'inactive')),
  avatar_url TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  source TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT NOT NULL,
  title TEXT,
  stage TEXT DEFAULT 'New' CHECK (stage IN ('New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost')),
  estimated_value NUMERIC(12,2) DEFAULT 0,
  source TEXT DEFAULT 'Inbound Website',
  score INTEGER DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  score_reason TEXT,
  ai_summary TEXT,
  next_action TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DEALS TABLE
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value NUMERIC(14,2) NOT NULL DEFAULT 0,
  stage TEXT DEFAULT 'Discovery' CHECK (stage IN ('Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost')),
  probability INTEGER DEFAULT 20 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE NOT NULL,
  ai_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  related_type TEXT CHECK (related_type IN ('contact', 'lead', 'deal', 'general')),
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  entity_type TEXT DEFAULT 'general' CHECK (entity_type IN ('contact', 'lead', 'deal', 'general')),
  entity_id UUID,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ACTIVITIES TABLE (Timeline audit log)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'stage_change', 'deal_won', 'task_completed', 'ai_analysis')),
  description TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LEAD IMPORT HISTORY TABLE (Automated Lead Import audit log)
CREATE TABLE IF NOT EXISTS public.lead_import_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  invalid_count INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'failed')),
  errors JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-performance filtering & lookup
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_stage ON public.leads(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_user_stage ON public.deals(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notes_user_entity ON public.notes(user_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_import_history_user_id ON public.lead_import_history(user_id, created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_import_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only view, insert, update and delete their own records
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own companies" ON public.companies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own contacts" ON public.contacts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own leads" ON public.leads
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own deals" ON public.deals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notes" ON public.notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own activities" ON public.activities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own lead imports" ON public.lead_import_history
  FOR ALL USING (auth.uid() = user_id);
