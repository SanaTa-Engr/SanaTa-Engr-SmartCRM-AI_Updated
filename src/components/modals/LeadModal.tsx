import { useState, useEffect, type FormEvent } from 'react';
import { X, Target, Sparkles } from 'lucide-react';
import { Lead, LeadStage } from '../../types';

interface LeadModalProps {
  lead?: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Lead>) => Promise<void>;
}

export function LeadModal({ lead, isOpen, onClose, onSave }: LeadModalProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<LeadStage>('New');
  const [estimatedValue, setEstimatedValue] = useState(25000);
  const [source, setSource] = useState('Inbound Web');
  const [score, setScore] = useState(60);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setName(lead.name);
      setCompany(lead.company);
      setTitle(lead.title || '');
      setEmail(lead.email);
      setPhone(lead.phone || '');
      setStage(lead.stage);
      setEstimatedValue(lead.estimatedValue || 0);
      setSource(lead.source || 'Inbound Web');
      setScore(lead.score || 60);
    } else {
      setName('');
      setCompany('');
      setTitle('');
      setEmail('');
      setPhone('');
      setStage('New');
      setEstimatedValue(25000);
      setSource('Inbound Web');
      setScore(60);
    }
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        ...(lead || {}),
        name,
        company,
        title,
        email,
        phone,
        stage,
        estimatedValue: Number(estimatedValue),
        source,
        score: Number(score),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {lead ? 'Edit Sales Lead' : 'Create New Sales Lead'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company *</label>
              <input
                type="text"
                required
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. Apex BioHealth"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. VP of Operations"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="sarah@apex.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pipeline Stage</label>
              <select
                value={stage}
                onChange={e => setStage(e.target.value as LeadStage)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Est. Value ($)</label>
              <input
                type="number"
                value={estimatedValue}
                onChange={e => setEstimatedValue(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Source</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="Inbound Web">Inbound Web</option>
                <option value="Google Maps">Google Maps</option>
                <option value="Outbound SDR">Outbound SDR</option>
                <option value="Referral">Referral</option>
                <option value="Partner Ecosystem">Partner Ecosystem</option>
                <option value="Conference">Conference</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Initial AI Score: {score}/100</label>
              <span className="text-[10px] text-indigo-600 font-medium">Can be auto-scored via Gemini</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={score}
              onChange={e => setScore(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
            >
              {isSaving ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
