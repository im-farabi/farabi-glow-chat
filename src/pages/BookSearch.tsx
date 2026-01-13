import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, BookOpen, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getBookUserProfile } from "@/lib/bookStorage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  isExactMatch?: boolean;
}

const BookSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookNotFound, setBookNotFound] = useState(false);
  const [exactMatchTitle, setExactMatchTitle] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const searchBooks = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setBookNotFound(false);
    setResults([]);
    setExactMatchTitle(null);

    const profile = getBookUserProfile();
    const interests = profile?.interests.join(', ') || 'general reading';

    // Two parallel AI calls for speed
    const exactMatchPrompt = `Find the book: "${query}"
If this exact book exists, return: {"found": true, "title": "Exact Book Title", "author": "Author Name"}
If it doesn't exist but there's a close match, return: {"found": true, "title": "Close Match Title", "author": "Author Name"}
If nothing matches at all, return: {"found": false, "title": "", "author": ""}
Return ONLY valid JSON.`;

    const similarBooksPrompt = `Suggest 2-3 books similar to "${query}" for someone interested in: ${interests}
Return ONLY valid JSON: {"books": [{"title": "Book Title", "author": "Author Name"}]}
Maximum 3 books. Be concise.`;

    try {
      // Run both AI calls in parallel (seed must be INT32, so use modulo)
      const seed = Math.floor(Date.now() % 1000000);
      const [exactResult, similarResult] = await Promise.allSettled([
        supabase.functions.invoke('pollinations-chat', {
          body: { prompt: exactMatchPrompt, model: 'gemini-large', seed }
        }),
        supabase.functions.invoke('pollinations-chat', {
          body: { prompt: similarBooksPrompt, model: 'gemini-large', seed: seed + 1 }
        })
      ]);

      let exactMatch: { found: boolean; title: string; author: string } | null = null;
      let similarBooks: { title: string; author: string }[] = [];

      // Parse exact match result
      if (exactResult.status === 'fulfilled' && exactResult.value.data) {
        const responseText = exactResult.value.data?.response || exactResult.value.data?.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            exactMatch = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.log('Failed to parse exact match');
          }
        }
      }

      // Parse similar books result
      if (similarResult.status === 'fulfilled' && similarResult.value.data) {
        const responseText = similarResult.value.data?.response || similarResult.value.data?.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            similarBooks = (parsed.books || []).slice(0, 3);
          } catch (e) {
            console.log('Failed to parse similar books');
          }
        }
      }

      // Build results array
      const formattedResults: SearchResult[] = [];

      if (exactMatch?.found && exactMatch.title) {
        setExactMatchTitle(exactMatch.title);
        setBookNotFound(false);
        formattedResults.push({
          id: `exact-${Date.now()}`,
          title: exactMatch.title,
          author: exactMatch.author,
          coverUrl: `https://covers.openlibrary.org/b/title/${encodeURIComponent(exactMatch.title)}-M.jpg`,
          isExactMatch: true
        });
      } else {
        setBookNotFound(true);
        setExactMatchTitle(null);
      }

      // Add similar books (filter out the exact match if present)
      similarBooks.forEach((book, index) => {
        if (exactMatch?.title?.toLowerCase() !== book.title.toLowerCase()) {
          formattedResults.push({
            id: `similar-${Date.now()}-${index}`,
            title: book.title,
            author: book.author,
            coverUrl: `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`,
            isExactMatch: false
          });
        }
      });

      setResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to search for books. Please try again.",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReadBook = (book: SearchResult) => {
    navigate(`/book/read/${encodeURIComponent(book.title)}`);
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
          <h1 className="text-xl font-bold text-foreground">Search Books</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for books, topics, or authors..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
          />
          <Button onClick={searchBooks} disabled={isSearching || !query.trim()}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Loading Skeleton */}
        {isSearching && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-3 rounded-xl border border-border bg-card">
                <Skeleton className="w-16 h-24 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-24 mt-3" />
                </div>
              </div>
            ))}
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Finding your book...
            </p>
          </div>
        )}

        {/* No Results */}
        {!isSearching && hasSearched && results.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No results found</p>
            <p className="text-sm text-muted-foreground">Try a different search term</p>
          </div>
        )}

        {/* Search Results */}
        {!isSearching && results.length > 0 && (
          <div className="space-y-3">
            {/* Book not found message */}
            {bookNotFound && (
              <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-500 font-medium text-sm">📚 Book couldn't be found</p>
                  <p className="text-yellow-500/80 text-xs mt-0.5">You may like these similar books:</p>
                </div>
              </div>
            )}
            
            {/* Found exact match message */}
            {!bookNotFound && exactMatchTitle && (
              <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                <BookOpen className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-500 font-medium text-sm">Found: {exactMatchTitle}</p>
                  {results.length > 1 && (
                    <p className="text-green-500/80 text-xs mt-0.5">Similar books you might like:</p>
                  )}
                </div>
              </div>
            )}
            
            {results.map((book) => (
              <div
                key={book.id}
                className={`flex gap-4 p-3 rounded-xl border bg-card ${
                  book.isExactMatch ? 'border-primary/40 bg-primary/5' : 'border-border'
                }`}
              >
                <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/160x240/1a1a2e/white?text=${encodeURIComponent(book.title.slice(0, 15))}`;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{book.author}</p>
                  <Button
                    size="sm"
                    variant={book.isExactMatch ? "default" : "outline"}
                    className="mt-3"
                    onClick={() => handleReadBook(book)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Click to Read
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">Discover your next read</p>
            <p className="text-sm text-muted-foreground mt-1">
              Search for books by title, author, or topic
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookSearch;