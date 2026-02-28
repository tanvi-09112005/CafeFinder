import { Search, SlidersHorizontal } from "lucide-react";

export default function SearchBar({ value, onChange, onFilterClick }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search cafes, bakeries..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-dark-card border border-dark-border text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm"
        />
      </div>
      <button
        onClick={onFilterClick}
        className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-colors"
      >
        <SlidersHorizontal className="w-5 h-5 text-primary" />
      </button>
    </div>
  );
}
