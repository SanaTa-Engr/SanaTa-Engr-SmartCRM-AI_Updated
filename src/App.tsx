import { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { DealsView } from './components/DealsView';
import { ContactsView } from './components/ContactsView';
import { CompaniesView } from './components/CompaniesView';
import { TasksView } from './components/TasksView';
import { NotesView } from './components/NotesView';
import { AIAssistantView } from './components/AIAssistantView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

import { LeadModal } from './components/modals/LeadModal';
import { LeadImportModal } from './components/modals/LeadImportModal';
import { DealModal } from './components/modals/DealModal';
import { ContactModal } from './components/modals/ContactModal';
import { CompanyModal } from './components/modals/CompanyModal';
import { TaskModal } from './components/modals/TaskModal';
import { NoteModal } from './components/modals/NoteModal';
import { EmailGeneratorModal } from './components/modals/EmailGeneratorModal';
import { AIAnalysisModal } from './components/modals/AIAnalysisModal';

import { api } from './api';
import { getSeedData } from '../server/seedData';
import {
  User,
  Lead,
  Deal,
  Contact,
  Company,
  Task,
  Note,
  Activity,
  DashboardMetrics,
  LeadStage,
  DealStage,
} from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // User auth state
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // CRM Data State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadImportOpen, setLeadImportOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Email generator modal
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    recipientName: string;
    companyName: string;
    stage: string;
  }>({
    isOpen: false,
    recipientName: '',
    companyName: '',
    stage: 'Proposal',
  });

  // AI analysis modal
  const [aiModal, setAiModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    type: 'contact_analysis' | 'deal_insights' | 'lead_summary';
    data: any;
  }>({
    isOpen: false,
    title: '',
    type: 'lead_summary',
    data: null,
  });

  const [isScoringId, setIsScoringId] = useState<string | null>(null);

  // Load All CRM Data
  const loadData = useCallback(async () => {
    try {
      const [
        leadsData,
        dealsData,
        contactsData,
        companiesData,
        tasksData,
        notesData,
        activitiesData,
        metricsData,
        statusData,
      ] = await Promise.all([
        api.getLeads(),
        api.getDeals(),
        api.getContacts(),
        api.getCompanies(),
        api.getTasks(),
        api.getNotes(),
        api.getActivities(),
        api.getDashboardMetrics(),
        api.getStatus(),
      ]);

      setLeads(leadsData);
      setDeals(dealsData);
      setContacts(contactsData);
      setCompanies(companiesData);
      setTasks(tasksData);
      setNotes(notesData);
      setActivities(activitiesData);
      setMetrics(metricsData);
      setDbStatus(statusData);
    } catch (err) {
      console.warn('Backend API unavailable, displaying preloaded demo data:', err);
      const seed = getSeedData('usr-demo-1');
      setLeads(seed.leads);
      setDeals(seed.deals);
      setContacts(seed.contacts);
      setCompanies(seed.companies);
      setTasks(seed.tasks);
      setNotes(seed.notes);
      setActivities(seed.activities);
      setMetrics({
        totalContacts: seed.contacts.length,
        activeLeads: seed.leads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost').length,
        openDeals: seed.deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length,
        totalPipelineValue: seed.deals.reduce((sum, d) => sum + d.value, 0),
        weightedPipelineValue: Math.round(seed.deals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0)),
        closedWonValue: seed.deals.filter(d => d.stage === 'Closed Won').reduce((sum, d) => sum + d.value, 0),
        pendingTasks: seed.tasks.filter(t => t.status !== 'completed').length,
        completedTasks: seed.tasks.filter(t => t.status === 'completed').length,
        winRatePercentage: 85,
      });
      setDbStatus({
        mode: 'demo_preview',
        supabaseConnected: false,
        totalContacts: seed.contacts.length,
        totalLeads: seed.leads.length,
        totalDeals: seed.deals.length,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth and load data
  useEffect(() => {
    async function initAuth() {
      const token = api.getToken();
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          await loadData();
          return;
        } catch {
          if (token.includes('demo') || token.startsWith('usr-')) {
            setUser({
              id: 'usr-demo-1',
              email: 'demo@smartcrm.ai',
              name: 'Alex Morgan',
              role: 'Sales Lead',
              companyName: 'Acme SaaS Corp',
              avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
              createdAt: new Date().toISOString(),
            });
            await loadData();
            return;
          }
          api.setToken(null);
        }
      }

      // Check if user explicitly logged out
      const hasLoggedOut = localStorage.getItem('smartcrm_logged_out') === 'true';
      if (!hasLoggedOut) {
        // Auto login demo user on first visit for seamless experience
        try {
          const demoLogin = await api.login('demo@smartcrm.ai', 'demopassword123');
          setUser(demoLogin.user);
          await loadData();
          return;
        } catch {
          // No action needed
        }
      }

      setUser(null);
      setShowAuthModal(true);
      setIsLoading(false);
    }
    initAuth();
  }, [loadData]);

  // Seed data trigger
  const handleSeedData = async () => {
    await api.seedData();
    await loadData();
  };

  const handleLogout = async () => {
    await api.logout();
    localStorage.setItem('smartcrm_logged_out', 'true');
    setUser(null);
    setShowAuthModal(true);
  };

  // --- Lead Actions ---
  const handleSaveLead = async (data: Partial<Lead>) => {
    if (editingLead) {
      await api.updateLead(editingLead.id, data);
    } else {
      await api.createLead(data);
    }
    setEditingLead(null);
    await loadData();
  };

  const handleDeleteLead = async (id: string) => {
    await api.deleteLead(id);
    await loadData();
  };

  const handleLeadStageChange = async (lead: Lead, newStage: LeadStage) => {
    await api.updateLead(lead.id, { stage: newStage });
    await loadData();
  };

  const handleScoreLead = async (lead: Lead) => {
    setIsScoringId(lead.id);
    try {
      const result = await api.scoreLead(lead);
      setAiModal({
        isOpen: true,
        title: `AI Scoring Analysis: ${lead.name}`,
        subtitle: `Score: ${result.score}/100 • ${lead.company}`,
        type: 'lead_summary',
        data: `Predictive Lead Score: ${result.score}/100\n\nStrategic Reason:\n${result.reason}\n\nRecommended Next Action:\n${result.nextAction}\n\nAI Summary:\n${result.aiSummary}`,
      });
      await loadData();
    } catch (err) {
      console.error('Scoring error:', err);
    } finally {
      setIsScoringId(null);
    }
  };

  const handleGenerateLeadSummary = async (lead: Lead) => {
    try {
      const res = await api.getLeadSummary(lead);
      setAiModal({
        isOpen: true,
        title: `Executive Lead Summary: ${lead.name}`,
        subtitle: `${lead.company} • ${lead.stage}`,
        type: 'lead_summary',
        data: res.summary,
      });
      await loadData();
    } catch (err) {
      console.error('Summary error:', err);
    }
  };

  // --- Deal Actions ---
  const handleSaveDeal = async (data: Partial<Deal>) => {
    if (editingDeal) {
      await api.updateDeal(editingDeal.id, data);
    } else {
      await api.createDeal(data);
    }
    setEditingDeal(null);
    await loadData();
  };

  const handleDeleteDeal = async (id: string) => {
    await api.deleteDeal(id);
    await loadData();
  };

  const handleDealStageChange = async (deal: Deal, newStage: DealStage) => {
    let prob = deal.probability;
    if (newStage === 'Closed Won') prob = 100;
    else if (newStage === 'Negotiation') prob = 80;
    else if (newStage === 'Proposal') prob = 50;
    else if (newStage === 'Discovery') prob = 20;
    else if (newStage === 'Closed Lost') prob = 0;

    await api.updateDeal(deal.id, { stage: newStage, probability: prob });
    await loadData();
  };

  const handleAnalyzeDeal = async (deal: Deal) => {
    try {
      const insights = await api.getDealInsights(deal.id);
      setAiModal({
        isOpen: true,
        title: `AI Closing Strategy: "${deal.title}"`,
        subtitle: `Value: $${Number(deal.value).toLocaleString()} • ${deal.stage}`,
        type: 'deal_insights',
        data: insights,
      });
      await loadData();
    } catch (err) {
      console.error('Deal analysis error:', err);
    }
  };

  // --- Contact Actions ---
  const handleSaveContact = async (data: Partial<Contact>) => {
    if (editingContact) {
      await api.updateContact(editingContact.id, data);
    } else {
      await api.createContact(data);
    }
    setEditingContact(null);
    await loadData();
  };

  const handleDeleteContact = async (id: string) => {
    await api.deleteContact(id);
    await loadData();
  };

  const handleAnalyzeContact = async (contact: Contact) => {
    try {
      const analysis = await api.analyzeContact(contact.id);
      setAiModal({
        isOpen: true,
        title: `AI Customer Intelligence: ${contact.name}`,
        subtitle: `${contact.title || 'Contact'} at ${contact.companyName || 'Organization'}`,
        type: 'contact_analysis',
        data: analysis,
      });
      await loadData();
    } catch (err) {
      console.error('Contact analysis error:', err);
    }
  };

  // --- Company Actions ---
  const handleSaveCompany = async (data: Partial<Company>) => {
    if (editingCompany) {
      await api.updateCompany(editingCompany.id, data);
    } else {
      await api.createCompany(data);
    }
    setEditingCompany(null);
    await loadData();
  };

  const handleDeleteCompany = async (id: string) => {
    await api.deleteCompany(id);
    await loadData();
  };

  // --- Task Actions ---
  const handleSaveTask = async (data: Partial<Task>) => {
    if (editingTask) {
      await api.updateTask(editingTask.id, data);
    } else {
      await api.createTask(data);
    }
    setEditingTask(null);
    await loadData();
  };

  const handleDeleteTask = async (id: string) => {
    await api.deleteTask(id);
    await loadData();
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await api.updateTask(task.id, { status: newStatus });
    await loadData();
  };

  // --- Note Actions ---
  const handleSaveNote = async (data: Partial<Note>) => {
    if (editingNote) {
      await api.updateNote(editingNote.id, data);
    } else {
      await api.createNote(data);
    }
    setEditingNote(null);
    await loadData();
  };

  const handleDeleteNote = async (id: string) => {
    await api.deleteNote(id);
    await loadData();
  };

  // Open Quick Add Modal
  const handleOpenAddModal = (type: 'lead' | 'deal' | 'contact' | 'task') => {
    if (type === 'lead') {
      setEditingLead(null);
      setLeadModalOpen(true);
    } else if (type === 'deal') {
      setEditingDeal(null);
      setDealModalOpen(true);
    } else if (type === 'contact') {
      setEditingContact(null);
      setContactModalOpen(true);
    } else if (type === 'task') {
      setEditingTask(null);
      setTaskModalOpen(true);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        counts={{
          activeLeads: metrics?.activeLeads,
          openDeals: metrics?.openDeals,
          pendingTasks: metrics?.pendingTasks,
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        supabaseConnected={dbStatus?.mode === 'supabase'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header
          user={user}
          activities={activities}
          onOpenAddModal={handleOpenAddModal}
          onOpenAI={() => setCurrentTab('ai-assistant')}
          onSeedData={handleSeedData}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                leads={leads}
                deals={deals}
                tasks={tasks}
                activities={activities}
                onNavigate={setCurrentTab}
                onSelectLead={lead => {
                  setEditingLead(lead);
                  setLeadModalOpen(true);
                }}
                onSelectDeal={deal => {
                  setEditingDeal(deal);
                  setDealModalOpen(true);
                }}
                onOpenAI={() => setCurrentTab('ai-assistant')}
              />
            )}

            {currentTab === 'contacts' && (
              <ContactsView
                contacts={contacts}
                onAddContact={() => {
                  setEditingContact(null);
                  setContactModalOpen(true);
                }}
                onEditContact={contact => {
                  setEditingContact(contact);
                  setContactModalOpen(true);
                }}
                onDeleteContact={handleDeleteContact}
                onAnalyzeContact={handleAnalyzeContact}
                onDraftEmail={contact => {
                  setEmailModal({
                    isOpen: true,
                    recipientName: contact.name,
                    companyName: contact.companyName || 'your company',
                    stage: contact.status === 'customer' ? 'Customer Retention' : 'Qualification',
                  });
                }}
                onViewDetails={contact => {
                  setEditingContact(contact);
                  setContactModalOpen(true);
                }}
              />
            )}

            {currentTab === 'companies' && (
              <CompaniesView
                companies={companies}
                contacts={contacts}
                deals={deals}
                onAddCompany={() => {
                  setEditingCompany(null);
                  setCompanyModalOpen(true);
                }}
                onEditCompany={company => {
                  setEditingCompany(company);
                  setCompanyModalOpen(true);
                }}
                onDeleteCompany={handleDeleteCompany}
                onSelectCompany={company => {
                  setEditingCompany(company);
                  setCompanyModalOpen(true);
                }}
              />
            )}

            {currentTab === 'leads' && (
              <LeadsView
                leads={leads}
                onAddLead={() => {
                  setEditingLead(null);
                  setLeadModalOpen(true);
                }}
                onLeadCreated={async (newLead) => {
                  setLeads(prev => [newLead, ...prev.filter(l => l.id !== newLead.id)]);
                  await loadData();
                }}
                onOpenImport={() => setLeadImportOpen(true)}
                onEditLead={lead => {
                  setEditingLead(lead);
                  setLeadModalOpen(true);
                }}
                onDeleteLead={handleDeleteLead}
                onStageChange={handleLeadStageChange}
                onScoreLead={handleScoreLead}
                onGenerateSummary={handleGenerateLeadSummary}
                onDraftEmail={lead => {
                  setEmailModal({
                    isOpen: true,
                    recipientName: lead.name,
                    companyName: lead.company,
                    stage: lead.stage,
                  });
                }}
                isScoringId={isScoringId}
              />
            )}

            {currentTab === 'deals' && (
              <DealsView
                deals={deals}
                onAddDeal={() => {
                  setEditingDeal(null);
                  setDealModalOpen(true);
                }}
                onEditDeal={deal => {
                  setEditingDeal(deal);
                  setDealModalOpen(true);
                }}
                onDeleteDeal={handleDeleteDeal}
                onStageChange={handleDealStageChange}
                onAnalyzeDeal={handleAnalyzeDeal}
              />
            )}

            {currentTab === 'tasks' && (
              <TasksView
                tasks={tasks}
                onAddTask={() => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                }}
                onEditTask={task => {
                  setEditingTask(task);
                  setTaskModalOpen(true);
                }}
                onDeleteTask={handleDeleteTask}
                onToggleStatus={handleToggleTaskStatus}
              />
            )}

            {currentTab === 'notes' && (
              <NotesView
                notes={notes}
                onAddNote={() => {
                  setEditingNote(null);
                  setNoteModalOpen(true);
                }}
                onEditNote={note => {
                  setEditingNote(note);
                  setNoteModalOpen(true);
                }}
                onDeleteNote={handleDeleteNote}
              />
            )}

            {currentTab === 'ai-assistant' && <AIAssistantView />}

            {currentTab === 'reports' && <ReportsView deals={deals} leads={leads} />}

            {currentTab === 'settings' && <SettingsView user={user} onRefreshData={loadData} />}
          </div>
        </main>
      </div>

      {/* Modals */}
      <LeadModal
        isOpen={leadModalOpen}
        lead={editingLead}
        onClose={() => setLeadModalOpen(false)}
        onSave={handleSaveLead}
      />

      <LeadImportModal
        isOpen={leadImportOpen}
        existingLeads={leads}
        onClose={() => setLeadImportOpen(false)}
        onImportSuccess={async () => {
          await loadData();
        }}
      />

      <DealModal
        isOpen={dealModalOpen}
        deal={editingDeal}
        companies={companies}
        contacts={contacts}
        onClose={() => setDealModalOpen(false)}
        onSave={handleSaveDeal}
      />

      <ContactModal
        isOpen={contactModalOpen}
        contact={editingContact}
        companies={companies}
        onClose={() => setContactModalOpen(false)}
        onSave={handleSaveContact}
      />

      <CompanyModal
        isOpen={companyModalOpen}
        company={editingCompany}
        onClose={() => setCompanyModalOpen(false)}
        onSave={handleSaveCompany}
      />

      <TaskModal
        isOpen={taskModalOpen}
        task={editingTask}
        leads={leads}
        deals={deals}
        contacts={contacts}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
      />

      <NoteModal
        isOpen={noteModalOpen}
        note={editingNote}
        leads={leads}
        deals={deals}
        contacts={contacts}
        onClose={() => setNoteModalOpen(false)}
        onSave={handleSaveNote}
      />

      <EmailGeneratorModal
        isOpen={emailModal.isOpen}
        defaultRecipient={emailModal.recipientName}
        defaultCompany={emailModal.companyName}
        defaultStage={emailModal.stage}
        onClose={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
      />

      <AIAnalysisModal
        isOpen={aiModal.isOpen}
        title={aiModal.title}
        subtitle={aiModal.subtitle}
        type={aiModal.type}
        data={aiModal.data}
        onClose={() => setAiModal(prev => ({ ...prev, isOpen: false }))}
      />

      {showAuthModal && (
        <AuthModal
          onSuccess={async () => {
            setShowAuthModal(false);
            const res = await api.getMe();
            setUser(res.user);
            await loadData();
          }}
        />
      )}
    </div>
  );
}
