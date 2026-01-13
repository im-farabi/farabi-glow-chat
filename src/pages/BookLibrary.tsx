import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Trash2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBooksRead, removeBookFromRead, getSavedSummaries, type ReadBook, type SavedBookSummary } from "@/lib/bookStorage";
import { useToast } from "@/hooks/use-toast";

const BookLibrary = () => {
  const [books, setBooks] = useState<ReadBook[]>([]);
  const [savedSummaries, setSavedSummaries] = useState<Record<string, SavedBookSummary>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setBooks(getBooksRead());
    setSavedSummaries(getSavedSummaries());
  }, []);

  const handleRemoveBook = (bookId: string, bookTitle: string) => {
    removeBookFromRead(bookId);
    setBooks(getBooksRead());
    toast({
      title: "Book removed",
      description: `"${bookTitle}" has been removed from your library.`
    });
  };

  const handleReadBook = (bookTitle: string) => {
    navigate(`/book/read/${encodeURIComponent(bookTitle)}`);
  };

  // Check if a book has an offline summary saved
  const hasOfflineSummary = (title: string) => {
    return !!savedSummaries[title.toLowerCase()];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Link to="/book">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">My Library</h1>
        </div>
      </div>

      <div className="p-4">
        {books.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your library is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding books you've read to build your personal library
            </p>
            <Link to="/book/search">
              <Button>Search for Books</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {books.length} book{books.length !== 1 ? 's' : ''} in your library
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {books.map((book) => (
                <div key={book.id} className="relative group">
                  <div 
                    className="w-full cursor-pointer"
                    onClick={() => handleReadBook(book.title)}
                  >
                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://placehold.co/200x300/1a1a2e/white?text=${encodeURIComponent(book.title.slice(0, 10))}`;
                        }}
                      />
                      {/* Offline indicator */}
                      <div className="absolute bottom-2 left-2">
                        {hasOfflineSummary(book.title) ? (
                          <div className="bg-green-500/90 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <WifiOff className="w-3 h-3" />
                            Offline
                          </div>
                        ) : (
                          <div className="bg-muted/90 text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Wifi className="w-3 h-3" />
                            Online
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full text-left">
                      <h3 className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
                        {book.title}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {book.author}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBook(book.id, book.title);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookLibrary;