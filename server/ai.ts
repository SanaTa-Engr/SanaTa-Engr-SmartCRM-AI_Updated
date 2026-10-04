import { GoogleGenAI } from '@google/genai';
import { Lead, Contact, Deal, Activity, DashboardMetrics } from '../src/types';
import { generateSmartSalesResponse } from '../src/aiEngine';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function scoreLeadWithAI(lead: Lead): Promise<{
  score: number;
  reason: string;
  nextAction: string;
  aiSummary: string;
}> {
  const client = getAiClient();

  if (client) {
    try {
      const prompt = `You are an elite enterprise B2B sales development AI.
Analyze this sales lead and provide:
1. An objective predictive lead quality score from 1 to 100.
2. A 2-sentence rationale for the score (mention budget, authority, need, timeline).
3. The single highest-impact immediate next action for the sales representative.
4. An executive summary of the lead's buying potential and strategic value.

Lead Details:
- Name: ${lead.name}
- Title: ${lead.title || 'Unknown'}
- Company: ${lead.company}
- Stage: ${lead.stage}
- Estimated Value: $${lead.estimatedValue}
- Source: ${lead.source}

Respond strictly in valid JSON format matching this schema:
{
  "score": number,
  "reason": "string",
  "nextAction": "string",
  "aiSummary": "string"
}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        return {
          score: Math.min(100, Math.max(1, Number(parsed.score) || 75)),
          reason: parsed.reason || 'Lead demonstrates solid fit based on title and company profile.',
          nextAction: parsed.nextAction || 'Schedule a 20-minute discovery call to confirm decision timeline.',
          aiSummary: parsed.aiSummary || 'Promising prospect with high alignment to core solution capabilities.',
        };
      }
    } catch (err) {
      console.warn('Gemini lead scoring failed, using intelligent heuristics:', err);
    }
  }

  // Intelligent heuristic fallback
  let calculatedScore = 60;
  if (lead.stage === 'Proposal') calculatedScore += 25;
  else if (lead.stage === 'Qualified') calculatedScore += 18;
  else if (lead.stage === 'Contacted') calculatedScore += 8;
  else if (lead.stage === 'Won') calculatedScore = 100;
  else if (lead.stage === 'Lost') calculatedScore = 20;

  if (lead.estimatedValue > 50000) calculatedScore += 10;
  if (lead.title && /(c[a-z]o|vp|director|head|founder|president)/i.test(lead.title)) calculatedScore += 10;
  calculatedScore = Math.min(98, Math.max(15, calculatedScore));

  return {
    score: calculatedScore,
    reason: `Calculated from ${lead.stage} stage progression, estimated value of $${lead.estimatedValue.toLocaleString()}, and ${lead.title || 'executive'} stakeholder role.`,
    nextAction: lead.stage === 'Proposal'
      ? 'Deliver tailored ROI proposal and schedule security stakeholder alignment.'
      : lead.stage === 'Qualified'
      ? 'Schedule a technical walkthrough and confirm Q3/Q4 procurement timeline.'
      : 'Conduct initial discovery call to identify core pain points and budget owner.',
    aiSummary: `${lead.name} from ${lead.company} is an active opportunity in the ${lead.stage} stage with an estimated deal size of $${lead.estimatedValue.toLocaleString()}.`,
  };
}

export async function generateLeadSummary(lead: Lead): Promise<string> {
  const client = getAiClient();
  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Provide a concise, 3-sentence executive summary of this lead, highlighting their qualification status, business relevance, and high-priority action:
Lead Name: ${lead.name}
Role: ${lead.title}
Company: ${lead.company}
Stage: ${lead.stage}
Estimated Value: $${lead.estimatedValue}
Source: ${lead.source}
Current Score: ${lead.score}/100`,
      });
      if (response.text) return response.text.trim();
    } catch (e) {
      console.warn('Gemini lead summary fallback:', e);
    }
  }
  return `${lead.name} (${lead.title || 'Representative'} at ${lead.company}) represents a $${lead.estimatedValue.toLocaleString()} opportunity currently in the ${lead.stage} stage. Acquired via ${lead.source}, this prospect maintains a score of ${lead.score}/100 and shows strong product alignment. Recommended immediate priority is advancing stakeholder discovery.`;
}

