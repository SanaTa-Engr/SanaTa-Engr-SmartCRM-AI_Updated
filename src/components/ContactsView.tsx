import { useState } from 'react';
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  Sparkles,
  Tag,
  Edit2,
  Trash2,
  ExternalLink,
  UserCheck,
  UserX,
  FileText,
} from 'lucide-react';
import { Contact } from '../types';

interface ContactsViewProps {
  contacts: Contact[];
  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onAnalyzeContact: (contact: Contact) => void;
  onDraftEmail: (contact: Contact) => void;
  onViewDetails: (contact: Contact) => void;
}

export function ContactsView({
  contacts,
  onAddContact,
  onEditContact,
  onDeleteContact,
  onAnalyzeContact,
  onDraftEmail,
  onViewDetails,
}: ContactsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'customer' | 'lead' | 'inactive'>('all');

  const filteredContacts = contacts.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.title && c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
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
              placeholder="Search contacts by name, email, company..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({contacts.length})
            </button>
            <button
              onClick={() => setStatusFilter('customer')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                statusFilter === 'customer' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setStatusFilter('lead')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                statusFilter === 'lead' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Leads
            </button>
          </div>
        </div>

        <button
          onClick={onAddContact}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map(contact => (
          <div
            key={contact.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Header: Avatar, Name, Status */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={contact.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(contact.name)}`}
                    alt={contact.name}
                    className="w-11 h-11 rounded-xl bg-slate-100 object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div>
                    <h4
                      onClick={() => onViewDetails(contact)}
                      className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 cursor-pointer transition-colors"
                    >
                      {contact.name}
                    </h4>
                    <p className="text-xs text-slate-500">{contact.title || 'Contact'}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                    contact.status === 'customer'
                      ? 'bg-emerald-100 text-emerald-700'
                      : contact.status === 'lead'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {contact.status}
                </span>
              </div>

              {/* Company & Contact Details */}
              <div className="space-y-1.5 text-xs text-slate-600 my-3 pt-2 border-t border-slate-100">
                {contact.companyName && (
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{contact.companyName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-slate-600">{contact.email}</span>
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{contact.phone}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {contact.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onAnalyzeContact(contact)}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  title="Run AI Customer Intelligence Analysis"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Profile</span>
                </button>
                <button
                  onClick={() => onDraftEmail(contact)}
                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Draft personalized email"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditContact(contact)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  title="Edit contact"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteContact(contact.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  title="Delete contact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
