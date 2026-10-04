const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outputPath = path.join(process.cwd(), 'public', 'SmartCRM_AI_Product_Requirements_Document.pdf');

// Create document with standard Letter size and comfortable margins
const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 50, bottom: 50, left: 54, right: 54 },
  bufferPages: true,
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Theme Palette (Modern Indigo / Slate executive styling)
const PRIMARY = '#4F46E5';     // Indigo 600
const SECONDARY = '#0F172A';   // Slate 900
const TEXT = '#1E293B';        // Slate 800
const MUTED = '#64748B';       // Slate 500
const BORDER = '#CBD5E1';      // Slate 300
const BG_LIGHT = '#F8FAFC';    // Slate 50
const ACCENT_GREEN = '#059669';// Emerald 600

// Helper functions for layout
function drawHeader(title, subtitle = null) {
  doc.rect(54, doc.y, 504, 3).fill(PRIMARY);
  doc.y += 10;
  doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(18).text(title);
  if (subtitle) {
    doc.fillColor(MUTED).font('Helvetica').fontSize(10).text(subtitle);
  }
  doc.y += 10;
}

function drawSectionHeading(number, title) {
  if (doc.y > 670) {
    doc.addPage();
  } else {
    doc.y += 12;
  }
  const headingText = number ? `${number}. ${title}` : title;
  doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(13).text(headingText);
  doc.y += 4;
  doc.rect(54, doc.y, 504, 1).fill(BORDER);
  doc.y += 8;
  doc.fillColor(TEXT).font('Helvetica').fontSize(9.5);
}

function drawSubHeading(title) {
  if (doc.y > 690) doc.addPage();
  doc.y += 6;
  doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(10.5).text(title);
  doc.y += 4;
  doc.fillColor(TEXT).font('Helvetica').fontSize(9.5);
}

function drawParagraph(text) {
  if (doc.y > 700) doc.addPage();
  doc.fillColor(TEXT).font('Helvetica').fontSize(9.5).text(text, {
    lineGap: 3,
    align: 'left',
  });
  doc.y += 6;
}

function drawBullet(title, description = null) {
  if (doc.y > 700) doc.addPage();
  const indent = 68;
  doc.circle(indent - 6, doc.y + 5, 2).fill(PRIMARY);
  
  if (description) {
    doc.font('Helvetica-Bold').fillColor(SECONDARY).text(title + ': ', indent, doc.y, { continued: true });
    doc.font('Helvetica').fillColor(TEXT).text(description, { lineGap: 2 });
  } else {
    doc.font('Helvetica').fillColor(TEXT).text(title, indent, doc.y, { lineGap: 2 });
  }
  doc.x = 54;
  doc.y += 4;
}

function drawCallout(title, text) {
  if (doc.y > 650) doc.addPage();
  const startY = doc.y;
  doc.rect(54, startY, 504, 52).fill(BG_LIGHT);
  doc.rect(54, startY, 4, 52).fill(PRIMARY);
  
  doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(9.5).text(title, 68, startY + 8);
  doc.fillColor(TEXT).font('Helvetica').fontSize(8.5).text(text, 68, startY + 22, { width: 470, lineGap: 2 });
  doc.y = startY + 60;
}

function drawTable(headers, rows, colWidths) {
  if (doc.y > 630) doc.addPage();
  
  const startX = 54;
  let currentY = doc.y;
  
  // Header row
  doc.rect(startX, currentY, 504, 20).fill(SECONDARY);
  let curX = startX;
  headers.forEach((h, i) => {
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5).text(h, curX + 6, currentY + 5, {
      width: colWidths[i] - 12,
      align: 'left',
    });
    curX += colWidths[i];
  });
  
  currentY += 20;
  
  rows.forEach((row, rowIdx) => {
    if (currentY > 710) {
      doc.addPage();
      currentY = doc.y;
    }
    
    const rowBg = rowIdx % 2 === 0 ? '#FFFFFF' : BG_LIGHT;
    doc.rect(startX, currentY, 504, 18).fill(rowBg);
    doc.rect(startX, currentY, 504, 18).stroke(BORDER);
    
    curX = startX;
    row.forEach((cell, cellIdx) => {
      doc.fillColor(TEXT).font(cellIdx === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).text(String(cell), curX + 6, currentY + 4.5, {
        width: colWidths[cellIdx] - 12,
        align: 'left',
      });
      curX += colWidths[cellIdx];
    });
    
    currentY += 18;
  });
  
  doc.y = currentY + 8;
}

// ==========================================
// DOCUMENT CONTENT
// ==========================================

// --- COVER BANNER ---
doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(24).text('SmartCRM AI', { align: 'left' });
doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(16).text('Product Requirements Document (PRD) — Release 3.0', { align: 'left' });
doc.fillColor(MUTED).font('Helvetica').fontSize(9.5).text('Version 3.0  |  Target: Product, Engineering, RevOps  |  Updated: October 2026');
doc.y += 12;

drawCallout(
  'Executive Summary',
  'SmartCRM AI is a next-generation customer relationship management platform engineered for modern B2B revenue teams, RevOps, and SDRs. Release 3.0 delivers native Google Maps Platform Lead Discovery & Interactive Spatial Intelligence, an overhauled 5-stage sales funnel with 1-click advancement, automated bulk file ingestion, and Google Gemini AI predictive scoring and sales copilot automation.'
);

// --- 1. PRODUCT VISION & OBJECTIVES ---
drawSectionHeading('1', 'Product Vision & Strategic Objectives');
drawParagraph('Traditional CRMs function as passive administrative recording tools. SmartCRM AI transforms CRM software into an active revenue acceleration engine through geospatial prospect intelligence, transparent pipeline progression, and predictive AI automation.');

drawSubHeading('1.1 Core Value Drivers');
drawBullet('Google Maps Geospatial Prospecting', 'Discover verified local businesses via modern Google Places API (New) with interactive maps, rich InfoWindows, and 1-click CRM conversion.');
drawBullet('Transparent Sales Funnel', 'Clear 5-step sales funnel (New Inbound -> Contacted -> Qualified -> Proposal Sent -> Closed Won) with column value aggregates and 1-click card advancement.');
drawBullet('Automated Lead Intelligence', 'Quantitatively score leads on a 0-100 scale using predictive qualification signals with transparent rationales and next steps.');
drawBullet('High-Throughput File Ingestion', 'Ingest up to 10MB of CSV/Excel files with intelligent header auto-mapping and real-time duplicate suppression.');
drawBullet('Zero Administrative Overhead', 'Generate multi-tone customized outreach and executive meeting summaries with sub-second AI latency.');

drawSubHeading('1.2 Success Metrics & KPIs');
drawTable(
  ['KPI / Metric', 'Target Baseline', 'Target Objective (v3.0)', 'Measurement Method'],
  [
    ['Rep Daily CRM Time', '45 mins/day manual entry', '< 15 mins/day', 'Session duration analytics'],
    ['Prospect Discovery to CRM', '20 mins per 10 prospects', '< 10 seconds (1-click / bulk)', 'Google Maps lead logs'],
    ['Lead Qualification Speed', '4-8 hours post-inquiry', '< 5 minutes', 'AI automated scoring latency'],
    ['Outreach Drafting Latency', '15 mins/email', '< 30 seconds', 'Rep email generation logs'],
    ['Pipeline Stage Clarity', 'Stale leads in vague stages', '> 92% active stage accountability', 'Stage transition audit logs'],
  ],
  [135, 125, 120, 124]
);

// --- 2. TARGET USER PERSONAS ---
drawSectionHeading('2', 'Target User Personas & Workflows');

drawSubHeading('2.1 Field Sales & Territory Account Executives (AEs)');
drawBullet('Pain Points', 'Discovering target territory prospects, evaluating company credibility, managing late-stage deal momentum.');
drawBullet('Core Workflows', 'Searching Google Maps in target cities, evaluating ratings and websites on the interactive map, converting prospects with 1-click, and moving deals across the 5-stage funnel.');

drawSubHeading('2.2 Sales Development Representatives (SDRs)');
drawBullet('Pain Points', 'Manual prospect sourcing, repetitive cold email drafting, and tedious spreadsheet data entry.');
drawBullet('Core Workflows', 'Using Google Maps niche presets (Restaurants, Tech, Real Estate) to bulk-import 20+ leads, running predictive AI Fit Scoring, and generating personalized outbound outreach.');

drawSubHeading('2.3 VP of Sales & Revenue Operations (RevOps)');
drawBullet('Pain Points', 'Pipeline forecast inaccuracies, duplicate lead records, and lack of visibility into sales stage velocity.');
drawBullet('Core Workflows', 'Monitoring total pipeline value across stages in the interactive funnel bar, tracking conversion drop-offs, and auditing lead sources.');

// --- 3. SYSTEM ARCHITECTURE & DATA MODEL ---
drawSectionHeading('3', 'System Architecture & Data Model');
drawParagraph('SmartCRM AI employs a modern reactive full-stack architecture engineered for low-latency spatial discovery, seamless offline operation, and optional cloud synchronization via Supabase PostgreSQL.');

