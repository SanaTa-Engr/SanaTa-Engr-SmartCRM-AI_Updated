import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { db } from './server/db';
import {
  scoreLeadWithAI,
  generateLeadSummary,
  analyzeCustomerProfile,
  generateFollowUpEmail,
  getDealInsights,
  summarizeActivityTimeline,
  handleAIChat,
} from './server/ai';
import { getMapsConfigStatus, searchGooglePlaces, getGoogleMapsApiKey } from './server/maps';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Normalize /api prefix if stripped by reverse proxies or Vercel serverless rewrites
app.use((req, res, next) => {
  // If request arrived via Vercel rewrite where req.url was stripped to / or /api
  const forwardedUri = (req.headers['x-forwarded-uri'] || req.headers['x-vercel-matched-path'] || req.headers['x-matched-path']) as string;
  if (forwardedUri && typeof forwardedUri === 'string' && forwardedUri.startsWith('/api/') && forwardedUri.length > 5 && (!req.url || req.url === '/' || req.url === '/api' || req.url === '/api/')) {
    const queryString = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    req.url = forwardedUri.includes('?') ? forwardedUri : forwardedUri + queryString;
  }

  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/src') && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules')) {
    const isApiPath = /^\/(auth|contacts|companies|leads|deals|tasks|notes|activities|dashboard|reports|ai|health|status|maps)/.test(req.url);
    if (isApiPath) {
      req.url = '/api' + req.url;
    }
  }
  next();
});

// Auth helper middleware
function getUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = db.verifyToken(token);
    if (user) return user.id;
  }
  // Default to demo user for quick testing if no token provided
  return 'usr-demo-1';
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }
  const token = authHeader.substring(7);
  const user = db.verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }
  (req as any).user = user;
  next();
}

// Standalone PRD Document Routes (not included in CRM UI)
app.get('/SmartCRM_AI_Product_Requirements_Document.pdf', (req, res) => {
  const filePath = path.join(process.cwd(), 'public', 'SmartCRM_AI_Product_Requirements_Document.pdf');
  res.download(filePath, 'SmartCRM_AI_Product_Requirements_Document.pdf');
});

app.get('/prd.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'prd.html'));
});

// Health & System status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/status', (req, res) => {
  res.json(db.getStatus());
});

// --- Auth Endpoints ---
app.post('/api/auth/signup', (req, res) => {
  try {
    const { email, password, name, companyName } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    const result = db.createUser(email, password, name, companyName);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = db.authenticate(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = authHeader.substring(7);
  const user = db.verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

app.post('/api/seed', (req, res) => {
  const userId = getUserId(req);
  const data = db.seedUserData(userId);
  res.json({ success: true, message: 'Sample demo dataset refreshed successfully', counts: {
    contacts: data.contacts.length,
    companies: data.companies.length,
    leads: data.leads.length,
    deals: data.deals.length,
    tasks: data.tasks.length,
  }});
});

// --- Contacts API ---
app.get('/api/contacts', (req, res) => {
  const userId = getUserId(req);
  const contacts = db.getContacts(userId);
  res.json(contacts);
});

app.get('/api/contacts/:id', (req, res) => {
  const userId = getUserId(req);
  const contact = db.getContact(userId, req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  res.json(contact);
});

app.post('/api/contacts', (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, email, phone, title, companyId, companyName, status, tags, source } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const contact = db.createContact(userId, {
      name,
      email,
      phone: phone || '',
      title: title || '',
      companyId,
      companyName,
      status: status || 'lead',
      tags: Array.isArray(tags) ? tags : [],
      source: source || 'Direct',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    });
    res.status(201).json(contact);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contacts/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const contact = db.updateContact(userId, req.params.id, req.body);
    res.json(contact);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/contacts/:id', (req, res) => {
  const userId = getUserId(req);
  const ok = db.deleteContact(userId, req.params.id);
  res.json({ success: ok });
});

// --- Companies API ---
app.get('/api/companies', (req, res) => {
  const userId = getUserId(req);
  res.json(db.getCompanies(userId));
});

app.get('/api/companies/:id', (req, res) => {
  const userId = getUserId(req);
  const comp = db.getCompany(userId, req.params.id);
  if (!comp) return res.status(404).json({ error: 'Company not found' });
  res.json(comp);
});

app.post('/api/companies', (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, domain, industry, size, phone, website, address, city, country, annualRevenue } = req.body;
    if (!name) return res.status(400).json({ error: 'Company name is required' });

    const company = db.createCompany(userId, {
      name,
      domain,
      industry: industry || 'Technology',
      size: size || '10-50',
      phone,
      website,
      address,
      city,
      country,
      annualRevenue: Number(annualRevenue) || 0,
    });
    res.status(201).json(company);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/companies/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const company = db.updateCompany(userId, req.params.id, req.body);
    res.json(company);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/companies/:id', (req, res) => {
  const userId = getUserId(req);
  const ok = db.deleteCompany(userId, req.params.id);
  res.json({ success: ok });
});

// --- Leads API ---
app.get('/api/leads', (req, res) => {
  const userId = getUserId(req);
  res.json(db.getLeads(userId));
});

// Automated Lead Import API (must be before :id route)
app.get('/api/leads/import-history', (req, res) => {
  const userId = getUserId(req);
  res.json(db.getImportHistory(userId));
});

app.post('/api/leads/import', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { filename, leads, skipDuplicates } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'No lead records provided for import' });
    }
    const result = await db.importLeads(userId, {
      filename: filename || 'leads_import.csv',
      leads,
      skipDuplicates: skipDuplicates !== false,
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Import failed' });
  }
});

