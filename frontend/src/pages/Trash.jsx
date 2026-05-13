import { useCallback, useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigCtx.jsx';
import { makeApi } from '../lib/api.js';
import PhotoGrid from '../components/PhotoGrid.jsx';

export default function Trash() {
  const { config } = useConfig();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const api = makeApi(config);
      const { data } = await api.get('/api/photos', { params: { trash: 1 } });
      setPhotos(data.photos || []);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="center-loading"><div className="spinner" /></div>;

  return (
    <>
      <h1 className="page-title">Trash</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        Items in Trash can be restored. Permanently delete to remove from your
        Supabase index (Telegram-side file remains).
      </p>
      <PhotoGrid
        photos={photos}
        onChange={load}
        showRestore
        emptyText="Trash is empty"
        emptyIcon="delete_outline"
      />
    </>
  );
}
