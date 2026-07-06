import React from 'react';

interface TopBarProps {
  breadcrumb: string[];
}

export function TopBar({ breadcrumb }: TopBarProps) {
  return (
    <div className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-6 flex-shrink-0">
      <div className="text-sm font-medium text-gray-500">
        {breadcrumb.map((b, i) => (
          <span key={i}>
            {i > 0 && <span className="mx-2 text-gray-300">/</span>}
            <span className={i === breadcrumb.length - 1 ? "text-gray-900" : ""}>{b}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-gray-50 text-gray-400 border border-gray-100">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs">Search records, people, invoices…</span>
          <span className="text-xs ml-1 px-1 rounded bg-gray-200">⌘K</span>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </div>
  );
}