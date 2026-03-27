import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/context/ConfigContext';
import { Eye, EyeOff, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function RestoreAccess() {
  const { restoreFromSupabase, setCredentials } = useConfig();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const restore = async () => {
    setLoading(true);
    const creds = await restoreFromSupabase(url, key);
    setLoading(false);
    if (creds) {
      setCredentials(creds);
      toast.success('Access restored successfully!');
      navigate('/');
    } else {
      toast.error('Could not restore. Check your Supabase URL and Anon Key.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold font-nunito text-foreground text-center mb-1">Restore Access</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Enter your Supabase credentials to restore all your settings automatically.</p>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-foreground mb-1 block">Supabase Project URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xyzxyz.supabase.co" className="tg-input" />
          </div>
          <div>
            <label className="text-sm text-foreground mb-1 block">Supabase Anon Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="eyJ..."
                className="tg-input pr-10"
              />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={restore}
          disabled={!url || !key || loading}
          className="tg-btn-primary w-full mt-5 gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Restore
        </button>

        <p className="text-xs text-muted-foreground text-center mt-4">Everything else will be restored automatically.</p>

        <button onClick={() => navigate('/onboarding')} className="mt-4 text-sm text-primary hover:underline block mx-auto">
          ← Back to setup
        </button>
      </div>
    </div>
  );
}
