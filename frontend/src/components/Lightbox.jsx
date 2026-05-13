import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactPlayer from 'react-player';
import { useConfig } from '../context/ConfigCtx.jsx';
import { fileUrl, makeApi } from '../lib/api.js';

export default function Lightbox({
  photos,
  index,
  onClose,
  onIndexChange,
  onChange,
  showRestore = false,
}) {
  const { config } = useConfig();
  const photo = photos[index];
  const [busy, setBusy] = useState(false);

  const url = useMemo(() => fileUrl(config, photo?.file_id), [config, photo?.file_id]);

  const go = useCallback(
    (delta) => {
      const next = (index + delta + photos.length) % photos.length;
      onIndexChange(next);
    },
    [index, photos.length, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  if (!photo) return null;

  const api = makeApi(config);

  const toggleFavorite = async () => {
    setBusy(true);
    try {
      await api.put(`/api/photos/${photo.id}/favorite`, {
        is_favorite: !photo.is_favorite,
      });
      onChange?.();
    } finally {
      setBusy(false);
    }
  };

  const softDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/api/photos/${photo.id}`);
      onChange?.();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      await api.post(`/api/photos/${photo.id}/restore`);
      onChange?.();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const hardDelete = async () => {
    if (!window.confirm('Permanently delete this item? Cannot be undone.')) return;
    setBusy(true);
    try {
      await api.delete(`/api/photos/${photo.id}/permanent`);
      onChange?.();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lightbox" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <header>
        <button className="icon-btn" onClick={onClose} title="Close" aria-label="Close">
          <span className="material-icons">arrow_back</span>
        </button>
        <span className="filename">{photo.title || photo.file_name || 'Untitled'}</span>

        {!showRestore && (
          <button
            className="icon-btn"
            onClick={toggleFavorite}
            disabled={busy}
            title="Favorite"
            aria-label="Favorite"
          >
            <span className="material-icons">
              {photo.is_favorite ? 'favorite' : 'favorite_border'}
            </span>
          </button>
        )}

        {showRestore ? (
          <>
            <button
              className="icon-btn"
              onClick={restore}
              disabled={busy}
              title="Restore"
              aria-label="Restore"
            >
              <span className="material-icons">restore_from_trash</span>
            </button>
            <button
              className="icon-btn"
              onClick={hardDelete}
              disabled={busy}
              title="Delete forever"
              aria-label="Delete forever"
            >
              <span className="material-icons">delete_forever</span>
            </button>
          </>
        ) : (
          <button
            className="icon-btn"
            onClick={softDelete}
            disabled={busy}
            title="Move to trash"
            aria-label="Move to trash"
          >
            <span className="material-icons">delete</span>
          </button>
        )}
      </header>

      <div className="stage">
        {photos.length > 1 && (
          <>
            <button
              className="nav-arrow left"
              onClick={() => go(-1)}
              aria-label="Previous"
            >
              <span className="material-icons">chevron_left</span>
            </button>
            <button
              className="nav-arrow right"
              onClick={() => go(1)}
              aria-label="Next"
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </>
        )}

        {photo.file_type === 'video' ? (
          <ReactPlayer url={url} controls playing width="100%" height="100%" />
        ) : (
          <img src={url} alt={photo.title || photo.file_name || ''} />
        )}
      </div>
    </div>
  );
}
