import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConfig } from '@/context/ConfigContext';
import PhotoGrid, { PhotoItem } from '@/components/tg/PhotoGrid';
import Lightbox from '@/components/tg/Lightbox';
import { getApi } from '@/lib/api';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const { credentials } = useConfig();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);

  const fetch = useCallback(async () => {
    if (!query) { setPhotos([]); setLoading(false); return; }
    try {
      const api = getApi(credentials);
      const { data } = await api.get(`/api/photos/search?q=${encodeURIComponent(query)}`);
      setPhotos(data.photos || data || []);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [credentials, query]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <div className="p-4 md:p-6 pb-0">
        <h1 className="text-xl font-bold font-nunito text-foreground mb-2">
          Search results for "{query}"
        </h1>
      </div>
      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">No results found</p>
        </div>
      ) : (
        <PhotoGrid photos={photos} backendUrl={credentials.backendUrl} onPhotoClick={p => setLightboxPhoto(p)} />
      )}
      {lightboxPhoto && (
        <Lightbox photo={lightboxPhoto} photos={photos} backendUrl={credentials.backendUrl} onClose={() => setLightboxPhoto(null)} onNavigate={setLightboxPhoto} />
      )}
    </>
  );
}
