import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Trash2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBooksRead, removeBookFromRead, getSavedSummaries, type ReadBook, type SavedBookSummary } from "@/lib/bookStorage";
import { useToast } from "@/hooks/use-toast";
import BookBackground from "@/components/book/BookBackground";
import PremiumBookCard from "@/components/book/PremiumBookCard";

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
    <div className="min-h-screen bg-black font-poppins">
      <BookBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="p-4 flex items-center gap-3 max-w-6xl mx-auto">
          <Link to="/book">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white">My Library</h1>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-6xl mx-auto relative z-10">
        {books.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white/30" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Your library is empty</h2>
            <p className="text-white/50 mb-6">
              Start adding books you've read to build your personal library
            </p>
            <Link to="/book/search">
              <Button className="bg-transparent border-2 border-orange-500 text-white hover:bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                Search for Books
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-white/50">
              {books.length} book{books.length !== 1 ? 's' : ''} in your library
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {books.map((book) => (
                <div key={book.id} className="relative">
                  <PremiumBookCard
                    title={book.title}
                    author={book.author}
                    coverUrl={book.coverUrl}
                    onClick={() => handleReadBook(book.title)}
                    onRemove={() => handleRemoveBook(book.id, book.title)}
                    showRemove
                  />
                  {/* Offline indicator */}
                  <div className="absolute top-2 left-2 z-10">
                    {hasOfflineSummary(book.title) ? (
                      <div className="bg-emerald-500/90 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                        <WifiOff className="w-3 h-3" />
                        Offline
                      </div>
                    ) : (
                      <div className="bg-white/20 backdrop-blur-sm text-white/70 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        Online
                      </div>
                    )}
                  </div>
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
