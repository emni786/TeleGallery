import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigCtx.jsx';
import UploadModal from './UploadModal.jsx';

export default function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useConfig();
  const [query, setQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="navbar">
      <div className="brand" onClick={() => navigate('/')} role="button">
        <span className="logo">
          <span className="material-icons" style={{ fontSize: 22 }}>
            photo_library
          </span>
        </span>
        <span>TeleGallery</span>
      </div>

      <form className="search" onSubmit={onSubmit}>
        <span className="material-icons">search</span>
        <input
          aria-label="Search your photos"
          placeholder="Search your photos"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="icon-btn"
            onClick={() => setQuery('')}
            title="Clear"
          >
            <span className="material-icons">close</span>
          </button>
        )}
      </form>

      <div className="actions">
        <button
          className="icon-btn"
          onClick={() => setUploadOpen(true)}
          title="Upload"
          aria-label="Upload"
        >
          <span className="material-icons">add_photo_alternate</span>
        </button>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          <span className="material-icons">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button
          className="icon-btn"
          onClick={() => navigate('/settings')}
          title="Settings"
          aria-label="Settings"
        >
          <span className="material-icons">settings</span>
        </button>
      </div>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </header>
  );
}
