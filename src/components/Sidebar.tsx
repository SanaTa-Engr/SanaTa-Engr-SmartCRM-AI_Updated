import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  Briefcase,
  CheckSquare,
  FileText,
  Sparkles,
  BarChart3,
  Settings,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'contacts'
  | 'companies'
  | 'leads'
  | 'deals'
  | 'tasks'
  | 'notes'
  | 'ai-assistant'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  counts?: {
    activeLeads?: number;
    openDeals?: number;
    pendingTasks?: number;
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  supabaseConnected?: boolean;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  counts,
  isCollapsed,
  onToggleCollapse,
  supabaseConnected,
}: SidebarProps) {
  const navItems: { id: NavTab; label: string; icon: any; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
    {
      id: 'leads',
      label: 'Leads',
      icon: Target,
      badge: counts?.activeLeads,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'deals',
      label: 'Deals',
      icon: Briefcase,
      badge: counts?.openDeals,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: counts?.pendingTasks,
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    { id: 'notes', label: 'Notes', icon: FileText },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: Sparkles,
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`h-screen bg-slate-900 text-slate-300 flex flex-col justify-between transition-all duration-300 border-r border-slate-800 select-none z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-base tracking-tight">SmartCRM</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-400 text-[10px] font-bold leading-none">
                    AI
                  </span>
                </div>
                <span className="text-[11px] font-medium text-sky-400 tracking-wide block mt-0.5">
                  B2B SaaS Engine
                </span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
              isCollapsed ? 'hidden' : 'block'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : item.id === 'ai-assistant' ? 'text-indigo-400' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-indigo-700 text-white' : item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.id === 'ai-assistant' && !isCollapsed && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-semibold rounded border border-indigo-400/30 uppercase tracking-wider">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Database Status */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => onSelectTab('settings')}
          className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors flex items-center gap-3 text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-700/80 flex items-center justify-center shrink-0 text-emerald-400 group-hover:bg-slate-700">
            <Database className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {supabaseConnected ? 'Supabase Connected' : 'Persistent Storage'}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Live Database Active</p>
            </div>
          )}
        </button>

        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-full mt-2 py-1 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
