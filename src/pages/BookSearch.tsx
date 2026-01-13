import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Plus, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addBookToRead, getBookUserProfile } from "@/lib/bookStorage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
}

const BookSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookNotFound, setBookNotFound] = useState(false);
  const { toast } = useToast();

  const searchBooks = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setBookNotFound(false);

    const profile = getBookUserProfile();
    const interests = profile?.interests.join(', ') || 'general reading';

    const prompt = `Search for books matching: "${query}"
User interests: ${interests}

INSTRUCTIONS:
1. If the exact book exists, include it FIRST
2. If the book doesn't exist or has an alternate name/spelling, find the CLOSEST match
3. Return 3-5 relevant book recommendations
4. If you truly can't find anything close, suggest books the user might like based on their interests

IMPORTANT: Set "found" to false ONLY if the exact searched book doesn't exist and you couldn't find a close match.

Return ONLY valid JSON, no other text:
{"found": true, "books": [{"title": "Book Title", "author": "Author Name"}, ...]}`;

    // Try gemini-large first, fallback to openai
    let responseText = '';
    let success = false;

    try {
      const { data, error } = await supabase.functions.invoke('pollinations-chat', {
        body: { prompt, model: 'gemini-large', seed: Date.now() }
      });

      if (!error && data) {
        responseText = data?.response || data?.text || '';
        success = true;
      }
    } catch (e) {
      console.log('gemini-large failed, trying openai fallback');
    }

    // Fallback to openai if gemini-large failed
    if (!success) {
      try {
        const { data, error } = await supabase.functions.invoke('pollinations-chat', {
          body: { prompt, model: 'openai', seed: Date.now() }
        });

        if (error) throw error;
        responseText = data?.response || data?.text || '';
      } catch (error) {
        console.error('Search error:', error);
        toast({
          title: "Search failed",
          description: "Unable to search for books. Please try again.",
          variant: "destructive"
        });
        setResults([]);
        setIsSearching(false);
        return;
      }
    }

    try {
      // Try to parse JSON object from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const wasFound = parsed.found !== false;
        const books = parsed.books || [];
        
        setBookNotFound(!wasFound);
        
        const formattedResults: SearchResult[] = books.map((book: any, index: number) => ({
          id: `search-${Date.now()}-${index}`,
          title: book.title,
          author: book.author,
          coverUrl: `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`
        }));
        setResults(formattedResults);
      } else {
        // Fallback: try parsing as array (old format)
        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          const parsed = JSON.parse(arrayMatch[0]);
          const formattedResults: SearchResult[] = parsed.map((book: any, index: number) => ({
            id: `search-${Date.now()}-${index}`,
            title: book.title,
            author: book.author,
            coverUrl: `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`
          }));
          setResults(formattedResults);
        } else {
          setResults([]);
        }
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddBook = (book: SearchResult) => {
    addBookToRead({
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl
    });
    toast({
      title: "Book added!",
      description: `"${book.title}" has been added to your library.`
    });
    // Remove from results to show it's been added
    setResults(results.filter(r => r.id !== book.id));
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
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Search Results */}
        {isSearching && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-muted-foreground">Searching for books...</p>
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No results found</p>
            <p className="text-sm text-muted-foreground">Try a different search term</p>
          </div>
        )}

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
            
            <p className="text-sm text-muted-foreground">{results.length} books found</p>
            {results.map((book) => (
              <div
                key={book.id}
                className="flex gap-4 p-3 rounded-xl border border-border bg-card"
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
                    variant="outline"
                    className="mt-3"
                    onClick={() => handleAddBook(book)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Mark as Read
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
