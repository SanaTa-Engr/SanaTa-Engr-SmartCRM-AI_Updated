import { useState, type FormEvent } from 'react';
import { Sparkles, Lock, Mail, User, Building, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { api } from '../api';

interface AuthModalProps {
  onSuccess: () => void;
}

export function AuthModal({ onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await api.login(email, password);
      } else {
        await api.signup(email, password, name, companyName);
      }
      localStorage.removeItem('smartcrm_logged_out');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await api.login('demo@smartcrm.ai', 'demopassword123');
      localStorage.removeItem('smartcrm_logged_out');
      onSuccess();
    } catch (err: any) {
      // If demo user wasn't initialized yet, sign them up
      try {
        await api.signup('demo@smartcrm.ai', 'demopassword123', 'Alex Morgan', 'Acme SaaS Corp');
        localStorage.removeItem('smartcrm_logged_out');
        onSuccess();
      } catch (signupErr: any) {
        // If the server backend returned 404 or connection failed (e.g. static Vercel build before serverless function is configured)
        api.setToken('usr-demo-1.demo_token');
        localStorage.removeItem('smartcrm_logged_out');
        onSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top brand hero */}
        <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">SmartCRM AI</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            Next-generation enterprise CRM with real-time Supabase database & Gemini intelligence.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              <p>{error}</p>
              {(error.includes('404') || error.includes('not found') || error.includes('Network error')) && (
                <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-rose-600">Want to test right now?</span>
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="font-bold text-indigo-700 hover:text-indigo-900 underline text-xs cursor-pointer"
                  >
                    Enter with Demo Login &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Demo Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full mb-5 py-2.5 px-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-200 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>1-Click Demo Login (Alex Morgan)</span>
          </button>

          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-[11px] text-slate-400 uppercase font-medium">or continue with email</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Jordan Hayes"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Cloud Systems"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Workspace' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
              }}
              className="text-xs text-slate-600 hover:text-indigo-600 font-medium"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
