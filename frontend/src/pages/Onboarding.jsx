import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigCtx.jsx';
import { SUPABASE_SQL } from '../lib/sql.js';
import { testConnections } from '../lib/api.js';

const FIELD_DEFS = {
  supabase_url: { label: 'Supabase Project URL', placeholder: 'https://xyzxyz.supabase.co', type: 'text' },
  supabase_key: { label: 'Supabase Anon Key', placeholder: 'eyJhbGciOi…', type: 'password' },
  bot_token: { label: 'Bot Token', placeholder: '1234:ABCdef…', type: 'password' },
  channel_id: { label: 'Channel ID', placeholder: '-1001234567890', type: 'text' },
  api_id: { label: 'API ID', placeholder: '12345678', type: 'text' },
  api_hash: { label: 'API Hash', placeholder: 'abcdef0123…', type: 'password' },
  backend_url: { label: 'Backend URL (Railway)', placeholder: 'https://myapp.railway.app', type: 'text' },
};

function Field({ name, value, onChange }) {
  const def = FIELD_DEFS[name];
  const [reveal, setReveal] = useState(false);
  const isPassword = def.type === 'password';
  return (
    <div className="field">
      <label>{def.label}</label>
      <div className="input-row">
        <input
          type={isPassword && !reveal ? 'password' : 'text'}
          placeholder={def.placeholder}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
        {isPassword && (
          <button
            type="button"
            className="toggle"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Hide' : 'Reveal'}
            title={reveal ? 'Hide' : 'Reveal'}
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

function StepDots({ step }) {
  return (
    <div className="step-dots">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`dot ${i <= step ? 'active' : ''}`} />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { config, setConfig, saveToSupabase } = useConfig();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(config);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const updateField = (name, value) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
    setTestResult(null);
  };

  const copySQL = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const runTests = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnections(draft);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        ok: false,
        checks: {
          telegram: { ok: false, detail: '' },
          channel: { ok: false, detail: '' },
          supabase: { ok: false, detail: '' },
          pyrogram: { ok: false, detail: '' },
        },
        error: err?.response?.data?.error || err.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await saveToSupabase(draft);
      setConfig(draft);
      navigate('/', { replace: true });
    } catch (err) {
      setSaveError(err.message || 'Failed to save credentials to Supabase');
    } finally {
      setSaving(false);
    }
  };

  const requiredOk =
    draft.supabase_url &&
    draft.supabase_key &&
    draft.bot_token &&
    draft.channel_id &&
    draft.backend_url;

  return (
    <div className="onboarding">
      <div className="card">
        <div className="brand">
          <span className="logo">
            <span className="material-icons">photo_library</span>
          </span>
          <span className="title">TeleGallery</span>
        </div>

        <StepDots step={step} />
        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
          Step {step + 1} of 4
        </div>

        {step === 0 && (
          <>
            <h2>Welcome</h2>
            <p>Your personal photo cloud — powered by Telegram. Unlimited storage. Original quality. Free.</p>
            <ul className="feature-list">
              <li><span className="material-icons">check_circle</span> Unlimited photo &amp; video storage</li>
              <li><span className="material-icons">check_circle</span> Google Photos-style experience</li>
              <li><span className="material-icons">check_circle</span> Your data, your Telegram, your control</li>
              <li><span className="material-icons">check_circle</span> Works on every device</li>
            </ul>
            <div className="actions between">
              <Link to="/restore" className="btn outline">
                <span className="material-icons">lock_open</span>
                Already set up? Restore access
              </Link>
              <button className="btn primary" onClick={() => setStep(1)}>
                Get started
                <span className="material-icons">arrow_forward</span>
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2>Set up your database</h2>
            <ol>
              <li>Sign in at <a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a> and create a free project.</li>
              <li>Open <strong>SQL Editor → New query</strong>.</li>
              <li>Paste the SQL below and click <strong>RUN</strong>.</li>
              <li>Open <strong>Project Settings → API</strong> to copy your Project URL and anon key (you'll need them in step 4).</li>
            </ol>
            <pre className="sql-block">{SUPABASE_SQL}</pre>
            <div className="actions between">
              <button className="btn outline" onClick={() => setStep(0)}>
                <span className="material-icons">arrow_back</span> Back
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn outline" onClick={copySQL}>
                  <span className="material-icons">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? 'Copied!' : 'Copy SQL'}
                </button>
                <button className="btn primary" onClick={() => setStep(2)}>
                  Done, next
                  <span className="material-icons">arrow_forward</span>
                </button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Connect your Telegram storage</h2>
            <ol>
              <li>In Telegram, message <strong>@BotFather</strong> and send <code>/newbot</code>. Save the <strong>bot token</strong>.</li>
              <li>Create a <strong>private channel</strong> in Telegram.</li>
              <li>Add the bot as an <strong>admin</strong> in the channel.</li>
              <li>Forward any message from the channel to <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer">@userinfobot</a> to get the channel ID (will start with <code>-100</code>).</li>
              <li>Visit <a href="https://my.telegram.org" target="_blank" rel="noreferrer">my.telegram.org</a> → API Development Tools → create app. Save the <strong>API ID</strong> and <strong>API Hash</strong> (needed for files &gt; 50 MB).</li>
            </ol>
            <div className="actions between">
              <button className="btn outline" onClick={() => setStep(1)}>
                <span className="material-icons">arrow_back</span> Back
              </button>
              <button className="btn primary" onClick={() => setStep(3)}>
                Got it, next
                <span className="material-icons">arrow_forward</span>
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Enter your credentials</h2>

            <div className="fieldset">
              <h4>Supabase</h4>
              <Field name="supabase_url" value={draft.supabase_url} onChange={updateField} />
              <Field name="supabase_key" value={draft.supabase_key} onChange={updateField} />
            </div>

            <div className="fieldset">
              <h4>Telegram</h4>
              <Field name="bot_token" value={draft.bot_token} onChange={updateField} />
              <Field name="channel_id" value={draft.channel_id} onChange={updateField} />
              <div className="field-row">
                <Field name="api_id" value={draft.api_id} onChange={updateField} />
                <Field name="api_hash" value={draft.api_hash} onChange={updateField} />
              </div>
            </div>

            <div className="fieldset">
              <h4>Backend</h4>
              <Field name="backend_url" value={draft.backend_url} onChange={updateField} />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', margin: '12px 0' }}>
              <button
                className="btn outline"
                onClick={runTests}
                disabled={testing || !requiredOk}
              >
                <span className="material-icons">
                  {testing ? 'hourglass_top' : 'cable'}
                </span>
                {testing ? 'Testing…' : 'Test all connections'}
              </button>
              {testResult && (
                <>
                  {Object.entries(testResult.checks).map(([k, v]) => (
                    <span
                      key={k}
                      className={`status-pill ${v.ok ? 'ok' : 'err'}`}
                      title={v.detail}
                    >
                      <span className="material-icons" style={{ fontSize: 16 }}>
                        {v.ok ? 'check_circle' : 'error'}
                      </span>
                      {k}
                    </span>
                  ))}
                </>
              )}
            </div>

            {saveError && (
              <div className="status-pill err" style={{ marginBottom: 12 }}>
                <span className="material-icons" style={{ fontSize: 16 }}>error</span>
                {saveError}
              </div>
            )}

            <div className="actions between">
              <button className="btn outline" onClick={() => setStep(2)} disabled={saving}>
                <span className="material-icons">arrow_back</span> Back
              </button>
              <button
                className="btn primary"
                onClick={finish}
                disabled={saving || !requiredOk}
              >
                <span className="material-icons">rocket_launch</span>
                {saving ? 'Saving…' : 'Start using TeleGallery'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
