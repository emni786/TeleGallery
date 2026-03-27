import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig, Credentials } from '@/context/ConfigContext';
import { Check, Copy, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, XCircle, Sparkles, Shield, Smartphone, Cloud } from 'lucide-react';
import { toast } from 'sonner';

const SQL_BLUEPRINT = `-- TeleGallery Database Blueprint v4.0

CREATE TABLE IF NOT EXISTS photos (
    id            BIGSERIAL PRIMARY KEY,
    file_id       TEXT NOT NULL,
    file_type     TEXT NOT NULL CHECK (file_type IN ('photo','video')),
    file_name     TEXT DEFAULT '',
    file_size     BIGINT DEFAULT 0,
    mime_type     TEXT DEFAULT '',
    title         TEXT DEFAULT '',
    album         TEXT DEFAULT 'All Photos',
    uploaded_at   TIMESTAMPTZ DEFAULT NOW(),
    is_favorite   BOOLEAN DEFAULT FALSE,
    is_deleted    BOOLEAN DEFAULT FALSE,
    thumbnail_id  TEXT DEFAULT '',
    width         INTEGER DEFAULT 0,
    height        INTEGER DEFAULT 0,
    duration      INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS albums (
    id             BIGSERIAL PRIMARY KEY,
    name           TEXT NOT NULL UNIQUE,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    cover_file_id  TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS credentials (
    id    BIGSERIAL PRIMARY KEY,
    key   TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
);

INSERT INTO albums (name) VALUES ('All Photos')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_photos_album ON photos (album);
CREATE INDEX IF NOT EXISTS idx_photos_favorite ON photos (is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_photos_deleted ON photos (is_deleted);
CREATE INDEX IF NOT EXISTS idx_photos_date ON photos (uploaded_at DESC);`;

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {step === 0 && <WelcomeStep onNext={() => setStep(1)} onRestore={() => navigate('/restore')} />}
        {step === 1 && <SupabaseStep onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <TelegramStep onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <CredentialsStep onBack={() => setStep(2)} />}
      </div>
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      <span className="text-xs text-muted-foreground">Step {current} of {total}</span>
      <div className="flex gap-1 ml-2">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < current ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>
    </div>
  );
}

function WelcomeStep({ onNext, onRestore }: { onNext: () => void; onRestore: () => void }) {
  return (
    <div className="text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-8 h-8 text-primary-foreground" />
      </div>
      <h1 className="text-3xl font-bold font-nunito text-foreground mb-2">TeleGallery</h1>
      <p className="text-muted-foreground mb-8">Your personal photo cloud — powered by Telegram<br />Unlimited storage. Original quality. Free.</p>

      <div className="grid grid-cols-2 gap-3 mb-8 text-left">
        {[
          { icon: Cloud, text: 'Unlimited photo & video storage' },
          { icon: Sparkles, text: 'Google Photos-like experience' },
          { icon: Shield, text: 'Your data, your Telegram, your control' },
          { icon: Smartphone, text: 'Works on all devices' },
        ].map((f, i) => (
          <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-secondary">
            <f.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span className="text-sm text-foreground">{f.text}</span>
          </div>
        ))}
      </div>

      <button onClick={onNext} className="tg-btn-primary w-full gap-2">
        Get Started <ArrowRight className="w-4 h-4" />
      </button>
      <button onClick={onRestore} className="mt-3 text-sm text-primary hover:underline">
        Already have an account? Restore Access
      </button>
    </div>
  );
}

function SupabaseStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(SQL_BLUEPRINT);
    setCopied(true);
    toast.success('SQL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <StepIndicator current={2} total={4} />
      <h2 className="text-xl font-bold font-nunito text-foreground mb-1">Set up your database</h2>
      <p className="text-sm text-muted-foreground mb-4">Create a free Supabase project and run this SQL</p>

      <ol className="text-sm text-foreground space-y-2 mb-4 list-decimal list-inside">
        <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener" className="text-primary hover:underline">supabase.com</a> → Create free account</li>
        <li>Create new project (any name)</li>
        <li>Go to SQL Editor → New Query</li>
        <li>Copy the SQL below and click <strong>RUN</strong></li>
      </ol>

      <div className="relative rounded-xl border border-tg-divider bg-secondary overflow-hidden mb-4">
        <div className="flex items-center justify-between px-3 py-2 border-b border-tg-divider bg-background/50">
          <span className="text-xs text-muted-foreground font-mono">SQL Blueprint</span>
          <button onClick={copy} className="tg-btn-outline text-xs py-1 px-3 gap-1">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy SQL'}
          </button>
        </div>
        <pre className="p-3 text-xs font-mono text-foreground overflow-auto max-h-52 leading-relaxed">{SQL_BLUEPRINT}</pre>
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="tg-btn-outline flex-1">Back</button>
        <button onClick={onNext} className="tg-btn-primary flex-1 gap-1">
          <Check className="w-4 h-4" /> Done, Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TelegramStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="animate-fade-in">
      <StepIndicator current={3} total={4} />
      <h2 className="text-xl font-bold font-nunito text-foreground mb-1">Connect your Telegram storage</h2>
      <p className="text-sm text-muted-foreground mb-4">Follow these steps to set up your Telegram bot and channel</p>

      <ol className="text-sm text-foreground space-y-3 mb-6">
        {[
          <>Open Telegram → search <strong>@BotFather</strong></>,
          <>Send <code className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">/newbot</code> → give any name & username</>,
          <>Copy the <strong>Bot Token</strong> you receive</>,
          <>Create a <strong>Private Channel</strong> in Telegram</>,
          <>Add your bot as <strong>Admin</strong> in the channel</>,
          <>Go to <a href="https://my.telegram.org" target="_blank" rel="noopener" className="text-primary hover:underline">my.telegram.org</a> → API Development Tools</>,
          <>Create app → copy <strong>API ID</strong> and <strong>API Hash</strong></>,
        ].map((text, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            <span>{text}</span>
          </li>
        ))}
      </ol>

      <div className="flex gap-2">
        <button onClick={onBack} className="tg-btn-outline flex-1">Back</button>
        <button onClick={onNext} className="tg-btn-primary flex-1 gap-1">
          Got it, Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CredentialsStep({ onBack }: { onBack: () => void }) {
  const { setCredentials, saveToSupabase } = useConfig();
  const navigate = useNavigate();
  const [form, setForm] = useState<Credentials>({
    supabaseUrl: '', supabaseAnonKey: '', botToken: '', channelId: '', apiId: '', apiHash: '', backendUrl: '',
  });
  const [reveals, setReveals] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Record<string, boolean | null>>({});

  const toggle = (field: string) => setReveals(prev => ({ ...prev, [field]: !prev[field] }));
  const update = (field: keyof Credentials, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const testConnections = async () => {
    setTesting(true);
    setResults({});

    // Test Supabase
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(form.supabaseUrl, form.supabaseAnonKey);
      await sb.from('photos').select('id').limit(1);
      setResults(prev => ({ ...prev, supabase: true }));
    } catch {
      setResults(prev => ({ ...prev, supabase: false }));
    }

    // Test Backend
    try {
      const resp = await fetch(`${form.backendUrl}/api/setup/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-Token': form.botToken,
          'X-Channel-Id': form.channelId,
        },
      });
      setResults(prev => ({ ...prev, backend: resp.ok }));
      setResults(prev => ({ ...prev, telegram: resp.ok }));
    } catch {
      setResults(prev => ({ ...prev, backend: false, telegram: false }));
    }

    setTesting(false);
  };

  const finish = async () => {
    setCredentials(form);
    try {
      await saveToSupabase(form);
      toast.success('Setup complete! Your credentials are saved.');
    } catch {
      toast.success('Setup complete! (Could not backup credentials)');
    }
    navigate('/');
  };

  const fields: { section: string; items: { key: keyof Credentials; label: string; placeholder: string; secret?: boolean }[] }[] = [
    {
      section: 'Supabase',
      items: [
        { key: 'supabaseUrl', label: 'Project URL', placeholder: 'https://xyzxyz.supabase.co' },
        { key: 'supabaseAnonKey', label: 'Anon Key', placeholder: 'eyJ...', secret: true },
      ],
    },
    {
      section: 'Telegram',
      items: [
        { key: 'botToken', label: 'Bot Token', placeholder: '123456:ABC-DEF...', secret: true },
        { key: 'channelId', label: 'Channel ID', placeholder: '-1001234567890' },
        { key: 'apiId', label: 'API ID', placeholder: '12345678' },
        { key: 'apiHash', label: 'API Hash', placeholder: 'abcdef1234567890...', secret: true },
      ],
    },
    {
      section: 'Backend',
      items: [
        { key: 'backendUrl', label: 'Backend URL (Render)', placeholder: 'https://telegallery-backend.onrender.com' },
      ],
    },
  ];

  const allFilled = form.supabaseUrl && form.supabaseAnonKey && form.botToken && form.channelId && form.backendUrl;

  return (
    <div className="animate-fade-in">
      <StepIndicator current={4} total={4} />
      <h2 className="text-xl font-bold font-nunito text-foreground mb-4">Enter your credentials</h2>

      <div className="space-y-5">
        {fields.map(section => (
          <div key={section.section}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{section.section}</h3>
            <div className="space-y-2">
              {section.items.map(item => (
                <div key={item.key}>
                  <label className="text-sm text-foreground mb-1 block">{item.label}</label>
                  <div className="relative">
                    <input
                      type={item.secret && !reveals[item.key] ? 'password' : 'text'}
                      value={form[item.key]}
                      onChange={e => update(item.key, e.target.value)}
                      placeholder={item.placeholder}
                      className="tg-input pr-10"
                    />
                    {item.secret && (
                      <button onClick={() => toggle(item.key)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                        {reveals[item.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={testConnections}
        disabled={!allFilled || testing}
        className="tg-btn-outline w-full mt-5 gap-2 disabled:opacity-50"
      >
        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔗'} Test All Connections
      </button>

      {Object.keys(results).length > 0 && (
        <div className="flex gap-3 mt-2 justify-center">
          {['supabase', 'telegram', 'backend'].map(key => (
            <div key={key} className="flex items-center gap-1 text-xs">
              {results[key] ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : results[key] === false ? <XCircle className="w-3.5 h-3.5 text-destructive" /> : null}
              <span className="capitalize text-muted-foreground">{key}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-5">
        <button onClick={onBack} className="tg-btn-outline flex-1">Back</button>
        <button onClick={finish} disabled={!allFilled} className="tg-btn-primary flex-1 gap-1 disabled:opacity-50">
          🚀 Start Using TeleGallery
        </button>
      </div>
    </div>
  );
}
