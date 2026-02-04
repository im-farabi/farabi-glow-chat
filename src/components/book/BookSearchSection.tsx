import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const BookSearchSection = () => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/book/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="w-full">
      {/* Glassmorphic Search Container */}
      <div 
        className={`relative rounded-2xl bg-white/5 backdrop-blur-xl border transition-all duration-300 ${
          isFocused ? 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)]' : 'border-white/10'
        }`}
      >
        <div className="flex items-center px-4">
          <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-orange-400' : 'text-white/40'}`} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Search books, authors, or topics..."
            className="h-14 text-base bg-transparent border-0 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      {/* Search hints */}
      <div className="flex flex-wrap gap-2 mt-3">
        {['best books for focus', 'self-improvement', 'fiction classics', 'business'].map((hint) => (
          <button
            key={hint}
            onClick={() => {
              setQuery(hint);
              navigate(`/book/search?q=${encodeURIComponent(hint)}`);
            }}
            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 hover:text-white/70 transition-all"
          >
            {hint}
          </button>
        ))}
      </div>
    </section>
  );
};

export default BookSearchSection;
