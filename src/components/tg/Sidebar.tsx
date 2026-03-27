import { Image, FolderOpen, Heart, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Photos', icon: Image },
  { path: '/albums', label: 'Albums', icon: FolderOpen },
  { path: '/favorites', label: 'Favorites', icon: Heart },
  { path: '/trash', label: 'Trash', icon: Trash2 },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 py-4 px-3 bg-tg-sidebar-bg border-r border-tg-divider shrink-0">
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`tg-sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
