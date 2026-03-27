import { X, ChevronLeft, ChevronRight, Heart, Trash2, Info, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PhotoItem } from './PhotoGrid';

interface Props {
  photo: PhotoItem;
  photos: PhotoItem[];
  backendUrl: string;
  onClose: () => void;
  onNavigate: (photo: PhotoItem) => void;
  onFavoriteToggle?: (photo: PhotoItem) => void;
  onDelete?: (photo: PhotoItem) => void;
}

export default function Lightbox({ photo, photos, backendUrl, onClose, onNavigate, onFavoriteToggle, onDelete }: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const idx = photos.findIndex(p => p.id === photo.id);
  const hasPrev = idx > 0;
  const hasNext = idx < photos.length - 1;
  const fileUrl = `${backendUrl}/api/file/${photo.file_id}`;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(photos[idx - 1]);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(photos[idx + 1]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [idx, photos, hasPrev, hasNext, onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-50 flex bg-background/95 backdrop-blur-sm">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 z-10">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-tg-hover-bg transition-colors">
          <X className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => onFavoriteToggle?.(photo)} className="p-2 rounded-full hover:bg-tg-hover-bg transition-colors">
            <Heart className={`w-5 h-5 ${photo.is_favorite ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
          </button>
          <button onClick={() => setShowInfo(!showInfo)} className="p-2 rounded-full hover:bg-tg-hover-bg transition-colors">
            <Info className="w-5 h-5 text-foreground" />
          </button>
          <a href={fileUrl} download className="p-2 rounded-full hover:bg-tg-hover-bg transition-colors">
            <Download className="w-5 h-5 text-foreground" />
          </a>
          <button onClick={() => onDelete?.(photo)} className="p-2 rounded-full hover:bg-tg-hover-bg transition-colors">
            <Trash2 className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Nav arrows */}
      {hasPrev && (
        <button onClick={() => onNavigate(photos[idx - 1])} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-tg-hover-bg transition-colors z-10">
          <ChevronLeft className="w-8 h-8 text-foreground" />
        </button>
      )}
      {hasNext && (
        <button onClick={() => onNavigate(photos[idx + 1])} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-tg-hover-bg transition-colors z-10">
          <ChevronRight className="w-8 h-8 text-foreground" />
        </button>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-16">
        {photo.file_type === 'video' ? (
          <video src={fileUrl} controls autoPlay className="max-w-full max-h-full rounded-lg" />
        ) : (
          <img src={fileUrl} alt={photo.title || photo.file_name} className="max-w-full max-h-full object-contain rounded-lg" />
        )}
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="w-80 border-l border-tg-divider bg-background p-6 overflow-auto">
          <h3 className="font-medium text-foreground mb-4">Details</h3>
          <div className="space-y-3 text-sm">
            <Detail label="Name" value={photo.file_name || 'Untitled'} />
            <Detail label="Type" value={photo.file_type} />
            <Detail label="Album" value={photo.album} />
            <Detail label="Size" value={formatBytes(photo.file_size)} />
            {photo.width > 0 && <Detail label="Dimensions" value={`${photo.width} × ${photo.height}`} />}
            {photo.duration > 0 && <Detail label="Duration" value={`${Math.floor(photo.duration / 60)}:${(photo.duration % 60).toString().padStart(2, '0')}`} />}
            <Detail label="Uploaded" value={new Date(photo.uploaded_at).toLocaleString()} />
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
