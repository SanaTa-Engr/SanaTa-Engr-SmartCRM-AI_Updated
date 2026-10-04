# SmartCRM AI — Product Requirements Document (PRD)

**Document Version:** 3.0  
**Status:** Approved / Production  
**Target Audience:** Product Management, Engineering, RevOps, Sales Leadership  
**Updated:** October 2026  
**Confidentiality:** Internal & Customer Engineering Reference  

---

## Executive Summary

**SmartCRM AI** is an intelligent, high-velocity customer relationship management platform engineered for modern B2B sales teams, revenue operations (RevOps), account executives (AEs), and sales development reps (SDRs). 

Release 3.0 introduces native **Google Maps Platform Lead Discovery & Interactive Spatial Intelligence** alongside an overhauled, crystal-clear **Sales Pipeline Funnel**, bulk CSV/Excel file ingestion, predictive AI qualification scoring (0-100), automated profile dossiers, contextual outreach drafting, and an always-on conversational sales copilot powered by Google Gemini AI models.

---

## 1. Product Vision & Strategic Objectives

Traditional CRMs function as passive administrative databases requiring 30–45 minutes of daily manual data entry while providing little prescriptive guidance. SmartCRM AI fundamentally re-architects the CRM into an **active revenue acceleration engine**:

1. **Geospatial Prospect Discovery:** Instantly discovers verified commercial businesses in any target territory or niche via Google Maps Platform, complete with addresses, ratings, phone numbers, websites, and 1-click pipeline conversion.
2. **Transparent Sales Funnel:** Organizes deal progression into an intuitive 5-step progression funnel (`New Inbound` → `Contacted` → `Qualified` → `Proposal Sent` → `Closed Won`) with explicit qualification criteria, stage totals, and 1-click stage advancement buttons on every card.
3. **Predictive Lead Triage:** Eliminates guesswork by quantitatively scoring prospects (0–100) using firmographics, budget tier, and intent signals, generating human-readable reasoning and prescriptive next steps.
4. **High-Throughput File Ingestion:** Ingests up to 10MB of CSV and Microsoft Excel (.xlsx/.xls) data with automatic header alias mapping, email validation, and duplicate prevention.
5. **Zero-Latency Outreach & Copilot:** Drafts tailored multi-tone follow-up emails in sub-second response times and offers a conversational sales copilot grounded in live CRM pipeline data.

### 1.1 Target Success Metrics & KPIs

| Metric / KPI | Historical Baseline | SmartCRM AI v3.0 Target | Measurement Methodology |
| :--- | :--- | :--- | :--- |
| **Daily CRM Admin Time** | 45 mins / sales rep / day | **< 15 mins / rep / day** | Session duration analytics |
| **Prospect Discovery to CRM Ingestion** | 20 mins per 10 prospects (manual copy-paste) | **< 10 seconds** (1-click / bulk add) | Google Maps lead creation logs |
| **Lead Qualification Speed** | 4–8 hours post-inquiry | **< 5 minutes** | Automated scoring latency |
| **Outreach Draft Time** | 15 mins / personalized email | **< 30 seconds** | Gemini AI drafting events |
| **Pipeline Stage Clarity & Conversion** | Stale leads abandoned across vague stages | **> 92% active stage accountability** | Stage transition audit logs |
| **Pipeline Forecast Variance** | 35% margin of error | **< 12% margin of error** | Quarterly closed-won comparison |

---

## 2. User Personas & Core Journeys

### 2.1 Field Sales & Territory Account Executives (AEs)
* **Core Goal:** Identify high-value commercial prospects in designated geographic territories, qualify opportunities, and advance deals efficiently to close.
* **Primary Workflows:**
  - Searching Google Maps for businesses in specific cities (e.g. "Software companies in Austin, TX" or "Medical clinics in Chicago, IL").
  - Evaluating physical address, rating credibility, and digital presence directly on the interactive map.
  - Adding prospects into the CRM pipeline with 1-click.
  - Advancing deals across the 5-stage funnel using 1-click forward buttons (`Advance to Contacted ➔`, `Advance to Qualified ➔`, `Send Proposal ➔`, `Mark Won 🏆`).

### 2.2 Sales Development Representatives (SDRs)
* **Core Goal:** High-volume prospect discovery, data enrichment, automated triage, and personalized outbound engagement.
* **Primary Workflows:**
  - Utilizing Google Maps niche presets (Restaurants, Cafes, Law Firms, Tech, Real Estate) to rapidly pull 20+ leads.
  - Using "Add All to Pipeline" to batch-import verified businesses into the CRM.
  - Running predictive AI Fit Scoring to prioritize top-tier opportunities.
  - Drafting tailored multi-tone sales emails tailored to the lead's industry and pain points.

