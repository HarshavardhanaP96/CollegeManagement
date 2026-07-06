import React from 'react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
        active
          ? "bg-gray-900 text-white"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}