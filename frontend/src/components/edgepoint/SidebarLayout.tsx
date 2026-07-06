import React from 'react';

interface SidebarLayoutProps {
  logo: React.ReactNode;
  nav: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarLayout({ logo, nav, footer, children }: SidebarLayoutProps) {
  return (
    <div className="flex h-screen font-sans overflow-hidden bg-gray-50 text-gray-900">
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-gray-100 bg-white">
        <div className="h-14 flex items-center px-4 border-b border-gray-100 flex-shrink-0">{logo}</div>
        <nav className="flex-1 py-4 px-3 overflow-y-auto">{nav}</nav>
        <div className="p-3 border-t border-gray-100">{footer}</div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}