import { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Shield,
  Key,
  Server,
  Code2,
  User,
  FileText,
  Download,
  ExternalLink,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api';
import { User as UserType } from '../types';

interface SettingsViewProps {
  user: UserType | null;
  onRefreshData: () => void;
}

export function SettingsView({ user, onRefreshData }: SettingsViewProps) {
  const [status, setStatus] = useState<any>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const s = await api.getStatus();
        setStatus(s);
      } catch (e) {
        console.error('Failed to get status:', e);
      }
    }
    loadStatus();
  }, []);

  const handleResetData = async () => {
    setIsResetting(true);
    setMessage(null);
    try {
      const res = await api.seedData();
      setMessage(res.message || 'Demo data successfully refreshed.');
      onRefreshData();
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const copySqlSchema = () => {
    const sql = `-- Supabase CRM Schema Script
-- Paste this directly into Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'sales_rep',
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  phone TEXT,
  website TEXT,
  city TEXT,
  country TEXT,
  annual_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  status TEXT DEFAULT 'lead',
  tags TEXT[] DEFAULT '{}',
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT NOT NULL,
  title TEXT,
  stage TEXT DEFAULT 'New',
  estimated_value NUMERIC DEFAULT 0,
  source TEXT,
  score INTEGER DEFAULT 50,
  score_reason TEXT,
  next_action TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value NUMERIC NOT NULL,
  stage TEXT DEFAULT 'Discovery',
  probability INTEGER DEFAULT 20,
  expected_close_date DATE,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name TEXT,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT,
  ai_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  related_type TEXT,
  related_id TEXT,
  related_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  entity_type TEXT DEFAULT 'general',
  entity_id TEXT,
  entity_name TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Settings Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">System & Database Settings</h2>
        <p className="text-xs text-slate-500">
          Manage your database connection, user workspace profile, and AI model configurations.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active User Profile</h3>
            <p className="text-xs text-slate-500">Currently authenticated sales operator</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Full Name</span>
            <span className="font-semibold text-slate-800">{user?.name || 'Alex Morgan'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email</span>
            <span className="font-semibold text-slate-800">{user?.email || 'demo@smartcrm.ai'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Company Workspace</span>
            <span className="font-semibold text-slate-800">{user?.companyName || 'Acme SaaS Corp'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Role / Permissions</span>
            <span className="font-semibold text-slate-800">{user?.role || 'Sales Lead (Admin)'}</span>
          </div>
        </div>
      </div>

      {/* Database / Supabase Integration Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Database & Backend Layer</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  Online & Active
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Mode: <span className="font-semibold text-slate-800">{status?.mode === 'supabase' ? 'Supabase PostgreSQL' : 'Local Persistent Storage (JSON Data Layer)'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={copySqlSchema}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'SQL Copied!' : 'Copy Supabase SQL Schema'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2">
          <p className="font-medium">
            To connect your live cloud Supabase project, define these environment variables:
          </p>
          <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-1">
            <p>SUPABASE_URL=https://your-project-id.supabase.co</p>
            <p>SUPABASE_ANON_KEY=your-anon-api-key</p>
          </div>
          <p className="text-[11px] text-slate-500">
            If left unconfigured, the app runs on a resilient, high-speed local filesystem persistence layer with complete relational integrity and full CRUD guarantees.
          </p>
        </div>

        {/* Re-seed demo dataset button */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-900">Reset Demo Data</p>
            <p className="text-[11px] text-slate-400">Restore default enterprise leads, deals, contacts, and tasks</p>
          </div>
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Restoring...' : 'Reset Dataset'}</span>
          </button>
        </div>
      </div>

      {/* AI Assistant Configuration Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Intelligence Engine</h3>
            <p className="text-xs text-slate-500">Powered by Google Gemini 3.8 Flash SDK</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Model Alias</span>
            <span className="font-bold text-slate-800">gemini-3.8-flash</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Lead Scoring</span>
            <span className="font-bold text-emerald-600">Enabled (B2B Matrix)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Email Drafter</span>
            <span className="font-bold text-indigo-600">Multi-tone Persuasion</span>
          </div>
        </div>
      </div>

      {/* Google Maps Platform Integration Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Google Maps Platform Integration</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  Live & Active
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Official SDK: <span className="font-semibold text-slate-800">@vis.gl/react-google-maps</span> &bull; Places API (New)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Map Engine</span>
            <span className="font-bold text-slate-800">AdvancedMarker + Pin</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Discovery API</span>
            <span className="font-bold text-indigo-600">Places Text Search (New)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Security Architecture</span>
            <span className="font-bold text-emerald-600">Server-Side Key Proxy</span>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3 text-xs text-emerald-950">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Google Maps API credentials are <strong>never committed to GitHub</strong> or hardcoded in source files. On Vercel, configure your private Google Maps key in <em>Project Settings &gt; Environment Variables</em>. The backend proxy securely handles searches and maps configuration while keeping your credentials 100% private.
            </p>
          </div>
        </div>
      </div>

      {/* Product Requirements Document (PRD v3.0) Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Product Requirements Document (PRD)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Release 3.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official specifications covering Google Maps Lead Discovery, Sales Pipeline Funnel, AI Scoring, and Bulk Import.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/prd.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>View Online PRD</span>
            </a>

            <a
              href="/SmartCRM_AI_Product_Requirements_Document.pdf"
              download="SmartCRM_AI_Product_Requirements_Document_v3.pdf"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800">
            Updated in Release 3.0:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
            <li><strong>Google Maps Lead Discovery:</strong> Real-time spatial prospecting with `@vis.gl/react-google-maps`, Places API (New), interactive markers, and bulk 1-click pipeline import.</li>
            <li><strong>5-Stage Sales Pipeline Funnel:</strong> Visual stepper bar with stage definitions, aggregate dollar volume, and 1-click stage advance buttons on Kanban cards.</li>
            <li><strong>Markdown & Standalone Web Versions:</strong> Accessible directly in the repository via <code>/PRD.md</code>, browser via <code>/prd.html</code>, or as an executive PDF document.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
