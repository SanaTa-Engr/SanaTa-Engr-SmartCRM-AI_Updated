import { useState, useEffect, type FormEvent } from 'react';
import { X, Users } from 'lucide-react';
import { Contact, Company } from '../../types';

interface ContactModalProps {
  contact?: Contact | null;
  companies: Company[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Contact>) => Promise<void>;
}

export function ContactModal({ contact, companies, isOpen, onClose, onSave }: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [status, setStatus] = useState<'customer' | 'lead' | 'inactive'>('lead');
  const [tagsInput, setTagsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setEmail(contact.email);
      setPhone(contact.phone || '');
      setTitle(contact.title || '');
      setCompanyId(contact.companyId || '');
      setStatus(contact.status);
      setTagsInput(contact.tags ? contact.tags.join(', ') : '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setTitle('');
      setCompanyId(companies[0]?.id || '');
      setStatus('lead');
      setTagsInput('decision-maker, enterprise');
    }
  }, [contact, isOpen, companies]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const comp = companies.find(c => c.id === companyId);
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await onSave({
        name,
        email,
        phone,
        title,
        companyId,
        companyName: comp ? comp.name : undefined,
        status,
        tags,
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
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {contact ? 'Edit Contact Profile' : 'Add New Contact'}
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
                placeholder="e.g. Jordan Hayes"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. VP Engineering"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jordan@company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 345-6789"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company</label>
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
              <label className="block font-semibold text-slate-700 mb-1">Customer Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="lead">Lead</option>
                <option value="customer">Active Customer</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. enterprise, vip, security-evaluator"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
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
              {isSaving ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
