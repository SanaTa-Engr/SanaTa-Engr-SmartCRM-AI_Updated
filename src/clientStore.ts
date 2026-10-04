import {
  User,
  Contact,
  Company,
  Lead,
  Deal,
  Task,
  Note,
  Activity,
  DashboardMetrics,
  SalesPipelineReport,
  DealStage,
  LeadStage,
  LeadImportRecord,
  LeadImportResult,
} from './types';
import { getSeedData } from '../server/seedData';
import { generateSmartSalesResponse } from './aiEngine';

const DEMO_USER: User = {
  id: 'usr-demo-1',
  email: 'demo@smartcrm.ai',
  name: 'Alex Morgan',
  role: 'Head of Sales',
  companyName: 'Acme SaaS Corp',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  createdAt: '2026-08-13T09:51:04.671Z',
};

class ClientStore {
  private usersKey = 'smartcrm_local_users';
  private currentUserKey = 'smartcrm_current_user';
  private contactsKey = 'smartcrm_contacts';
  private companiesKey = 'smartcrm_companies';
  private leadsKey = 'smartcrm_leads';
  private dealsKey = 'smartcrm_deals';
  private tasksKey = 'smartcrm_tasks';
  private notesKey = 'smartcrm_notes';
  private activitiesKey = 'smartcrm_activities';
  private importHistoryKey = 'smartcrm_lead_import_history';

  constructor() {
    this.initIfEmpty();
  }

  private initIfEmpty() {
    if (!localStorage.getItem(this.leadsKey)) {
      const seed = getSeedData(DEMO_USER.id);
      localStorage.setItem(this.contactsKey, JSON.stringify(seed.contacts));
      localStorage.setItem(this.companiesKey, JSON.stringify(seed.companies));
      localStorage.setItem(this.leadsKey, JSON.stringify(seed.leads));
      localStorage.setItem(this.dealsKey, JSON.stringify(seed.deals));
      localStorage.setItem(this.tasksKey, JSON.stringify(seed.tasks));
      localStorage.setItem(this.notesKey, JSON.stringify(seed.notes));
      localStorage.setItem(this.activitiesKey, JSON.stringify(seed.activities));
    }
    if (!localStorage.getItem(this.usersKey)) {
      localStorage.setItem(this.usersKey, JSON.stringify([DEMO_USER]));
    }
  }

  private getItems<T>(key: string): T[] {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  }

  private setItems<T>(key: string, items: T[]): void {
    localStorage.setItem(key, JSON.stringify(items));
  }

