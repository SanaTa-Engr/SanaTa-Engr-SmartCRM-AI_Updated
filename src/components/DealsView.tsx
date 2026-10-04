import { useState } from 'react';
import {
  Plus,
  Search,
  Sparkles,
  Briefcase,
  DollarSign,
  Calendar,
  Building,
  User,
  Edit2,
  Trash2,
  TrendingUp,
  LayoutGrid,
  List,
  CheckCircle,
} from 'lucide-react';
import { Deal, DealStage } from '../types';

interface DealsViewProps {
  deals: Deal[];
  onAddDeal: () => void;
  onEditDeal: (deal: Deal) => void;
  onDeleteDeal: (id: string) => void;
  onStageChange: (deal: Deal, newStage: DealStage) => void;
  onAnalyzeDeal: (deal: Deal) => void;
}

const DEAL_STAGES: { id: DealStage; label: string; color: string; defaultProb: number }[] = [
  { id: 'Discovery', label: 'Discovery', color: 'border-t-blue-500', defaultProb: 20 },
  { id: 'Proposal', label: 'Proposal', color: 'border-t-amber-500', defaultProb: 50 },
  { id: 'Negotiation', label: 'Negotiation', color: 'border-t-purple-500', defaultProb: 80 },
  { id: 'Closed Won', label: 'Closed Won', color: 'border-t-emerald-500', defaultProb: 100 },
  { id: 'Closed Lost', label: 'Closed Lost', color: 'border-t-slate-400', defaultProb: 0 },
];

export function DealsView({
  deals,
  onAddDeal,
  onEditDeal,
  onDeleteDeal,
  onStageChange,
  onAnalyzeDeal,
}: DealsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  const filteredDeals = deals.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.companyName && d.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (d.contactName && d.contactName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPipeline = filteredDeals
    .filter(d => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + Number(d.value), 0);

  const weightedRevenue = filteredDeals
    .filter(d => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + Number(d.value) * ((d.probability || 0) / 100), 0);

  return (
    <div className="space-y-6">
      {/* Top action bar & Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search deals, company, or contact..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="hidden lg:flex items-center gap-4 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block font-medium">TOTAL VALUE</span>
              <span className="font-bold text-slate-900">${totalPipeline.toLocaleString()}</span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <span className="text-slate-400 text-[10px] block font-medium">WEIGHTED FORECAST</span>
              <span className="font-bold text-emerald-600">${Math.round(weightedRevenue).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'kanban' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={onAddDeal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Deal</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {DEAL_STAGES.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
            const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);

            return (
              <div
                key={stage.id}
                className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200 flex flex-col min-w-[260px] max-h-[calc(100vh-220px)]"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                    <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">${(stageTotal / 1000).toFixed(0)}k</span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                  {stageDeals.map(deal => (
                    <div
                      key={deal.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{deal.title}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onEditDeal(deal)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteDeal(deal.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Associated Company & Contact */}
                      <div className="space-y-1 text-[11px] text-slate-500">
                        {deal.companyName && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-medium text-slate-700">{deal.companyName}</span>
                          </div>
                        )}
                        {deal.contactName && (
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{deal.contactName}</span>
                          </div>
                        )}
                      </div>

                      {/* Amount & Close Date */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="font-bold text-slate-900">${Number(deal.value).toLocaleString()}</span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{deal.expectedCloseDate}</span>
                        </div>
                      </div>

                      {/* Probability bar */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>Win Probability</span>
                          <span className="font-bold text-slate-700">{deal.probability}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              deal.probability >= 70 ? 'bg-emerald-500' : deal.probability >= 40 ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                      </div>

                      {/* AI Strategy Button & Stage mover */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => onAnalyzeDeal(deal)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-colors"
                          title="Generate AI sales recommendation & closing strategy"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Insights</span>
                        </button>

                        <select
                          value={deal.stage}
                          onChange={e => onStageChange(deal, e.target.value as DealStage)}
                          className="text-[10px] font-semibold py-0.5 px-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 border-none focus:ring-0 cursor-pointer"
                        >
                          {DEAL_STAGES.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[11px]">
                      No deals
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Deal Title</th>
                <th className="px-4 py-3">Company & Contact</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Deal Value</th>
                <th className="px-4 py-3">Probability</th>
                <th className="px-4 py-3">Target Close</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeals.map(deal => (
                <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{deal.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{deal.companyName || '-'}</p>
                    <p className="text-[11px] text-slate-400">{deal.contactName || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">${Number(deal.value).toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{deal.probability}%</td>
                  <td className="px-4 py-3 text-slate-600">{deal.expectedCloseDate}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onAnalyzeDeal(deal)}
                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                        title="AI Closing Strategy"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditDeal(deal)}
                        className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteDeal(deal.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
