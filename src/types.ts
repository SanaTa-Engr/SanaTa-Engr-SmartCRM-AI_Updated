export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
export type DealStage = 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type ContactStatus = 'lead' | 'customer' | 'partner' | 'inactive';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'stage_change' | 'deal_won' | 'task_completed' | 'ai_analysis';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  companyName?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  companyId?: string;
  companyName?: string;
  status: ContactStatus;
  avatarUrl?: string;
  tags: string[];
  source?: string;
  notesCount?: number;
  dealsCount?: number;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  userId: string;
  name: string;
  domain?: string;
  industry: string;
  size: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  annualRevenue?: number;
  contactsCount?: number;
  activeDealsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  stage: LeadStage;
  estimatedValue: number;
  source: string;
  score: number; // 0 - 100
  scoreReason?: string;
  aiSummary?: string;
  nextAction?: string;
  assignedTo?: string;
  address?: string;
  website?: string;
  mapsUrl?: string;
  mapsPlaceId?: string;
  category?: string;
  rating?: number;
  userRatingsTotal?: number;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MapLeadPlace {
  id: string;
  name: string;
  formattedAddress: string;
  phone?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  category?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  isSavedAsLead?: boolean;
  existingLeadId?: string;
}

export interface MapSearchResponse {
  success: boolean;
  places: MapLeadPlace[];
  query: string;
  location: string;
  totalCount: number;
  configured: boolean;
  warning?: string;
  error?: string;
}

export interface Deal {
  id: string;
  userId: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number; // 0 - 100
  expectedCloseDate: string;
  contactId?: string;
  contactName?: string;
  companyId?: string;
  companyName?: string;
  aiInsights?: string;
  notesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  relatedType?: 'contact' | 'lead' | 'deal' | 'general';
  relatedId?: string;
  relatedName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  entityType: 'contact' | 'lead' | 'deal' | 'general';
  entityId?: string;
  entityName?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  description: string;
  entityType?: 'contact' | 'lead' | 'deal' | 'task' | 'general';
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DashboardMetrics {
  totalContacts: number;
  activeLeads: number;
  openDeals: number;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  closedWonValue: number;
  pendingTasks: number;
  completedTasks: number;
  winRatePercentage: number;
}

export interface SalesPipelineReport {
  stageDistribution: { stage: DealStage; count: number; value: number }[];
  leadFunnel: { stage: LeadStage; count: number; conversionRate: number }[];
  revenueByMonth: { month: string; won: number; projected: number }[];
  topLeadSources: { source: string; count: number; wonCount: number }[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export const SUPPORTED_LEAD_SOURCES = [
  'Inbound Web',
  'Outbound SDR',
  'Referral',
  'Partner Ecosystem',
  'Conference',
] as const;

export type SupportedLeadSource = typeof SUPPORTED_LEAD_SOURCES[number];

export interface LeadImportRecord {
  id: string;
  userId: string;
  filename: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  invalidCount: number;
  status: 'completed' | 'partial' | 'failed';
  errors?: { row: number; field?: string; message: string }[];
  createdAt: string;
}

export interface LeadImportPayload {
  filename: string;
  leads: Partial<Lead>[];
  skipDuplicates?: boolean;
}

export interface LeadImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  invalidCount: number;
  totalRows: number;
  importRecord?: LeadImportRecord;
}
