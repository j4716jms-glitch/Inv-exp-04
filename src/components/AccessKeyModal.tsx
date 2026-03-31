'use client';
// components/AccessKeyModal.tsx
import { useState, useCallback, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { APP_TITLE, APP_TAGLINE, THEME_COLOR } from '@/config/settings.config';

interface Props {
  onAuthenticated: (key: string) => void;
}

export default function AccessKeyModal({ onAuthenticated }: Props) {
  const [key, setKey]           = useState('');
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = useCallback(async () => {
    if (!key.trim()) { setError('Please enter your access key.'); triggerShake(); return; }
    setLoading(true);
    setError('');

    try {
      const res  = await fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await res.json();

      if (data.valid) {
        // Persist in sessionStorage so page refresh doesn't kick user out
        sessionStorage.setItem('inv_access_key', key.trim());
        onAuthenticated(key.trim());
      } else {
        setError('Invalid access key. Please try again.');
        triggerShake();
      }
    } catch {
      setError('Network error. Could not verify key.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  }, [key, onAuthenticated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] modal-backdrop bg-slate-900/60 flex items-center justify-center p-4">
      {/* Card */}
      <div
        className={`card w-full max-w-md p-8 fade-in transition-all duration-150 ${
          shake ? 'animate-[wiggle_0.4s_ease_both]' : ''
        }`}
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
      >
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 mx-auto"
          style={{ background: `${THEME_COLOR}18` }}
        >
          <Lock size={24} style={{ color: THEME_COLOR }} />
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-800 text-slate-900 tracking-tight">
            {APP_TITLE}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{APP_TAGLINE}</p>
        </div>

        <p className="text-sm text-slate-600 text-center mb-6">
          Enter your access key to continue to the dashboard.
        </p>

        {/* Input */}
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Access key…"
            autoFocus
            className="input pr-10 font-mono tracking-widest"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full justify-center mt-5 py-3"
          style={{ background: loading ? '#94a3b8' : THEME_COLOR }}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Verifying…</>
          ) : (
            <><ShieldCheck size={16} /> Unlock Dashboard</>
          )}
        </button>

        <p className="text-center text-xs text-slate-400 mt-4">
          Keys are managed via <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">AUTHORIZED_USERS</code> env variable.
        </p>
      </div>

      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
