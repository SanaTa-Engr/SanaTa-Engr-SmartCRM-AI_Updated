import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Copy, Check, RefreshCw, Zap, TrendingUp, Mail, AlertTriangle } from 'lucide-react';
import { api } from '../api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export function AIAssistantView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am **SmartCRM AI**, your intelligent sales development & pipeline advisor.\n\nI have real-time access to your pipeline, deals, active leads, and team activity timeline. How can I help you accelerate sales today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Which leads have the highest win score right now?',
    'What deals should we focus on closing this week?',
    'Draft a consultative follow-up email for a stalled proposal',
    'Summarize our current pipeline health and revenue forecast',
    'Generate an executive summary of recent CRM activities',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const response = await api.chatWithAI(history);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I encountered an issue processing your request: ${err.message || 'Server connection error'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>SmartCRM AI Copilot</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                Gemini 3.8 Flash
              </span>
            </h2>
            <p className="text-xs text-slate-500">Live CRM context analysis, predictive lead scoring & outreach drafting</p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                role: 'assistant',
                content: `Chat history cleared. How can I assist your sales pipeline now?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ])
          }
          className="text-xs text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title="Reset conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {m.role === 'assistant' ? (
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed relative group ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none shadow-xs'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {m.role === 'assistant' && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{m.timestamp || ''}</span>
                  <button
                    onClick={() => handleCopy(m.content, idx)}
                    className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
              <span>SmartCRM AI is analyzing CRM context...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-indigo-500" /> Suggestions:
        </span>
        {quickPrompts.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs whitespace-nowrap transition-colors shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about your deals, leads, email templates, or forecasts..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
