export function Tabs({ defaultValue, children, className = "" }) {
  return <div className={className}>{children}</div>;
}

export function TabsList({ children }) {
  return <div className="flex space-x-2 border-b mb-4">{children}</div>;
}

export function TabsTrigger({ value, children }) {
  return (
    <button
      onClick={() => {}}
      className="px-4 py-2 border-b-2 border-transparent hover:border-blue-500"
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }) {
  return <div>{children}</div>;
}
