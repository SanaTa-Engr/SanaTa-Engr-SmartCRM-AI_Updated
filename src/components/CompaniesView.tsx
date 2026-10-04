import { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Globe,
  Phone,
  MapPin,
  DollarSign,
  Users,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Company, Contact, Deal } from '../types';

interface CompaniesViewProps {
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  onAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (id: string) => void;
  onSelectCompany: (company: Company) => void;
}

export function CompaniesView({
  companies,
  contacts,
  deals,
  onAddCompany,
  onEditCompany,
  onDeleteCompany,
  onSelectCompany,
}: CompaniesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)));

  const filteredCompanies = companies.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.domain && c.domain.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesIndustry = selectedIndustry === 'all' || c.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search companies by name, domain, city..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedIndustry}
            onChange={e => setSelectedIndustry(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Industries</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onAddCompany}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.map(company => {
          const companyContacts = contacts.filter(c => c.companyId === company.id || c.companyName === company.name);
          const companyDeals = deals.filter(d => d.companyId === company.id || d.companyName === company.name);
          const totalDealVal = companyDeals.reduce((sum, d) => sum + Number(d.value), 0);

          return (
            <div
              key={company.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {company.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4
                        onClick={() => onSelectCompany(company)}
                        className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {company.name}
                      </h4>
                      <p className="text-xs text-slate-500">{company.industry} • {company.size || '10-50'} employees</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                    ${((company.annualRevenue || 0) / 1000000).toFixed(1)}M Rev
                  </span>
                </div>

                {/* Company Details */}
                <div className="space-y-1.5 text-xs text-slate-600 my-3 pt-2 border-t border-slate-100">
                  {company.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline truncate"
                      >
                        {company.domain || company.website}
                      </a>
                    </div>
                  )}
                  {(company.city || company.country) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{[company.city, company.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Associated counts stats */}
                <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-slate-50 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Contacts</span>
                    <span className="text-xs font-bold text-slate-800">{companyContacts.length} people</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Deal Pipeline</span>
                    <span className="text-xs font-bold text-emerald-600">${(totalDealVal / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectCompany(company)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View full profile
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditCompany(company)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                    title="Edit company"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteCompany(company.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Delete company"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
