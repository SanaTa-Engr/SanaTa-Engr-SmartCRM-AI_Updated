import { useState } from 'react';
import {
  Plus,
  Search,
  Sparkles,
  Mail,
  ArrowRight,
  ArrowLeft,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Upload,
  MapPin,
  ExternalLink,
  Target,
  Building2,
  PhoneCall,
  ShieldCheck,
  FileText,
  Trophy,
  Filter,
  Check,
} from 'lucide-react';
import { Lead, LeadStage } from '../types';
import { MapLeadsView } from './MapLeadsView';

interface LeadsViewProps {
  leads: Lead[];
  onAddLead: () => void;
  onLeadCreated?: (lead: Lead) => void;
  onOpenImport?: () => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onStageChange: (lead: Lead, newStage: LeadStage) => void;
  onScoreLead: (lead: Lead) => void;
  onGenerateSummary: (lead: Lead) => void;
  onDraftEmail: (lead: Lead) => void;
  isScoringId: string | null;
}

interface StageConfig {
  id: LeadStage;
  stepNumber: number;
  label: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  accentBar: string;
  dotColor: string;
  nextStage: LeadStage | null;
  prevStage: LeadStage | null;
  nextLabel?: string;
  icon: any;
}

const STAGES: StageConfig[] = [
  {
    id: 'New',
    stepNumber: 1,
    label: 'New Inbound',
    description: 'Fresh discovery & unprocessed leads',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    accentBar: 'bg-blue-500',
    dotColor: 'bg-blue-500',
    nextStage: 'Contacted',
    prevStage: null,
    nextLabel: 'Contacted',
    icon: Target,
  },
  {
    id: 'Contacted',
    stepNumber: 2,
    label: 'Contacted',
    description: 'Outreach started (calls, emails, intro)',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    accentBar: 'bg-purple-500',
    dotColor: 'bg-purple-500',
    nextStage: 'Qualified',
    prevStage: 'New',
    nextLabel: 'Qualified',
    icon: PhoneCall,
  },
  {
    id: 'Qualified',
    stepNumber: 3,
    label: 'Qualified',
    description: 'Budget, authority & interest verified',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    accentBar: 'bg-amber-500',
    dotColor: 'bg-amber-500',
    nextStage: 'Proposal',
    prevStage: 'Contacted',
    nextLabel: 'Proposal',
    icon: ShieldCheck,
  },
  {
    id: 'Proposal',
    stepNumber: 4,
    label: 'Proposal Sent',
    description: 'Formal contract, pricing or quote submitted',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    accentBar: 'bg-indigo-500',
    dotColor: 'bg-indigo-500',
    nextStage: 'Won',
    prevStage: 'Qualified',
    nextLabel: 'Mark Won',
    icon: FileText,
  },
  {
    id: 'Won',
    stepNumber: 5,
    label: 'Closed Won',
    description: 'Contract signed, deal converted to customer',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    accentBar: 'bg-emerald-500',
    dotColor: 'bg-emerald-500',
    nextStage: null,
    prevStage: 'Proposal',
    icon: Trophy,
  },
  {
    id: 'Lost',
    stepNumber: 6,
    label: 'Closed Lost',
    description: 'Disqualified, unresponsive or lost to competitor',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-700',
    accentBar: 'bg-slate-400',
    dotColor: 'bg-slate-400',
    nextStage: null,
    prevStage: 'Proposal',
    icon: XCircle,
  },
];

