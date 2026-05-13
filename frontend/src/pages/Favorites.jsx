import { useCallback, useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigCtx.jsx';
import { makeApi } from '../lib/api.js';
import PhotoGrid from '../components/PhotoGrid.jsx';

export default function Favorites() {
  const { config } = useConfig();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const api = makeApi(config);
      const { data } = await api.get('/api/photos', { params: { favorites: 1 } });
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
      <h1 className="page-title">Favorites</h1>
      <PhotoGrid
        photos={photos}
        onChange={load}
        emptyText="No favorites yet"
        emptyIcon="favorite_border"
      />
    </>
  );
}
