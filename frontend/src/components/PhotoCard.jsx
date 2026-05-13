import { useMemo, useState } from 'react';
import { useConfig } from '../context/ConfigCtx.jsx';
import { makeApi, thumbnailUrl } from '../lib/api.js';

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PhotoCard({ photo, onOpen, onChange }) {
  const { config } = useConfig();
  const [favoriteState, setFavoriteState] = useState(Boolean(photo.is_favorite));
  const [imgError, setImgError] = useState(false);

  const thumb = useMemo(() => {
    const id = photo.thumbnail_id || photo.file_id;
    return thumbnailUrl(config, id);
  }, [config, photo.file_id, photo.thumbnail_id]);

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    const next = !favoriteState;
    setFavoriteState(next);
    try {
      const api = makeApi(config);
      await api.put(`/api/photos/${photo.id}/favorite`, { is_favorite: next });
      onChange?.();
    } catch {
      setFavoriteState(!next);
    }
  };

  return (
    <div className="photo-card" onClick={onOpen} role="button">
      {!imgError && thumb ? (
        <img
          className="thumb"
          src={thumb}
          alt={photo.title || photo.file_name || 'photo'}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="thumb"
          style={{
            display: 'grid',
            placeItems: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <span className="material-icons" style={{ fontSize: 40 }}>
            {photo.file_type === 'video' ? 'movie' : 'broken_image'}
          </span>
        </div>
      )}

      <div className="overlay" />

      <button
        type="button"
        className="corner tr"
        onClick={toggleFavorite}
        title={favoriteState ? 'Unfavorite' : 'Favorite'}
        aria-label="Favorite"
      >
        <span className="material-icons">
          {favoriteState ? 'favorite' : 'favorite_border'}
        </span>
      </button>

      {photo.file_type === 'video' && (
        <>
          <div className="play-icon">
            <span className="material-icons" style={{ fontSize: 32 }}>
              play_arrow
            </span>
          </div>
          {photo.duration > 0 && (
            <div className="duration">
              <span className="material-icons" style={{ fontSize: 14 }}>
                play_arrow
              </span>
              {formatDuration(photo.duration)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
