import { useState, useEffect } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBookUserProfile } from "@/lib/bookStorage";
import { POPULAR_BOOKS } from "@/data/popularBooks";
import { supabase } from "@/integrations/supabase/client";

interface Recommendation {
  title: string;
  reason: string;
}

const RecommendationBox = () => {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecommendation = async () => {
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

    const prompt = `Based on this reader profile:
- Age: ${profile.age}
- Interests: ${profile.interests.join(', ')}
- Liked Books: ${selectedBookTitles.join(', ')}

Suggest ONE book they should read next. It can be from the liked books or a completely new recommendation. Return ONLY valid JSON in this exact format, no other text:
{"title": "Book Name", "reason": "One short sentence why"}`;

    try {
      const { data, error } = await supabase.functions.invoke('pollinations-chat', {
        body: { prompt, model: 'openai' }
      });

      if (error) throw error;

      const responseText = data?.response || data?.text || '';
      
      // Try to parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*"title"[\s\S]*"reason"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setRecommendation(parsed);
      } else {
        // Fallback to a random book from selections
        const fallbackBook = selectedBookTitles[Math.floor(Math.random() * selectedBookTitles.length)] || 'Atomic Habits';
        setRecommendation({
          title: fallbackBook,
          reason: "Based on your reading preferences!"
        });
      }
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      // Fallback recommendation
      const fallbackBook = selectedBookTitles[Math.floor(Math.random() * selectedBookTitles.length)] || 'Atomic Habits';
      setRecommendation({
        title: fallbackBook,
        reason: "A great choice based on your interests!"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendation();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">AI Recommendation</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchRecommendation}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-6 bg-muted/50 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted/30 rounded animate-pulse w-full" />
          </div>
        ) : recommendation ? (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Wanna Read <span className="text-primary">{recommendation.title}</span> Next?
            </h3>
            <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
          </div>
        ) : (
          <p className="text-muted-foreground">Unable to load recommendation</p>
        )}
      </div>
    </div>
  );
};

export default RecommendationBox;
