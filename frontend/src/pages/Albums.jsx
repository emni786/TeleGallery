import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigCtx.jsx';
import { makeApi, thumbnailUrl } from '../lib/api.js';

export default function Albums() {
  const { config } = useConfig();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const api = makeApi(config);
      const { data } = await api.get('/api/albums');
      setAlbums(data.albums || []);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const api = makeApi(config);
      await api.post('/api/albums', { name: newName.trim() });
      setNewName('');
      await load();
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="center-loading"><div className="spinner" /></div>;

  return (
    <>
      <h1 className="page-title">Albums</h1>

      <form onSubmit={create} style={{ display: 'flex', gap: 8, margin: '0 4px 24px' }}>
        <div className="field" style={{ flex: 1, margin: 0 }}>
          <div className="input-row">
            <input
              placeholder="New album name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
        </div>
        <button className="btn primary" type="submit" disabled={creating || !newName.trim()}>
          <span className="material-icons">add</span>
          Create
        </button>
      </form>

      {albums.length === 0 ? (
        <div className="empty-state">
          <span className="material-icons">photo_album</span>
          <h3>No albums yet</h3>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 16,
          }}
        >
          {albums.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/albums/${encodeURIComponent(a.name)}`)}
              style={{
                textAlign: 'left',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--divider)',
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  aspectRatio: '1 / 1',
                  background: 'var(--sidebar-bg)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                {a.cover_file_id ? (
                  <img
                    src={thumbnailUrl(config, a.cover_file_id)}
                    alt={a.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span className="material-icons" style={{ fontSize: 48 }}>
                    photo_album
                  </span>
                )}
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontWeight: 500 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {a.count} item{a.count === 1 ? '' : 's'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
