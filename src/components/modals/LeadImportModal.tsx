import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  Clock,
  Trash2,
  Eye,
  Layers,
  ChevronDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Lead, LeadImportRecord, LeadImportResult, SUPPORTED_LEAD_SOURCES, SupportedLeadSource } from '../../types';
import { api } from '../../api';

interface LeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingLeads: Lead[];
  onImportSuccess: (result: LeadImportResult) => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'result';

interface FieldMapping {
  name: string;
  company: string;
  email: string;
  phone: string;
  title: string;
  stage: string;
  source: string;
  estimatedValue: string;
  score: string;
  nextAction: string;
}

interface ParsedLeadRow {
  rowNumber: number;
  data: Partial<Lead>;
  status: 'valid' | 'invalid' | 'duplicate';
  errors: string[];
  warnings: string[];
}

const TARGET_FIELDS: { key: keyof FieldMapping; label: string; required: boolean; description: string }[] = [
  { key: 'name', label: 'Full Name', required: true, description: 'Lead or contact full name' },
  { key: 'company', label: 'Company Name', required: true, description: 'Organization / company name' },
  { key: 'email', label: 'Email Address', required: false, description: 'Work or personal email address' },
  { key: 'phone', label: 'Phone Number', required: false, description: 'Direct or mobile phone number' },
  { key: 'title', label: 'Job Title', required: false, description: 'Position, role or designation' },
  { key: 'stage', label: 'Lead Stage', required: false, description: 'New, Contacted, Qualified, Proposal, Won, Lost' },
  { key: 'source', label: 'Lead Source', required: false, description: 'Inbound Web, Outbound SDR, Referral, etc.' },
  { key: 'estimatedValue', label: 'Estimated Value ($)', required: false, description: 'Expected deal size in USD' },
  { key: 'score', label: 'Lead Score (1-100)', required: false, description: 'Numerical qualification score' },
  { key: 'nextAction', label: 'Next Action', required: false, description: 'Next scheduled sales milestone' },
];

