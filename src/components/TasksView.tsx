import { useState } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  AlertCircle,
  CheckSquare,
  Tag,
} from 'lucide-react';
import { Task } from '../types';

interface TasksViewProps {
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleStatus: (task: Task) => void;
}

export function TasksView({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleStatus,
}: TasksViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredTasks = tasks.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.relatedName && t.relatedName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingCount = tasks.filter(t => t.status !== 'completed').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

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
              placeholder="Search tasks or related records..."
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
              All ({tasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                statusFilter === 'pending' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                statusFilter === 'completed' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Done ({completedCount})
            </button>
          </div>
        </div>

        <button
          onClick={onAddTask}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No tasks found matching your filters.
          </div>
        ) : (
          filteredTasks.map(task => {
            const isCompleted = task.status === 'completed';
            const isOverdue = !isCompleted && new Date(task.dueDate) < new Date();

            return (
              <div
                key={task.id}
                className={`p-4 hover:bg-slate-50 transition-colors flex items-start sm:items-center justify-between gap-4 ${
                  isCompleted ? 'bg-slate-50/40 opacity-75' : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => onToggleStatus(task)}
                    className="mt-0.5 sm:mt-0 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                    title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <h4
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
                      <span
                        className={`flex items-center gap-1 font-medium ${
                          isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                        {isOverdue && <span className="text-[10px]">(Overdue)</span>}
                      </span>

                      {task.relatedName && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                          Ref: {task.relatedName} ({task.relatedType})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      task.priority === 'high'
                        ? 'bg-rose-100 text-rose-700'
                        : task.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {task.priority}
                  </span>

                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                    title="Edit task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
