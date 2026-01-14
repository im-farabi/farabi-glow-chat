import { useState } from "react";
import { ChevronDown, ChevronUp, Newspaper } from "lucide-react";
import { NewsArticle } from "@/lib/newsStorage";

interface NewsCardProps {
  article: NewsArticle;
  defaultExpanded?: boolean;
}

const NewsCard = ({ article, defaultExpanded = false }: NewsCardProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm overflow-hidden transition-all duration-300">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-card/70 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Newspaper className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground leading-tight mb-1">
              {article.headline}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {article.context}
            </p>
          </div>
          <div className="flex-shrink-0 ml-2">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {/* Body - expandable */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 pt-0">
          <div className="border-t border-border/50 pt-4">
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {article.body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