### 2.3 VP of Sales & Revenue Operations (RevOps)
* **Core Goal:** Accurate pipeline forecasting, duplicate record prevention, sales velocity tracking, and clean CRM hygiene.
* **Primary Workflows:**
  - Monitoring total pipeline value across stages in the interactive funnel bar.
  - Reviewing conversion drop-offs between stages.
  - Auditing bulk file imports and source distributions (Inbound Web, Outbound SDR, Google Maps, Referral, Conference).

---

## 3. System Architecture & Technical Specifications

| Layer | Technology | Functionality & Responsibilities |
| :--- | :--- | :--- |
| **Frontend Client** | React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts | Single-page application, split-view spatial discovery layout, responsive Kanban board, and sub-100ms interactions |
| **Google Maps Platform** | `@vis.gl/react-google-maps`, Google Places API (New) | Official React SDK, `<APIProvider>`, `<Map>` (`mapId: DEMO_MAP_ID`), `<AdvancedMarker>`, `<Pin>`, `<InfoWindow>`, Text Search REST API |
| **Backend Server & Proxy** | Express 4, Node.js, TSX Runtime | REST API endpoints, Google Maps proxying with server-side API key protection, duplicate detection, and file parsing |
| **AI Intelligence Engine** | Google Gemini 3.8 Flash SDK (`@google/genai`) | Predictive lead qualification scoring, email generator, executive dossiers, and conversational sales copilot |
| **Persistence Engine** | Dual-mode: JSON file store + Supabase PostgreSQL with RLS | Zero-configuration local storage with full relational schema, ACID guarantees, and cloud multi-tenancy |

---

## 4. Detailed Functional Requirements

### 4.1 Google Maps Lead Discovery & Spatial Intelligence

1. **Official SDK Integration:**
   - Powered by `@vis.gl/react-google-maps` using modern promise-based architecture.
   - Initialized via `<APIProvider apiKey={...} libraries={['marker', 'places']}>`.
   - Rendered using `<Map mapId="DEMO_MAP_ID" internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}>`.
   - Utilizes `<AdvancedMarker>` and `<Pin>` components with custom styling.

2. **Modern Places API (New):**
   - Discovers commercial prospects using the `https://places.googleapis.com/v1/places:searchText` REST API.
   - Employs strict `X-Goog-FieldMask` optimization (`places.id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,googleMapsUri,primaryTypeDisplayName,location`).
   - Server-side proxy (`/api/maps/search`) prevents client-side API key exposure.

3. **Interactive Map Synchronization:**
   - Selecting or hovering any lead card highlights the corresponding pin on Google Maps with a glowing pulsing ring.
   - Clicking any marker smoothly pans the camera, zooms in (`useMap()`), and opens a rich InfoWindow.
   - Unsaved businesses feature high-contrast indigo pins; businesses already active in the CRM pipeline display emerald pins with verified checkmark glyphs.

4. **Rich InfoWindow:**
   - Displays business name, category tag, star rating with review count, formatted address, direct phone link (`tel:`), website link, Google Maps navigation link, and instant **"+ Add to Leads Pipeline"** button.

5. **Niche & Location Presets:**
   - 1-click industry buttons: *Restaurants*, *Cafes & Bakeries*, *Software & Tech*, *Real Estate*, *Dental Clinics*, *Law Firms*, *Retail Boutiques*, *Fitness & Gyms*.
   - 1-click geographic presets: *San Francisco, CA*, *Austin, TX*, *New York, NY*, *Chicago, IL*, *Miami, FL*, *Seattle, WA*.

6. **Discovery Filters & Sorting:**
   - Filter by Minimum Star Rating (4.0+, 4.5+, 4.8+), Has Phone Number, Has Website, and Unsaved Leads Only.
   - Sort by Top Rated, Most Reviews, or Company Name (A-Z).

7. **3-Way Responsive View Layouts:**
   - Responsive toggle between **Split View** (sidebar list + interactive map), **Map Only** (fullscreen interactive map), and **List Only**.

8. **Bulk Lead Ingestion:**
   - "Add All (X) to Pipeline" action allowing batch conversion of all visible Google Maps prospects with automated deal value estimation ($2,500–$15,000) and initial AI fit scores.

9. **Duplicate Prevention:**
   - Prevents duplicate lead records by verifying both Google Maps `placeId` and normalized company name against existing CRM records.

---

### 4.2 Transparent Sales Pipeline & Lead Management

1. **Interactive Pipeline Stepper Funnel:**
   - Visual stage progression funnel bar showing deal count, dollar volume, and step numbers:  
     `Step 1: New Inbound` → `Step 2: Contacted` → `Step 3: Qualified` → `Step 4: Proposal Sent` → `Step 5: Closed Won` (plus `Closed Lost`).
   - Clicking any stage filters the view or focuses the column.

