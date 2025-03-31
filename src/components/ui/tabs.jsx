import { useState } from 'react';

export function Tabs({ defaultValue, children, className = "" }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={className}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
}

export function TabsList({ children, activeTab, setActiveTab }) {
  return <div className="flex space-x-2 border-b mb-4">{children}</div>;
}

export function TabsTrigger({ value, children, activeTab, setActiveTab }) {
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 border-b-2 ${
        activeTab === value ? 'border-blue-500' : 'border-transparent hover:border-blue-500'
      }`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, activeTab }) {
  return activeTab === value ? <div>{children}</div> : null;
}
