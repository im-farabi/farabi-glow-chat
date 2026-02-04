import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, BookOpen, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getBookUserProfile } from "@/lib/bookStorage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BookBackground from "@/components/book/BookBackground";

interface SearchResult {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  isExactMatch?: boolean;
}

const BookSearch = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookNotFound, setBookNotFound] = useState(false);
  const [exactMatchTitle, setExactMatchTitle] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auto-search if query param exists
  useEffect(() => {
    if (initialQuery) {
      searchBooks(initialQuery);
    }
  }, []);

  const searchBooks = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setBookNotFound(false);
    setResults([]);
    setExactMatchTitle(null);

    const profile = getBookUserProfile();
    const interests = profile?.interests?.join(', ') || 'general reading';
    const age = profile?.age || 18;

    // Enhanced natural language search prompt supporting multiple languages and topics
    const exactMatchPrompt = `You are a book search assistant. Find books matching: "${q}"

This search could be:
- A book title in ANY language (English, Bengali/Bangla, Hindi, Arabic, Spanish, Chinese, etc.)
- An author name (full or partial)
- A topic like "best books for focus", "productivity", "motivation"
- A genre like "romance", "thriller", "self-help", "fiction"
- A mood like "uplifting", "thought-provoking", "relaxing"
- A recommendation request like "books like Atomic Habits"

For someone aged ${age} interested in: ${interests}

If this is an exact book title, return it.
If this is a topic/genre/author search, return the BEST matching book.
Be flexible with spelling and transliterations.

Return ONLY valid JSON:
{"found": true, "title": "Exact Book Title in English", "author": "Author Name"}
or
{"found": false, "title": "", "author": ""}`;

    const similarBooksPrompt = `Suggest 3 books related to "${q}" for someone aged ${age} interested in: ${interests}

This could be:
- Similar books to a title
- Books by an author
- Books on a topic (e.g., "focus", "productivity", "self-improvement")
- Books in a genre
- Books in any language (return English titles when possible)

Return ONLY valid JSON: {"books": [{"title": "Book Title", "author": "Author Name"}]}
Maximum 3 books. Be helpful and diverse.`;

    try {
      // Run both AI calls in parallel using openai (cheaper)
      const seed = Math.floor(Date.now() % 1000000);
      const [exactResult, similarResult] = await Promise.allSettled([
        supabase.functions.invoke('pollinations-chat', {
          body: { prompt: exactMatchPrompt, model: 'openai', seed }
        }),
        supabase.functions.invoke('pollinations-chat', {
          body: { prompt: similarBooksPrompt, model: 'openai', seed: seed + 1 }
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
    <div className="min-h-screen bg-black font-poppins">
      <BookBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="p-4 flex items-center gap-3 max-w-4xl mx-auto">
          <Link to="/book">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white">Search Books</h1>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto relative z-10">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books, authors, topics, or in any language..."
              className="h-12 text-base bg-white/5 backdrop-blur-xl border-white/20 text-white placeholder:text-white/40 rounded-xl focus:border-orange-500/50"
              onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
            />
          </div>
          <Button 
            onClick={() => searchBooks()} 
            disabled={isSearching || !query.trim()}
            className="h-12 px-5 bg-transparent border-2 border-orange-500 text-white hover:bg-orange-500/10 rounded-xl"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Loading Skeleton */}
        {isSearching && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <Skeleton className="w-16 h-24 rounded-lg flex-shrink-0 bg-white/10" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-3/4 bg-white/10" />
                  <Skeleton className="h-3 w-1/2 bg-white/10" />
                  <Skeleton className="h-8 w-24 mt-3 bg-white/10" />
                </div>
              </div>
            ))}
            <p className="text-center text-sm text-white/50 animate-pulse">
              Finding your book...
            </p>
          </div>
        )}

        {/* No Results */}
        {!isSearching && hasSearched && results.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-white/30 mx-auto mb-3" />
            <p className="text-white font-medium">No results found</p>
            <p className="text-sm text-white/50">Try a different search term or topic</p>
          </div>
        )}

        {/* Search Results */}
        {!isSearching && results.length > 0 && (
          <div className="space-y-3">
            {/* Book not found message */}
            {bookNotFound && (
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 font-medium text-sm">📚 Book couldn't be found</p>
                  <p className="text-amber-400/70 text-xs mt-0.5">You may like these similar books:</p>
                </div>
              </div>
            )}
            
            {/* Found exact match message */}
            {!bookNotFound && exactMatchTitle && (
              <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <BookOpen className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-400 font-medium text-sm">Found: {exactMatchTitle}</p>
                  {results.length > 1 && (
                    <p className="text-emerald-400/70 text-xs mt-0.5">Similar books you might like:</p>
                  )}
                </div>
              </div>
            )}
            
            {results.map((book) => (
              <div
                key={book.id}
                className={`flex gap-4 p-3 rounded-xl border backdrop-blur-xl ${
                  book.isExactMatch ? 'border-orange-500/40 bg-orange-500/5' : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/160x240/18181b/ffffff?text=${encodeURIComponent(book.title.slice(0, 15))}`;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-white/60 mt-0.5">{book.author}</p>
                  <Button
                    size="sm"
                    className={`mt-3 ${book.isExactMatch ? 'bg-transparent border-2 border-orange-500 text-white hover:bg-orange-500/10' : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'}`}
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
            <Search className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white font-medium">Discover your next read</p>
            <p className="text-sm text-white/50 mt-1">
              Search for books, authors, topics, or try queries like "best books for focus"
            </p>
            
            {/* Quick search hints */}
            <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-md mx-auto">
              {['self-improvement', 'fiction classics', 'best for focus', 'productivity'].map((hint) => (
                <button
                  key={hint}
                  onClick={() => {
                    setQuery(hint);
                    searchBooks(hint);
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 hover:text-white/70 transition-all"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookSearch;