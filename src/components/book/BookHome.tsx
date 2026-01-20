import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Library, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBookUserProfile, getRecentBooks, ReadBook } from "@/lib/bookStorage";
import { POPULAR_BOOKS } from "@/data/popularBooks";
import BookCard from "./BookCard";
import RecommendationBox from "./RecommendationBox";

const BookHome = () => {
  const [userName, setUserName] = useState<string>("Reader");
  const [recentBooks, setRecentBooks] = useState<ReadBook[]>([]);

  useEffect(() => {
    const profile = getBookUserProfile();
    if (profile?.name) {
      setUserName(profile.name);
    }
    setRecentBooks(getRecentBooks(2));
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Convert ReadBook to PopularBook format for BookCard
  const recentBooksAsCards = useMemo(() => {
    return recentBooks.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      cover: book.coverUrl
    }));
  }, [recentBooks]);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">Read<span className="text-primary">ME</span></span>
          </div>
          <Link to="/book/library">
            <Button variant="ghost" size="icon" className="touch-manipulation">
              <Library className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 py-5 max-w-4xl mx-auto w-full space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, <span className="text-primary">{userName}</span>!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">What will you read today?</p>
        </div>

        {/* AI Recommendation */}
        <RecommendationBox />

        {/* Recent Reads */}
        {recentBooks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Your Recent Reads</h2>
              <Link to="/book/library" className="text-primary text-sm flex items-center gap-1">
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {recentBooksAsCards.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isSelected={false}
                  onToggle={() => {}}
                  showCheckmark={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {recentBooks.length === 0 && (
          <section className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No books yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Search and mark books as read to track your progress</p>
            <Link to="/book/search">
              <Button className="rounded-xl">
                <Search className="w-4 h-4 mr-2" />
                Find Books
              </Button>
            </Link>
          </section>
        )}

        {/* Quick Actions */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Link to="/book/search" className="block">
            <div className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors active:scale-[0.98]">
              <Search className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-medium text-foreground text-sm">Search Books</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Find your next read</p>
            </div>
          </Link>
          <Link to="/book/library" className="block">
            <div className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors active:scale-[0.98]">
              <Library className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-medium text-foreground text-sm">My Library</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Books you've read</p>
            </div>
          </Link>
        </section>
      </main>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border safe-area-bottom">
        <div className="max-w-4xl mx-auto">
          <Link to="/book/search" className="block">
            <Button className="w-full h-12 rounded-xl font-semibold text-base">
              <Search className="w-5 h-5 mr-2" />
              Search New Books
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookHome;
