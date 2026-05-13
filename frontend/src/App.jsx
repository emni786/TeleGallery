import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useConfig, isConfigured } from './context/ConfigCtx.jsx';
import AppShell from './components/AppShell.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Restore from './pages/Restore.jsx';
import Home from './pages/Home.jsx';
import Albums from './pages/Albums.jsx';
import AlbumView from './pages/AlbumView.jsx';
import Favorites from './pages/Favorites.jsx';
import Trash from './pages/Trash.jsx';
import Search from './pages/Search.jsx';
import Settings from './pages/Settings.jsx';

function initNativeStatusBar() {
  // Lazy native bridge — only runs inside Capacitor APK build.
  import('@capacitor/core')
    .then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return;
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Dark });
    })
    .catch(() => {
      // Web build — no native plugin available, ignore.
    });
}

function ProtectedRoutes() {
  const { config } = useConfig();
  const location = useLocation();

  if (!isConfigured(config)) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/albums" element={<Albums />} />
        <Route path="/albums/:name" element={<AlbumView />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  const { ready, config } = useConfig();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initNativeStatusBar();
  }, []);

  // Auto-redirect to the gallery once credentials exist.
  useEffect(() => {
    if (!ready) return;
    if (isConfigured(config) && location.pathname.startsWith('/onboarding')) {
      navigate('/', { replace: true });
    }
  }, [ready, config, location.pathname, navigate]);

  if (!ready) {
    return (
      <div className="center-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/restore" element={<Restore />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}
