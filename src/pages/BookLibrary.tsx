import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBooksRead, removeBookFromRead, type ReadBook } from "@/lib/bookStorage";
import BookCard from "@/components/book/BookCard";
import { useToast } from "@/hooks/use-toast";

const BookLibrary = () => {
  const [books, setBooks] = useState<ReadBook[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setBooks(getBooksRead());
  }, []);

  const handleRemoveBook = (bookId: string, bookTitle: string) => {
    removeBookFromRead(bookId);
    setBooks(getBooksRead());
    toast({
      title: "Book removed",
      description: `"${bookTitle}" has been removed from your library.`
    });
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
                  <BookCard
                    book={{
                      id: book.id,
                      title: book.title,
                      author: book.author,
                      cover: book.coverUrl
                    }}
                    isSelected={false}
                    onToggle={() => {}}
                    showCheckmark={false}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => handleRemoveBook(book.id, book.title)}
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
