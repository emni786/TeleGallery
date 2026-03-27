import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import UploadModal from './UploadModal';
import { useConfig } from '@/context/ConfigContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isConfigured } = useConfig();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onUploadClick={isConfigured ? () => setShowUpload(true) : undefined} />
      <div className="flex-1 flex overflow-hidden">
        {isConfigured && <Sidebar />}
        <main className="flex-1 flex flex-col overflow-auto">
          {children}
        </main>
      </div>
      {isConfigured && <BottomNav />}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={() => setShowUpload(false)} />}
    </div>
  );
}
