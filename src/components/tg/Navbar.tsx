import { Search, Settings, Moon, Sun, Upload } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ onUploadClick }: { onUploadClick?: () => void }) {
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2 border-b bg-tg-nav-bg border-tg-divider">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold font-nunito">TG</span>
        </div>
        <span className="font-nunito text-lg hidden sm:inline text-foreground">TeleGallery</span>
      </button>

      <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your photos & videos"
            className="tg-input pl-10 rounded-full"
          />
        </div>
      </form>

      <div className="flex items-center gap-1 shrink-0">
        {onUploadClick && location.pathname !== '/onboarding' && (
          <button onClick={onUploadClick} className="p-2 rounded-full hover:bg-tg-hover-bg transition-colors" title="Upload">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
        <button onClick={toggleDark} className="p-2 rounded-full hover:bg-tg-hover-bg transition-colors" title="Toggle theme">
          {dark ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
        </button>
        <button onClick={() => navigate('/settings')} className="p-2 rounded-full hover:bg-tg-hover-bg transition-colors" title="Settings">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
