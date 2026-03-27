import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfigProvider } from "@/context/ConfigContext";
import AppLayout from "@/components/tg/AppLayout";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import RestoreAccess from "./pages/RestoreAccess";
import AlbumsPage from "./pages/Albums";
import FavoritesPage from "./pages/Favorites";
import TrashPage from "./pages/TrashPage";
import SearchPage from "./pages/SearchPage";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ConfigProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/restore" element={<RestoreAccess />} />
              <Route path="/albums" element={<AlbumsPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/trash" element={<TrashPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </ConfigProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
