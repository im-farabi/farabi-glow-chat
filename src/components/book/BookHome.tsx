import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Library, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBookUserProfile, getRecentBooks, type ReadBook } from "@/lib/bookStorage";
import RecommendationBox from "./RecommendationBox";
import BookCard from "./BookCard";

const BookHome = () => {
  const [userName, setUserName] = useState("");
  const [recentBooks, setRecentBooks] = useState<ReadBook[]>([]);

  useEffect(() => {
    const profile = getBookUserProfile();
    if (profile) {
      setUserName(profile.name);
    }
    setRecentBooks(getRecentBooks(2));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-foreground">ReadME</span>
          </div>
          <Link to="/book/library">
            <Button variant="ghost" size="icon">
              <Library className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hello, {userName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Ready to discover your next read?</p>
        </div>

        {/* AI Recommendation Box */}
        <RecommendationBox />

        {/* Recent Reads */}
        {recentBooks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Your Recent Reads</h2>
              <Link to="/book/library" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recentBooks.map((book) => (
                <BookCard
                  key={book.id}
                  title={book.title}
                  author={book.author}
                  cover={book.coverUrl}
                  showCheckmark={false}
                  size="md"
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Recent Reads */}
        {recentBooks.length === 0 && (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-1">No books read yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start building your reading history by searching for books
            </p>
            <Link to="/book/search">
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Search Books
              </Button>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/book/search" className="block">
            <div className="p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors">
              <Search className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-medium text-foreground">Search Books</h3>
              <p className="text-xs text-muted-foreground">Find your next read</p>
            </div>
          </Link>
          <Link to="/book/library" className="block">
            <div className="p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors">
              <Library className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-medium text-foreground">My Library</h3>
              <p className="text-xs text-muted-foreground">View all your books</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom Search Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Link to="/book/search" className="block">
          <Button className="w-full h-12 text-base" size="lg">
            <Search className="w-5 h-5 mr-2" />
            Search New Books
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default BookHome;
