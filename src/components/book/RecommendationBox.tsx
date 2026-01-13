import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBookUserProfile, getPreviousRecommendations, addPreviousRecommendation, clearPreviousRecommendations } from "@/lib/bookStorage";
import { POPULAR_BOOKS } from "@/data/popularBooks";
import { supabase } from "@/integrations/supabase/client";

interface Recommendation {
  title: string;
  reason: string;
}

const RecommendationBox = () => {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecommendation = useCallback(async () => {
    setIsLoading(true);
    const profile = getBookUserProfile();
    
    if (!profile) {
      setIsLoading(false);
      return;
    }

    // Get selected book titles
    const selectedBookTitles = profile.selectedBooks
      .map(id => POPULAR_BOOKS.find(b => b.id === id)?.title)
      .filter(Boolean);

    // Get previous recommendations to exclude
    let previousRecs = getPreviousRecommendations();
    
    // If we've recommended too many, reset the list
    if (previousRecs.length >= 15) {
      clearPreviousRecommendations();
      previousRecs = [];
    }

    const excludeList = previousRecs.length > 0 
      ? `\n\nIMPORTANT: Do NOT recommend these books (already suggested): ${previousRecs.join(', ')}`
      : '';

    const prompt = `Based on this reader profile:
- Age: ${profile.age}
- Interests: ${profile.interests.length > 0 ? profile.interests.join(', ') : 'General reading'}
- Liked Books: ${selectedBookTitles.join(', ')}${excludeList}

Suggest ONE unique book they should read next. Pick something fresh and exciting - could be a classic, a bestseller, or a hidden gem. Be creative!

Return ONLY valid JSON in this exact format, no other text:
{"title": "Book Name", "reason": "One engaging sentence why they'll love it"}`;

    try {
      const { data, error } = await supabase.functions.invoke('pollinations-chat', {
        body: { 
          prompt, 
          model: 'openai',
          seed: Date.now() // Add seed for variation
        }
      });

      if (error) throw error;

      const responseText = data?.response || data?.text || '';
      
      // Try to parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*"title"[\s\S]*"reason"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Save to previous recommendations
        addPreviousRecommendation(parsed.title);
        setRecommendation(parsed);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      // Fallback: pick a random book from selections that hasn't been recommended
      const availableBooks = selectedBookTitles.filter(t => !previousRecs.includes(t || ''));
      const fallbackBook = availableBooks[Math.floor(Math.random() * availableBooks.length)] 
        || selectedBookTitles[Math.floor(Math.random() * selectedBookTitles.length)] 
        || 'Atomic Habits';
      
      addPreviousRecommendation(fallbackBook);
      setRecommendation({
        title: fallbackBook,
        reason: "A great choice based on your reading preferences!"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">AI Pick</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchRecommendation}
            disabled={isLoading}
            className="h-8 w-8 touch-manipulation"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-5 bg-muted/50 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted/30 rounded animate-pulse w-full" />
          </div>
        ) : recommendation ? (
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground leading-tight">
              Read <span className="text-primary">{recommendation.title}</span>?
            </h3>
            <p className="text-sm text-muted-foreground leading-snug">{recommendation.reason}</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Unable to load recommendation</p>
        )}
      </div>
    </div>
  );
};

export default RecommendationBox;