export async function analyzeCustomerProfile(contact: Contact, relatedDeals: Deal[], relatedNotes: string[]): Promise<{
  sentiment: 'positive' | 'neutral' | 'high_priority' | 'at_risk';
  summary: string;
  upsellOpportunities: string[];
  recommendedTalkingPoints: string[];
}> {
  const client = getAiClient();
  if (client) {
    try {
      const prompt = `Analyze this CRM customer/contact profile and provide intelligent insights:
Contact: ${contact.name} (${contact.title || 'Lead'}, ${contact.companyName || 'Company'})
Status: ${contact.status}
Tags: ${contact.tags.join(', ')}
Associated Deals: ${JSON.stringify(relatedDeals.map(d => ({ title: d.title, value: d.value, stage: d.stage })))}
Recent Notes: ${relatedNotes.join(' | ')}

Return strictly JSON matching:
{
  "sentiment": "positive" | "neutral" | "high_priority" | "at_risk",
  "summary": "string",
  "upsellOpportunities": ["string", "string"],
  "recommendedTalkingPoints": ["string", "string", "string"]
}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      if (response.text) {
        return JSON.parse(response.text.trim());
      }
    } catch (e) {
      console.warn('Gemini contact analysis fallback:', e);
    }
  }

  return {
    sentiment: contact.status === 'customer' ? 'positive' : 'high_priority',
    summary: `${contact.name} is a key stakeholder at ${contact.companyName || 'the organization'}. Engagement history indicates strong responsiveness and strategic interest in automated workflow enhancements.`,
    upsellOpportunities: [
      'Multi-seat enterprise expansion for cross-functional collaboration',
      'Advanced AI Assistant & automation add-on package',
      'Dedicated Customer Success & priority SLA tier',
    ],
    recommendedTalkingPoints: [
      `Review current team adoption and weekly time savings achieved.`,
      `Demonstrate new automated pipeline reporting features for leadership.`,
      `Discuss upcoming fiscal renewal and potential multi-year discount incentives.`,
    ],
  };
}

export async function generateFollowUpEmail(params: {
  recipientName: string;
  companyName: string;
  tone: 'consultative' | 'friendly' | 'urgent' | 'formal';
  context: string;
  stage?: string;
}): Promise<{ subject: string; body: string }> {
  const client = getAiClient();
  if (client) {
    try {
      const prompt = `You are a top 1% enterprise sales advisor.
Write an authentic, highly persuasive follow-up email.
Recipient: ${params.recipientName}
Company: ${params.companyName}
Tone: ${params.tone}
Context/Objective: ${params.context}
Current Deal Stage: ${params.stage || 'In Discussion'}

Keep the email concise (under 160 words), engaging, with a clear single call-to-action.
Return strictly JSON matching:
{
  "subject": "string",
  "body": "string"
}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      if (response.text) {
        return JSON.parse(response.text.trim());
      }
    } catch (e) {
      console.warn('Gemini follow up email fallback:', e);
    }
  }

  // Fallback template
  const subjects: Record<string, string> = {
    consultative: `Exploring next steps for ${params.companyName}'s sales automation`,
    friendly: `Quick check-in following our discussion, ${params.recipientName}`,
    urgent: `Time-sensitive: Finalizing details for ${params.companyName}`,
    formal: `Executive Follow-Up: ${params.companyName} & SmartCRM AI Partnership`,
  };

  return {
    subject: subjects[params.tone] || `Following up regarding ${params.companyName}`,
    body: `Hi ${params.recipientName},\n\nI wanted to follow up on our recent conversation regarding ${params.companyName}'s CRM modernization goals.\n\n${params.context || 'Based on your team priorities, our AI-powered workflows can deliver immediate time-to-value and accelerate pipeline velocity.'}\n\nDo you have 15 minutes this Thursday or Friday for a brief call to align on the proposal and next steps?\n\nBest regards,\nAlex Morgan\nSmartCRM AI`,
  };
}

export async function getDealInsights(deal: Deal, contactName?: string): Promise<{
  winProbability: number;
  healthAssessment: 'healthy' | 'caution' | 'at_risk';
  keyStrengths: string[];
  potentialRisks: string[];
  closingStrategy: string;
}> {
  const client = getAiClient();
  if (client) {
    try {
      const prompt = `Analyze this B2B sales deal and provide strategic closing guidance:
Deal: "${deal.title}"
Value: $${deal.value}
Current Stage: ${deal.stage}
Estimated Close Date: ${deal.expectedCloseDate}
Primary Contact: ${contactName || 'Stakeholder'}

Return strictly JSON matching:
{
  "winProbability": number (1-100),
  "healthAssessment": "healthy" | "caution" | "at_risk",
  "keyStrengths": ["string", "string"],
  "potentialRisks": ["string", "string"],
  "closingStrategy": "string"
}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      if (response.text) {
        return JSON.parse(response.text.trim());
      }
    } catch (e) {
      console.warn('Gemini deal insights fallback:', e);
    }
  }

  const isWon = deal.stage === 'Closed Won';
  const isLost = deal.stage === 'Closed Lost';
  const prob = isWon ? 100 : isLost ? 0 : deal.stage === 'Negotiation' ? 85 : deal.stage === 'Proposal' ? 60 : 35;

  return {
    winProbability: prob,
    healthAssessment: isWon ? 'healthy' : isLost ? 'at_risk' : prob > 50 ? 'healthy' : 'caution',
    keyStrengths: [
      `Strong alignment between deal scope ($${deal.value.toLocaleString()}) and company scale.`,
      `Active engagement in the ${deal.stage} phase with clear executive visibility.`,
    ],
    potentialRisks: [
      deal.value > 50000 ? 'Higher contract value requires multi-level executive budget signoff.' : 'Ensure timeline does not slip past end of quarter.',
      'Competitor alternatives or internal build resistance.',
    ],
    closingStrategy: `Target closing prior to ${deal.expectedCloseDate}. Schedule an alignment review with key procurement stakeholders and offer early-quarter onboarding support to lock in commitment.`,
  };
}

export async function summarizeActivityTimeline(activities: Activity[]): Promise<string> {
  const client = getAiClient();
  if (client) {
    try {
      const prompt = `Summarize the recent CRM activity stream into an executive sales digest (3 bullet points):
Activities:
${activities.slice(0, 10).map(a => `- [${a.type}] ${a.description} (${new Date(a.createdAt).toLocaleDateString()})`).join('\n')}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      if (response.text) return response.text.trim();
    } catch (e) {
      console.warn('Gemini activity summary fallback:', e);
    }
  }

  return `• Key milestone: Successfully logged ${activities.length} recent sales touchpoints across pipeline leads and enterprise accounts.\n• Momentum: Active stage transitions and high response rates across high-value healthcare and software prospects.\n• Focus: Maintain cadence on pending contract reviews and scheduled discovery follow-ups.`;
}

