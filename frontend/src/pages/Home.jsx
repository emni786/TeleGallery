import { useCallback, useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigCtx.jsx';
import { makeApi } from '../lib/api.js';
import PhotoGrid from '../components/PhotoGrid.jsx';

export default function Home() {
  const { config } = useConfig();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const api = makeApi(config);
      const { data } = await api.get('/api/photos');
      setPhotos(data.photos || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="center-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title">Photos</h1>
      {error && (
        <div className="empty-state">
          <span className="material-icons">cloud_off</span>
          <h3>Could not load photos</h3>
          <p>{error}</p>
        </div>
      )}
      {!error && (
        <PhotoGrid
          photos={photos}
          onChange={load}
          emptyText="Your gallery is empty"
        />
      )}
    </>
  );
}
