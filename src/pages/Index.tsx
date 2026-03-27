import { useConfig } from '@/context/ConfigContext';
import { Navigate } from 'react-router-dom';
import Home from './Home';

export default function Index() {
  const { isConfigured } = useConfig();
  if (!isConfigured) return <Navigate to="/onboarding" replace />;
  return <Home />;
}
