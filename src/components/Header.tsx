import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  User as UserIcon,
  LogOut,
  Sparkles,
  RefreshCw,
  Target,
  Briefcase,
  Users,
  CheckSquare,
  ExternalLink,
} from 'lucide-react';
import { User, Activity } from '../types';

interface HeaderProps {
  user: User | null;
  activities: Activity[];
  onOpenAddModal: (type: 'lead' | 'deal' | 'contact' | 'task') => void;
  onOpenAI: () => void;
  onSeedData: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Header({
  user,
  activities,
  onOpenAddModal,
  onOpenAI,
  onSeedData,
  onLogout,
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const addMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    await onSeedData();
    setIsSeeding(false);
    setShowUserMenu(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Search Input */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="global-crm-search-input"
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search leads, deals, contacts, companies..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-sm text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* AI Copilot shortcut button */}
        <button
          id="header-open-ai-btn"
          onClick={onOpenAI}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/80 transition-all shadow-xs"
        >
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span>AI Copilot</span>
        </button>

        {/* Quick Add Dropdown */}
        <div className="relative" ref={addMenuRef}>
          <button
            id="header-quick-add-btn"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">New Record</span>
          </button>

          {showAddMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  onOpenAddModal('lead');
                  setShowAddMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
              >
                <Target className="w-4 h-4 text-amber-500" />
                <span>New Lead</span>
              </button>
              <button
                onClick={() => {
                  onOpenAddModal('deal');
                  setShowAddMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
              >
                <Briefcase className="w-4 h-4 text-emerald-500" />
                <span>New Deal</span>
              </button>
              <button
                onClick={() => {
                  onOpenAddModal('contact');
                  setShowAddMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
              >
                <Users className="w-4 h-4 text-blue-500" />
                <span>New Contact</span>
              </button>
              <button
                onClick={() => {
                  onOpenAddModal('task');
                  setShowAddMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
              >
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                <span>New Task</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            id="header-notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors relative"
            title="Activity Notifications"
          >
            <Bell className="w-5 h-5" />
            {activities.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 absolute top-2 right-2 ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Activity Timeline</h4>
                <span className="text-xs text-slate-400">{activities.length} recent events</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 px-2 py-1">
                {activities.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">No recent activities logged</div>
                ) : (
                  activities.slice(0, 8).map(act => (
                    <div key={act.id} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                      <p className="text-xs font-medium text-slate-800 leading-snug">{act.description}</p>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(act.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            id="header-user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="text-left hidden lg:block leading-tight pr-1">
              <p className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-400 truncate max-w-[120px]">{user?.role || 'Sales Lead'}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {user?.companyName || 'SmartCRM AI Workspace'}
                </span>
              </div>

              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>{isSeeding ? 'Refreshing Demo Data...' : 'Refresh Demo Dataset'}</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
