import {
  Users,
  Target,
  Briefcase,
  DollarSign,
  CheckSquare,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Activity as ActivityIcon,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { DashboardMetrics, Lead, Deal, Task, Activity } from '../types';
import { PipelineCharts } from './PipelineCharts';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  leads: Lead[];
  deals: Deal[];
  tasks: Task[];
  activities: Activity[];
  onNavigate: (tab: any) => void;
  onSelectLead: (lead: Lead) => void;
  onSelectDeal: (deal: Deal) => void;
  onOpenAI: () => void;
}

export function DashboardView({
  metrics,
  leads,
  deals,
  tasks,
  activities,
  onNavigate,
  onSelectLead,
  onSelectDeal,
  onOpenAI,
}: DashboardViewProps) {
  // Top 3 high score leads
  const hotLeads = [...leads]
    .filter(l => l.stage !== 'Won' && l.stage !== 'Lost')
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Open deals in Proposal/Negotiation
  const closingDeals = deals
    .filter(d => d.stage === 'Negotiation' || d.stage === 'Proposal')
    .sort((a, b) => b.value - a.value);

  // Pipeline breakdown by stage
  const pipelineStages = [
    { label: 'Discovery', color: 'bg-blue-500', deals: deals.filter(d => d.stage === 'Discovery') },
    { label: 'Proposal', color: 'bg-amber-500', deals: deals.filter(d => d.stage === 'Proposal') },
    { label: 'Negotiation', color: 'bg-purple-500', deals: deals.filter(d => d.stage === 'Negotiation') },
    { label: 'Closed Won', color: 'bg-emerald-500', deals: deals.filter(d => d.stage === 'Closed Won') },
  ];

  const totalValue = deals.reduce((sum, d) => sum + Number(d.value), 0) || 1;

  return (
    <div className="space-y-6">
      {/* Welcome & AI Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Sales Copilot Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Enterprise Sales Operations</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Pipeline health is strong with <span className="text-white font-semibold">${(metrics?.totalPipelineValue || 0).toLocaleString()}</span> across active deals and a <span className="text-emerald-400 font-semibold">{metrics?.winRatePercentage || 75}% win rate</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={onOpenAI}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask SmartCRM AI</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold border border-white/15 transition-all cursor-pointer"
          >
            View Analytics
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Contacts */}
        <div
          onClick={() => onNavigate('contacts')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Contacts</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics?.totalContacts || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-medium">Synced</span> across accounts
          </p>
        </div>

        {/* Active Leads */}
        <div
          onClick={() => onNavigate('leads')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Active Leads</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics?.activeLeads || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-amber-600 font-medium">AI Scored</span> in pipeline
          </p>
        </div>

        {/* Open Deals */}
        <div
          onClick={() => onNavigate('deals')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Open Deals</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics?.openDeals || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Valued at <span className="font-semibold text-slate-700">${((metrics?.totalPipelineValue || 0) / 1000).toFixed(0)}k</span>
          </p>
        </div>

        {/* Weighted Pipeline Revenue */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Weighted Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${((metrics?.weightedPipelineValue || 0) / 1000).toFixed(0)}k
          </p>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>${((metrics?.closedWonValue || 0) / 1000).toFixed(0)}k Won ARR</span>
          </p>
        </div>

        {/* Pending Tasks */}
        <div
          onClick={() => onNavigate('tasks')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Tasks Due</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics?.pendingTasks || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            <span className="text-indigo-600 font-medium">{metrics?.completedTasks || 0}</span> done this month
          </p>
        </div>
      </div>

      {/* Visual Analytics: Deal Pipeline Value & Lead Funnel Distribution */}
      <PipelineCharts deals={deals} leads={leads} onNavigate={onNavigate} />

      {/* Middle Grid: Pipeline Distribution + AI Hot Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Pipeline Progress Visualizer */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Deal Pipeline</h2>
              <p className="text-xs text-slate-500">Value distribution across sales stages</p>
            </div>
            <button
              onClick={() => onNavigate('deals')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Manage Pipeline</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stacked visual bar */}
          <div className="space-y-2 mb-6">
            <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden p-0.5 gap-1">
              {pipelineStages.map(stage => {
                const stageVal = stage.deals.reduce((sum, d) => sum + Number(d.value), 0);
                const pct = Math.max(4, Math.round((stageVal / totalValue) * 100));
                return (
                  <div
                    key={stage.label}
                    style={{ width: `${pct}%` }}
                    className={`${stage.color} h-full rounded-full transition-all`}
                    title={`${stage.label}: $${stageVal.toLocaleString()}`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>$0</span>
              <span>Total Pipeline: ${(metrics?.totalPipelineValue || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Stage breakdown cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pipelineStages.map(stage => {
              const val = stage.deals.reduce((sum, d) => sum + Number(d.value), 0);
              return (
                <div key={stage.label} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`}></span>
                    <span className="text-xs font-semibold text-slate-700 truncate">{stage.label}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">${(val / 1000).toFixed(0)}k</p>
                  <p className="text-[11px] text-slate-400">{stage.deals.length} deals</p>
                </div>
              );
            })}
          </div>

          {/* Top closing opportunities table */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">High Priority Deals</h3>
            <div className="space-y-2">
              {closingDeals.slice(0, 3).map(deal => (
                <div
                  key={deal.id}
                  onClick={() => onSelectDeal(deal)}
                  className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{deal.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{deal.companyName || 'Enterprise Lead'}</p>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <p className="text-xs font-bold text-slate-900">${Number(deal.value).toLocaleString()}</p>
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                      {deal.stage} ({deal.probability}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Hot Leads Recommendations */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">AI Priority Leads</h2>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full">
                High Intent
              </span>
            </div>

            <div className="space-y-3">
              {hotLeads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="p-3.5 bg-gradient-to-br from-slate-50 to-indigo-50/30 hover:from-indigo-50/50 hover:to-purple-50/50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {lead.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{lead.company} • {lead.stage}</p>
                    </div>
                    <div className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[11px] font-bold">
                      {lead.score}/100
                    </div>
                  </div>
                  {lead.nextAction && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-indigo-950 font-medium flex items-start gap-1.5">
                      <span className="font-bold text-indigo-600 shrink-0">Next:</span>
                      <span className="truncate">{lead.nextAction}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('leads')}
            className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View All Leads Pipeline</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Stream + Tasks Due Soon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Recent CRM Activities</h2>
            </div>
            <span className="text-xs text-slate-400">Live feed</span>
          </div>

          <div className="space-y-3">
            {activities.slice(0, 5).map(act => (
              <div key={act.id} className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-slate-600">
                  {act.type === 'deal_won' ? '🎉' : act.type === 'ai_analysis' ? '✨' : act.type === 'call' ? '📞' : '📝'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800 leading-snug">{act.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {new Date(act.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Due Soon */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Priority Follow-up Tasks</h2>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            {tasks
              .filter(t => t.status !== 'completed')
              .slice(0, 4)
              .map(task => (
                <div
                  key={task.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{task.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Due {new Date(task.dueDate).toLocaleDateString()} • {task.relatedName || 'General'}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                      task.priority === 'high'
                        ? 'bg-rose-100 text-rose-700'
                        : task.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
