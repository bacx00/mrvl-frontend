// src/app/components/TabNavigation.tsx
'use client';

import React from 'react';

interface Props {
  tabs: string[];
  activeTab: string;
  onTabSelect: (tab: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onTabSelect }: Props) {
  return (
    <ul className="nav nav-tabs">
      {tabs.map((tab) => (
        <li className="nav-item" key={tab}>
          <button
            type="button"
            className={`nav-link ${tab === activeTab ? 'active' : ''}`}
            onClick={() => onTabSelect(tab)}
          >
            {tab}
          </button>
        </li>
      ))}
    </ul>
  );
}