drawTable(
  ['Layer / Subsystem', 'Technology Stack', 'Operational Responsibility'],
  [
    ['Frontend Client', 'React 19, TypeScript, Tailwind CSS v4', 'Single-page application, responsive Kanban, split-view spatial discovery'],
    ['Google Maps Platform', '@vis.gl/react-google-maps, Places API (New)', 'Official React SDK, <Map>, <AdvancedMarker>, <Pin>, <InfoWindow>'],
    ['API & Backend Server', 'Express, Node.js, TSX Runtime', 'RESTful CRUD endpoints, secure Maps proxying, deduplication, batch import'],
    ['AI Engine', 'Google Gemini 3.8 Flash SDK (@google/genai)', 'Lead qualification scoring, email drafting, sales copilot assistant'],
    ['Persistence Engine', 'Dual-mode: JSON store + Supabase PostgreSQL', 'Resilient local caching + enterprise RLS multi-tenancy'],
  ],
  [110, 150, 244]
);

// --- 4. DETAILED FUNCTIONAL REQUIREMENTS ---
drawSectionHeading('4', 'Detailed Functional Requirements');

drawSubHeading('4.1 Google Maps Lead Discovery & Interactive Map View');
drawBullet('Official SDK & Map Integration', 'Built using @vis.gl/react-google-maps with APIProvider, Map (DEMO_MAP_ID), and AdvancedMarker elements.');
drawBullet('Modern Places API (New)', 'Uses https://places.googleapis.com/v1/places:searchText with field masking for maximum performance and cost optimization.');
drawBullet('Interactive Spatial Sync', 'Selecting a card highlights the map marker with glowing pulsing ring; clicking markers pans the camera and opens rich InfoWindows.');
drawBullet('Visual Marker Pins', 'Unsaved businesses display indigo pins; saved CRM leads display emerald pins with verified checkmark icons.');
drawBullet('Rich InfoWindows', 'Displays business name, category, rating stars, address, phone (tel:), website, Maps directions link, and "+ Add to Pipeline" CTA.');
drawBullet('Niches & Location Presets', '1-click industry buttons (Restaurants, Tech, Real Estate, Law, Healthcare) and city presets (SF, Austin, NYC, Chicago, Miami).');
drawBullet('Discovery Filters & Sorting', 'Filter by Minimum Rating (4.0+, 4.5+), Has Phone, Has Website, Unsaved Only; sort by rating, reviews, or name.');
drawBullet('3-Way View Layouts', 'Responsive toggle between Split View (List + Map), Map Only (Fullscreen), and List Only.');
drawBullet('Bulk Pipeline Ingestion', '"Add All (X) to Pipeline" action allowing batch conversion of verified Google Maps listings into CRM leads.');
drawBullet('Duplicate Prevention', 'Real-time cross-checks by Google Maps placeId and normalized company name prevent duplicate records.');

drawSubHeading('4.2 Transparent Sales Pipeline & Lead Management');
drawBullet('Interactive Pipeline Stepper Funnel', 'High-level visual funnel across 5 progressive stages: New Inbound -> Contacted -> Qualified -> Proposal Sent -> Closed Won.');
drawBullet('Explicit Stage Definitions', 'Each Kanban column header defines its qualification criteria with total deal counts and aggregate dollar values.');
drawBullet('1-Click Stage Advancement', 'Prominent forward action buttons on each card (Advance to Contacted ➔, Advance to Qualified ➔, Send Proposal ➔, Mark Won 🏆) and back-step arrow (⬅).');
drawBullet('Google Maps Origin Badges', 'Leads saved from Google Maps feature a dedicated badge, address preview, and a direct Google Maps navigation link.');
drawBullet('Predictive AI Fit Scoring', 'Prospects are scored 0-100 with color-coded badges (High Fit in green, Good Fit in amber, Low Fit in slate) with natural-language reasoning.');
drawBullet('Smart Sales Actions', 'Single-click triggers for AI Profile Dossier, AI Follow-Up Email Drafter, Lead Editing, and Deletion.');

drawSubHeading('4.3 Automated Bulk Lead Import Engine (CSV / XLSX)');
drawBullet('File Ingestion', 'Support for CSV and Microsoft Excel (.xlsx, .xls) files up to 10MB via drag-and-drop or file selector.');
drawBullet('Header Auto-Mapping', 'Intelligent matching of spreadsheet columns to CRM fields with dropdown overrides.');
drawBullet('Supported Lead Sources', 'Strict normalization: Inbound Web, Outbound SDR, Referral, Partner Ecosystem, Conference, Google Maps.');
drawBullet('Deduplication & Validation', 'Email syntax checks, duplicate detection against database and file rows with optional auto-skip.');
drawBullet('Live Preview & Audit Log', 'Breakdown of Total Rows, Valid Records, Duplicates, and Invalids with persistent timestamped audit history.');

