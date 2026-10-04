import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Target,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Download,
} from 'lucide-react';
import { api } from '../api';
import { SalesPipelineReport, Deal, Lead } from '../types';

interface ReportsViewProps {
  deals: Deal[];
  leads: Lead[];
}

export function ReportsView({ deals, leads }: ReportsViewProps) {
  const [report, setReport] = useState<SalesPipelineReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await api.getReportsAnalytics();
        setReport(data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const totalWonRevenue = deals
    .filter(d => d.stage === 'Closed Won')
    .reduce((sum, d) => sum + Number(d.value), 0);

  const totalOpenRevenue = deals
    .filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + Number(d.value), 0);

  // Conversion rates calculation
  const totalLeadsCount = leads.length || 1;
  const wonLeadsCount = leads.filter(l => l.stage === 'Won').length;
  const qualifiedLeadsCount = leads.filter(l => l.stage === 'Qualified' || l.stage === 'Proposal' || l.stage === 'Won').length;

  const leadToQualifiedRate = Math.round((qualifiedLeadsCount / totalLeadsCount) * 100);
  const leadToWonRate = Math.round((wonLeadsCount / totalLeadsCount) * 100);

  const stages = ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Revenue & Sales Performance Analytics</h2>
          <p className="text-xs text-slate-500">Real-time pipeline progression, deal velocity, and conversion attribution</p>
        </div>

        <button
          onClick={() => {
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
              JSON.stringify({ report, deals, leads }, null, 2)
            )}`;
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', jsonString);
            downloadAnchor.setAttribute('download', `smartcrm-sales-report-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
          }}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics JSON</span>
        </button>
      </div>

      {/* Top 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Realized Won ARR</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">${totalWonRevenue.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Booked Closed Won contract revenue</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Active Open Pipeline</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">${totalOpenRevenue.toLocaleString()}</p>
          <p className="text-xs text-indigo-600 font-medium mt-1">
            Weighted: ${(report?.weightedPipelineValue || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Pipeline Win Rate</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{report?.winRatePercentage || 75}%</p>
          <p className="text-xs text-purple-600 font-medium mt-1">{leadToWonRate}% lead-to-won conversion</p>
        </div>
      </div>

      {/* Pipeline Stage Bar Visualization */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Deal Volume & Capital Allocation by Stage</h3>
        <p className="text-xs text-slate-500 mb-6">Aggregate contract values in each phase of the pipeline</p>

        <div className="space-y-4">
          {stages.map(stageName => {
            const stageDeals = deals.filter(d => d.stage === stageName);
            const stageVal = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);
            const maxVal = Math.max(...deals.map(d => Number(d.value))) * deals.length || 100000;
            const barWidth = Math.min(100, Math.max(5, Math.round((stageVal / (totalWonRevenue + totalOpenRevenue || 1)) * 100)));

            return (
              <div key={stageName} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{stageName} ({stageDeals.length} deals)</span>
                  <span className="font-bold text-slate-900">${stageVal.toLocaleString()}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stageName === 'Closed Won'
                        ? 'bg-emerald-500'
                        : stageName === 'Negotiation'
                        ? 'bg-purple-600'
                        : stageName === 'Proposal'
                        ? 'bg-indigo-500'
                        : stageName === 'Discovery'
                        ? 'bg-blue-500'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversion Funnel Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Lead Qualification Funnel</h3>
          <p className="text-xs text-slate-500 mb-5">Progression through acquisition milestones</p>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700">1. Total Inbound Leads</span>
                <p className="text-[11px] text-slate-400">All captured prospects</p>
              </div>
              <span className="text-sm font-bold text-slate-900">{totalLeadsCount}</span>
            </div>

            <div className="p-3.5 bg-indigo-50/50 rounded-2xl flex items-center justify-between border border-indigo-100">
              <div>
                <span className="text-xs font-semibold text-indigo-900">2. Qualified Opportunities</span>
                <p className="text-[11px] text-indigo-600">{leadToQualifiedRate}% conversion rate</p>
              </div>
              <span className="text-sm font-bold text-indigo-900">{qualifiedLeadsCount}</span>
            </div>

            <div className="p-3.5 bg-emerald-50/50 rounded-2xl flex items-center justify-between border border-emerald-100">
              <div>
                <span className="text-xs font-semibold text-emerald-900">3. Closed Won Customers</span>
                <p className="text-[11px] text-emerald-600">{leadToWonRate}% overall conversion</p>
              </div>
              <span className="text-sm font-bold text-emerald-900">{wonLeadsCount}</span>
            </div>
          </div>
        </div>

        {/* Lead Source Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Customer Acquisition Channels</h3>
          <p className="text-xs text-slate-500 mb-5">Lead distribution by marketing & sales channel</p>

          <div className="space-y-3">
            {['Inbound Web', 'Outbound SDR', 'Referral', 'Partner Ecosystem'].map(channel => {
              const channelLeads = leads.filter(l => l.source === channel);
              const pct = Math.round((channelLeads.length / totalLeadsCount) * 100);

              return (
                <div key={channel} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{channel}</span>
                    <span className="font-bold text-slate-900">{channelLeads.length} leads ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.max(8, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
