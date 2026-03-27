import { useState } from 'react';
import { useConfig, Credentials } from '@/context/ConfigContext';
import { Eye, EyeOff, Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { credentials, setCredentials, saveToSupabase, clearCredentials } = useConfig();
  const [form, setForm] = useState<Credentials>(credentials);
  const [reveals, setReveals] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [showDanger, setShowDanger] = useState(false);

  const toggle = (field: string) => setReveals(prev => ({ ...prev, [field]: !prev[field] }));
  const update = (field: keyof Credentials, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const save = async () => {
    setSaving(true);
    setCredentials(form);
    try {
      await saveToSupabase(form);
      toast.success('Settings saved and backed up!');
    } catch {
      toast.success('Settings saved locally.');
    }
    setSaving(false);
  };

  const fields: { section: string; items: { key: keyof Credentials; label: string; secret?: boolean }[] }[] = [
    {
      section: 'Supabase',
      items: [
        { key: 'supabaseUrl', label: 'Project URL' },
        { key: 'supabaseAnonKey', label: 'Anon Key', secret: true },
      ],
    },
    {
      section: 'Telegram',
      items: [
        { key: 'botToken', label: 'Bot Token', secret: true },
        { key: 'channelId', label: 'Channel ID' },
        { key: 'apiId', label: 'API ID' },
        { key: 'apiHash', label: 'API Hash', secret: true },
      ],
    },
    {
      section: 'Backend',
      items: [
        { key: 'backendUrl', label: 'Backend URL' },
      ],
    },
  ];

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 pb-24 animate-fade-in">
      <h1 className="text-xl font-bold font-nunito text-foreground mb-6">⚙️ Settings</h1>

      <div className="space-y-6">
        {fields.map(section => (
          <div key={section.section}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{section.section}</h3>
            <div className="space-y-2">
              {section.items.map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <label className="text-sm text-foreground w-28 shrink-0">{item.label}</label>
                  <div className="relative flex-1">
                    <input
                      type={item.secret && !reveals[item.key] ? 'password' : 'text'}
                      value={form[item.key]}
                      onChange={e => update(item.key, e.target.value)}
                      className="tg-input pr-10"
                    />
                    {item.secret && (
                      <button onClick={() => toggle(item.key)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground">
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

      <div className="flex gap-2 mt-6">
        <button className="tg-btn-outline flex-1 gap-1">🔗 Test Connections</button>
        <button onClick={save} disabled={saving} className="tg-btn-primary flex-1 gap-1 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="mt-10 border-t border-tg-divider pt-6">
        <button onClick={() => setShowDanger(!showDanger)} className="text-sm text-destructive hover:underline flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </button>
        {showDanger && (
          <div className="flex gap-2 mt-3">
            <button onClick={() => { clearCredentials(); toast.success('Local cache cleared'); }} className="tg-btn-outline text-sm gap-1 text-destructive border-destructive/30">
              <Trash2 className="w-3.5 h-3.5" /> Clear local cache
            </button>
            <button onClick={() => { clearCredentials(); toast.success('All data reset'); }} className="tg-btn-outline text-sm gap-1 text-destructive border-destructive/30">
              <AlertTriangle className="w-3.5 h-3.5" /> Reset all data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