  // Auth
  async login(email: string, _password: string): Promise<{ user: User; token: string }> {
    this.initIfEmpty();
    const users = this.getItems<User>(this.usersKey);
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      if (email.toLowerCase() === 'demo@smartcrm.ai' || email.includes('demo')) {
        user = DEMO_USER;
      } else {
        // Automatically create account if not found for friction-free testing
        user = {
          id: 'usr-' + Math.random().toString(36).substring(2, 9),
          email,
          name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          role: 'Sales Representative',
          companyName: 'My Company',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
          createdAt: new Date().toISOString(),
        };
        users.push(user);
        this.setItems(this.usersKey, users);
      }
    }

    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
    const token = `${user.id}.client_fallback_token`;
    return { user, token };
  }

  async signup(email: string, _password: string, name: string, companyName?: string): Promise<{ user: User; token: string }> {
    this.initIfEmpty();
    const users = this.getItems<User>(this.usersKey);
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        email,
        name: name || email.split('@')[0],
        role: 'Sales Lead',
        companyName: companyName || 'My Company',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      this.setItems(this.usersKey, users);
    }

    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
    const token = `${user.id}.client_fallback_token`;
    return { user, token };
  }

  getCurrentUser(): User {
    try {
      const val = localStorage.getItem(this.currentUserKey);
      if (val) return JSON.parse(val);
    } catch {
      // ignore
    }
    return DEMO_USER;
  }

  // Dashboard Metrics
  getDashboardMetrics(): DashboardMetrics {
    this.initIfEmpty();
    const contacts = this.getItems<Contact>(this.contactsKey);
    const leads = this.getItems<Lead>(this.leadsKey);
    const deals = this.getItems<Deal>(this.dealsKey);
    const tasks = this.getItems<Task>(this.tasksKey);

    const activeLeads = leads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost').length;
    const openDeals = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
    const totalPipelineValue = deals.reduce((acc, d) => acc + d.value, 0);
    const weightedPipelineValue = Math.round(deals.reduce((acc, d) => acc + (d.value * d.probability / 100), 0));
    const closedWonValue = deals.filter(d => d.stage === 'Closed Won').reduce((acc, d) => acc + d.value, 0);
    const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const wonCount = deals.filter(d => d.stage === 'Closed Won').length;
    const winRatePercentage = deals.length > 0 ? Math.round((wonCount / deals.length) * 100) : 0;

    return {
      totalContacts: contacts.length,
      activeLeads,
      openDeals,
      totalPipelineValue,
      weightedPipelineValue,
      closedWonValue,
      pendingTasks,
      completedTasks,
      winRatePercentage,
    };
  }

  // Analytics Report
  getReportsAnalytics(): SalesPipelineReport & { totalLeads: number; totalDeals: number; totalTasks: number } {
    this.initIfEmpty();
    const deals = this.getItems<Deal>(this.dealsKey);
    const leads = this.getItems<Lead>(this.leadsKey);
    const tasks = this.getItems<Task>(this.tasksKey);

    const dealStages: DealStage[] = ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    const stageDistribution = dealStages.map(stage => {
      const matching = deals.filter(d => d.stage === stage);
      return {
        stage,
        count: matching.length,
        value: matching.reduce((sum, d) => sum + d.value, 0),
      };
    });

    const leadStages: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
    const leadFunnel = leadStages.map((stage, idx) => {
      const count = leads.filter(l => l.stage === stage).length;
      return {
        stage,
        count,
        conversionRate: Math.max(10, 100 - idx * 16),
      };
    });

    const revenueByMonth = [
      { month: 'May', won: 45000, projected: 65000 },
      { month: 'Jun', won: 78000, projected: 95000 },
      { month: 'Jul', won: 92000, projected: 110000 },
      { month: 'Aug', won: 135000, projected: 145000 },
      { month: 'Sep', won: 180000, projected: 220000 },
    ];

    const topLeadSources = [
      { source: 'Inbound Website', count: 42, wonCount: 18 },
      { source: 'Referral', count: 28, wonCount: 16 },
      { source: 'Outbound SDR', count: 35, wonCount: 9 },
      { source: 'Conference / Event', count: 19, wonCount: 8 },
    ];

    return {
      stageDistribution,
      leadFunnel,
      revenueByMonth,
      topLeadSources,
      totalLeads: leads.length,
      totalDeals: deals.length,
      totalTasks: tasks.length,
    };
  }

  // Contacts CRUD
  getContacts(): Contact[] {
    this.initIfEmpty();
    return this.getItems<Contact>(this.contactsKey);
  }

  createContact(data: Partial<Contact>): Contact {
    const contacts = this.getContacts();
    const user = this.getCurrentUser();
    const newContact: Contact = {
      id: 'cont-' + Date.now(),
      userId: user.id,
      name: data.name || 'New Contact',
      email: data.email || '',
      phone: data.phone || '',
      title: data.title || '',
      companyName: data.companyName || '',
      status: data.status || 'lead',
      tags: data.tags || ['Inbound'],
      avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name || 'Contact')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contacts.unshift(newContact);
    this.setItems(this.contactsKey, contacts);
    return newContact;
  }

  updateContact(id: string, data: Partial<Contact>): Contact {
    const contacts = this.getContacts();
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      contacts[index] = { ...contacts[index], ...data, updatedAt: new Date().toISOString() };
      this.setItems(this.contactsKey, contacts);
      return contacts[index];
    }
    return data as Contact;
  }

  deleteContact(id: string): boolean {
    const contacts = this.getContacts().filter(c => c.id !== id);
    this.setItems(this.contactsKey, contacts);
    return true;
  }

  // Companies CRUD
  getCompanies(): Company[] {
    this.initIfEmpty();
    return this.getItems<Company>(this.companiesKey);
  }

  createCompany(data: Partial<Company>): Company {
    const companies = this.getCompanies();
    const user = this.getCurrentUser();
    const newCompany: Company = {
      id: 'comp-' + Date.now(),
      userId: user.id,
      name: data.name || 'New Company',
      industry: data.industry || 'Technology',
      size: data.size || '10-50',
      phone: data.phone || '',
      website: data.website || '',
      city: data.city || 'San Francisco',
      country: data.country || 'USA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    companies.unshift(newCompany);
    this.setItems(this.companiesKey, companies);
    return newCompany;
  }

  updateCompany(id: string, data: Partial<Company>): Company {
    const companies = this.getCompanies();
    const idx = companies.findIndex(c => c.id === id);
    if (idx !== -1) {
      companies[idx] = { ...companies[idx], ...data, updatedAt: new Date().toISOString() };
      this.setItems(this.companiesKey, companies);
      return companies[idx];
    }
    return data as Company;
  }

  deleteCompany(id: string): boolean {
    const companies = this.getCompanies().filter(c => c.id !== id);
    this.setItems(this.companiesKey, companies);
    return true;
  }

  // Leads CRUD
  getLeads(): Lead[] {
    this.initIfEmpty();
    return this.getItems<Lead>(this.leadsKey);
  }

  createLead(data: Partial<Lead>): Lead {
    const leads = this.getLeads();
    const user = this.getCurrentUser();
    const newLead: Lead = {
      id: 'lead-' + Date.now(),
      userId: user.id,
      name: data.name || 'New Lead',
      email: data.email || '',
      phone: data.phone || '',
      company: data.company || '',
      title: data.title || '',
      estimatedValue: data.estimatedValue || 10000,
      stage: data.stage || 'New',
      score: data.score || 75,
      scoreReason: data.scoreReason || 'Initial assessment based on company profile and fit.',
      aiSummary: data.aiSummary || 'High-potential prospect showing strong engagement signals.',
      source: data.source || 'Website',
      address: data.address || '',
      website: data.website || '',
      mapsUrl: data.mapsUrl || '',
      mapsPlaceId: data.mapsPlaceId || '',
      category: data.category || '',
      rating: data.rating,
      userRatingsTotal: data.userRatingsTotal,
      latitude: data.latitude,
      longitude: data.longitude,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    leads.unshift(newLead);
    this.setItems(this.leadsKey, leads);
    return newLead;
  }

  updateLead(id: string, data: Partial<Lead>): Lead {
    const leads = this.getLeads();
    const idx = leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], ...data, updatedAt: new Date().toISOString() };
      this.setItems(this.leadsKey, leads);
      return leads[idx];
    }
    return data as Lead;
  }

  deleteLead(id: string): boolean {
    const leads = this.getLeads().filter(l => l.id !== id);
    this.setItems(this.leadsKey, leads);
    return true;
  }

  // Automated Lead Import
  getImportHistory(): LeadImportRecord[] {
    this.initIfEmpty();
    return this.getItems<LeadImportRecord>(this.importHistoryKey);
  }

  importLeads(payload: { filename: string; leads: Partial<Lead>[]; skipDuplicates?: boolean }): LeadImportResult {
    const { filename, leads: rawLeads, skipDuplicates = true } = payload;
    const leads = this.getLeads();
    const user = this.getCurrentUser();
    const existingEmails = new Set(leads.map(l => (l.email || '').toLowerCase().trim()).filter(Boolean));
    const seenBatchEmails = new Set<string>();

    const newLeads: Lead[] = [];
    const errors: { row: number; field?: string; message: string }[] = [];
    let skippedCount = 0;
    let invalidCount = 0;

    const validStages: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
    const validSources = ['Inbound Web', 'Outbound SDR', 'Referral', 'Partner Ecosystem', 'Conference'];

    rawLeads.forEach((raw, idx) => {
      const rowNum = idx + 1;
      const name = (raw.name || '').trim();
      const company = (raw.company || '').trim();
      const email = (raw.email || '').toLowerCase().trim();

      if (!name) {
        invalidCount++;
        errors.push({ row: rowNum, field: 'name', message: 'Missing required field: Full Name' });
        return;
      }
      if (!company) {
        invalidCount++;
        errors.push({ row: rowNum, field: 'company', message: 'Missing required field: Company Name' });
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        invalidCount++;
        errors.push({ row: rowNum, field: 'email', message: `Invalid email address format: "${email}"` });
        return;
      }

      if (email) {
        if (existingEmails.has(email)) {
          if (skipDuplicates) {
            skippedCount++;
            errors.push({ row: rowNum, field: 'email', message: `Duplicate email with existing CRM lead (${email})` });
            return;
          }
        }
        if (seenBatchEmails.has(email)) {
          if (skipDuplicates) {
            skippedCount++;
            errors.push({ row: rowNum, field: 'email', message: `Duplicate email within file (${email})` });
            return;
          }
        }
        seenBatchEmails.add(email);
      }

      let stage: LeadStage = 'New';
      if (raw.stage && validStages.includes(raw.stage as LeadStage)) {
        stage = raw.stage as LeadStage;
      }

      let source = 'Inbound Web';
      if (raw.source && validSources.includes(raw.source)) {
        source = raw.source;
      } else if (raw.source) {
        const s = raw.source.toLowerCase();
        if (s.includes('outbound') || s.includes('sdr') || s.includes('cold')) source = 'Outbound SDR';
        else if (s.includes('referral') || s.includes('mouth')) source = 'Referral';
        else if (s.includes('partner') || s.includes('alliance')) source = 'Partner Ecosystem';
        else if (s.includes('conference') || s.includes('event')) source = 'Conference';
        else source = 'Inbound Web';
      }

      const estimatedValue = Number(raw.estimatedValue) >= 0 ? Number(raw.estimatedValue) : 10000;
      const score = Number(raw.score) >= 0 && Number(raw.score) <= 100 ? Math.round(Number(raw.score)) : 70;

      const lead: Lead = {
        id: 'lead-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        userId: user.id,
        name,
        email,
        phone: (raw.phone || '').trim(),
        company,
        title: (raw.title || '').trim(),
        stage,
        estimatedValue,
        source,
        score,
        scoreReason: raw.scoreReason || `Imported from ${filename}`,
        nextAction: raw.nextAction || 'Schedule introductory qualification call',
        assignedTo: raw.assignedTo || user.name || 'You',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newLeads.push(lead);
      if (email) existingEmails.add(email);
    });

    if (newLeads.length > 0) {
      leads.unshift(...newLeads);
      this.setItems(this.leadsKey, leads);
    }

    const status = newLeads.length === rawLeads.length ? 'completed' : (newLeads.length > 0 ? 'partial' : 'failed');
    const historyRecord: LeadImportRecord = {
      id: 'imp-' + Date.now(),
      userId: user.id,
      filename,
      totalRows: rawLeads.length,
      importedCount: newLeads.length,
      skippedCount,
      invalidCount,
      status,
      errors: errors.slice(0, 50),
      createdAt: new Date().toISOString(),
    };

    const history = this.getImportHistory();
    history.unshift(historyRecord);
    this.setItems(this.importHistoryKey, history);

    this.logActivity({
      type: 'note',
      description: `Imported ${newLeads.length} leads from "${filename}" (${skippedCount} duplicates skipped)`,
      entityType: 'lead',
      entityName: `${newLeads.length} Leads`,
    });

    return {
      success: true,
      importedCount: newLeads.length,
      skippedCount,
      invalidCount,
      totalRows: rawLeads.length,
      importRecord: historyRecord,
    };
  }

  // Deals CRUD
  getDeals(): Deal[] {
    this.initIfEmpty();
    return this.getItems<Deal>(this.dealsKey);
  }

  createDeal(data: Partial<Deal>): Deal {
    const deals = this.getDeals();
    const user = this.getCurrentUser();
    const newDeal: Deal = {
      id: 'deal-' + Date.now(),
      userId: user.id,
      title: data.title || 'New Enterprise Deal',
      value: data.value || 25000,
      stage: data.stage || 'Discovery',
      probability: data.probability || 40,
      expectedCloseDate: data.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      companyName: data.companyName || 'Target Corp',
      contactName: data.contactName || 'Lead Contact',
      aiInsights: data.aiInsights || 'High win likelihood based on strong engagement.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    deals.unshift(newDeal);
    this.setItems(this.dealsKey, deals);
    return newDeal;
  }

  updateDeal(id: string, data: Partial<Deal>): Deal {
    const deals = this.getDeals();
    const idx = deals.findIndex(d => d.id === id);
    if (idx !== -1) {
      deals[idx] = { ...deals[idx], ...data, updatedAt: new Date().toISOString() };
      this.setItems(this.dealsKey, deals);
      return deals[idx];
    }
    return data as Deal;
  }

  deleteDeal(id: string): boolean {
    const deals = this.getDeals().filter(d => d.id !== id);
    this.setItems(this.dealsKey, deals);
    return true;
  }

  // Tasks CRUD
  getTasks(): Task[] {
    this.initIfEmpty();
    return this.getItems<Task>(this.tasksKey);
  }

  createTask(data: Partial<Task>): Task {
    const tasks = this.getTasks();
    const user = this.getCurrentUser();
    const newTask: Task = {
      id: 'task-' + Date.now(),
      userId: user.id,
      title: data.title || 'Follow up with prospect',
      description: data.description || '',
      dueDate: data.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      relatedType: data.relatedType || 'general',
      relatedId: data.relatedId,
      relatedName: data.relatedName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    this.setItems(this.tasksKey, tasks);
    return newTask;
  }

  updateTask(id: string, data: Partial<Task>): Task {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...data, updatedAt: new Date().toISOString() };
      this.setItems(this.tasksKey, tasks);
      return tasks[idx];
    }
    return data as Task;
  }

  deleteTask(id: string): boolean {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this.setItems(this.tasksKey, tasks);
    return true;
  }

  // Notes CRUD
  getNotes(entityType?: string, entityId?: string): Note[] {
    this.initIfEmpty();
    let notes = this.getItems<Note>(this.notesKey);
    if (entityType) notes = notes.filter(n => n.entityType === entityType);
    if (entityId) notes = notes.filter(n => n.entityId === entityId);
    return notes;
  }

  createNote(data: Partial<Note>): Note {
    const notes = this.getItems<Note>(this.notesKey);
    const user = this.getCurrentUser();
    const newNote: Note = {
      id: 'note-' + Date.now(),
      userId: user.id,
      title: data.title || 'Meeting Summary',
      content: data.content || '',
      entityType: (data.entityType as any) || 'lead',
      entityId: data.entityId || '',
      entityName: data.entityName || '',
      tags: data.tags || ['Call Notes'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    notes.unshift(newNote);
    this.setItems(this.notesKey, notes);
    return newNote;
  }

  updateNote(id: string, data: Partial<Note>): Note {
    const notes = this.getItems<Note>(this.notesKey);
    const idx = notes.findIndex(n => n.id === id);
    if (idx !== -1) {
      notes[idx] = { ...notes[idx], ...data, updatedAt: new Date().toISOString() };
      this.setItems(this.notesKey, notes);
      return notes[idx];
    }
    return data as Note;
  }

  deleteNote(id: string): boolean {
    const notes = this.getItems<Note>(this.notesKey).filter(n => n.id !== id);
    this.setItems(this.notesKey, notes);
    return true;
  }

  // Activities
  getActivities(): Activity[] {
    this.initIfEmpty();
    return this.getItems<Activity>(this.activitiesKey);
  }

  logActivity(data: Partial<Activity>): Activity {
    const activities = this.getActivities();
    const user = this.getCurrentUser();
    const newAct: Activity = {
      id: 'act-' + Date.now(),
      userId: user.id,
      type: data.type || 'note',
      description: data.description || 'Logged update in CRM',
      entityType: data.entityType || 'lead',
      entityId: data.entityId || '',
      entityName: data.entityName || '',
      createdAt: new Date().toISOString(),
    };
    activities.unshift(newAct);
    this.setItems(this.activitiesKey, activities);
    return newAct;
  }

  // AI intelligence helpers
  scoreLead(lead: Lead) {
    let score = 70;
    if (lead.estimatedValue > 50000) score += 15;
    if (lead.stage === 'Qualified' || lead.stage === 'Proposal') score += 10;
    if (lead.title?.toLowerCase().includes('director') || lead.title?.toLowerCase().includes('vp')) score += 5;
    score = Math.min(98, Math.max(40, score));

    return {
      score,
      reason: `Company budget of $${lead.estimatedValue.toLocaleString()} and decision-maker engagement signals indicate a ${score >= 80 ? 'high-probability tier' : 'healthy prospect'}.`,
      nextAction: 'Schedule technical deep dive and share customized ROI business case.',
      aiSummary: `${lead.name} from ${lead.company} is evaluating enterprise solutions for their team. Key interest revolves around automation, productivity boosts, and fast time-to-value.`,
    };
  }

  analyzeContact(contactId: string) {
    const contacts = this.getContacts();
    const contact = contacts.find(c => c.id === contactId);
    const name = contact?.name || 'Contact';
    const company = contact?.companyName || 'the client account';

    return {
      sentiment: 'positive' as const,
      summary: `${name} has been highly responsive and is the internal champion at ${company}. Prior conversations show high trust and interest in executive reporting.`,
      upsellOpportunities: [
        'Dedicated Enterprise Customer Success Manager',
        'Custom SSO and SOC2 compliance add-on package',
        'Multi-seat license expansion for EMEA sales team',
      ],
      recommendedTalkingPoints: [
        'Highlight our 99.9% uptime SLA and real-time data sync',
        'Review the pilot team’s positive workflow feedback',
        'Present the phased multi-department onboarding rollout',
      ],
    };
  }

  generateFollowUp(params: { recipientName: string; companyName: string; tone: string; context: string }) {
    const isFriendly = params.tone === 'friendly';
    return {
      subject: `Accelerating growth for ${params.companyName} | Next Steps`,
      body: `${isFriendly ? 'Hi' : 'Dear'} ${params.recipientName},

Thank you for taking the time to connect regarding ${params.companyName}. 

Based on our conversation regarding ${params.context || 'your sales automation goals'}, I put together a tailored summary showing how SmartCRM AI can deliver immediate value and visibility across your pipeline.

Would you be open to a brief 15-minute sync this Thursday to walk through the implementation outline?

Looking forward to hearing your thoughts.

Best regards,
${this.getCurrentUser().name}
${this.getCurrentUser().companyName || 'SmartCRM AI'}`,
    };
  }

  getDealInsights(dealId: string) {
    const deals = this.getDeals();
    const deal = deals.find(d => d.id === dealId);
    const title = deal?.title || 'this enterprise deal';

    return {
      winProbability: deal ? Math.min(92, deal.probability + 12) : 78,
      healthAssessment: 'healthy' as const,
      keyStrengths: [
        'Strong executive sponsorship from key stakeholders',
        'Budget allocated and approved for this quarter',
        'Clear problem-solution alignment documented in scope',
      ],
      potentialRisks: [
        'Legal review turnaround could impact targeted close date',
        'Secondary evaluation by security operations team',
      ],
      closingStrategy: `Provide a security audit questionnaire proactively and propose an executive sign-off call to lock in introductory pricing for ${title}.`,
    };
  }

  getActivitySummary() {
    const activities = this.getActivities().slice(0, 10);
    return {
      summary: `Over the past week, ${activities.length} key engagements were executed across pipeline accounts. The team logged positive responses on 3 product demos and advanced 2 enterprise proposals into closing review.`,
    };
  }

  chatWithAI(messages: { role: 'user' | 'assistant'; content: string }[]) {
    const metrics = this.getDashboardMetrics();
    const deals = this.getDeals();
    const leads = this.getLeads();
    const contacts = this.getContacts();
    const tasks = this.getTasks();
    const user = this.getCurrentUser();

    return generateSmartSalesResponse(messages, {
      metrics,
      deals,
      leads,
      contacts,
      tasks,
      userName: user.name,
      companyName: user.companyName,
    });
  }
}

export const clientStore = new ClientStore();
