import { useState, useEffect, type FormEvent } from 'react';
import { X, CheckSquare } from 'lucide-react';
import { Task, Lead, Deal, Contact } from '../../types';

interface TaskModalProps {
  task?: Task | null;
  leads: Lead[];
  deals: Deal[];
  contacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Task>) => Promise<void>;
}

export function TaskModal({ task, leads, deals, contacts, isOpen, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [relatedType, setRelatedType] = useState<'lead' | 'deal' | 'contact' | 'none'>('lead');
  const [relatedId, setRelatedId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setPriority(task.priority);
      setStatus(task.status);
      setRelatedType((task.relatedType as any) || 'none');
      setRelatedId(task.relatedId || '');
    } else {
      setTitle('');
      setDescription('');
      setDueDate(new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]);
      setPriority('medium');
      setStatus('pending');
      setRelatedType('lead');
      setRelatedId(leads[0]?.id || '');
    }
  }, [task, isOpen, leads]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let relatedName = '';
      if (relatedType === 'lead') {
        relatedName = leads.find(l => l.id === relatedId)?.name || '';
      } else if (relatedType === 'deal') {
        relatedName = deals.find(d => d.id === relatedId)?.title || '';
      } else if (relatedType === 'contact') {
        relatedName = contacts.find(c => c.id === relatedId)?.name || '';
      }

      await onSave({
        title,
        description,
        dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
        priority,
        status,
        relatedType: relatedType === 'none' ? undefined : relatedType,
        relatedId: relatedType === 'none' ? undefined : relatedId,
        relatedName: relatedType === 'none' ? undefined : relatedName,
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
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {task ? 'Edit Action Task' : 'Schedule New Task'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Schedule technical discovery call with CTO"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Details & Agenda</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide context or follow-up milestones..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Associated Entity</label>
              <select
                value={relatedType}
                onChange={e => {
                  const t = e.target.value as any;
                  setRelatedType(t);
                  if (t === 'lead') setRelatedId(leads[0]?.id || '');
                  else if (t === 'deal') setRelatedId(deals[0]?.id || '');
                  else if (t === 'contact') setRelatedId(contacts[0]?.id || '');
                  else setRelatedId('');
                }}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="none">General Task</option>
                <option value="lead">Sales Lead</option>
                <option value="deal">Deal Opportunity</option>
                <option value="contact">Contact Stakeholder</option>
              </select>
            </div>

            {relatedType !== 'none' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Record</label>
                <select
                  value={relatedId}
                  onChange={e => setRelatedId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
                >
                  {relatedType === 'lead' &&
                    leads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.company})
                      </option>
                    ))}
                  {relatedType === 'deal' &&
                    deals.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title} (${Number(d.value).toLocaleString()})
                      </option>
                    ))}
                  {relatedType === 'contact' &&
                    contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
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
              {isSaving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
