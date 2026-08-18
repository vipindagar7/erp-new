// src/components/shared/SearchBar.jsx
import { useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/utils.js";

export function SearchBar({ value, onChange, placeholder = "Search…", className, debounce = 300 }) {
  const timer = useRef(null);
  const handleChange = (e) => {
    clearTimeout(timer.current);
    const val = e.target.value;
    timer.current = setTimeout(() => onChange(val), debounce);
  };
  return (
    <div className={cn("relative", className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input defaultValue={value} onChange={handleChange} placeholder={placeholder}
        className="w-full h-9 pl-9 pr-8 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
      {value && (
        <button onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X size={12} />
        </button>
      )}
    </div>
  );
}
export default SearchBar;
