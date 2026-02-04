import { useState, useEffect } from "react";
import { Library, BookOpen } from "lucide-react";
import { getBooksRead, removeBookFromRead, ReadBook } from "@/lib/bookStorage";
import PremiumBookCard from "./PremiumBookCard";
import { useNavigate } from "react-router-dom";

const BookLibrarySection = () => {
  const [books, setBooks] = useState<ReadBook[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setBooks(getBooksRead());
  }, []);

  const handleRemove = (bookId: string) => {
    removeBookFromRead(bookId);
    setBooks(getBooksRead());
  };

  const handleBookClick = (book: ReadBook) => {
    navigate(`/book/read/${encodeURIComponent(book.title)}`);
  };

  if (books.length === 0) {
    return (
      <section className="w-full">
        <div className="flex items-center gap-2 mb-4">
          <Library className="w-5 h-5 text-white/60" />
          <h2 className="text-lg font-semibold text-white">Your Library</h2>
        </div>
        
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">No books in your library yet</p>
          <p className="text-white/30 text-xs mt-1">Books you read will appear here</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Library className="w-5 h-5 text-white/60" />
        <h2 className="text-lg font-semibold text-white">Your Library</h2>
        <span className="text-white/40 text-sm">({books.length})</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {books.slice(0, 10).map((book) => (
          <PremiumBookCard
            key={book.id}
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            onClick={() => handleBookClick(book)}
            onRemove={() => handleRemove(book.id)}
            showRemove
          />
        ))}
      </div>
    </section>
  );
};

export default BookLibrarySection;
