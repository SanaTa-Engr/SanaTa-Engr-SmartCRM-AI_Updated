import { useState } from 'react';
import { Plus, Search, FileText, Tag, Edit2, Trash2, Calendar, Building, User, Target, Briefcase } from 'lucide-react';
import { Note } from '../types';

interface NotesViewProps {
  notes: Note[];
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

export function NotesView({ notes, onAddNote, onEditNote, onDeleteNote }: NotesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const filteredNotes = notes.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.entityName && n.entityName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesEntity = entityFilter === 'all' || n.entityType === entityFilter;
    return matchesSearch && matchesEntity;
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
              placeholder="Search notes content, title, tags..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Note Types</option>
            <option value="lead">Leads</option>
            <option value="deal">Deals</option>
            <option value="contact">Contacts</option>
            <option value="company">Companies</option>
            <option value="general">General</option>
          </select>
        </div>

        <button
          onClick={onAddNote}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            No notes found. Create your first note above!
          </div>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{note.title}</h4>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {note.entityType}
                  </span>
                </div>

                <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed mb-4">
                  {note.content}
                </p>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-medium rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="truncate">
                  {note.entityName ? (
                    <span className="font-semibold text-slate-700 truncate block">Attached: {note.entityName}</span>
                  ) : (
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEditNote(note)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    title="Edit Note"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
