import { useState, useEffect, useCallback } from 'react';
import { useConfig } from '@/context/ConfigContext';
import PhotoGrid, { PhotoItem } from '@/components/tg/PhotoGrid';
import Lightbox from '@/components/tg/Lightbox';
import { getApi } from '@/lib/api';

export default function Home() {
  const { credentials } = useConfig();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const api = getApi(credentials);
      const { data } = await api.get('/api/photos');
      setPhotos((data.photos || data || []).filter((p: PhotoItem) => !p.is_deleted));
    } catch {
      // Demo data when no backend
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [credentials]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const toggleFavorite = async (photo: PhotoItem) => {
    try {
      const api = getApi(credentials);
      await api.put(`/api/photos/${photo.id}/favorite`);
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, is_favorite: !p.is_favorite } : p));
    } catch {}
  };

  const deletePhoto = async (photo: PhotoItem) => {
    try {
      const api = getApi(credentials);
      await api.delete(`/api/photos/${photo.id}`);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      setLightboxPhoto(null);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PhotoGrid
        photos={photos}
        backendUrl={credentials.backendUrl}
        onPhotoClick={photo => setLightboxPhoto(photo)}
        onFavoriteToggle={toggleFavorite}
      />
      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          photos={photos}
          backendUrl={credentials.backendUrl}
          onClose={() => setLightboxPhoto(null)}
          onNavigate={setLightboxPhoto}
          onFavoriteToggle={toggleFavorite}
          onDelete={deletePhoto}
        />
      )}
    </>
  );
}
