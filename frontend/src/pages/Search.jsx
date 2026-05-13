import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConfig } from '../context/ConfigCtx.jsx';
import { makeApi } from '../lib/api.js';
import PhotoGrid from '../components/PhotoGrid.jsx';

export default function Search() {
  const { config } = useConfig();
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!q) {
      setPhotos([]);
      return;
    }
    setLoading(true);
    try {
      const api = makeApi(config);
      const { data } = await api.get('/api/photos/search', { params: { q } });
      setPhotos(data.photos || []);
    } finally {
      setLoading(false);
    }
  }, [config, q]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="center-loading"><div className="spinner" /></div>;

  return (
    <>
      <h1 className="page-title">
        {q ? `Results for “${q}”` : 'Search your gallery'}
      </h1>
      {!q ? (
        <div className="empty-state">
          <span className="material-icons">search</span>
          <h3>Type something in the search bar</h3>
          <p>Match titles, albums, or filenames.</p>
        </div>
      ) : (
        <PhotoGrid
          photos={photos}
          onChange={load}
          emptyText="No matches"
          emptyIcon="search_off"
        />
      )}
    </>
  );
}
