import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="text-xs font-semibold tracking-widest uppercase px-3 mb-2 mt-4 text-gray-400">
      {children}
    </p>
  );
}