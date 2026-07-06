import React from 'react';

interface UserFooterProps {
  initials: string;
  name: string;
  sub: string;
  onLogout: () => void;
}

export function UserFooter({ initials, name, sub, onLogout }: UserFooterProps) {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate text-gray-900">{name}</p>
        <p className="text-xs truncate text-gray-400">{sub}</p>
      </div>
      <button onClick={onLogout} className="flex-shrink-0 text-gray-300 hover:text-gray-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
      </button>
    </div>
  );
}