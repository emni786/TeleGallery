import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/', icon: 'photo', label: 'Photos', end: true },
  { to: '/favorites', icon: 'favorite', label: 'Favorites' },
  { to: '/albums', icon: 'photo_album', label: 'Albums' },
  { to: '/search', icon: 'manage_search', label: 'Explore' },
  { to: '/trash', icon: 'delete', label: 'Trash' },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="material-icons">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
      <div className="divider" />
      <NavLink
        to="/settings"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="material-icons">settings</span>
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}
