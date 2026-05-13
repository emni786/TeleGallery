import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigCtx.jsx';

export default function Restore() {
  const navigate = useNavigate();
  const { restoreFromSupabase } = useConfig();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) return;
    setBusy(true);
    setError('');
    try {
      const restored = await restoreFromSupabase(url.trim(), key.trim());
      if (!restored.bot_token || !restored.channel_id || !restored.backend_url) {
        setError(
          'Connected to Supabase, but some credentials are missing from the credentials table. Use the Settings page to fill them in.',
        );
        navigate('/settings');
        return;
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Could not restore credentials');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="card">
        <div className="brand">
          <span className="logo">
            <span className="material-icons">vpn_key</span>
          </span>
          <span className="title">Restore Access</span>
        </div>
        <p>
          Enter your Supabase project URL &amp; anon key. Everything else will be
          decrypted automatically from your <code>credentials</code> table.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
          <div className="field">
            <label>Supabase Project URL</label>
            <div className="input-row">
              <input
                placeholder="https://xyzxyz.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="field">
            <label>Supabase Anon Key</label>
            <div className="input-row">
              <input
                type={reveal ? 'text' : 'password'}
                placeholder="eyJhbGciOi…"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoComplete="off"
              />
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
            </div>
          </div>

          {error && (
            <div className="status-pill err" style={{ marginBottom: 12 }}>
              <span className="material-icons" style={{ fontSize: 16 }}>error</span>
              {error}
            </div>
          )}

          <div className="actions between">
            <Link to="/onboarding" className="btn outline">
              <span className="material-icons">arrow_back</span> Back
            </Link>
            <button
              type="submit"
              className="btn primary"
              disabled={busy || !url.trim() || !key.trim()}
            >
              <span className="material-icons">restore</span>
              {busy ? 'Restoring…' : 'Restore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