drawSubHeading('4.4 Deal Pipeline & Revenue Forecasting');
drawBullet('Deal Stages', 'Discovery -> Demo Scheduled -> Proposal Sent -> Negotiation -> Closed Won -> Closed Lost.');
drawBullet('Weighted Pipeline Calculation', 'Probability-weighted forecasting based on stage conversion thresholds.');
drawBullet('Stage Transitions', 'Automated activity logging and timestamp updates upon any stage modification.');

drawSubHeading('4.5 AI Sales Copilot (Conversational Assistant)');
drawBullet('Pipeline Context Grounding', 'Contextual grounding injecting current user pipeline metrics directly into Gemini prompts.');
drawBullet('Capabilities', 'Answering pipeline queries, identifying at-risk deals, drafting bespoke sales proposals, and coaching sales tactics.');

// --- 5. SECURITY, PRIVACY & COMPLIANCE ---
drawSectionHeading('5', 'Security, Data Privacy & Governance');
drawParagraph('SmartCRM AI adheres strictly to modern enterprise data governance and API security principles:');
drawBullet('Zero Client-Side Secret Exposure', 'Google Maps Platform API keys and Gemini API credentials reside securely on the backend server proxy.');
drawBullet('Multi-Tenant Data Isolation', 'Supabase Row Level Security (RLS) policies enforce strict per-user boundaries (auth.uid() = user_id).');
drawBullet('Local Fallback Encryption', 'Offline browser storage isolates credentials and customer data per origin without external leak vectors.');
drawBullet('Input Sanitization & Validation', 'Strict file-type whitelisting, payload size limits, and regex validation on all ingest endpoints.');

// --- 6. NON-FUNCTIONAL REQUIREMENTS ---
drawSectionHeading('6', 'Non-Functional Requirements (NFRs)');
drawTable(
  ['Category', 'Specification', 'Verification Method'],
  [
    ['Performance', 'Map init < 500ms; Places search < 800ms; UI interactions < 100ms', 'Lighthouse & browser performance traces'],
    ['Availability', '99.9% uptime with instant client-side offline mode', 'Automated healthcheck polling (/api/health)'],
    ['Scalability', 'Support 10,000+ active contacts and 5,000+ leads per account', 'Stress-testing JSON & Postgres indexes'],
    ['Compliance', 'Zero deprecated Google Maps APIs; compliant with GMP Terms', 'Internal usage attribution & audit checks'],
  ],
  [90, 240, 174]
);

// --- 7. VERSION HISTORY ---
drawSectionHeading('7', 'Version History & Roadmap');
drawTable(
  ['Version', 'Release Date', 'Milestone Capabilities'],
  [
    ['v1.0', 'July 2026', 'Initial CRM MVP: Contacts, Companies, basic Leads list, and Deal tracking'],
    ['v2.0', 'August 2026', 'Gemini AI Integration: Lead scoring, email generator, and executive dashboard'],
    ['v2.4', 'September 2026', 'Automated Bulk Lead Import Engine (CSV/Excel) with header mapping and deduplication'],
    ['v3.0 (Current)', 'October 2026', 'Google Maps Platform Lead Discovery, Interactive Spatial Map View (@vis.gl/react-google-maps), and Overhauled 5-Stage Sales Funnel with 1-Click Advancement'],
  ],
  [80, 94, 330]
);

// Document Finalization
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  
  // Footer rule
  doc.rect(54, 742, 504, 0.5).fill(BORDER);
  
  // Footer text
  doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(
    'SmartCRM AI  —  Confidential & Proprietary Product Requirements Document (PRD v3.0)',
    54,
    750,
    { align: 'left' }
  );
  
  doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(
    `Page ${i + 1} of ${range.count}`,
    54,
    750,
    { align: 'right' }
  );
}

doc.end();

writeStream.on('finish', () => {
  console.log('PRD PDF generated successfully at:', outputPath);
  // Also copy to dist if dist exists
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    const distPath = path.join(distDir, 'SmartCRM_AI_Product_Requirements_Document.pdf');
    fs.copyFileSync(outputPath, distPath);
    console.log('Copied to dist at:', distPath);
  }
});
writeStream.on('error', (err) => {
  console.error('Error generating PRD PDF:', err);
});
