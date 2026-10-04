import { useState, useEffect, type FormEvent } from 'react';
import { X, Building2 } from 'lucide-react';
import { Company } from '../../types';

interface CompanyModalProps {
  company?: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Company>) => Promise<void>;
}

export function CompanyModal({ company, isOpen, onClose, onSave }: CompanyModalProps) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [size, setSize] = useState('10-50');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');
  const [annualRevenue, setAnnualRevenue] = useState(1500000);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setDomain(company.domain || '');
      setIndustry(company.industry || 'Technology');
      setSize(company.size || '10-50');
      setWebsite(company.website || '');
      setCity(company.city || '');
      setCountry(company.country || 'United States');
      setAnnualRevenue(company.annualRevenue || 1500000);
    } else {
      setName('');
      setDomain('');
      setIndustry('Technology');
      setSize('10-50');
      setWebsite('');
      setCity('');
      setCountry('United States');
      setAnnualRevenue(1500000);
    }
  }, [company, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        name,
        domain: domain || (website ? website.replace(/^https?:\/\//, '') : undefined),
        industry,
        size,
        website: website || (domain ? `https://${domain}` : undefined),
        city,
        country,
        annualRevenue: Number(annualRevenue),
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
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {company ? 'Edit Company Account' : 'Add New Company'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Acme Cloud Corp"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Industry</label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Fintech">Fintech</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Consulting">Consulting</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee Headcount</label>
              <select
                value={size}
                onChange={e => setSize(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="1-10">1-10 employees</option>
                <option value="10-50">10-50 employees</option>
                <option value="50-200">50-200 employees</option>
                <option value="200-500">200-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Annual Revenue ($)</label>
              <input
                type="number"
                value={annualRevenue}
                onChange={e => setAnnualRevenue(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
            >
              {isSaving ? 'Saving...' : company ? 'Update Company' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
