import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/', icon: 'photo', label: 'Photos', end: true },
  { to: '/favorites', icon: 'favorite', label: 'Favorites' },
  { to: '/albums', icon: 'photo_album', label: 'Albums' },
  { to: '/search', icon: 'search', label: 'Search' },
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <span className="material-icons">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
