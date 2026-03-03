import { type ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300">
        <Header 
          isCollapsed={isCollapsed}
          onToggleSidebar={() => {
            if (window.innerWidth >= 768) {
              setIsCollapsed(!isCollapsed);
            } else {
              setIsSidebarOpen(!isSidebarOpen);
            }
          }} 
        />
        <main className="flex-1 overflow-hidden px-4 py-4 md:px-6 lg:px-8 flex flex-col">
          <div className="flex-1 min-h-0 w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
