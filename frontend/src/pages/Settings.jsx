import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigCtx.jsx';
import { testConnections } from '../lib/api.js';

const FIELDS = [
  { name: 'supabase_url', label: 'Project URL', section: 'Supabase' },
  { name: 'supabase_key', label: 'Anon Key', section: 'Supabase', password: true },
  { name: 'bot_token', label: 'Bot Token', section: 'Telegram', password: true },
  { name: 'channel_id', label: 'Channel ID', section: 'Telegram' },
  { name: 'api_id', label: 'API ID', section: 'Telegram' },
  { name: 'api_hash', label: 'API Hash', section: 'Telegram', password: true },
  { name: 'backend_url', label: 'Backend URL', section: 'Backend' },
];

function FieldRow({ field, value, onChange }) {
  const [reveal, setReveal] = useState(false);
  const showAs = field.password && !reveal ? 'password' : 'text';
  return (
    <div className="field">
      <label>{field.label}</label>
      <div className="input-row">
        <input
          type={showAs}
          value={value || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
        {field.password && (
          <button
            type="button"
            className="toggle"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Hide' : 'Reveal'}
          >
            <span className="material-icons">
              {reveal ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { config, setConfig, clearCache, saveToSupabase } = useConfig();
  const [draft, setDraft] = useState(config);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const updateField = (name, value) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
    setTestResult(null);
    setSaveStatus('');
  };

  const grouped = FIELDS.reduce((acc, f) => {
    acc[f.section] = acc[f.section] || [];
    acc[f.section].push(f);
    return acc;
  }, {});

  const runTests = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await testConnections(draft);
      setTestResult(r);
    } catch (err) {
      setTestResult({
        ok: false,
        checks: {
          telegram: { ok: false, detail: err.message },
          channel: { ok: false, detail: '' },
          supabase: { ok: false, detail: '' },
          pyrogram: { ok: false, detail: '' },
        },
      });
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveStatus('');
    try {
      await saveToSupabase(draft);
      setConfig(draft);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    if (
      window.confirm(
        'Reset removes credentials from this device only. Your Telegram + Supabase data is not touched.',
      )
    ) {
      clearCache();
      navigate('/onboarding', { replace: true });
    }
  };

  return (
    <div className="settings">
      <h1 className="page-title">Settings</h1>

      {Object.entries(grouped).map(([section, fields]) => (
        <div className="card" key={section}>
          <h3>{section}</h3>
          {fields.map((f) => (
            <FieldRow
              key={f.name}
              field={f}
              value={draft[f.name]}
              onChange={updateField}
            />
          ))}
        </div>
      ))}

      <div className="card">
        <h3>Connections</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn outline" onClick={runTests} disabled={testing}>
            <span className="material-icons">cable</span>
            {testing ? 'Testing…' : 'Test connections'}
          </button>
          <button className="btn primary" onClick={save} disabled={saving}>
            <span className="material-icons">save</span>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saveStatus === 'saved' && (
            <span className="status-pill ok">
              <span className="material-icons" style={{ fontSize: 16 }}>check_circle</span>
              Saved &amp; encrypted to Supabase
            </span>
          )}
          {saveStatus && saveStatus !== 'saved' && (
            <span className="status-pill err">
              <span className="material-icons" style={{ fontSize: 16 }}>error</span>
              {saveStatus}
            </span>
          )}
        </div>

        {testResult && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {Object.entries(testResult.checks).map(([k, v]) => (
              <span key={k} className={`status-pill ${v.ok ? 'ok' : 'err'}`} title={v.detail}>
                <span className="material-icons" style={{ fontSize: 16 }}>
                  {v.ok ? 'check_circle' : 'error'}
                </span>
                {k} {v.detail && `· ${v.detail}`}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="danger">Danger zone</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>
          Local cache lives in your browser. Reset removes credentials from this
          device — your photos in Telegram &amp; the metadata in Supabase remain.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn outline" onClick={clearCache}>
            <span className="material-icons">cleaning_services</span>
            Clear local cache
          </button>
          <button className="btn outline danger" onClick={resetAll}>
            <span className="material-icons">restart_alt</span>
            Reset &amp; restart onboarding
          </button>
        </div>
      </div>
    </div>
  );
}