2. **Clear Stage Definitions:**
   - Each Kanban column header defines its qualification criteria:
     - **New Inbound:** Fresh discovery & unprocessed leads
     - **Contacted:** Outreach started (calls, emails, intro)
     - **Qualified:** Budget, authority & interest verified
     - **Proposal Sent:** Formal contract, pricing or quote submitted
     - **Closed Won:** Contract signed, deal converted to customer
     - **Closed Lost:** Disqualified, unresponsive or lost to competitor
   - Column-specific "+ Add to [Stage]" quick buttons.
   - Empty column guidance states.

3. **1-Click Stage Advancement:**
   - Prominent action buttons on every card:
     - `Advance to Contacted ➔`
     - `Advance to Qualified ➔`
     - `Advance to Qualified ➔`
     - `Send Proposal ➔`
     - `Mark Won 🏆`
     - Back-step button (`⬅`) to retreat a stage if needed
     - Direct jump dropdown to transition to any stage.

4. **Google Maps Origin Badges:**
   - Leads discovered via Google Maps display a distinct `📍 Google Maps` pill, physical address preview, and a direct link to open the business listing on Google Maps.

5. **Predictive AI Fit Scoring:**
   - Evaluates prospects on a 0–100 scale:
     - **High Fit (80–100):** Emerald badge
     - **Good Fit (60–79):** Amber badge
     - **Low Fit (< 60):** Slate badge
   - Transparent scoring rationales and recommended next actions.

6. **Smart Sales Actions:**
   - Single-click triggers for AI Profile Dossier, AI Follow-Up Email Drafter, Lead Editing, and Deletion.

7. **Dense Table View:**
   - Tabular representation with sortable columns, location links, deal values, and quick stage transition triggers.

---

### 4.3 Automated Bulk Lead Import Engine (CSV / XLSX)

1. **File Ingestion:** Native parsing of CSV and Microsoft Excel (.xlsx / .xls) files up to 10MB.
2. **Intelligent Header Mapping:** Matches spreadsheet columns to CRM fields with dropdown overrides.
3. **Source Normalization:** Enforces standard channels: *Inbound Web*, *Outbound SDR*, *Referral*, *Partner Ecosystem*, *Conference*, and *Google Maps*.
4. **Deduplication Engine:** Validates email syntax and filters duplicates against both the CRM database and file rows.
5. **Interactive Preview:** Color-coded breakdown of valid, duplicate, and invalid rows.
6. **Audit History Log:** Persistent ledger tracking import dates, filenames, success counts, and error reports.

---

### 4.4 Deal Pipeline & Revenue Tracking

1. **Deal Stages:** Discovery → Demo Scheduled → Proposal Sent → Negotiation → Closed Won / Closed Lost.
2. **Weighted Revenue Forecasts:** Calculates probability-adjusted pipeline totals for executive financial forecasting.
3. **Deal Risk Analyzer:** Flags stagnant deals and provides AI deal-winning recommendations.

---

### 4.5 AI Sales Copilot

1. **Grounded Sales Assistant:** Conversational sidebar assistant with real-time access to user pipeline metrics and customer accounts.
2. **Capabilities:** Answering pipeline queries, identifying at-risk deals, drafting custom proposals, and coaching sales tactics.

---

## 5. Security, Data Privacy & Governance

1. **Zero Client-Side Secret Exposure:** Google Maps API keys and Gemini API credentials are maintained on the backend proxy server and never exposed in client bundles.
2. **Multi-Tenant Data Isolation:** Supabase Row Level Security (RLS) policies enforce strict per-user boundaries (`auth.uid() = user_id`).
3. **Input Sanitization & Validation:** Strict payload caps, MIME-type checks, and regex validation on all search and import endpoints.

---

## 6. Non-Functional Requirements (NFRs)

| Category | Requirement Specification | Verification Method |
| :--- | :--- | :--- |
| **Performance** | Map initialization < 500ms; Places search response < 800ms; UI transitions < 100ms | Lighthouse & browser performance traces |
| **Availability** | 99.9% uptime with offline fallback mode and local JSON data persistence | Automated healthcheck polling (`/api/health`) |
| **Scalability** | Support 10,000+ active contacts and 5,000+ leads per account without UI stutter | Stress-testing data layers |
| **Compliance** | Zero deprecated Google Maps APIs; compliant with Google Maps Terms of Service | Internal usage attribution & audit checks |

---

## 7. Version History & Roadmap

| Version | Release Date | Key Deliverables |
| :--- | :--- | :--- |
| **v1.0** | July 2026 | Initial CRM MVP: Contacts, Companies, Leads list, and Deal tracking |
| **v2.0** | August 2026 | Gemini AI Integration: Lead scoring, email generator, and executive dashboard |
| **v2.4** | September 2026 | Automated Bulk Lead Import Engine (CSV/Excel) with header mapping and deduplication |
| **v3.0 (Current)** | **October 2026** | **Google Maps Platform Lead Discovery, Interactive Spatial Map View (`@vis.gl/react-google-maps`), and Overhauled 5-Stage Sales Funnel with 1-Click Advancement** |