export function LeadsView({
  leads,
  onAddLead,
  onLeadCreated,
  onOpenImport,
  onEditLead,
  onDeleteLead,
  onStageChange,
  onScoreLead,
  onGenerateSummary,
  onDraftEmail,
  isScoringId,
}: LeadsViewProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'map'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.address && l.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStage = selectedStageFilter === 'all' || l.stage === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  const totalPipelineValue = leads.reduce(
    (acc, l) => acc + (Number(l.estimatedValue) || 0),
    0
  );

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        label: 'High Fit',
      };
    }
    if (score >= 60) {
      return {
        bg: 'bg-amber-100 text-amber-800 border-amber-300',
        label: 'Good Fit',
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      label: 'Low Fit',
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search leads, company, city..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStageFilter}
              onChange={e => setSelectedStageFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Pipeline Stages ({leads.length})</option>
              {STAGES.map(s => {
                const count = leads.filter(l => l.stage === s.id).length;
                return (
                  <option key={s.id} value={s.id}>
                    {s.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* View Mode Switcher and Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Pipeline Stage Columns View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tabular List View"
            >
              <List className="w-4 h-4" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Google Maps Interactive Lead Discovery"
            >
              <MapPin className="w-4 h-4" />
              <span>Google Maps</span>
            </button>
          </div>

          {/* Find on Map shortcut button */}
          <button
            onClick={() => setViewMode(viewMode === 'map' ? 'kanban' : 'map')}
            className={`px-3.5 py-2 border text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'map'
                ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            <MapPin className={`w-4 h-4 ${viewMode === 'map' ? 'text-white' : 'text-emerald-600'}`} />
            <span>{viewMode === 'map' ? 'Back to Pipeline' : 'Find Leads on Map'}</span>
          </button>

          {/* Import */}
          {onOpenImport && (
            <button
              onClick={onOpenImport}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Import</span>
            </button>
          )}

          {/* Add Lead */}
          <button
            onClick={onAddLead}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Main View Area: Google Maps View, Pipeline Kanban, or Table */}
      {viewMode === 'map' ? (
        <MapLeadsView
          existingLeads={leads}
          onLeadCreated={lead => {
            if (onLeadCreated) onLeadCreated(lead);
          }}
          onBackToLeads={() => setViewMode('kanban')}
        />
      ) : viewMode === 'kanban' ? (
        <div className="space-y-4">
          {/* Interactive Pipeline Progression Funnel (Clear Sales Stepper) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Sales Pipeline Flow & Conversion Funnel
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any stage to filter or follow leads step-by-step from discovery to closed won
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Total Leads: </span>
                  <strong className="text-slate-900">{leads.length}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Pipeline Value: </span>
                  <strong className="text-emerald-700">
                    ${totalPipelineValue.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Stepper bar */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {STAGES.map((stage, idx) => {
                const stageLeads = leads.filter(l => l.stage === stage.id);
                const stageVal = stageLeads.reduce(
                  (sum, l) => sum + (Number(l.estimatedValue) || 0),
                  0
                );
                const isSelected = selectedStageFilter === stage.id;
                const StageIcon = stage.icon;

                return (
                  <button
                    key={stage.id}
                    onClick={() =>
                      setSelectedStageFilter(selectedStageFilter === stage.id ? 'all' : stage.id)
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                        <span className="text-[10px] font-bold text-slate-400">Step {stage.stepNumber}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${stage.badgeBg} ${stage.badgeText}`}>
                        {stageLeads.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <StageIcon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">
                        {stage.label}
                      </h4>
                    </div>

                    <p className="text-[11px] font-extrabold text-slate-700 mt-1">
                      ${stageVal.toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kanban Columns with Clear Visual Separation and 1-Click Advancement */}
          <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start">
            {STAGES.map(stage => {
              const stageLeads = filteredLeads.filter(l => l.stage === stage.id);
              const totalStageVal = stageLeads.reduce(
                (sum, l) => sum + (Number(l.estimatedValue) || 0),
                0
              );
              const StageIcon = stage.icon;

              return (
                <div
                  key={stage.id}
                  className="w-[320px] flex-shrink-0 bg-slate-100/90 rounded-2xl p-3.5 border border-slate-200/90 flex flex-col max-h-[calc(100vh-200px)] shadow-2xs"
                >
                  {/* Stage Top Accent Bar */}
                  <div className={`h-1.5 w-full rounded-full mb-2.5 ${stage.accentBar}`} />

                  {/* Stage Header */}
                  <div className="mb-2 px-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StageIcon className="w-4 h-4 text-slate-700" />
                        <span className="text-xs font-extrabold text-slate-900">{stage.label}</span>
                        <span
                          className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${stage.badgeBg} ${stage.badgeText}`}
                        >
                          {stageLeads.length}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                        ${totalStageVal.toLocaleString()}
                      </span>
                    </div>
                    {/* Clear Stage Description */}
                    <p className="text-[10px] text-slate-500 font-medium mt-1 leading-tight">
                      {stage.description}
                    </p>
                  </div>

                  {/* Column Quick Add */}
                  <button
                    onClick={onAddLead}
                    className="w-full mb-3 py-1.5 px-2 bg-white/80 hover:bg-white text-slate-600 hover:text-indigo-600 border border-dashed border-slate-300 hover:border-indigo-300 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to {stage.label}</span>
                  </button>

                  {/* Cards List */}
                  <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                    {stageLeads.length === 0 ? (
                      <div className="p-6 text-center bg-white/50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-400 font-medium">No leads in this stage</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Move leads here or click "+ Add" above
                        </p>
                      </div>
                    ) : (
                      stageLeads.map(lead => {
                        const scoreInfo = getScoreBadge(lead.score);

                        return (
                          <div
                            key={lead.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all relative group flex flex-col gap-2.5"
                          >
                            {/* Card Top: Company, Contact, and AI Fit Score */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-xs font-extrabold text-slate-900 truncate leading-tight group-hover:text-indigo-600 transition-colors">
                                  {lead.company}
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                  {lead.name} {lead.title ? `• ${lead.title}` : ''}
                                </p>
                              </div>

                              {/* AI Score Badge */}
                              <div
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border shrink-0 ${scoreInfo.bg}`}
                                title={`AI Predictive Fit Score: ${lead.score}/100 (${scoreInfo.label})`}
                              >
                                Score {lead.score}
                              </div>
                            </div>

                            {/* Google Maps / Location Info */}
                            {lead.address && (
                              <div
                                className="flex items-center gap-1.5 text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100"
                                title={lead.address}
                              >
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="truncate flex-1 font-medium">{lead.address}</span>
                                <a
                                  href={
                                    lead.mapsUrl ||
                                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                      lead.company + ' ' + lead.address
                                    )}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold shrink-0 flex items-center gap-0.5"
                                  title="View location on Google Maps"
                                >
                                  <span>Map</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            )}

                            {/* Value and Lead Source */}
                            <div className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-50 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  Est. Deal
                                </span>
                                <span className="font-extrabold text-slate-900">
                                  ${Number(lead.estimatedValue).toLocaleString()}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                  lead.source === 'Google Maps'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                                    : 'bg-white text-slate-600 border border-slate-200'
                                }`}
                              >
                                {lead.source === 'Google Maps' ? '📍 Google Maps' : lead.source}
                              </span>
                            </div>

                            {/* Recommended AI Next Action */}
                            {lead.nextAction && (
                              <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-950 leading-snug">
                                <span className="font-bold text-indigo-700 block text-[10px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-indigo-600" />
                                  Next Action
                                </span>
                                <span className="line-clamp-2">{lead.nextAction}</span>
                              </div>
                            )}

                            {/* 1-Click Pipeline Advancement Toolbar */}
                            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                              {/* Primary Pipeline Progress Button */}
                              <div className="flex items-center gap-1">
                                {stage.prevStage && (
                                  <button
                                    onClick={() => onStageChange(lead, stage.prevStage as LeadStage)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                                    title={`Move back to ${stage.prevStage}`}
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {stage.nextStage ? (
                                  <button
                                    onClick={() => onStageChange(lead, stage.nextStage as LeadStage)}
                                    className="flex-1 py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                    title={`Advance lead to ${stage.nextLabel || stage.nextStage}`}
                                  >
                                    <span>Advance to {stage.nextLabel || stage.nextStage}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                ) : stage.id === 'Won' ? (
                                  <div className="flex-1 py-1 px-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-center text-xs font-extrabold flex items-center justify-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Deal Won</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => onStageChange(lead, 'New')}
                                    className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold text-center cursor-pointer transition-colors"
                                  >
                                    Reopen Lead
                                  </button>
                                )}

                                {/* Jump Stage Select */}
                                <select
                                  value={lead.stage}
                                  onChange={e => onStageChange(lead, e.target.value as LeadStage)}
                                  className="text-[10px] font-bold py-1 px-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 border-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
                                  title="Jump to any pipeline stage"
                                >
                                  {STAGES.map(s => (
                                    <option key={s.id} value={s.id}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Secondary Actions: AI Score, Email, Summary, Edit, Delete */}
                              <div className="flex items-center justify-between text-slate-400">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onScoreLead(lead)}
                                    disabled={isScoringId === lead.id}
                                    title="Rescore with Gemini AI"
                                    className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  >
                                    <Sparkles
                                      className={`w-3.5 h-3.5 ${
                                        isScoringId === lead.id ? 'animate-spin' : ''
                                      }`}
                                    />
                                  </button>

                                  <button
                                    onClick={() => onDraftEmail(lead)}
                                    title="Generate follow-up email"
                                    className="p-1 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => onGenerateSummary(lead)}
                                    title="AI Lead Dossier"
                                    className="p-1 rounded-md text-purple-600 hover:bg-purple-50 transition-colors"
                                  >
                                    <TrendingUp className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onEditLead(lead)}
                                    title="Edit Lead Details"
                                    className="p-1 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => onDeleteLead(lead.id)}
                                    title="Delete Lead"
                                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Company & Lead</th>
                  <th className="py-3.5 px-4">Stage & Pipeline Flow</th>
                  <th className="py-3.5 px-4">Deal Value</th>
                  <th className="py-3.5 px-4">AI Score</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLeads.map(lead => {
                  const currentStageConfig = STAGES.find(s => s.id === lead.stage) || STAGES[0];
                  const scoreInfo = getScoreBadge(lead.score);

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{lead.company}</div>
                        <div className="text-[11px] text-slate-500">
                          {lead.name} {lead.title ? `• ${lead.title}` : ''}
                        </div>
                        {lead.email && (
                          <div className="text-[10px] text-slate-400">{lead.email}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${currentStageConfig.badgeBg} ${currentStageConfig.badgeText}`}
                          >
                            {currentStageConfig.label}
                          </span>

                          {/* Quick advance button */}
                          {currentStageConfig.nextStage && (
                            <button
                              onClick={() =>
                                onStageChange(lead, currentStageConfig.nextStage as LeadStage)
                              }
                              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                              title={`Advance to ${currentStageConfig.nextLabel || currentStageConfig.nextStage}`}
                            >
                              <span>Next</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        ${Number(lead.estimatedValue).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${scoreInfo.bg}`}
                        >
                          {lead.score}/100 • {scoreInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {lead.address ? (
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 max-w-[200px]">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{lead.address}</span>
                            <a
                              href={
                                lead.mapsUrl ||
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  lead.company + ' ' + lead.address
                                )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 ml-1 shrink-0"
                              title="Open on Google Maps"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No address</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onScoreLead(lead)}
                            title="Rescore with AI"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDraftEmail(lead)}
                            title="Draft Email"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditLead(lead)}
                            title="Edit"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteLead(lead.id)}
                            title="Delete"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
