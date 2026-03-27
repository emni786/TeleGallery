import { useState, useEffect } from 'react';
import { useConfig } from '@/context/ConfigContext';
import { getApi } from '@/lib/api';
import { FolderOpen, Plus } from 'lucide-react';

interface Album {
  id: number;
  name: string;
  cover_file_id: string;
  created_at: string;
}

export default function AlbumsPage() {
  const { credentials } = useConfig();
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const api = getApi(credentials);
        const { data } = await api.get('/api/albums');
        setAlbums(data.albums || data || []);
      } catch {
        setAlbums([{ id: 1, name: 'All Photos', cover_file_id: '', created_at: new Date().toISOString() }]);
      }
    })();
  }, [credentials]);

  return (
    <div className="flex-1 p-4 md:p-6 pb-24 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold font-nunito text-foreground">Albums</h1>
        <button className="tg-btn-outline text-sm gap-1"><Plus className="w-4 h-4" /> New Album</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {albums.map(album => (
          <div key={album.id} className="group cursor-pointer">
            <div className="aspect-square rounded-xl bg-secondary flex items-center justify-center overflow-hidden mb-2">
              {album.cover_file_id ? (
                <img src={`${credentials.backendUrl}/api/thumbnail/${album.cover_file_id}`} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <FolderOpen className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground truncate">{album.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
