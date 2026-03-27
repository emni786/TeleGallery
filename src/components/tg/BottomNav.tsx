import { Image, FolderOpen, Heart, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Photos', icon: Image },
  { path: '/albums', label: 'Albums', icon: FolderOpen },
  { path: '/favorites', label: 'Favorites', icon: Heart },
  { path: '/trash', label: 'Trash', icon: Trash2 },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t bg-tg-nav-bg border-tg-divider">
      {NAV_ITEMS.map(item => {
        const active = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
              active ? 'text-tg-active-text' : 'text-muted-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
