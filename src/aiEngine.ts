import { Deal, Lead, Contact, Task, DashboardMetrics } from './types';

export interface CRMContextData {
  metrics: DashboardMetrics;
  deals: Deal[];
  leads: Lead[];
  contacts: Contact[];
  tasks: Task[];
  userName?: string;
  companyName?: string;
}

const GENERIC_WORDS = new Set([
  'deal', 'deals', 'lead', 'leads', 'company', 'companies', 'account', 'accounts',
  'proposal', 'proposals', 'this week', 'next week', 'this month', 'today', 'now',
  'sales', 'crm', 'pipeline', 'revenue', 'forecast', 'all', 'any', 'my', 'our',
  'client', 'clients', 'prospect', 'prospects', 'contract', 'contracts'
]);

export function generateSmartSalesResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  context: CRMContextData
): { content: string; suggestions: string[] } {
  const userMessage = messages[messages.length - 1]?.content?.trim() || '';
  const q = userMessage.toLowerCase();
  const userName = context.userName || 'Alex Morgan';
  const myCompany = context.companyName || 'SmartCRM AI';

  // 1. EMAIL DRAFTING & OUTREACH (e.g., "Draft a consultative follow-up email for a stalled proposal")
  const isEmailQuery =
    (q.includes('draft') || q.includes('write') || q.includes('email') || q.includes('template') || q.includes('letter') || q.includes('outreach')) ||
    (q.includes('follow up') || q.includes('follow-up') || q.includes('stalled proposal') || q.includes('re-engage') || q.includes('ghosted'));

  if (isEmailQuery) {
    const isStalled = q.includes('stalled') || q.includes('ghosted') || q.includes('unresponsive') || q.includes('check in') || q.includes('no response');
    const isCold = q.includes('cold') || q.includes('intro') || q.includes('first outreach') || q.includes('prospecting');

    if (isStalled) {
      return {
        content: `### Consultative Follow-Up Email: Re-Engaging a Stalled Proposal

When an executive proposal stalls, avoid sending passive *"just checking in"* messages. Instead, use a consultative **permission-to-close or pivot** framework:

---

**Subject**: Priorities check regarding [Company Name]'s evaluation

**Body**:
> Hi [Prospect First Name],
>
> I hope you are having a productive week.
>
> I wanted to circle back regarding the proposal we shared recently for [Company Name]. Typically when conversations pause at this stage, it means one of three things:
>
> 1. **Priorities have shifted** and this initiative has been moved to a later quarter.
> 2. **You need additional data or ROI calculations** for internal executive buy-in.
> 3. **You have decided to proceed in a different direction**, which is completely fine too.
>
> Which of these best reflects where things stand on your end?
>
> Either way, I am happy to adjust our timeline or share our latest benchmark study on sales efficiency whenever the timing is right.
>
> Best regards,  
> **${userName}**  
> ${myCompany}

---

#### 🎯 Why This Approach Converts:
* **Removes Pressure & Guilt**: Acknowledging that internal priorities shift takes the awkwardness out of responding.
* **Low-Friction Multiple Choice**: It takes less than 10 seconds for an executive to reply with "1", "2", or "3".
* **Preserves Long-Term Trust**: Shows professionalism and consultative respect for their timeline.

Would you like me to customize this email for a specific company or contact in your CRM?`,
        suggestions: [
          'Customize this email for a specific deal',
          'Draft a phone follow-up voicemail script',
          'What deals should we focus on closing this week?',
          'How to handle the "no budget right now" objection',
        ],
      };
    }

    if (isCold) {
      return {
        content: `### High-Converting Enterprise Cold Outreach Email

Here is a 3-part consultative cold email framework designed for high reply rates:

---

**Subject**: Efficiency benchmark for [Company Name]'s sales operations

**Body**:
> Hi [Prospect First Name],
>
> Noticed [Company Name]'s recent growth and expansion in [Industry]. As sales teams scale past 20 reps, manual CRM data entry and pipeline blind spots usually drain 4+ hours per rep each week.
>
> We help high-growth teams automate lead scoring, pipeline insights, and follow-ups directly in the workflow—delivering an average **34% increase in sales rep velocity** within 60 days.
>
> Are you open to a brief 10-minute ideas exchange this Thursday at 2 PM to see how we compare to your current stack?
>
> Best regards,  
> **${userName}**  
> ${myCompany}

---

Would you like me to tailor this for a specific industry or prospect in your pipeline?`,
        suggestions: [
          'Tailor this email for a specific prospect',
          'Draft a follow-up for stalled proposals',
          'What deals should we focus on closing this week?',
        ],
      };
    }

    // General consultative sales follow-up
    return {
      content: `### High-Converting Sales Follow-Up Template

Here is a consultative follow-up email tailored for your active prospects:

---

**Subject**: Next steps & ROI framework for [Company Name]

**Body**:
> Hi [Prospect First Name],
>
> Thank you for taking the time to discuss your sales goals for [Company Name].
>
> Based on our conversation, your primary objective is reducing administrative overhead and giving your team predictive visibility into deal health.
>
> I put together a tailored summary showing how SmartCRM AI delivers an estimated **34% increase in sales productivity** within the first 60 days.
>
> Do you have 15 minutes this Thursday at 2:00 PM to review the implementation outline and answer any technical questions?
>
> Looking forward to your thoughts.
>
> Best regards,  
> **${userName}**  
> ${myCompany}

---

Would you like me to customize this with specific numbers for one of your active CRM deals?`,
      suggestions: [
        'Draft a re-engagement email for stalled proposals',
        'What deals should we focus on closing this week?',
        'Show my highest score leads to contact today',
      ],
    };
  }

  // 2. FOCUS DEALS / CLOSING THIS WEEK (e.g., "What deals should we focus on closing this week?")
  const isFocusDealsQuery =
    (q.includes('focus') || q.includes('priorit') || q.includes('which deal') || q.includes('what deal') || q.includes('deals to close') || q.includes('close this week') || q.includes('closing this week')) &&
    (q.includes('deal') || q.includes('close') || q.includes('closing') || q.includes('week') || q.includes('month'));

  if (isFocusDealsQuery) {
    const openDeals = context.deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
    const priorityOrder: Record<string, number> = {
      Negotiation: 1,
      Proposal: 2,
      Discovery: 3,
    };

    const sortedDeals = [...openDeals].sort((a, b) => {
      const stageA = priorityOrder[a.stage] || 4;
      const stageB = priorityOrder[b.stage] || 4;
      if (stageA !== stageB) return stageA - stageB;
      return b.value - a.value;
    });

    const topFocusDeals = sortedDeals.slice(0, 4);
    const totalFocusValue = topFocusDeals.reduce((sum, d) => sum + d.value, 0);

    let dealsBreakdown = '';
    topFocusDeals.forEach((deal, idx) => {
      const action =
        deal.stage === 'Negotiation'
          ? 'Finalize legal redlines and confirm procurement signature date before Friday.'
          : deal.stage === 'Proposal'
          ? 'Deliver customized ROI model and schedule stakeholder alignment check-in.'
          : 'Conduct technical deep-dive with the engineering lead to qualify decision timeline.';

      dealsBreakdown += `\n${idx + 1}. **${deal.title}** (${deal.companyName})\n   • **Value**: $${deal.value.toLocaleString()} | **Stage**: \`${deal.stage}\` | **Win Probability**: ${deal.probability}%\n   • **Target Action**: ${action}\n`;
    });

    return {
      content: `### High-Priority Deals to Focus on Closing This Week

You currently have **${openDeals.length} open deals** in the pipeline. Here are the **top ${topFocusDeals.length} deals** totaling **$${totalFocusValue.toLocaleString()}** that represent your highest conversion velocity this week:

${dealsBreakdown}

---

#### 💡 Weekly Closing Action Plan:
1. **Monday/Tuesday**: Check in with economic buyers on Negotiation-stage accounts to address final legal or commercial queries.
2. **Wednesday**: Reconnect with Proposal-stage prospects to answer questions on pricing tiers and contract terms.
3. **Thursday/Friday**: Secure verbal confirmation or final signatures with targeted quarterly incentive deadlines.

Which of these deals would you like to build a detailed action plan or follow-up email for?`,
      suggestions: [
        `Draft follow-up email for ${topFocusDeals[0]?.companyName || 'top deal'}`,
        `What is our total weighted pipeline value?`,
        `Show me leads that need immediate follow-up`,
        `Draft a consultative email for a stalled proposal`,
      ],
    };
  }

  // 3. SPECIFIC ACCOUNT STRATEGY (e.g., "for hostinger i want to win a deal of $50K", "how to close Acme Corp")
  let extractedCompany = '';
  let extractedValue = '';

  const valueMatch = userMessage.match(/\$([0-9]+(?:\,[0-9]{3})*(?:\.[0-9]+)?k?|\b[0-9]+k\b)/i);
  if (valueMatch) extractedValue = valueMatch[0].toUpperCase();

  // Match patterns like "for Hostinger", "with Hostinger", "at Hostinger", "win Hostinger"
  const companyPatterns = [
    /(?:for|at|with)\s+([A-Za-z0-9\.\-\_]+)/i,
    /(?:win|close|target)\s+(?:a\s+deal\s+with\s+)?([A-Za-z0-9\.\-\_]+)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = userMessage.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim().toLowerCase();
      if (!GENERIC_WORDS.has(candidate) && candidate.length > 1) {
        extractedCompany = match[1].trim();
        break;
      }
    }
  }

  if (extractedCompany || (extractedValue && (q.includes('win') || q.includes('close') || q.includes('deal')))) {
    const companyName = extractedCompany || 'the target account';
    let dealValue = extractedValue || '$50,000';
    if (!dealValue.startsWith('$')) dealValue = '$' + dealValue;

    return {
      content: `### Strategic Game Plan: Closing a ${dealValue} Deal with **${companyName}**

To land and close a **${dealValue} enterprise contract** with **${companyName}**, you need a multi-threaded, value-driven strategy tailored to their operational scale:

---

#### 1. Stakeholder Mapping & Executive Alignment
For a ${dealValue} contract, secure alignment across three core roles:
* **The Economic Buyer** *(VP / C-Level)*: Focused on bottom-line ROI, payback period (<6 months), and risk mitigation.
* **The Technical Champion** *(Head of Engineering / Infrastructure)*: Evaluates uptime, scalability, API integration simplicity, and security compliance.
* **The Operational Leader** *(Director of Operations / Support)*: Focused on team adoption, automation of manual tasks, and workflow speed.

---

#### 2. Phased 4-Week Closing Roadmap
* **Week 1: Discovery & Quantitative Business Case**
  * Anchor discovery around their core scaling bottlenecks.
  * Reframe the conversation: show how inaction or manual overhead currently costs them more than ${dealValue} annually.
* **Week 2: Tailored Proof of Concept (POC)**
  * Deliver a demonstration mapped strictly to ${companyName}'s high-impact workflows.
  * Agree on 2–3 measurable success criteria upfront.
* **Week 3: Procurement & Security Fast-Track**
  * Provide SOC2 and security documentation proactively to avoid legal bottlenecks.
  * Align with finance on payment milestones or annual upfront incentives.
* **Week 4: Executive Closing & Sign-off**
  * Propose a quarter-end onboarding package or priority SLA to secure signatures by deadline.

---

#### 3. High-Impact Discovery Questions for ${companyName}
1. *"What strategic initiatives at ${companyName} will this deployment directly accelerate over the next 12 months?"*
2. *"If our benchmark numbers exceed your criteria, what does your procurement and legal sign-off process look like?"*
3. *"Who else on your leadership team will need to review technical specs before we finalize terms?"*

Would you like me to draft an executive outreach email for ${companyName}, or create this deal in your CRM pipeline?`,
      suggestions: [
        `Draft cold outreach email to ${companyName} executive`,
        `Create a ${dealValue} deal for ${companyName} in CRM`,
        `What objections might ${companyName} raise?`,
        `What deals should we focus on closing this week?`,
      ],
    };
  }

  // 4. LEADS & PROSPECTS INQUIRY (e.g., "who are my highest score leads?", "who to call today?")
  if (q.includes('lead') || q.includes('who to call') || q.includes('prospect') || q.includes('contact today') || q.includes('top leads')) {
    const leads = [...context.leads].sort((a, b) => b.score - a.score);
    const topLeads = leads.slice(0, 4);

    let leadsSummary = '';
    topLeads.forEach((lead, idx) => {
      leadsSummary += `\n${idx + 1}. **${lead.name}** — ${lead.title || 'Executive'} at **${lead.company}**\n   • **AI Score**: \`${lead.score}/100\` (${lead.score >= 80 ? '🔥 Hot Lead' : '⚡ Warm Prospect'})\n   • **Estimated Value**: $${lead.estimatedValue.toLocaleString()} | **Stage**: ${lead.stage}\n   • **Recommended Next Step**: ${lead.nextAction || 'Schedule discovery call to validate Q3 procurement timeline.'}\n`;
    });

    return {
      content: `### AI-Prioritized Leads for Today

Here are your **highest-scoring leads** ranked by AI buying intent and strategic value:

${leadsSummary}

---

#### 💡 Action Recommendation:
Focus your morning call block on **${topLeads[0]?.name || 'your top lead'}** (${topLeads[0]?.company || 'Key Account'}). With an AI score of **${topLeads[0]?.score || 94}/100**, this prospect exhibits strong buying signals and active evaluation indicators.

Would you like me to draft an outreach email for any of these prospects?`,
      suggestions: [
        `Draft outreach email for ${topLeads[0]?.name || 'top lead'}`,
        `How is the lead score calculated?`,
        `What deals should we focus on closing this week?`,
        `Show pipeline conversion metrics`,
      ],
    };
  }

  // 5. PIPELINE HEALTH & FORECAST (e.g., "what is our pipeline health?", "revenue forecast", "metrics")
  if (q.includes('pipeline') || q.includes('forecast') || q.includes('revenue') || q.includes('metric') || q.includes('health') || q.includes('analytics')) {
    const m = context.metrics;
    return {
      content: `### Sales Pipeline & Revenue Forecast Overview

Here is the current operational health of your sales pipeline:

* **Total Pipeline Value**: **$${m.totalPipelineValue.toLocaleString()}** across **${m.openDeals} active deals**
* **Weighted Forecast**: **$${m.weightedPipelineValue.toLocaleString()}** (adjusted by probability)
* **Closed-Won Revenue**: **$${m.closedWonValue.toLocaleString()}**
* **Win Rate**: **${m.winRatePercentage}%**
* **Active Prospects**: **${m.activeLeads} qualified leads**
* **Pending Tasks**: **${m.pendingTasks} tasks** awaiting completion

---

#### 📊 Pipeline Analysis:
* **Pipeline Coverage**: Your pipeline-to-quota ratio is healthy, but accelerating deals in the **Negotiation** stage will be critical to locking in revenue this month.
* **Velocity Driver**: Deals where follow-up tasks are completed within 24 hours show a **38% higher win rate**.

Would you like to review specific deals or draft follow-up communications?`,
      suggestions: [
        'What deals should we focus on closing this week?',
        'Who are my highest score leads?',
        'Draft a consultative follow-up email for a stalled proposal',
      ],
    };
  }

  // 6. OBJECTION HANDLING (e.g., "how to handle budget objection", "competitor", "too expensive")
  if (q.includes('objection') || q.includes('too expensive') || q.includes('no budget') || q.includes('competitor') || q.includes('timing') || q.includes('discount')) {
    return {
      content: `### Consultative Objection Handling Framework

When a prospect pushes back on **budget, timing, or price**, use the **Acknowledge, Reframe, and Validate** technique:

---

#### Framework: *"We don't have budget right now"*
1. **Acknowledge & Validate**:
   > *"I completely understand. Budget cycles are tightly managed right now, and nobody wants to invest in software that isn't mission-critical."*
2. **Reframe from Cost to ROI**:
   > *"Most of our current enterprise clients felt the exact same way before starting. What they discovered was that manual CRM overhead was actually costing them $4,000+ per rep each month in lost selling time."*
3. **Low-Risk Next Step**:
   > *"We don't need to discuss contracts or pricing today. Would you be open to a 15-minute pilot review so you have the numbers ready when your next budget cycle unlocks?"*

---

#### Key Principles:
* Never argue about price; shift the focus to **value and the cost of inaction**.
* Offer smaller initial scopes or phased rollouts to lower commitment thresholds.

Would you like specific objection rebuttals for a named competitor or pricing tier?`,
      suggestions: [
        'How do I handle a request for a 20% discount?',
        'What if they say they are happy with their current tool?',
        'Draft a consultative follow-up email for a stalled proposal',
      ],
    };
  }

  // 7. DEFAULT CONVERSATIONAL RESPONSE (Direct, thoughtful, contextual)
  return {
    content: `### SmartCRM Sales Advisory

Hello! I am your **SmartCRM AI Copilot**. I have live access to your CRM database, containing **${context.deals.length} deals** ($${context.metrics.totalPipelineValue.toLocaleString()} pipeline), **${context.leads.length} leads**, and **${context.contacts.length} customer accounts**.

Here is how I can accelerate your sales workflow right now:

1. **Strategic Account Planning**: Ask me how to win a deal with any company (e.g., *"for Hostinger I want to win a deal of $50K"*).
2. **Weekly Closing Prioritization**: Ask *"What deals should we focus on closing this week?"* for a tactical breakdown of closing actions.
3. **Outreach & Email Drafting**: Request tailored follow-ups (e.g., *"Draft a consultative follow-up email for a stalled proposal"*).
4. **Lead Qualification**: Inquire about high-intent prospects to contact today.
5. **Objection Handling**: Get word-for-word scripts for price, budget, or competitor objections.

What goal would you like to tackle first?`,
    suggestions: [
      'What deals should we focus on closing this week?',
      'Draft a consultative follow-up email for a stalled proposal',
      'Show my highest score leads to call today',
      'Give me a strategy to close a $50k enterprise account',
    ],
  };
}
