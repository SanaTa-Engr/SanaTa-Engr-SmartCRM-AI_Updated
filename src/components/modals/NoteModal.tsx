import { useState, useEffect, type FormEvent } from 'react';
import { X, FileText } from 'lucide-react';
import { Note, Lead, Deal, Contact } from '../../types';

interface NoteModalProps {
  note?: Note | null;
  leads: Lead[];
  deals: Deal[];
  contacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Note>) => Promise<void>;
}

export function NoteModal({ note, leads, deals, contacts, isOpen, onClose, onSave }: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entityType, setEntityType] = useState<'lead' | 'deal' | 'contact' | 'general'>('general');
  const [entityId, setEntityId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setEntityType((note.entityType as any) || 'general');
      setEntityId(note.entityId || '');
      setTagsInput(note.tags ? note.tags.join(', ') : '');
    } else {
      setTitle('');
      setContent('');
      setEntityType('general');
      setEntityId('');
      setTagsInput('meeting, priority');
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let entityName = '';
      if (entityType === 'lead') entityName = leads.find(l => l.id === entityId)?.name || '';
      else if (entityType === 'deal') entityName = deals.find(d => d.id === entityId)?.title || '';
      else if (entityType === 'contact') entityName = contacts.find(c => c.id === entityId)?.name || '';

      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await onSave({
        title,
        content,
        entityType,
        entityId: entityType === 'general' ? undefined : entityId,
        entityName: entityType === 'general' ? undefined : entityName,
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
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {note ? 'Edit Note' : 'Create New Note'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Note Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Call briefing regarding security compliance"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Content / Meeting Minutes *</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Record takeaways, pain points, objections, and next commitments..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Attach to Record</label>
              <select
                value={entityType}
                onChange={e => {
                  const t = e.target.value as any;
                  setEntityType(t);
                  if (t === 'lead') setEntityId(leads[0]?.id || '');
                  else if (t === 'deal') setEntityId(deals[0]?.id || '');
                  else if (t === 'contact') setEntityId(contacts[0]?.id || '');
                  else setEntityId('');
                }}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="general">General Note</option>
                <option value="lead">Sales Lead</option>
                <option value="deal">Deal Opportunity</option>
                <option value="contact">Contact Profile</option>
              </select>
            </div>

            {entityType !== 'general' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Record</label>
                <select
                  value={entityId}
                  onChange={e => setEntityId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
                >
                  {entityType === 'lead' &&
                    leads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.company})
                      </option>
                    ))}
                  {entityType === 'deal' &&
                    deals.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  {entityType === 'contact' &&
                    contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. security, procurement, demo"
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
              {isSaving ? 'Saving...' : note ? 'Update Note' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
