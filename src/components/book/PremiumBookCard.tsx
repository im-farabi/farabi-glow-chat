import { Star, Trash2 } from "lucide-react";

interface PremiumBookCardProps {
  title: string;
  author: string;
  coverUrl: string;
  onClick?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
  isStarred?: boolean;
  reason?: string;
}

const PremiumBookCard = ({ 
  title, 
  author, 
  coverUrl, 
  onClick, 
  onRemove,
  showRemove = false,
  isStarred = false,
  reason
}: PremiumBookCardProps) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-all duration-500 cursor-pointer hover:-translate-y-1"
    >
      {/* Book Cover */}
      <div className="aspect-[2/3] overflow-hidden bg-zinc-900">
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/200x300/18181b/ffffff?text=${encodeURIComponent(title.slice(0, 12))}`;
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Book Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
        <h3 className="font-semibold text-white text-sm md:text-base line-clamp-2 mb-0.5">
          {title}
        </h3>
        <p className="text-white/60 text-xs md:text-sm line-clamp-1">
          {author}
        </p>
        {reason && (
          <p className="text-orange-400/80 text-xs mt-1 line-clamp-1">
            {reason}
          </p>
        )}
      </div>

      {/* Star indicator */}
      {isStarred && (
        <div className="absolute top-2 right-2">
          <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
        </div>
      )}

      {/* Remove button */}
      {showRemove && onRemove && (
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-red-400 hover:border-red-400/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Hover shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </div>
  );
};

export default PremiumBookCard;
