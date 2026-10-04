import { useState, useEffect, type FormEvent } from 'react';
import { X, Briefcase } from 'lucide-react';
import { Deal, DealStage, Company, Contact } from '../../types';

interface DealModalProps {
  deal?: Deal | null;
  companies: Company[];
  contacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Deal>) => Promise<void>;
}

export function DealModal({ deal, companies, contacts, isOpen, onClose, onSave }: DealModalProps) {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState(35000);
  const [stage, setStage] = useState<DealStage>('Discovery');
  const [probability, setProbability] = useState(25);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (deal) {
      setTitle(deal.title);
      setValue(deal.value);
      setStage(deal.stage);
      setProbability(deal.probability);
      setExpectedCloseDate(deal.expectedCloseDate || '');
      setCompanyId(deal.companyId || '');
      setContactId(deal.contactId || '');
    } else {
      setTitle('');
      setValue(35000);
      setStage('Discovery');
      setProbability(25);
      setExpectedCloseDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setCompanyId(companies[0]?.id || '');
      setContactId(contacts[0]?.id || '');
    }
  }, [deal, isOpen, companies, contacts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const comp = companies.find(c => c.id === companyId);
      const cont = contacts.find(c => c.id === contactId);

      await onSave({
        title,
        value: Number(value),
        stage,
        probability: Number(probability),
        expectedCloseDate,
        companyId,
        companyName: comp ? comp.name : undefined,
        contactId,
        contactName: cont ? cont.name : undefined,
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
            <Briefcase className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {deal ? 'Edit Deal Opportunity' : 'Create New Deal'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deal Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Enterprise License Expansion - 50 Seats"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contract Value ($) *</label>
              <input
                type="number"
                required
                value={value}
                onChange={e => setValue(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Close Date</label>
              <input
                type="date"
                value={expectedCloseDate}
                onChange={e => setExpectedCloseDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pipeline Stage</label>
              <select
                value={stage}
                onChange={e => {
                  const s = e.target.value as DealStage;
                  setStage(s);
                  if (s === 'Closed Won') setProbability(100);
                  else if (s === 'Negotiation') setProbability(80);
                  else if (s === 'Proposal') setProbability(50);
                  else if (s === 'Discovery') setProbability(20);
                  else if (s === 'Closed Lost') setProbability(0);
                }}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="Discovery">Discovery</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Win Probability ({probability}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={probability}
                onChange={e => setProbability(Number(e.target.value))}
                className="w-full accent-emerald-600 mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Related Company</label>
              <select
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="">-- None --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Stakeholder</label>
              <select
                value={contactId}
                onChange={e => setContactId(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="">-- None --</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.companyName || 'Contact'})
                  </option>
                ))}
              </select>
            </div>
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs"
            >
              {isSaving ? 'Saving...' : deal ? 'Update Deal' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
