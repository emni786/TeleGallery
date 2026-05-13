import { useMemo, useState } from 'react';
import PhotoCard from './PhotoCard.jsx';
import Lightbox from './Lightbox.jsx';

function groupByDate(photos) {
  const groups = new Map();
  for (const p of photos) {
    const d = p.uploaded_at ? new Date(p.uploaded_at) : new Date(0);
    const key = d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  return Array.from(groups.entries());
}

export default function PhotoGrid({
  photos,
  onChange,
  showRestore = false,
  emptyText = "Nothing here yet",
  emptyIcon = 'photo_library',
}) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const grouped = useMemo(() => groupByDate(photos), [photos]);

  if (!photos.length) {
    return (
      <div className="empty-state">
        <span className="material-icons">{emptyIcon}</span>
        <h3>{emptyText}</h3>
        <p>Upload your first photo or video using the + button.</p>
      </div>
    );
  }

  const flat = grouped.flatMap(([, list]) => list);

  return (
    <>
      {grouped.map(([date, list]) => (
        <section key={date}>
          <div className="section-header">
            <span className="date">{date}</span>
          </div>
          <div className="photo-grid">
            {list.map((photo) => {
              const idx = flat.indexOf(photo);
              return (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onOpen={() => setLightboxIndex(idx)}
                  onChange={onChange}
                />
              );
            })}
          </div>
        </section>
      ))}

      {lightboxIndex >= 0 && (
        <Lightbox
          photos={flat}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
          onIndexChange={setLightboxIndex}
          onChange={onChange}
          showRestore={showRestore}
        />
      )}
    </>
  );
}