export async function handleAIChat(messages: { role: 'user' | 'assistant'; content: string }[], crmContext: Record<string, any>): Promise<{
  content: string;
  suggestions?: string[];
}> {
  const client = getAiClient();
  const userMessage = messages[messages.length - 1]?.content || '';

  if (client) {
    try {
      const systemInstruction = `You are SmartCRM AI, an intelligent, consultative sales assistant built directly into the CRM.
You have access to live CRM context:
- Total Contacts: ${crmContext.totalContacts}
- Active Leads: ${crmContext.activeLeads}
- Open Deals Count: ${crmContext.openDeals}
- Total Open Pipeline Value: $${crmContext.totalPipelineValue}
- Weighted Pipeline Value: $${crmContext.weightedPipelineValue}
- Closed Won Value: $${crmContext.closedWonValue}
- Pending Tasks: ${crmContext.pendingTasks}
- Top Deals: ${JSON.stringify(crmContext.topDeals || [])}
- High-Score Leads: ${JSON.stringify(crmContext.topLeads || [])}

Provide direct, actionable, expert guidance for sales teams. Answer questions clearly, offer actionable suggestions, write outreach copy, calculate forecasts, or advise on closing strategies. Keep tone professional, energetic, and concise.`;

      const contents = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      if (response.text) {
        return {
          content: response.text.trim(),
          suggestions: [
            'Which leads have the highest win score right now?',
            'What deals should we focus on closing this week?',
            'Draft a re-engagement email for stalled proposals',
            'Give me a summary of our Q3 revenue forecast',
          ],
        };
      }
    } catch (e) {
      console.warn('Gemini chat fallback:', e);
    }
  }

  // Fallback intelligent multi-intent response generator
  const metrics: DashboardMetrics = {
    totalContacts: crmContext.totalContacts || 5,
    activeLeads: crmContext.activeLeads || 4,
    openDeals: crmContext.openDeals || 3,
    totalPipelineValue: crmContext.totalPipelineValue || 205000,
    weightedPipelineValue: crmContext.weightedPipelineValue || 135000,
    closedWonValue: crmContext.closedWonValue || 139000,
    pendingTasks: crmContext.pendingTasks || 3,
    completedTasks: 5,
    winRatePercentage: crmContext.winRatePercentage || 40,
  };

  const deals = (crmContext.topDeals || []).map((d: any, idx: number) => ({
    id: 'deal-' + idx,
    userId: 'usr-demo-1',
    title: d.title || 'Enterprise Deal',
    value: d.value || 25000,
    stage: d.stage || 'Proposal',
    probability: d.probability || 60,
    expectedCloseDate: '2026-09-30',
    companyName: d.companyName || d.title?.split(' ')[0] || 'Enterprise Client',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const leads = (crmContext.topLeads || []).map((l: any, idx: number) => ({
    id: 'lead-' + idx,
    userId: 'usr-demo-1',
    name: l.name || 'Lead Contact',
    email: 'contact@example.com',
    phone: '555-0199',
    company: l.company || 'Prospect Co',
    title: 'Decision Maker',
    stage: l.stage || 'Qualified',
    estimatedValue: l.value || 30000,
    source: 'Website Inbound',
    score: l.score || 85,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return generateSmartSalesResponse(messages, {
    metrics,
    deals,
    leads,
    contacts: [],
    tasks: [],
    userName: 'Alex Morgan',
    companyName: 'SmartCRM AI',
  });
}
