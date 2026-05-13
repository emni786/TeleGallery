import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import MobileNav from './MobileNav.jsx';

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <Sidebar />
      <main className="main">{children}</main>
      <MobileNav />
    </div>
  );
}
