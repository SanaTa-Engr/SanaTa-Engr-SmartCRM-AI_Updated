import { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, Mail, RefreshCw, Send } from 'lucide-react';
import { api } from '../../api';

interface EmailGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: string;
  defaultCompany?: string;
  defaultStage?: string;
}

export function EmailGeneratorModal({
  isOpen,
  onClose,
  defaultRecipient = '',
  defaultCompany = '',
  defaultStage = 'Proposal',
}: EmailGeneratorModalProps) {
  const [recipientName, setRecipientName] = useState(defaultRecipient);
  const [companyName, setCompanyName] = useState(defaultCompany);
  const [tone, setTone] = useState<'consultative' | 'friendly' | 'urgent' | 'formal'>('consultative');
  const [context, setContext] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRecipientName(defaultRecipient);
      setCompanyName(defaultCompany);
      setContext('Following up on our product demo to align on the technical requirements and proposal review.');
      setSubject('');
      setBody('');
    }
  }, [isOpen, defaultRecipient, defaultCompany]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateFollowUp({
        recipientName: recipientName || 'Partner',
        companyName: companyName || 'your organization',
        tone,
        context,
        stage: defaultStage,
      });
      setSubject(res.subject);
      setBody(res.body);
    } catch (err: any) {
      console.error('Email generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Sales Email Drafter</h3>
              <p className="text-[11px] text-slate-500">Gemini 3.8 Flash personalized enterprise outreach</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recipient Name</label>
              <input
                type="text"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                placeholder="e.g. Dr. Marcus Vance"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Apex BioHealth"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tone & Persona</label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value as any)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="consultative">Consultative & Value-driven</option>
                <option value="friendly">Friendly & Warm</option>
                <option value="urgent">Time-sensitive & Urgent</option>
                <option value="formal">Executive Formal</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Deal Stage Reference</label>
              <input
                type="text"
                disabled
                value={defaultStage}
                className="w-full px-3 py-2 bg-slate-100 text-slate-500 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Context & Key Objectives</label>
            <textarea
              rows={2}
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="e.g. Address their concern about HIPAA compliance and propose a quick 15-minute alignment call."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating with Gemini...' : 'Generate Follow-Up Draft'}</span>
            </button>
          </div>

          {/* Generated Result Output */}
          {body && (
            <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Email Body</label>
                <textarea
                  rows={6}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal text-slate-800 leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl font-medium text-xs"
          >
            Close
          </button>

          {body && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Subject & Email'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
