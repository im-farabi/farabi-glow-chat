import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getBookUserProfile, getSavedRecommendations, saveRecommendations, BookRecommendation } from "@/lib/bookStorage";
import PremiumBookCard from "./PremiumBookCard";
import { useNavigate } from "react-router-dom";

const BookRecommendations = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [showAllModal, setShowAllModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load saved recommendations first
    const saved = getSavedRecommendations();
    if (saved.length > 0) {
      setRecommendations(saved);
    } else {
      fetchRecommendations();
    }
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    const profile = getBookUserProfile();
    const interests = profile?.interests?.join(', ') || 'self-improvement, fiction, business';
    const age = profile?.age || 18;

    const prompt = `Suggest 10 unique books for someone aged ${age} interested in: ${interests}

Return ONLY valid JSON in this exact format:
{
  "books": [
    {"title": "Book Title", "author": "Author Name", "reason": "One short sentence why they'd love it"}
  ]
}

Make each recommendation unique and diverse. Include classics and modern books. No markdown, just JSON.`;

    try {
      const seed = Math.floor(Date.now() % 1000000);
      const { data, error } = await supabase.functions.invoke('pollinations-chat', {
        body: { prompt, model: 'openai', seed }
      });

      if (error) throw error;

      const responseText = data?.response || data?.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const books: BookRecommendation[] = (parsed.books || []).slice(0, 10).map((book: any, index: number) => ({
          id: `rec-${Date.now()}-${index}`,
          title: book.title,
          author: book.author,
          coverUrl: `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`,
          reason: book.reason || ''
        }));
        
        setRecommendations(books);
        saveRecommendations(books);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchRecommendations();
  };

  const handleBookClick = (book: BookRecommendation) => {
    navigate(`/book/read/${encodeURIComponent(book.title)}`);
  };

  const visibleBooks = recommendations.slice(0, 5);
  const hasMoreBooks = recommendations.length > 5;

  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-semibold text-white">Recommended Books</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-white/50 hover:text-white hover:bg-white/5 w-8 h-8"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      <div
        className={`overflow-hidden transition-all duration-500 ${
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl overflow-hidden">
                <Skeleton className="w-full h-full bg-white/5" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {visibleBooks.map((book) => (
                <PremiumBookCard
                  key={book.id}
                  title={book.title}
                  author={book.author}
                  coverUrl={book.coverUrl}
                  reason={book.reason}
                  onClick={() => handleBookClick(book)}
                />
              ))}
            </div>
            
            {hasMoreBooks && (
              <div className="text-center mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAllModal(true)}
                  className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                >
                  More Books ({recommendations.length - 5} more)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* All Recommendations Modal */}
      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="bg-zinc-950 border-white/10 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              All Recommendations
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mt-4">
            {recommendations.map((book) => (
              <PremiumBookCard
                key={book.id}
                title={book.title}
                author={book.author}
                coverUrl={book.coverUrl}
                reason={book.reason}
                onClick={() => {
                  setShowAllModal(false);
                  handleBookClick(book);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default BookRecommendations;
