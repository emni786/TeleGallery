import { Heart, Check, Play } from 'lucide-react';
import { useState } from 'react';

export interface PhotoItem {
  id: number;
  file_id: string;
  file_type: 'photo' | 'video';
  file_name: string;
  title: string;
  album: string;
  uploaded_at: string;
  is_favorite: boolean;
  is_deleted: boolean;
  thumbnail_id: string;
  width: number;
  height: number;
  duration: number;
  file_size: number;
}

interface Props {
  photos: PhotoItem[];
  backendUrl: string;
  onPhotoClick?: (photo: PhotoItem, index: number) => void;
  onFavoriteToggle?: (photo: PhotoItem) => void;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function groupByDate(photos: PhotoItem[]) {
  const groups: Record<string, PhotoItem[]> = {};
  photos.forEach(p => {
    const date = new Date(p.uploaded_at).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(p);
  });
  return Object.entries(groups);
}

export default function PhotoGrid({ photos, backendUrl, onPhotoClick, onFavoriteToggle }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const groups = groupByDate(photos);

  if (photos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Image className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No photos yet</p>
        <p className="text-sm mt-1">Upload photos to see them here</p>
      </div>
    );
  }

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-auto p-2 md:p-4 pb-20 md:pb-4">
      {groups.map(([date, items]) => (
        <div key={date} className="mb-6 animate-fade-in">
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1 uppercase tracking-wide font-nunito">{date}</h3>
          <div className="tg-masonry">
            {items.map((photo, idx) => {
              const thumbUrl = photo.thumbnail_id
                ? `${backendUrl}/api/thumbnail/${photo.thumbnail_id}`
                : `${backendUrl}/api/thumbnail/${photo.file_id}`;
              const isSelected = selected.has(photo.id);

              return (
                <div
                  key={photo.id}
                  className={`tg-masonry-card group ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                  onClick={() => onPhotoClick?.(photo, idx)}
                >
                  <img
                    src={thumbUrl}
                    alt={photo.title || photo.file_name}
                    loading="lazy"
                    className="transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="tg-card-overlay" />

                  {/* Checkbox */}
                  <button
                    onClick={e => toggleSelect(photo.id, e)}
                    className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'border-primary-foreground/70 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </button>

                  {/* Favorite */}
                  <button
                    onClick={e => { e.stopPropagation(); onFavoriteToggle?.(photo); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart
                      className={`w-5 h-5 drop-shadow-md ${
                        photo.is_favorite ? 'fill-red-500 text-red-500' : 'text-primary-foreground/80'
                      }`}
                    />
                  </button>

                  {/* Video badge */}
                  {photo.file_type === 'video' && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-background/40 backdrop-blur flex items-center justify-center">
                          <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
                        </div>
                      </div>
                      {photo.duration > 0 && (
                        <span className="absolute bottom-2 right-2 text-xs font-medium text-primary-foreground bg-background/50 backdrop-blur rounded px-1.5 py-0.5">
                          {formatDuration(photo.duration)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Image({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
