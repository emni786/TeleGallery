import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useConfig } from '../context/ConfigCtx.jsx';
import { makeApi } from '../lib/api.js';
import PhotoGrid from '../components/PhotoGrid.jsx';

export default function AlbumView() {
  const { name } = useParams();
  const { config } = useConfig();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const api = makeApi(config);
      const { data } = await api.get('/api/photos', { params: { album: name } });
      setPhotos(data.photos || []);
    } finally {
      setLoading(false);
    }
  }, [config, name]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="center-loading"><div className="spinner" /></div>;

  return (
    <>
      <h1 className="page-title">{decodeURIComponent(name)}</h1>
      <PhotoGrid photos={photos} onChange={load} emptyText="Album is empty" />
    </>
  );
}
