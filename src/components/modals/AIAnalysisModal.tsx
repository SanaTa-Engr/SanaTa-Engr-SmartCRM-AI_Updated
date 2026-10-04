import { X, Sparkles, CheckCircle2, AlertTriangle, Target, TrendingUp, Lightbulb } from 'lucide-react';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  type: 'contact_analysis' | 'deal_insights' | 'lead_summary';
  data: any;
}

export function AIAnalysisModal({ isOpen, onClose, title, subtitle, type, data }: AIAnalysisModalProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-indigo-50/30 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Contact Analysis View */}
          {type === 'contact_analysis' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Executive Summary</span>
                <p className="text-slate-800 leading-relaxed font-medium">{data.summary}</p>
              </div>

              {data.upsellOpportunities && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Upsell & Expansion Opportunities</span>
                  </h4>
                  <div className="space-y-1.5">
                    {data.upsellOpportunities.map((opp: string, i: number) => (
                      <div key={i} className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-emerald-950 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{opp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.recommendedTalkingPoints && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>Recommended Discussion Points</span>
                  </h4>
                  <div className="space-y-1.5">
                    {data.recommendedTalkingPoints.map((pt: string, i: number) => (
                      <div key={i} className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-xl text-amber-950 flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Deal Insights View */}
          {type === 'deal_insights' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase block">Win Probability</span>
                  <p className="text-2xl font-bold text-indigo-950">{data.winProbability}%</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    data.healthAssessment === 'healthy'
                      ? 'bg-emerald-100 text-emerald-700'
                      : data.healthAssessment === 'caution'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {data.healthAssessment}
                </span>
              </div>

              {data.closingStrategy && (
                <div className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-purple-700 uppercase block mb-1">
                    AI Strategic Closing Plan
                  </span>
                  <p className="text-purple-950 font-medium leading-relaxed">{data.closingStrategy}</p>
                </div>
              )}

              {data.keyStrengths && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1.5">Deal Strengths</h4>
                  <ul className="space-y-1 list-disc list-inside text-slate-700">
                    {data.keyStrengths.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {data.potentialRisks && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1 text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Risk Factors</span>
                  </h4>
                  <ul className="space-y-1 list-disc list-inside text-slate-700">
                    {data.potentialRisks.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Lead Summary View */}
          {type === 'lead_summary' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl leading-relaxed text-slate-800 font-medium whitespace-pre-wrap">
                {typeof data === 'string' ? data : data.summary || JSON.stringify(data, null, 2)}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
