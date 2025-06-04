import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  return (
    <div className="w-full">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150
                ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <div className="flex items-center">
                {tab.icon && <span className="mr-2">{tab.icon}</span>}
                {tab.label}
              </div>
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
};

export default Tabs;