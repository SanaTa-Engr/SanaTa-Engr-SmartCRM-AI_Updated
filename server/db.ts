import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Contact, Company, Lead, Deal, Task, Note, Activity, LeadImportRecord, LeadImportResult, LeadStage } from '../src/types';
import { getSeedData } from './seedData';

interface UserRecord extends User {
  passwordHash: string;
  salt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  companies: Company[];
  contacts: Contact[];
  leads: Lead[];
  deals: Deal[];
  tasks: Task[];
  notes: Note[];
  activities: Activity[];
  leadImportHistory?: LeadImportRecord[];
}

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const DATA_DIR = IS_SERVERLESS ? path.join('/tmp', 'crm-data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'crm-db.json');

class DatabaseService {
  private db: DatabaseSchema = {
    users: [],
    companies: [],
    contacts: [],
    leads: [],
    deals: [],
    tasks: [],
    notes: [],
    activities: [],
  };

  private supabase: SupabaseClient | null = null;
  private isSupabaseConfigured: boolean = false;

  constructor() {
    this.initStorage();
    this.initSupabase();
    this.ensureDefaultData();
  }

  private initStorage() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
        // Ensure arrays exist
        this.db.users = this.db.users || [];
        this.db.companies = this.db.companies || [];
        this.db.contacts = this.db.contacts || [];
        this.db.leads = this.db.leads || [];
        this.db.deals = this.db.deals || [];
        this.db.tasks = this.db.tasks || [];
        this.db.notes = this.db.notes || [];
        this.db.activities = this.db.activities || [];
        this.db.leadImportHistory = this.db.leadImportHistory || [];
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Failed to load database file, initializing clean state:', err);
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  private initSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key && url.startsWith('http')) {
      try {
        this.supabase = createClient(url, key);
        this.isSupabaseConfigured = true;
        console.log('Supabase client initialized with endpoint:', url);
        this.syncFromSupabase();
      } catch (e) {
        console.warn('Supabase initialization failed:', e);
      }
    }
  }

  private async syncFromSupabase() {
    if (!this.supabase) return;
    try {
      const { data: remoteUsers, error: usersErr } = await this.supabase.from('users').select('*').limit(100);
      if (!usersErr && remoteUsers && remoteUsers.length > 0) {
        console.log(`Synchronized ${remoteUsers.length} users from Supabase`);
        for (const ru of remoteUsers) {
          if (!this.db.users.some(u => u.id === ru.id || u.email.toLowerCase() === ru.email.toLowerCase())) {
            this.db.users.push({
              id: ru.id,
              email: ru.email,
              name: ru.name,
              role: ru.role || 'Sales Lead',
              companyName: ru.company_name || 'SmartCRM Cloud',
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(ru.name)}`,
              createdAt: ru.created_at || new Date().toISOString(),
              passwordHash: ru.password_hash || '',
              salt: '',
            });
          }
        }
        this.save();
      }
    } catch (err: any) {
      console.log('Supabase tables ready for migration:', err?.message || 'Remote connected');
    }
  }

  private async syncToSupabase(table: string, action: 'insert' | 'update' | 'delete', payload: any) {
    if (!this.isSupabaseConfigured || !this.supabase) return;
    try {
      if (action === 'insert') {
        const { error } = await this.supabase.from(table).upsert(payload);
        if (error) console.warn(`Supabase ${table} sync note:`, error.message);
      } else if (action === 'update') {
        const { id, ...rest } = payload;
        const { error } = await this.supabase.from(table).update(rest).eq('id', id);
        if (error) console.warn(`Supabase ${table} update note:`, error.message);
      } else if (action === 'delete') {
        const { error } = await this.supabase.from(table).delete().eq('id', payload.id);
        if (error) console.warn(`Supabase ${table} delete note:`, error.message);
      }
    } catch (err: any) {
      console.warn(`Supabase ${table} ${action} handled:`, err?.message);
    }
  }

  public getStatus() {
    return {
      mode: this.isSupabaseConfigured ? 'supabase_hybrid' : 'embedded_persistent_db',
      supabaseConnected: this.isSupabaseConfigured,
      supabaseUrl: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/:\/\/.*@/, '://***@') : null,
      totalUsers: this.db.users.length,
      totalContacts: this.db.contacts.length,
      totalCompanies: this.db.companies.length,
      totalLeads: this.db.leads.length,
      totalDeals: this.db.deals.length,
      totalTasks: this.db.tasks.length,
      totalNotes: this.db.notes.length,
      totalActivities: this.db.activities.length,
    };
  }

  // --- Auth & User Management ---
  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  public createUser(email: string, password: string, name: string, companyName?: string): { user: User; token: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = this.db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('A user with this email address already exists');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);
    const id = 'usr-' + crypto.randomUUID();

    const newUser: UserRecord = {
      id,
      email: normalizedEmail,
      name: name.trim(),
      role: 'Sales Lead',
      companyName: companyName || 'SmartCRM Cloud',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString(),
      passwordHash,
      salt,
    };

    this.db.users.push(newUser);
    this.save();
    this.syncToSupabase('users', 'insert', {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      company_name: newUser.companyName,
      created_at: newUser.createdAt,
      password_hash: newUser.passwordHash,
    });

    // Auto seed demo data for the newly registered user
    this.seedUserData(id);

    const token = this.generateToken(newUser);
    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    return { user: safeUser, token };
  }

  public authenticate(email: string, password: string): { user: User; token: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const user = this.db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const hash = this.hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    const { passwordHash: _, salt: __, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public verifyToken(token: string): User | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;
      const [userId, hash] = parts;
      const user = this.db.users.find(u => u.id === userId);
      if (!user) return null;

      const expected = crypto.createHmac('sha256', 'smartcrm_secret_key_2026').update(userId).digest('hex').slice(0, 32);
      if (hash !== expected) return null;

      const { passwordHash: _, salt: __, ...safeUser } = user;
      return safeUser;
    } catch {
      return null;
    }
  }

  private generateToken(user: UserRecord): string {
    const sig = crypto.createHmac('sha256', 'smartcrm_secret_key_2026').update(user.id).digest('hex').slice(0, 32);
    return `${user.id}.${sig}`;
  }

  public getUserById(id: string): User | null {
    const user = this.db.users.find(u => u.id === id);
    if (!user) return null;
    const { passwordHash: _, salt: __, ...safeUser } = user;
    return safeUser;
  }

  private ensureDefaultData() {
    if (this.db.users.length === 0) {
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = this.hashPassword('demopassword123', salt);
      const demoUser: UserRecord = {
        id: 'usr-demo-1',
        email: 'demo@smartcrm.ai',
        name: 'Alex Morgan',
        role: 'Head of Sales',
        companyName: 'Acme SaaS Corp',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        passwordHash,
        salt,
      };
      this.db.users.push(demoUser);
      this.save();
      this.seedUserData(demoUser.id);
    }
  }

  public seedUserData(userId: string) {
    // Remove existing data for this user
    this.db.companies = this.db.companies.filter(c => c.userId !== userId);
    this.db.contacts = this.db.contacts.filter(c => c.userId !== userId);
    this.db.leads = this.db.leads.filter(l => l.userId !== userId);
    this.db.deals = this.db.deals.filter(d => d.userId !== userId);
    this.db.tasks = this.db.tasks.filter(t => t.userId !== userId);
    this.db.notes = this.db.notes.filter(n => n.userId !== userId);
    this.db.activities = this.db.activities.filter(a => a.userId !== userId);

    const seed = getSeedData(userId);
    this.db.companies.push(...seed.companies);
    this.db.contacts.push(...seed.contacts);
    this.db.leads.push(...seed.leads);
    this.db.deals.push(...seed.deals);
    this.db.tasks.push(...seed.tasks);
    this.db.notes.push(...seed.notes);
    this.db.activities.push(...seed.activities);

    this.save();

    if (this.isSupabaseConfigured && this.supabase) {
      setTimeout(async () => {
        try {
          for (const c of seed.companies) {
            await this.syncToSupabase('companies', 'insert', {
              id: c.id,
              user_id: c.userId,
              name: c.name,
              domain: c.domain,
              industry: c.industry,
              size: c.size,
              phone: c.phone,
              website: c.website,
              address: c.address,
              city: c.city,
              country: c.country,
              annual_revenue: c.annualRevenue,
              created_at: c.createdAt,
            });
          }
          for (const cont of seed.contacts) {
            await this.syncToSupabase('contacts', 'insert', {
              id: cont.id,
              user_id: cont.userId,
              company_id: cont.companyId,
              company_name: cont.companyName,
              name: cont.name,
              email: cont.email,
              phone: cont.phone,
              title: cont.title,
              status: cont.status,
              tags: cont.tags,
              source: cont.source,
              created_at: cont.createdAt,
            });
          }
          for (const l of seed.leads) {
            await this.syncToSupabase('leads', 'insert', {
              id: l.id,
              user_id: l.userId,
              name: l.name,
              email: l.email,
              phone: l.phone,
              company: l.company,
              title: l.title,
              stage: l.stage,
              estimated_value: l.estimatedValue,
              source: l.source,
              score: l.score,
              score_reason: l.scoreReason,
              next_action: l.nextAction,
              ai_summary: l.aiSummary,
              created_at: l.createdAt,
            });
          }
          for (const d of seed.deals) {
            await this.syncToSupabase('deals', 'insert', {
              id: d.id,
              user_id: d.userId,
              title: d.title,
              value: d.value,
              stage: d.stage,
              probability: d.probability,
              expected_close_date: d.expectedCloseDate,
              contact_id: d.contactId,
              contact_name: d.contactName,
              company_id: d.companyId,
              company_name: d.companyName,
              ai_insights: d.aiInsights,
              created_at: d.createdAt,
            });
          }
        } catch (e) {
          console.warn('Seed sync warning:', e);
        }
      }, 0);
    }

    return seed;
  }

  // --- Companies CRUD ---
  public getCompanies(userId: string): Company[] {
    return this.db.companies.filter(c => c.userId === userId).map(comp => {
      const contactsCount = this.db.contacts.filter(c => c.userId === userId && c.companyId === comp.id).length;
      const activeDealsCount = this.db.deals.filter(d => d.userId === userId && d.companyId === comp.id && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
      return { ...comp, contactsCount, activeDealsCount };
    });
  }

  public getCompany(userId: string, id: string): Company | null {
    const comp = this.db.companies.find(c => c.userId === userId && c.id === id);
    if (!comp) return null;
    const contactsCount = this.db.contacts.filter(c => c.userId === userId && c.companyId === comp.id).length;
    const activeDealsCount = this.db.deals.filter(d => d.userId === userId && d.companyId === comp.id && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
    return { ...comp, contactsCount, activeDealsCount };
  }

  public createCompany(userId: string, data: Omit<Company, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Company {
    const newComp: Company = {
      ...data,
      id: 'comp-' + crypto.randomUUID().slice(0, 8),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.companies.unshift(newComp);
    this.logActivity(userId, 'note', `Created new company: ${newComp.name}`, 'general', newComp.id, newComp.name);
    this.save();
    this.syncToSupabase('companies', 'insert', {
      id: newComp.id,
      user_id: newComp.userId,
      name: newComp.name,
      domain: newComp.domain,
      industry: newComp.industry,
      size: newComp.size,
      phone: newComp.phone,
      website: newComp.website,
      address: newComp.address,
      city: newComp.city,
      country: newComp.country,
      annual_revenue: newComp.annualRevenue,
      created_at: newComp.createdAt,
    });
    return newComp;
  }

  public updateCompany(userId: string, id: string, data: Partial<Company>): Company {
    const index = this.db.companies.findIndex(c => c.userId === userId && c.id === id);
    if (index === -1) throw new Error('Company not found');
    const updated = {
      ...this.db.companies[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.db.companies[index] = updated;
    this.save();
    this.syncToSupabase('companies', 'update', {
      id: updated.id,
      name: updated.name,
      domain: updated.domain,
      industry: updated.industry,
      size: updated.size,
      phone: updated.phone,
      website: updated.website,
      address: updated.address,
      city: updated.city,
      country: updated.country,
      annual_revenue: updated.annualRevenue,
    });
    return updated;
  }

  public deleteCompany(userId: string, id: string): boolean {
    const initialLen = this.db.companies.length;
    this.db.companies = this.db.companies.filter(c => !(c.userId === userId && c.id === id));
    // Nullify companyId in contacts and deals
    this.db.contacts.forEach(c => {
      if (c.userId === userId && c.companyId === id) {
        c.companyId = undefined;
        c.companyName = undefined;
      }
    });
    this.db.deals.forEach(d => {
      if (d.userId === userId && d.companyId === id) {
        d.companyId = undefined;
        d.companyName = undefined;
      }
    });
    this.save();
    this.syncToSupabase('companies', 'delete', { id });
    return this.db.companies.length < initialLen;
  }

  // --- Contacts CRUD ---
  public getContacts(userId: string): Contact[] {
    return this.db.contacts.filter(c => c.userId === userId).map(contact => {
      const notesCount = this.db.notes.filter(n => n.userId === userId && n.entityId === contact.id).length;
      const dealsCount = this.db.deals.filter(d => d.userId === userId && d.contactId === contact.id).length;
      return { ...contact, notesCount, dealsCount };
    });
  }

  public getContact(userId: string, id: string): Contact | null {
    const contact = this.db.contacts.find(c => c.userId === userId && c.id === id);
    if (!contact) return null;
    const notesCount = this.db.notes.filter(n => n.userId === userId && n.entityId === contact.id).length;
    const dealsCount = this.db.deals.filter(d => d.userId === userId && d.contactId === contact.id).length;
    return { ...contact, notesCount, dealsCount };
  }

  public createContact(userId: string, data: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Contact {
    let companyName = data.companyName;
    if (data.companyId && !companyName) {
      const comp = this.db.companies.find(c => c.id === data.companyId);
      if (comp) companyName = comp.name;
    }

    const newContact: Contact = {
      ...data,
      companyName,
      id: 'cont-' + crypto.randomUUID().slice(0, 8),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.contacts.unshift(newContact);
    this.logActivity(userId, 'note', `Added new contact: ${newContact.name} (${newContact.title || 'Contact'})`, 'contact', newContact.id, newContact.name);
    this.save();
    this.syncToSupabase('contacts', 'insert', {
      id: newContact.id,
      user_id: newContact.userId,
      company_id: newContact.companyId,
      company_name: newContact.companyName,
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      title: newContact.title,
      status: newContact.status,
      tags: newContact.tags,
      source: newContact.source,
      created_at: newContact.createdAt,
    });
    return newContact;
  }

  public updateContact(userId: string, id: string, data: Partial<Contact>): Contact {
    const index = this.db.contacts.findIndex(c => c.userId === userId && c.id === id);
    if (index === -1) throw new Error('Contact not found');

    let companyName = data.companyName !== undefined ? data.companyName : this.db.contacts[index].companyName;
    if (data.companyId) {
      const comp = this.db.companies.find(c => c.id === data.companyId);
      if (comp) companyName = comp.name;
    }

    const updated = {
      ...this.db.contacts[index],
      ...data,
      companyName,
      updatedAt: new Date().toISOString(),
    };
    this.db.contacts[index] = updated;
    this.save();
    this.syncToSupabase('contacts', 'update', {
      id: updated.id,
      company_id: updated.companyId,
      company_name: updated.companyName,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      title: updated.title,
      status: updated.status,
      tags: updated.tags,
      source: updated.source,
    });
    return updated;
  }

  public deleteContact(userId: string, id: string): boolean {
    const initialLen = this.db.contacts.length;
    this.db.contacts = this.db.contacts.filter(c => !(c.userId === userId && c.id === id));
    this.save();
    this.syncToSupabase('contacts', 'delete', { id });
    return this.db.contacts.length < initialLen;
  }

  // --- Leads CRUD ---
  public getLeads(userId: string): Lead[] {
    return this.db.leads.filter(l => l.userId === userId);
  }

  public getLead(userId: string, id: string): Lead | null {
    return this.db.leads.find(l => l.userId === userId && l.id === id) || null;
  }

  public createLead(userId: string, data: Omit<Lead, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Lead {
    const newLead: Lead = {
      ...data,
      id: 'lead-' + crypto.randomUUID().slice(0, 8),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.leads.unshift(newLead);
    this.logActivity(userId, 'note', `Created new lead: ${newLead.name} (${newLead.company}) - Stage: ${newLead.stage}`, 'lead', newLead.id, newLead.name);
    this.save();
    this.syncToSupabase('leads', 'insert', {
      id: newLead.id,
      user_id: newLead.userId,
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone,
      company: newLead.company,
      title: newLead.title,
      stage: newLead.stage,
      estimated_value: newLead.estimatedValue,
      source: newLead.source,
      score: newLead.score,
      score_reason: newLead.scoreReason,
      next_action: newLead.nextAction,
      ai_summary: newLead.aiSummary,
      created_at: newLead.createdAt,
    });
    return newLead;
  }

  public updateLead(userId: string, id: string, data: Partial<Lead>): Lead {
    const index = this.db.leads.findIndex(l => l.userId === userId && l.id === id);
    if (index === -1) throw new Error('Lead not found');

    const prevStage = this.db.leads[index].stage;
    const updated = {
      ...this.db.leads[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (data.stage && data.stage !== prevStage) {
      this.logActivity(
        userId,
        'stage_change',
        `Moved lead ${updated.name} from ${prevStage} to ${data.stage}`,
        'lead',
        updated.id,
        updated.name
      );
    }

    this.db.leads[index] = updated;
    this.save();
    this.syncToSupabase('leads', 'update', {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      company: updated.company,
      title: updated.title,
      stage: updated.stage,
      estimated_value: updated.estimatedValue,
      source: updated.source,
      score: updated.score,
      score_reason: updated.scoreReason,
      next_action: updated.nextAction,
      ai_summary: updated.aiSummary,
    });
    return updated;
  }

  public deleteLead(userId: string, id: string): boolean {
    const initialLen = this.db.leads.length;
    this.db.leads = this.db.leads.filter(l => !(l.userId === userId && l.id === id));
    this.save();
    this.syncToSupabase('leads', 'delete', { id });
    return this.db.leads.length < initialLen;
  }

  // --- Automated Lead Import & History ---
  public getImportHistory(userId: string): LeadImportRecord[] {
    return (this.db.leadImportHistory || [])
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async importLeads(
    userId: string,
    payload: {
      filename: string;
      leads: Array<Partial<Lead>>;
      skipDuplicates?: boolean;
    }
  ): Promise<LeadImportResult> {
    const { filename, leads: rawLeads, skipDuplicates = true } = payload;
    const existingLeads = this.getLeads(userId);
    const existingEmails = new Set(existingLeads.map(l => (l.email || '').toLowerCase().trim()).filter(Boolean));
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

      // Required fields check
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

      // Email format check
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        invalidCount++;
        errors.push({ row: rowNum, field: 'email', message: `Invalid email address format: "${email}"` });
        return;
      }

      // Duplicate detection
      if (email) {
        if (existingEmails.has(email)) {
          if (skipDuplicates) {
            skippedCount++;
            errors.push({ row: rowNum, field: 'email', message: `Duplicate email: Lead already exists in CRM with email "${email}"` });
            return;
          }
        }
        if (seenBatchEmails.has(email)) {
          if (skipDuplicates) {
            skippedCount++;
            errors.push({ row: rowNum, field: 'email', message: `Duplicate email: Duplicate lead found within import file for "${email}"` });
            return;
          }
        }
        seenBatchEmails.add(email);
      }

      // Stage normalization
      let stage: LeadStage = 'New';
      if (raw.stage && validStages.includes(raw.stage as LeadStage)) {
        stage = raw.stage as LeadStage;
      }

      // Source normalization matching supported sources:
      // Inbound Web, Outbound SDR, Referral, Partner Ecosystem, Conference
      let source = 'Inbound Web';
      if (raw.source && validSources.includes(raw.source)) {
        source = raw.source;
      } else if (raw.source) {
        const s = raw.source.toLowerCase();
        if (s.includes('outbound') || s.includes('sdr') || s.includes('cold') || s.includes('prospect')) {
          source = 'Outbound SDR';
        } else if (s.includes('referral') || s.includes('mouth') || s.includes('friend')) {
          source = 'Referral';
        } else if (s.includes('partner') || s.includes('ecosystem') || s.includes('alliance') || s.includes('affiliate')) {
          source = 'Partner Ecosystem';
        } else if (s.includes('conference') || s.includes('event') || s.includes('summit') || s.includes('expo') || s.includes('trade show')) {
          source = 'Conference';
        } else {
          source = 'Inbound Web';
        }
      }

      // Value & Score
      const estimatedValue = Number(raw.estimatedValue) >= 0 ? Number(raw.estimatedValue) : 0;
      const score = Number(raw.score) >= 0 && Number(raw.score) <= 100 ? Math.round(Number(raw.score)) : 50;

      const lead: Lead = {
        id: 'lead-' + crypto.randomUUID().slice(0, 8),
        userId,
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
        assignedTo: raw.assignedTo || 'You',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newLeads.push(lead);
      if (email) existingEmails.add(email);
    });

    // Add new leads to local/embedded database
    if (newLeads.length > 0) {
      this.db.leads.unshift(...newLeads);
    }

    // Sync to Supabase in batch if configured
    if (this.isSupabaseConfigured && this.supabase && newLeads.length > 0) {
      try {
        const supabaseRows = newLeads.map(l => ({
          id: l.id,
          user_id: l.userId,
          name: l.name,
          email: l.email,
          phone: l.phone,
          company: l.company,
          title: l.title,
          stage: l.stage,
          estimated_value: l.estimatedValue,
          source: l.source,
          score: l.score,
          score_reason: l.scoreReason,
          next_action: l.nextAction,
          created_at: l.createdAt,
        }));
        const { error } = await this.supabase.from('leads').upsert(supabaseRows);
        if (error) console.warn('Supabase batch lead import sync note:', error.message);
      } catch (err: any) {
        console.warn('Supabase batch import error:', err?.message);
      }
    }

    // Create import history record
    const status = newLeads.length === rawLeads.length
      ? 'completed'
      : newLeads.length > 0
      ? 'partial'
      : 'failed';

    const historyRecord: LeadImportRecord = {
      id: 'imp-' + crypto.randomUUID().slice(0, 8),
      userId,
      filename,
      totalRows: rawLeads.length,
      importedCount: newLeads.length,
      skippedCount,
      invalidCount,
      status,
      errors: errors.slice(0, 50),
      createdAt: new Date().toISOString(),
    };

    this.db.leadImportHistory = this.db.leadImportHistory || [];
    this.db.leadImportHistory.unshift(historyRecord);

    // Sync history record to Supabase
    if (this.isSupabaseConfigured && this.supabase) {
      this.syncToSupabase('lead_import_history', 'insert', {
        id: historyRecord.id,
        user_id: historyRecord.userId,
        filename: historyRecord.filename,
        total_rows: historyRecord.totalRows,
        imported_count: historyRecord.importedCount,
        skipped_count: historyRecord.skippedCount,
        invalid_count: historyRecord.invalidCount,
        status: historyRecord.status,
        errors: historyRecord.errors,
        created_at: historyRecord.createdAt,
      });
    }

    // Log Activity in Timeline
    this.logActivity(
      userId,
      'note',
      `Imported ${newLeads.length} leads from "${filename}" (${skippedCount} duplicates skipped, ${invalidCount} invalid rows skipped)`,
      'lead',
      newLeads[0]?.id,
      `${newLeads.length} Leads`,
      { filename, importedCount: newLeads.length, skippedCount, invalidCount }
    );

    this.save();

    return {
      success: true,
      importedCount: newLeads.length,
      skippedCount,
      invalidCount,
      totalRows: rawLeads.length,
      importRecord: historyRecord,
    };
  }

  // --- Deals CRUD ---
  public getDeals(userId: string): Deal[] {
    return this.db.deals.filter(d => d.userId === userId).map(deal => {
      const notesCount = this.db.notes.filter(n => n.userId === userId && n.entityId === deal.id).length;
      return { ...deal, notesCount };
    });
  }

  public getDeal(userId: string, id: string): Deal | null {
    const deal = this.db.deals.find(d => d.userId === userId && d.id === id);
    if (!deal) return null;
    const notesCount = this.db.notes.filter(n => n.userId === userId && n.entityId === deal.id).length;
    return { ...deal, notesCount };
  }

  public createDeal(userId: string, data: Omit<Deal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Deal {
    let companyName = data.companyName;
    if (data.companyId && !companyName) {
      const comp = this.db.companies.find(c => c.id === data.companyId);
      if (comp) companyName = comp.name;
    }

    let contactName = data.contactName;
    if (data.contactId && !contactName) {
      const cont = this.db.contacts.find(c => c.id === data.contactId);
      if (cont) contactName = cont.name;
    }

    const newDeal: Deal = {
      ...data,
      companyName,
      contactName,
      id: 'deal-' + crypto.randomUUID().slice(0, 8),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.deals.unshift(newDeal);
    this.logActivity(userId, 'note', `Created new deal: "${newDeal.title}" valued at $${newDeal.value.toLocaleString()}`, 'deal', newDeal.id, newDeal.title);
    this.save();
    this.syncToSupabase('deals', 'insert', {
      id: newDeal.id,
      user_id: newDeal.userId,
      title: newDeal.title,
      value: newDeal.value,
      stage: newDeal.stage,
      probability: newDeal.probability,
      expected_close_date: newDeal.expectedCloseDate,
      contact_id: newDeal.contactId,
      contact_name: newDeal.contactName,
      company_id: newDeal.companyId,
      company_name: newDeal.companyName,
      ai_insights: newDeal.aiInsights,
      created_at: newDeal.createdAt,
    });
    return newDeal;
  }

  public updateDeal(userId: string, id: string, data: Partial<Deal>): Deal {
    const index = this.db.deals.findIndex(d => d.userId === userId && d.id === id);
    if (index === -1) throw new Error('Deal not found');

    const prevStage = this.db.deals[index].stage;
    const updated = {
      ...this.db.deals[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (data.stage && data.stage !== prevStage) {
      const isWon = data.stage === 'Closed Won';
      this.logActivity(
        userId,
        isWon ? 'deal_won' : 'stage_change',
        isWon
          ? `Closed Won Deal: "${updated.title}" ($${updated.value.toLocaleString()})!`
          : `Moved deal "${updated.title}" to ${data.stage}`,
        'deal',
        updated.id,
        updated.title
      );
    }

    this.db.deals[index] = updated;
    this.save();
    this.syncToSupabase('deals', 'update', {
      id: updated.id,
      title: updated.title,
      value: updated.value,
      stage: updated.stage,
      probability: updated.probability,
      expected_close_date: updated.expectedCloseDate,
      contact_id: updated.contactId,
      contact_name: updated.contactName,
      company_id: updated.companyId,
      company_name: updated.companyName,
      ai_insights: updated.aiInsights,
    });
    return updated;
  }

  public deleteDeal(userId: string, id: string): boolean {
    const initialLen = this.db.deals.length;
    this.db.deals = this.db.deals.filter(d => !(d.userId === userId && d.id === id));
    this.save();
    this.syncToSupabase('deals', 'delete', { id });
    return this.db.deals.length < initialLen;
  }

  // --- Tasks CRUD ---
  public getTasks(userId: string): Task[] {
    return this.db.tasks.filter(t => t.userId === userId);
  }

  public createTask(userId: string, data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...data,
      id: 'task-' + crypto.randomUUID().slice(0, 8),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.tasks.unshift(newTask);
    this.save();
    this.syncToSupabase('tasks', 'insert', {
      id: newTask.id,
      user_id: newTask.userId,
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.dueDate,
      priority: newTask.priority,
      status: newTask.status,
      related_type: newTask.relatedType,
      related_id: newTask.relatedId,
      related_name: newTask.relatedName,
      created_at: newTask.createdAt,
    });
    return newTask;
  }

  public updateTask(userId: string, id: string, data: Partial<Task>): Task {
    const index = this.db.tasks.findIndex(t => t.userId === userId && t.id === id);
    if (index === -1) throw new Error('Task not found');

    const prevStatus = this.db.tasks[index].status;
    const updated = {
      ...this.db.tasks[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (data.status === 'completed' && prevStatus !== 'completed') {
      this.logActivity(userId, 'task_completed', `Completed task: "${updated.title}"`, 'task', updated.id, updated.title);
    }

    this.db.tasks[index] = updated;
    this.save();
    this.syncToSupabase('tasks', 'update', {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      due_date: updated.dueDate,
      priority: updated.priority,
      status: updated.status,
      related_type: updated.relatedType,
      related_id: updated.relatedId,
      related_name: updated.relatedName,
    });
    return updated;
  }

  public deleteTask(userId: string, id: string): boolean {
    const initialLen = this.db.tasks.length;
    this.db.tasks = this.db.tasks.filter(t => !(t.userId === userId && t.id === id));
    this.save();
    this.syncToSupabase('tasks', 'delete', { id });
    return this.db.tasks.length < initialLen;
  }

  // --- Notes CRUD ---
  public getNotes(userId: string, entityType?: string, entityId?: string): Note[] {
    let list = this.db.notes.filter(n => n.userId === userId);
    if (entityType && entityType !== 'all') {
      list = list.filter(n => n.entityType === entityType);
    }
    if (entityId) {
      list = list.filter(n => n.entityId === entityId);
    }
    return list;
  }

  public createNote(userId: string, data: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Note {
    const newNote: Note = {
      ...data,
      id: 'note-' + crypto.randomUUID().slice(0, 8),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.notes.unshift(newNote);
    this.logActivity(userId, 'note', `Added note: "${newNote.title}"`, newNote.entityType, newNote.entityId, newNote.entityName);
    this.save();
    this.syncToSupabase('notes', 'insert', {
      id: newNote.id,
      user_id: newNote.userId,
      title: newNote.title,
      content: newNote.content,
      entity_type: newNote.entityType,
      entity_id: newNote.entityId,
      entity_name: newNote.entityName,
      tags: newNote.tags,
      created_at: newNote.createdAt,
    });
    return newNote;
  }

  public updateNote(userId: string, id: string, data: Partial<Note>): Note {
    const index = this.db.notes.findIndex(n => n.userId === userId && n.id === id);
    if (index === -1) throw new Error('Note not found');
    const updated = {
      ...this.db.notes[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.db.notes[index] = updated;
    this.save();
    this.syncToSupabase('notes', 'update', {
      id: updated.id,
      title: updated.title,
      content: updated.content,
      entity_type: updated.entityType,
      entity_id: updated.entityId,
      entity_name: updated.entityName,
      tags: updated.tags,
    });
    return updated;
  }

  public deleteNote(userId: string, id: string): boolean {
    const initialLen = this.db.notes.length;
    this.db.notes = this.db.notes.filter(n => !(n.userId === userId && n.id === id));
    this.save();
    this.syncToSupabase('notes', 'delete', { id });
    return this.db.notes.length < initialLen;
  }

  // --- Activities ---
  public getActivities(userId: string, limit = 20): Activity[] {
    return this.db.activities
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  public logActivity(
    userId: string,
    type: Activity['type'],
    description: string,
    entityType?: Activity['entityType'],
    entityId?: string,
    entityName?: string,
    metadata?: Record<string, any>
  ): Activity {
    const act: Activity = {
      id: 'act-' + crypto.randomUUID().slice(0, 8),
      userId,
      type,
      description,
      entityType,
      entityId,
      entityName,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.db.activities.unshift(act);
    // Keep max 200 activities per user in history
    const userActs = this.db.activities.filter(a => a.userId === userId);
    if (userActs.length > 200) {
      const oldestId = userActs[userActs.length - 1].id;
      this.db.activities = this.db.activities.filter(a => a.id !== oldestId);
    }
    this.save();
    this.syncToSupabase('activities', 'insert', {
      id: act.id,
      user_id: act.userId,
      type: act.type,
      description: act.description,
      entity_type: act.entityType,
      entity_id: act.entityId,
      entity_name: act.entityName,
      metadata: act.metadata,
      created_at: act.createdAt,
    });
    return act;
  }

  // --- Dashboard Metrics & Reporting ---
  public getDashboardMetrics(userId: string) {
    const contacts = this.db.contacts.filter(c => c.userId === userId);
    const leads = this.db.leads.filter(l => l.userId === userId);
    const deals = this.db.deals.filter(d => d.userId === userId);
    const tasks = this.db.tasks.filter(t => t.userId === userId);

    const activeLeads = leads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost').length;
    const openDealsList = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
    const closedWonDeals = deals.filter(d => d.stage === 'Closed Won');

    const totalPipelineValue = openDealsList.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    const weightedPipelineValue = openDealsList.reduce((sum, d) => sum + (Number(d.value) || 0) * ((d.probability || 0) / 100), 0);
    const closedWonValue = closedWonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

    const totalDealsResolved = deals.filter(d => d.stage === 'Closed Won' || d.stage === 'Closed Lost').length;
    const winRatePercentage = totalDealsResolved > 0 ? Math.round((closedWonDeals.length / totalDealsResolved) * 100) : 75;

    const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    return {
      totalContacts: contacts.length,
      activeLeads,
      openDeals: openDealsList.length,
      totalPipelineValue,
      weightedPipelineValue: Math.round(weightedPipelineValue),
      closedWonValue,
      pendingTasks,
      completedTasks,
      winRatePercentage,
    };
  }

  public getReportsAnalytics(userId: string) {
    const leads = this.db.leads.filter(l => l.userId === userId);
    const deals = this.db.deals.filter(d => d.userId === userId);
    const tasks = this.db.tasks.filter(t => t.userId === userId);

    // Deal Stage distribution
    const dealStages: Deal['stage'][] = ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    const stageDistribution = dealStages.map(stage => {
      const matching = deals.filter(d => d.stage === stage);
      const value = matching.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      return { stage, count: matching.length, value };
    });

    // Lead funnel
    const leadStages: Lead['stage'][] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
    const totalLeads = leads.length || 1;
    const leadFunnel = leadStages.map(stage => {
      const count = leads.filter(l => l.stage === stage).length;
      return {
        stage,
        count,
        conversionRate: Math.round((count / totalLeads) * 100),
      };
    });

    // Top Lead sources
    const sourceMap = new Map<string, { count: number; wonCount: number }>();
    leads.forEach(l => {
      const src = l.source || 'Direct';
      const cur = sourceMap.get(src) || { count: 0, wonCount: 0 };
      cur.count += 1;
      if (l.stage === 'Won') cur.wonCount += 1;
      sourceMap.set(src, cur);
    });
    const topLeadSources = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      count: data.count,
      wonCount: data.wonCount,
    }));

    return {
      stageDistribution,
      leadFunnel,
      topLeadSources,
      totalLeads: leads.length,
      totalDeals: deals.length,
      totalTasks: tasks.length,
    };
  }
}

export const db = new DatabaseService();
