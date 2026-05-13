import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useConfig } from '../context/ConfigCtx.jsx';
import { makeApi } from '../lib/api.js';

const STATUS_LABELS = {
  pending: 'Waiting',
  uploading: 'Uploading…',
  done: 'Done',
  error: 'Failed',
};

export default function UploadModal({ onClose }) {
  const { config } = useConfig();
  const [items, setItems] = useState([]);
  const [running, setRunning] = useState(false);

  const onDrop = useCallback((accepted) => {
    setItems((prev) => [
      ...prev,
      ...accepted.map((f) => ({
        file: f,
        name: f.name,
        size: f.size,
        status: 'pending',
        progress: 0,
        message: '',
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
  });

  const startUpload = async () => {
    setRunning(true);
    const api = makeApi(config);
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'done') continue;
      setItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'uploading' } : it)),
      );
      const fd = new FormData();
      fd.append('file', items[i].file);
      fd.append('album', 'All Photos');
      try {
        await api.post('/api/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (!e.total) return;
            const pct = Math.round((e.loaded / e.total) * 100);
            setItems((prev) =>
              prev.map((it, idx) => (idx === i ? { ...it, progress: pct } : it)),
            );
          },
        });
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: 'done', progress: 100 } : it,
          ),
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: 'error',
                  message: err?.response?.data?.error || err.message,
                }
              : it,
          ),
        );
      }
    }
    setRunning(false);
  };

  const allDone = items.length > 0 && items.every((it) => it.status === 'done');

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && !running && onClose()}>
      <div className="modal" role="dialog" aria-labelledby="upload-title">
        <h3 id="upload-title">Upload photos &amp; videos</h3>

        <div
          {...getRootProps({ className: `dropzone ${isDragActive ? 'active' : ''}` })}
        >
          <input {...getInputProps()} />
          <span className="material-icons" style={{ fontSize: 40, display: 'block' }}>
            cloud_upload
          </span>
          {isDragActive
            ? 'Drop files to add to the queue'
            : 'Drag & drop, or click to choose photos / videos'}
        </div>

        {items.length > 0 && (
          <ul className="upload-list">
            {items.map((it) => (
              <li key={`${it.name}-${it.size}`}>
                <span className="material-icons">
                  {it.file.type.startsWith('video') ? 'movie' : 'image'}
                </span>
                <span className="name" title={it.name}>{it.name}</span>
                <span
                  className={`status ${
                    it.status === 'done' ? 'ok' : it.status === 'error' ? 'err' : ''
                  }`}
                >
                  {it.status === 'uploading'
                    ? `${it.progress}%`
                    : STATUS_LABELS[it.status]}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="actions" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn outline" onClick={onClose} disabled={running}>
            {allDone ? 'Close' : 'Cancel'}
          </button>
          <button
            className="btn primary"
            onClick={startUpload}
            disabled={running || !items.length || allDone}
          >
            {running ? 'Uploading…' : 'Start upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