export function LeadImportModal({
  isOpen,
  onClose,
  existingLeads,
  onImportSuccess,
}: LeadImportModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({
    name: '',
    company: '',
    email: '',
    phone: '',
    title: '',
    stage: '',
    source: '',
    estimatedValue: '',
    score: '',
    nextAction: '',
  });

  const [parsedRows, setParsedRows] = useState<ParsedLeadRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [filterPreview, setFilterPreview] = useState<'all' | 'valid' | 'invalid' | 'duplicate'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<LeadImportResult | null>(null);

  // Import history audit trail
  const [history, setHistory] = useState<LeadImportRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    } else {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setRawHeaders([]);
    setRawRows([]);
    setMapping({
      name: '',
      company: '',
      email: '',
      phone: '',
      title: '',
      stage: '',
      source: '',
      estimatedValue: '',
      score: '',
      nextAction: '',
    });
    setParsedRows([]);
    setErrorMessage(null);
    setImportResult(null);
    setFilterPreview('all');
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const records = await api.getLeadImportHistory();
      if (Array.isArray(records)) {
        setHistory(records);
      }
    } catch (err) {
      console.warn('Failed to fetch import history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  // 1. Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'Full Name,Company Name,Work Email,Phone Number,Job Title,Lead Stage,Lead Source,Estimated Value ($),Lead Score (1-100),Next Action\n' +
      'Samantha Reed,CloudScale Systems,samantha.reed@cloudscale.io,+1 (555) 234-5678,VP of Infrastructure,New,Inbound Web,45000,85,Schedule intro qualification call\n' +
      'David Chen,Nexis Logistics,david.chen@nexislogistics.com,+1 (555) 876-5432,Director of Operations,Contacted,Outbound SDR,32000,72,Send custom workflow teardown\n' +
      'Elena Rostova,Apex FinTech,elena@apexfintech.co,+1 (555) 345-9876,Head of Product,Qualified,Referral,75000,90,Present enterprise security overview\n' +
      'Marcus Brody,Vanguard Health,marcus.b@vanguardhealth.org,+1 (555) 432-1098,Chief Digital Officer,Proposal,Partner Ecosystem,120000,94,Deliver final MSA & SLA contract\n' +
      'Rachel Kim,Starlight Media,rachel@starlightmedia.net,+1 (555) 654-3210,Growth Lead,New,Conference,28000,68,Follow up after SaaS Expo keynote';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'smartcrm_lead_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. File Selection & Parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processSelectedFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processSelectedFile(dropped);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setErrorMessage(null);

    // Validation 1: File size (limit 10MB)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE_BYTES) {
      setErrorMessage('File exceeds the 10MB limit. Please upload a smaller file or split your dataset.');
      return;
    }

    // Validation 2: File type (.csv, .xlsx, .xls)
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      setErrorMessage('Unsupported file format. Please upload a valid CSV or Excel (.xlsx/.xls) file.');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    const reader = new FileReader();

    if (ext === 'csv') {
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          if (!text || text.trim().length === 0) {
            setErrorMessage('The uploaded file is empty. Please select a file with valid lead records.');
            setIsProcessing(false);
            return;
          }

          const workbook = XLSX.read(text, { type: 'string' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: '' });

          parseWorkbookData(jsonData);
        } catch (err: any) {
          setErrorMessage('Could not parse CSV file: ' + (err.message || 'Invalid format'));
          setIsProcessing(false);
        }
      };
      reader.readAsText(selectedFile);
    } else {
      // Excel binary
      reader.onload = (evt) => {
        try {
          const buffer = evt.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: '' });

          parseWorkbookData(jsonData);
        } catch (err: any) {
          setErrorMessage('Could not parse Excel spreadsheet: ' + (err.message || 'Invalid format'));
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const parseWorkbookData = (matrix: any[][]) => {
    if (!matrix || matrix.length < 2) {
      setErrorMessage('The file must contain a header row and at least one lead data row.');
      setIsProcessing(false);
      return;
    }

    const headers = matrix[0].map((h: any) => String(h || '').trim()).filter(Boolean);
    if (headers.length === 0) {
      setErrorMessage('No valid column headers found in the file.');
      setIsProcessing(false);
      return;
    }

    const rows = matrix.slice(1).filter((r: any[]) => r.some((cell: any) => String(cell || '').trim() !== ''));
    if (rows.length === 0) {
      setErrorMessage('The file has header columns but no data rows to import.');
      setIsProcessing(false);
      return;
    }

    setRawHeaders(headers);
    setRawRows(rows);

    // Auto-detect best column matches
    const autoMap: FieldMapping = {
      name: '',
      company: '',
      email: '',
      phone: '',
      title: '',
      stage: '',
      source: '',
      estimatedValue: '',
      score: '',
      nextAction: '',
    };

    const findMatch = (candidates: string[]) => {
      return headers.find(h => {
        const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        return candidates.some(c => clean.includes(c.toLowerCase().replace(/[^a-z0-9]/g, '')));
      }) || '';
    };

    autoMap.name = findMatch(['fullname', 'name', 'contactname', 'leadname', 'lead']);
    autoMap.company = findMatch(['companyname', 'company', 'organization', 'account', 'business']);
    autoMap.email = findMatch(['workemail', 'email', 'emailaddress', 'mail']);
    autoMap.phone = findMatch(['phonenumber', 'phone', 'telephone', 'mobile', 'cell']);
    autoMap.title = findMatch(['jobtitle', 'title', 'position', 'role', 'designation']);
    autoMap.stage = findMatch(['leadstage', 'stage', 'status', 'pipelinestage']);
    autoMap.source = findMatch(['leadsource', 'source', 'channel', 'origin']);
    autoMap.estimatedValue = findMatch(['estimatedvalue', 'value', 'dealsize', 'amount', 'revenue']);
    autoMap.score = findMatch(['leadscore', 'score', 'rating', 'aiscore']);
    autoMap.nextAction = findMatch(['nextaction', 'nextstep', 'action', 'followup']);

    setMapping(autoMap);
    setIsProcessing(false);
    setStep('mapping');
  };

  // 3. Evaluate Mapping and Generate Preview
  const handleProceedToPreview = () => {
    if (!mapping.name || !mapping.company) {
      setErrorMessage('Please map the required fields: Full Name and Company Name.');
      return;
    }
    setErrorMessage(null);

    const existingEmails = new Set(existingLeads.map(l => (l.email || '').toLowerCase().trim()).filter(Boolean));
    const seenBatchEmails = new Set<string>();

    const rows: ParsedLeadRow[] = rawRows.map((rawRow, idx) => {
      const getVal = (headerName: string) => {
        if (!headerName) return '';
        const headerIndex = rawHeaders.indexOf(headerName);
        if (headerIndex === -1 || headerIndex >= rawRow.length) return '';
        return String(rawRow[headerIndex] ?? '').trim();
      };

      const name = getVal(mapping.name);
      const company = getVal(mapping.company);
      const email = getVal(mapping.email).toLowerCase();
      const phone = getVal(mapping.phone);
      const title = getVal(mapping.title);
      const rawStage = getVal(mapping.stage);
      const rawSource = getVal(mapping.source);
      const rawVal = getVal(mapping.estimatedValue);
      const rawScore = getVal(mapping.score);
      const nextAction = getVal(mapping.nextAction) || 'Schedule introductory qualification call';

      const errors: string[] = [];
      const warnings: string[] = [];

      // Required field validation
      if (!name) errors.push('Missing Full Name');
      if (!company) errors.push('Missing Company Name');

      // Email format validation
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Invalid email format: "${email}"`);
      }

      // Duplicate check
      let isDuplicate = false;
      if (email) {
        if (existingEmails.has(email)) {
          isDuplicate = true;
          warnings.push(`Matches existing lead in CRM (${email})`);
        }
        if (seenBatchEmails.has(email)) {
          isDuplicate = true;
          warnings.push(`Duplicate email within import file (${email})`);
        }
        seenBatchEmails.add(email);
      }

      // Stage normalization
      let stage: any = 'New';
      const validStages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
      if (rawStage) {
        const matched = validStages.find(s => s.toLowerCase() === rawStage.toLowerCase());
        if (matched) {
          stage = matched;
        } else {
          warnings.push(`Unrecognized stage "${rawStage}" defaulted to "New"`);
        }
      }

      // Source normalization (Supported: Inbound Web, Outbound SDR, Referral, Partner Ecosystem, Conference)
      let source = 'Inbound Web';
      if (rawSource) {
        const s = rawSource.toLowerCase();
        if (s.includes('outbound') || s.includes('sdr') || s.includes('cold') || s.includes('prospect')) {
          source = 'Outbound SDR';
        } else if (s.includes('referral') || s.includes('mouth') || s.includes('friend')) {
          source = 'Referral';
        } else if (s.includes('partner') || s.includes('ecosystem') || s.includes('alliance') || s.includes('affiliate')) {
          source = 'Partner Ecosystem';
        } else if (s.includes('conference') || s.includes('event') || s.includes('summit') || s.includes('expo')) {
          source = 'Conference';
        } else if (s.includes('inbound') || s.includes('web') || s.includes('organic') || s.includes('search')) {
          source = 'Inbound Web';
        } else {
          warnings.push(`Source "${rawSource}" mapped to default "Inbound Web"`);
        }
      }

      // Number parsing
      const numVal = rawVal.replace(/[^0-9.]/g, '');
      const estimatedValue = numVal ? Number(numVal) : 10000;

      const numScore = rawScore.replace(/[^0-9]/g, '');
      const score = numScore ? Math.min(100, Math.max(0, parseInt(numScore, 10))) : 65;

      let status: 'valid' | 'invalid' | 'duplicate' = 'valid';
      if (errors.length > 0) {
        status = 'invalid';
      } else if (isDuplicate) {
        status = 'duplicate';
      }

      return {
        rowNumber: idx + 2, // 1-based + 1 for header
        data: {
          name,
          company,
          email,
          phone,
          title,
          stage,
          source,
          estimatedValue,
          score,
          nextAction,
          scoreReason: `Imported from ${file?.name || 'file'}`,
          assignedTo: 'You',
        },
        status,
        errors,
        warnings,
      };
    });

    setParsedRows(rows);
    setStep('preview');
  };

  // 4. Counts Calculation
  const totalRowsCount = parsedRows.length;
  const invalidRowsCount = parsedRows.filter(r => r.status === 'invalid').length;
  const duplicateRowsCount = parsedRows.filter(r => r.status === 'duplicate').length;
  const validRowsCount = parsedRows.filter(r => r.status === 'valid').length;
  const willImportCount = skipDuplicates ? validRowsCount : validRowsCount + duplicateRowsCount;

  // 5. Final Execute Import
  const handleExecuteImport = async () => {
    if (willImportCount === 0) {
      setErrorMessage('No valid records available to import.');
      return;
    }

    setStep('importing');
    setErrorMessage(null);

    // Records to submit
    const candidates = parsedRows
      .filter(r => {
        if (r.status === 'invalid') return false;
        if (skipDuplicates && r.status === 'duplicate') return false;
        return true;
      })
      .map(r => r.data);

    try {
      const result = await api.importLeads({
        filename: file?.name || 'lead_import.csv',
        leads: candidates,
        skipDuplicates,
      });

      setImportResult(result);
      setStep('result');
      onImportSuccess(result);
      loadHistory();
    } catch (err: any) {
      setErrorMessage('Failed to save imported leads: ' + (err.message || 'Database error'));
      setStep('preview');
    }
  };

  const filteredPreviewRows = parsedRows.filter(r => {
    if (filterPreview === 'all') return true;
    return r.status === filterPreview;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/90 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Import Leads from File</h2>
              <p className="text-xs text-slate-400">
                Bulk upload contacts and accounts directly into your CRM database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View History Switcher */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'import' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Import Leads
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('history');
                  loadHistory();
                }}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Audit History</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 2: Audit History View */}
        {activeTab === 'history' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Import History & Audit Log</h3>
                <p className="text-xs text-slate-400">View past bulk lead imports and operational summaries</p>
              </div>
              <button
                onClick={loadHistory}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading import logs...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="font-medium text-slate-300">No import history found</p>
                <p className="text-slate-500 mt-1">Upload a CSV or Excel file to record your first batch lead import.</p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date & Time</th>
                      <th className="px-4 py-3 font-semibold">Original Filename</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Total Rows</th>
                      <th className="px-4 py-3 font-semibold text-right text-emerald-400">Imported</th>
                      <th className="px-4 py-3 font-semibold text-right text-amber-400">Skipped</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-300">
                          {new Date(record.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="truncate max-w-[200px]">{record.filename}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              record.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : record.status === 'partial'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">{record.totalRows}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-400">{record.importedCount}</td>
                        <td className="px-4 py-3 text-right text-amber-400">{record.skippedCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Wizard Steps (Upload -> Mapping -> Preview -> Executing -> Result) */}
        {activeTab === 'import' && (
          <div className="flex-1 overflow-y-auto flex flex-col p-6">
            {/* Step Indicators */}
            {step !== 'result' && (
              <div className="flex items-center justify-between mb-6 px-2 sm:px-6">
                {[
                  { id: 'upload', label: '1. Upload File' },
                  { id: 'mapping', label: '2. Map Columns' },
                  { id: 'preview', label: '3. Preview & Validate' },
                ].map((s, idx) => {
                  const isActive = step === s.id;
                  const isDone =
                    (s.id === 'upload' && step !== 'upload') ||
                    (s.id === 'mapping' && (step === 'preview' || step === 'importing'));

                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                            : isDone
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <span
                        className={`text-xs font-medium hidden sm:inline ${
                          isActive ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {s.label.split('. ')[1]}
                      </span>
                      {idx < 2 && <div className="w-8 sm:w-16 h-px bg-slate-800 mx-2" />}
                    </div>
                  );
                })}
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* STEP 1: Upload File Area */}
            {step === 'upload' && (
              <div className="space-y-6">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700/80 hover:border-indigo-500/80 bg-slate-950/40 hover:bg-slate-900/60 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 group-hover:bg-indigo-600/20 border border-indigo-500/20 group-hover:border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 transition-all mb-4">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>

                  <h3 className="text-base font-semibold text-white mb-1">
                    Drag and drop your lead file here, or{' '}
                    <span className="text-indigo-400 underline underline-offset-4">browse</span>
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    Supports <strong>CSV</strong> and <strong>Excel (.xlsx / .xls)</strong> files up to 10MB
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800">
                    <span>Required: Full Name, Company</span>
                    <span>•</span>
                    <span>Optional: Email, Phone, Stage, Source</span>
                  </div>
                </div>

                {/* Instructions & Template Download */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Need a pre-formatted template?</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Download our sample CSV with all standard lead fields and valid lead source columns.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors shrink-0 cursor-pointer border border-slate-700/60"
                  >
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Download CSV Template</span>
                  </button>
                </div>

                {/* Instructions Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
                  <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/60 space-y-2">
                    <span className="font-semibold text-slate-200 block">Supported Lead Sources</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {SUPPORTED_LEAD_SOURCES.map((src) => (
                        <span
                          key={src}
                          className="px-2 py-0.5 bg-slate-800/80 text-indigo-300 rounded text-[11px] border border-slate-700/40"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Other source values will automatically normalize to the closest matching channel.
                    </p>
                  </div>

                  <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/60 space-y-1.5">
                    <span className="font-semibold text-slate-200 block">Automatic Deduplication</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      SmartCRM AI inspects email addresses against your existing database. Duplicates will be safely
                      flagged in preview and can be automatically skipped to prevent polluting your pipeline.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Map Columns */}
            {step === 'mapping' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <div>
                      <span className="text-xs font-semibold text-white block">{file?.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {rawRows.length} rows detected • {rawHeaders.length} columns found
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setStep('upload');
                      setFile(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Choose another file</span>
                  </button>
                </div>

                <div className="text-xs text-slate-300">
                  Confirm how columns in your file match SmartCRM AI lead fields. Columns with asterisks (<span className="text-rose-400">*</span>) are required.
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold">CRM Field</th>
                        <th className="px-4 py-3 font-semibold">Description</th>
                        <th className="px-4 py-3 font-semibold">File Column</th>
                        <th className="px-4 py-3 font-semibold">Sample Data (Row 1)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {TARGET_FIELDS.map((field) => {
                        const selectedHeader = mapping[field.key];
                        const headerIndex = rawHeaders.indexOf(selectedHeader);
                        const sampleVal =
                          headerIndex !== -1 && rawRows[0] && rawRows[0][headerIndex] !== undefined
                            ? String(rawRows[0][headerIndex])
                            : '—';

                        return (
                          <tr key={field.key} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-white">
                              {field.label}{' '}
                              {field.required && <span className="text-rose-400 font-bold">*</span>}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-[11px]">{field.description}</td>
                            <td className="px-4 py-3">
                              <select
                                value={mapping[field.key] || ''}
                                onChange={(e) =>
                                  setMapping({ ...mapping, [field.key]: e.target.value })
                                }
                                className={`w-full max-w-[200px] px-2.5 py-1.5 rounded-lg border text-xs bg-slate-900 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                  field.required && !mapping[field.key]
                                    ? 'border-rose-500/60 bg-rose-950/20'
                                    : 'border-slate-700'
                                }`}
                              >
                                <option value="">(Do not map)</option>
                                {rawHeaders.map((header) => (
                                  <option key={header} value={header}>
                                    {header}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-slate-300 font-mono text-[11px] truncate max-w-[180px]">
                              {sampleVal}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('upload')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToPreview}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <span>Proceed to Preview & Validation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Preview & Validation Table */}
            {step === 'preview' && (
              <div className="space-y-5">
                {/* Metric Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Total Rows</span>
                    <span className="text-xl font-bold text-white mt-1 block">{totalRowsCount}</span>
                  </div>
                  <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                    <span className="text-[11px] text-emerald-400 block">Valid Records</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">{validRowsCount}</span>
                  </div>
                  <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <span className="text-[11px] text-amber-400 block">Duplicates</span>
                    <span className="text-xl font-bold text-amber-400 mt-1 block">{duplicateRowsCount}</span>
                  </div>
                  <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                    <span className="text-[11px] text-rose-400 block">Invalid Rows</span>
                    <span className="text-xl font-bold text-rose-400 mt-1 block">{invalidRowsCount}</span>
                  </div>
                  <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-indigo-400 block">Will Import</span>
                    <span className="text-xl font-bold text-indigo-400 mt-1 block">{willImportCount}</span>
                  </div>
                </div>

                {/* Filter and Duplicate Setting */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                  {/* Status filter tabs */}
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterPreview('all')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        filterPreview === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All ({totalRowsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterPreview('valid')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        filterPreview === 'valid' ? 'bg-emerald-600/30 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Valid ({validRowsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterPreview('duplicate')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        filterPreview === 'duplicate' ? 'bg-amber-600/30 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Duplicates ({duplicateRowsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterPreview('invalid')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        filterPreview === 'invalid' ? 'bg-rose-600/30 text-rose-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Invalid ({invalidRowsCount})
                    </button>
                  </div>

                  {/* Duplicate toggle checkbox */}
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Skip duplicate emails automatically</span>
                  </label>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold w-12 text-center">Row</th>
                        <th className="px-3 py-2.5 font-semibold">Status</th>
                        <th className="px-3 py-2.5 font-semibold">Lead Name</th>
                        <th className="px-3 py-2.5 font-semibold">Company</th>
                        <th className="px-3 py-2.5 font-semibold">Email</th>
                        <th className="px-3 py-2.5 font-semibold">Stage</th>
                        <th className="px-3 py-2.5 font-semibold">Source</th>
                        <th className="px-3 py-2.5 font-semibold text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-slate-500">
                            No rows match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((row) => {
                          const isRowSkipped = skipDuplicates && row.status === 'duplicate';

                          return (
                            <tr
                              key={row.rowNumber}
                              className={`hover:bg-slate-800/30 transition-colors ${
                                row.status === 'invalid'
                                  ? 'bg-rose-950/10'
                                  : isRowSkipped
                                  ? 'bg-amber-950/10'
                                  : ''
                              }`}
                            >
                              <td className="px-3 py-2.5 text-center text-slate-500 font-mono">
                                #{row.rowNumber}
                              </td>
                              <td className="px-3 py-2.5">
                                {row.status === 'valid' && (
                                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Valid</span>
                                  </span>
                                )}
                                {row.status === 'duplicate' && (
                                  <span
                                    className="inline-flex items-center gap-1 text-amber-400 font-medium"
                                    title={row.warnings.join(', ')}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>{skipDuplicates ? 'Duplicate (Skip)' : 'Duplicate'}</span>
                                  </span>
                                )}
                                {row.status === 'invalid' && (
                                  <span
                                    className="inline-flex items-center gap-1 text-rose-400 font-medium"
                                    title={row.errors.join(', ')}
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>Invalid</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 font-medium text-white">
                                {row.data.name || <span className="text-rose-400 italic">Empty</span>}
                              </td>
                              <td className="px-3 py-2.5 text-slate-300">
                                {row.data.company || <span className="text-rose-400 italic">Empty</span>}
                              </td>
                              <td className="px-3 py-2.5 text-slate-400 font-mono text-[11px]">
                                {row.data.email || '—'}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-indigo-300 border border-slate-700/60">
                                  {row.data.stage}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-slate-300 text-[11px]">{row.data.source}</td>
                              <td className="px-3 py-2.5 text-right font-medium text-slate-200">
                                ${row.data.estimatedValue?.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Validation warnings / error callout */}
                {invalidRowsCount > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        {invalidRowsCount} record(s) contain validation errors and will be omitted from the import. Valid records will be imported safely.
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('mapping')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Mapping</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={willImportCount === 0}
                      onClick={handleExecuteImport}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Import {willImportCount} Lead{willImportCount === 1 ? '' : 's'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Importing Execution Progress */}
            {step === 'importing' && (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 animate-pulse">
                  <Upload className="w-7 h-7 animate-bounce" />
                </div>
                <h3 className="text-base font-bold text-white">Importing Leads into CRM...</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Writing validated lead records to your Supabase database and updating pipeline metrics.
                </p>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-indigo-500 animate-indeterminate" />
                </div>
              </div>
            )}

            {/* STEP 5: Result Screen */}
            {step === 'result' && (
              <div className="py-8 text-center flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">Lead Import Complete!</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    Successfully imported {importResult?.importedCount || 0} leads into your active CRM pipeline and updated your sales activity timeline.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full max-w-md bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Processed</span>
                    <span className="text-base font-bold text-white mt-0.5 block">{importResult?.totalRows || 0}</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 block text-[11px]">Imported</span>
                    <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                      {importResult?.importedCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-400 block text-[11px]">Skipped</span>
                    <span className="text-base font-bold text-amber-400 mt-0.5 block">
                      {(importResult?.skippedCount || 0) + (importResult?.invalidCount || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetState();
                      setActiveTab('history');
                      loadHistory();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    View Audit Log
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-colors cursor-pointer"
                  >
                    Done & View Leads
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