app.get('/api/leads/:id', (req, res) => {
  const userId = getUserId(req);
  const lead = db.getLead(userId, req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

app.post('/api/leads', async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      name,
      email,
      phone,
      company,
      title,
      stage,
      estimatedValue,
      source,
      score,
      assignedTo,
      address,
      website,
      mapsUrl,
      mapsPlaceId,
      category,
      rating,
      userRatingsTotal,
      latitude,
      longitude,
      nextAction,
      aiSummary,
      scoreReason,
    } = req.body;
    if (!name || !company) return res.status(400).json({ error: 'Name and company are required' });

    // Check duplicate by mapsPlaceId if provided
    if (mapsPlaceId) {
      const existing = db.getLeads(userId).find(l => l.mapsPlaceId === mapsPlaceId);
      if (existing) {
        return res.status(409).json({ error: 'This business is already saved in your Leads database.', duplicate: true, lead: existing });
      }
    }

    const initialLead = {
      name,
      email: email || '',
      phone: phone || '',
      company,
      title: title || '',
      stage: stage || 'New',
      estimatedValue: Number(estimatedValue) || 0,
      source: source || 'Inbound Web',
      score: Number(score) || 50,
      assignedTo: assignedTo || 'You',
      address: address || '',
      website: website || '',
      mapsUrl: mapsUrl || '',
      mapsPlaceId: mapsPlaceId || '',
      category: category || '',
      rating: typeof rating === 'number' ? rating : undefined,
      userRatingsTotal: typeof userRatingsTotal === 'number' ? userRatingsTotal : undefined,
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined,
      nextAction: nextAction || '',
      aiSummary: aiSummary || '',
      scoreReason: scoreReason || '',
    };

    const lead = db.createLead(userId, initialLead);
    res.status(201).json(lead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leads/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const lead = db.updateLead(userId, req.params.id, req.body);
    res.json(lead);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/leads/:id', (req, res) => {
  const userId = getUserId(req);
  const ok = db.deleteLead(userId, req.params.id);
  res.json({ success: ok });
});

// --- Google Maps / Places Lead Discovery API ---
app.get(['/api/maps/status', '/maps/status'], (req, res) => {
  res.json(getMapsConfigStatus());
});

app.get(['/api/maps/config', '/maps/config'], (req, res) => {
  const isConfigured = Boolean(getGoogleMapsApiKey());
  res.json({ configured: isConfigured });
});

app.get(['/api/maps/search', '/maps/search'], async (req, res) => {
  try {
    const keyword = (req.query.keyword || req.query.query || '') as string;
    const location = (req.query.location || '') as string;
    const result = await searchGooglePlaces(keyword, location);

    const userId = getUserId(req);
    const existingLeads = db.getLeads(userId);
    const annotatedPlaces = result.places.map(p => {
      const match = existingLeads.find(l => 
        (p.id && l.mapsPlaceId === p.id) ||
        (l.company && l.company.trim().toLowerCase() === p.name.trim().toLowerCase())
      );
      return {
        ...p,
        isSavedAsLead: Boolean(match),
        existingLeadId: match ? match.id : undefined,
      };
    });

    res.json({
      ...result,
      source: 'google_places',
      places: annotatedPlaces,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      source: 'google_places',
      places: [],
      error: 'Unable to retrieve verified Google Places results. Please try again.',
    });
  }
});

app.post(['/api/maps/search', '/maps/search'], async (req, res) => {
  try {
    const { keyword, query, location } = req.body;
    const searchKeyword = keyword || query || '';
    const result = await searchGooglePlaces(searchKeyword, location);

    const userId = getUserId(req);
    const existingLeads = db.getLeads(userId);
    const annotatedPlaces = result.places.map(p => {
      const match = existingLeads.find(l => 
        (p.id && l.mapsPlaceId === p.id) ||
        (l.company && l.company.trim().toLowerCase() === p.name.trim().toLowerCase())
      );
      return {
        ...p,
        isSavedAsLead: Boolean(match),
        existingLeadId: match ? match.id : undefined,
      };
    });

    res.json({
      ...result,
      source: 'google_places',
      places: annotatedPlaces,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      source: 'google_places',
      places: [],
      error: 'Unable to retrieve verified Google Places results. Please try again.',
    });
  }
});

app.post(['/api/leads/from-map', '/leads/from-map'], async (req, res) => {
  try {
    const userId = getUserId(req);
    const place = req.body;
    if (!place || !place.name) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    const existingLeads = db.getLeads(userId);
    // Duplicate check
    const duplicate = existingLeads.find(l => 
      (place.id && l.mapsPlaceId === place.id) ||
      (l.company && l.company.trim().toLowerCase() === place.name.trim().toLowerCase())
    );

    if (duplicate) {
      return res.status(409).json({
        error: `"${place.name}" is already in your Leads list.`,
        duplicate: true,
        lead: duplicate,
      });
    }

    let initialScore = 65;
    if (place.rating) {
      initialScore += Math.round((place.rating - 3) * 10);
    }
    if (place.userRatingCount && place.userRatingCount > 50) {
      initialScore += 10;
    }
    initialScore = Math.max(30, Math.min(95, initialScore));

    const initialLead = {
      name: place.name,
      company: place.name,
      title: place.category ? `${place.category} Owner / Manager` : 'General Manager',
      email: place.email || '',
      phone: place.phone || '',
      stage: 'New' as const,
      estimatedValue: 15000,
      source: 'Google Maps',
      score: initialScore,
      scoreReason: `Discovered on Google Maps. ${place.rating ? `Customer rating: ${place.rating}★ (${place.userRatingCount || 0} reviews).` : ''} High local market presence.`,
      aiSummary: `${place.name} is a local ${place.category || 'business'} located at ${place.formattedAddress || 'local address'}. Captured via Google Maps lead search.`,
      nextAction: 'Initiate discovery outreach & verify decision-maker.',
      assignedTo: 'You',
      address: place.formattedAddress || '',
      website: place.websiteUri || '',
      mapsUrl: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + (place.formattedAddress || ''))}`,
      mapsPlaceId: place.id,
      category: place.category || 'Local Business',
      rating: place.rating,
      userRatingsTotal: place.userRatingCount,
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
    };

    const lead = db.createLead(userId, initialLead);
    res.status(201).json({ success: true, lead });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to convert map business into lead' });
  }
});

// --- Deals API ---
app.get('/api/deals', (req, res) => {
  const userId = getUserId(req);
  res.json(db.getDeals(userId));
});

app.get('/api/deals/:id', (req, res) => {
  const userId = getUserId(req);
  const deal = db.getDeal(userId, req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  res.json(deal);
});

app.post('/api/deals', (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, value, stage, probability, expectedCloseDate, contactId, contactName, companyId, companyName } = req.body;
    if (!title || value === undefined) return res.status(400).json({ error: 'Title and value are required' });

    const deal = db.createDeal(userId, {
      title,
      value: Number(value) || 0,
      stage: stage || 'Discovery',
      probability: Number(probability) || 20,
      expectedCloseDate: expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      contactId,
      contactName,
      companyId,
      companyName,
    });
    res.status(201).json(deal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/deals/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const deal = db.updateDeal(userId, req.params.id, req.body);
    res.json(deal);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/deals/:id', (req, res) => {
  const userId = getUserId(req);
  const ok = db.deleteDeal(userId, req.params.id);
  res.json({ success: ok });
});

// --- Tasks API ---
app.get('/api/tasks', (req, res) => {
  const userId = getUserId(req);
  res.json(db.getTasks(userId));
});

app.post('/api/tasks', (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, description, dueDate, priority, status, relatedType, relatedId, relatedName } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });

    const task = db.createTask(userId, {
      title,
      description: description || '',
      dueDate: dueDate || new Date(Date.now() + 2 * 86400000).toISOString(),
      priority: priority || 'medium',
      status: status || 'pending',
      relatedType,
      relatedId,
      relatedName,
    });
    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const task = db.updateTask(userId, req.params.id, req.body);
    res.json(task);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  const userId = getUserId(req);
  const ok = db.deleteTask(userId, req.params.id);
  res.json({ success: ok });
});

// --- Notes API ---
app.get('/api/notes', (req, res) => {
  const userId = getUserId(req);
  const { entityType, entityId } = req.query;
  res.json(db.getNotes(userId, entityType as string, entityId as string));
});

app.post('/api/notes', (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, content, entityType, entityId, entityName, tags } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

    const note = db.createNote(userId, {
      title,
      content,
      entityType: entityType || 'general',
      entityId,
      entityName,
      tags: Array.isArray(tags) ? tags : [],
    });
    res.status(201).json(note);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notes/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const note = db.updateNote(userId, req.params.id, req.body);
    res.json(note);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/notes/:id', (req, res) => {
  const userId = getUserId(req);
  const ok = db.deleteNote(userId, req.params.id);
  res.json({ success: ok });
});

// --- Activities Timeline API ---
app.get('/api/activities', (req, res) => {
  const userId = getUserId(req);
  res.json(db.getActivities(userId));
});

app.post('/api/activities', (req, res) => {
  const userId = getUserId(req);
  const { type, description, entityType, entityId, entityName, metadata } = req.body;
  const act = db.logActivity(userId, type, description, entityType, entityId, entityName, metadata);
  res.status(201).json(act);
});

// --- Dashboard & Analytics API ---
app.get('/api/dashboard/metrics', (req, res) => {
  const userId = getUserId(req);
  res.json(db.getDashboardMetrics(userId));
});

app.get('/api/reports/analytics', (req, res) => {
  const userId = getUserId(req);
  res.json(db.getReportsAnalytics(userId));
});

// --- AI Endpoints ---
app.post('/api/ai/lead-score', async (req, res) => {
  try {
    const { lead } = req.body;
    if (!lead) return res.status(400).json({ error: 'Lead object is required' });
    const result = await scoreLeadWithAI(lead);

    // If lead has an ID, automatically update it in DB
    const userId = getUserId(req);
    if (lead.id) {
      db.updateLead(userId, lead.id, {
        score: result.score,
        scoreReason: result.reason,
        nextAction: result.nextAction,
        aiSummary: result.aiSummary,
      });
      db.logActivity(userId, 'ai_analysis', `AI updated lead score for ${lead.name}: ${result.score}/100`, 'lead', lead.id, lead.name);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/lead-summary', async (req, res) => {
  try {
    const { lead } = req.body;
    if (!lead) return res.status(400).json({ error: 'Lead object is required' });
    const summary = await generateLeadSummary(lead);

    const userId = getUserId(req);
    if (lead.id) {
      db.updateLead(userId, lead.id, { aiSummary: summary });
    }

    res.json({ summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/contact-analysis', async (req, res) => {
  try {
    const { contactId } = req.body;
    const userId = getUserId(req);
    const contact = db.getContact(userId, contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const relatedDeals = db.getDeals(userId).filter(d => d.contactId === contactId || d.companyId === contact.companyId);
    const relatedNotes = db.getNotes(userId, 'contact', contactId).map(n => n.content);

    const analysis = await analyzeCustomerProfile(contact, relatedDeals, relatedNotes);
    db.logActivity(userId, 'ai_analysis', `AI completed Customer Analysis for ${contact.name}`, 'contact', contact.id, contact.name);
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/follow-up-email', async (req, res) => {
  try {
    const { recipientName, companyName, tone, context, stage } = req.body;
    const result = await generateFollowUpEmail({
      recipientName: recipientName || 'Valued Partner',
      companyName: companyName || 'your organization',
      tone: tone || 'consultative',
      context: context || '',
      stage,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/deal-insights', async (req, res) => {
  try {
    const { dealId } = req.body;
    const userId = getUserId(req);
    const deal = db.getDeal(userId, dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const insights = await getDealInsights(deal, deal.contactName);
    db.updateDeal(userId, deal.id, { aiInsights: insights.closingStrategy });
    db.logActivity(userId, 'ai_analysis', `AI generated strategic closing insights for deal: "${deal.title}"`, 'deal', deal.id, deal.title);
    res.json(insights);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/activity-summary', async (req, res) => {
  try {
    const userId = getUserId(req);
    const activities = db.getActivities(userId, 15);
    const summary = await summarizeActivityTimeline(activities);
    res.json({ summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'Messages array required' });

    const metrics = db.getDashboardMetrics(userId);
    const deals = db.getDeals(userId).slice(0, 5);
    const leads = db.getLeads(userId).slice(0, 5);

    const context = {
      ...metrics,
      topDeals: deals.map(d => ({ title: d.title, value: d.value, stage: d.stage })),
      topLeads: leads.map(l => ({ name: l.name, company: l.company, score: l.score, stage: l.stage })),
    };

    const reply = await handleAIChat(messages, context);
    res.json(reply);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite Middleware & SPA serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartCRM AI Server running on http://0.0.0.0:${PORT}`);
  });
}

export { app };
export default app;

if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}
