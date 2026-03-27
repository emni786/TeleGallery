import { useState, useEffect, useCallback } from 'react';
import { useConfig } from '@/context/ConfigContext';
import PhotoGrid, { PhotoItem } from '@/components/tg/PhotoGrid';
import { getApi } from '@/lib/api';
import { Trash2 } from 'lucide-react';

export default function TrashPage() {
  const { credentials } = useConfig();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const api = getApi(credentials);
      const { data } = await api.get('/api/photos');
      setPhotos((data.photos || data || []).filter((p: PhotoItem) => p.is_deleted));
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [credentials]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (photos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Trash2 className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">Trash is empty</p>
        <p className="text-sm mt-1">Items in trash will be permanently deleted after 30 days</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 pb-0">
        <h1 className="text-xl font-bold font-nunito text-foreground mb-1">Trash</h1>
        <p className="text-sm text-muted-foreground mb-2">Items are permanently deleted after 30 days</p>
      </div>
      <PhotoGrid photos={photos} backendUrl={credentials.backendUrl} />
    </>
  );
}
