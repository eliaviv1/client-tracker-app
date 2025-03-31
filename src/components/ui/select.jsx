export function Select({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => {
        console.log("Selected value: ", e.target.value);
        onChange(e.target.value);
      }}
      className={`border border-gray-300 rounded px-3 py-2 w-full ${className}`}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children }) {
  return <>{children}</>;
}

export function SelectContent({ children }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
