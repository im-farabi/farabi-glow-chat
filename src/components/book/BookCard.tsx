import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface BookCardProps {
  title: string;
  author: string;
  cover: string;
  selected?: boolean;
  onClick?: () => void;
  showCheckmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const BookCard = ({
  title,
  author,
  cover,
  selected = false,
  onClick,
  showCheckmark = true,
  size = 'md'
}: BookCardProps) => {
  const sizeClasses = {
    sm: 'w-24',
    md: 'w-32',
    lg: 'w-40'
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col cursor-pointer transition-all duration-200",
        sizeClasses[size],
        onClick && "hover:scale-105",
        selected && "ring-2 ring-primary rounded-lg"
      )}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
        <img
          src={cover}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/200x300/1a1a2e/white?text=${encodeURIComponent(title.slice(0, 10))}`;
          }}
        />
        {selected && showCheckmark && (
          <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-sm font-medium text-foreground line-clamp-2">{title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{author}</p>
      </div>
    </div>
  );
};

export default BookCard;
