import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'green' | 'orange' | 'blue' | 'red' | 'gray' | 'dark' | 'purple';
}

export function Badge({ children, color = 'gray' }: BadgeProps) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    orange: 'bg-amber-50 text-amber-700 border border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
    gray: 'bg-gray-100 text-gray-600 border border-gray-200',
    dark: 'bg-gray-800 text-gray-200 border border-gray-700',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}