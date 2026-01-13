import { Check } from "lucide-react";
import { PopularBook } from "@/data/popularBooks";

interface BookCardProps {
  book: PopularBook;
  isSelected: boolean;
  onToggle: () => void;
  showCheckmark?: boolean;
}

const BookCard = ({ book, isSelected, onToggle, showCheckmark = true }: BookCardProps) => {
  return (
    <button
      onClick={onToggle}
      className={`relative flex flex-col items-center p-2 rounded-xl border transition-all touch-manipulation active:scale-[0.97] ${
        isSelected
          ? "border-primary bg-primary/10 ring-2 ring-primary/30"
          : "border-border bg-card hover:bg-muted/50"
      }`}
    >
      {/* Book Cover */}
      <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
        <img
          src={book.cover}
          alt={book.title}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/200x300/1a1a2e/white?text=${encodeURIComponent(book.title.slice(0, 10))}`;
          }}
        />
        {showCheckmark && isSelected && (
          <div className="absolute top-1 right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="w-full text-left">
        <h3 className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
          {book.title}
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
          {book.author}
        </p>
      </div>
    </button>
  );
};

export default BookCard;
