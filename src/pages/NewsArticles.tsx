import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PremiumBackground from "@/components/PremiumBackground";
import NewsCard from "@/components/news/NewsCard";
import {
  getCategoryDisplayName,
  getCategoryEmoji,
  getTimeFilterDisplayName,
  getSavedNews,
  saveNews,
  isNewsCacheValid,
  getNewsUserProfile,
  NewsArticle
} from "@/lib/newsStorage";
import { supabase } from "@/integrations/supabase/client";

const NewsArticles = () => {
  const { categoryId, timeFilter } = useParams<{ categoryId: string; timeFilter: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categoryName = getCategoryDisplayName(categoryId || "");
  const categoryEmoji = getCategoryEmoji(categoryId || "");
  const timeFilterName = getTimeFilterDisplayName(timeFilter || "");

  const getArticleCount = () => {
    switch (timeFilter) {
      case "latest": return "3-5";
      case "week": return "4-6";
      case "month": return "5-8";
      default: return "3-5";
    }
  };

  const getTimeContext = () => {
    switch (timeFilter) {
      case "latest": return "from today or the past 24 hours";
      case "week": return "from the past 7 days";
      case "month": return "from the past 30 days";
      default: return "recent";
    }
  };

  const generateNews = async (forceRefresh = false) => {
    if (!categoryId || !timeFilter) return;

    // Check cache first
    if (!forceRefresh) {
      const cached = getSavedNews(categoryId, timeFilter);
      if (cached && isNewsCacheValid(cached, timeFilter)) {
        setArticles(cached.articles);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(!forceRefresh);
    setIsRefreshing(forceRefresh);

    try {
      const userProfile = getNewsUserProfile();
      const userAge = userProfile?.age || 18;

      const prompt = `Generate ${getArticleCount()} recent news articles about ${categoryName} ${getTimeContext()}.
Reader age: ${userAge}

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "articles": [
    {
      "headline": "Short, attention-grabbing headline",
      "context": "1-2 sentence summary of what happened",
      "body": "2-3 paragraphs with details, dates, names, and facts"
    }
  ]
}

Rules:
- Make news realistic and plausible for January 2026
- Use simple language appropriate for age ${userAge}
- Include specific dates, names, and numbers
- Each article should be complete and informative
- Keep it factual and easy to understand
- Headlines should be catchy but informative
- Context should summarize the key point
- Body should provide full details with proper formatting`;

      const { data, error } = await supabase.functions.invoke("pollinations-chat", {
        body: {
          prompt,
          model: "openai",
          temperature: 0.7
        }
      });

      if (error) throw error;

      const responseText = data?.response || "";
      
      // Parse JSON from response
      let parsed;
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse news response:", parseError, responseText);
        throw new Error("Failed to parse news data");
      }

      if (!parsed.articles || !Array.isArray(parsed.articles)) {
        throw new Error("Invalid news format");
      }

      const newArticles: NewsArticle[] = parsed.articles.map((article: any, index: number) => ({
        id: `${categoryId}-${timeFilter}-${Date.now()}-${index}`,
        headline: article.headline || "Untitled",
        context: article.context || "",
        body: article.body || "",
        generatedAt: Date.now()
      }));

      // Save to cache
      saveNews(categoryId, timeFilter, newArticles);
      setArticles(newArticles);

    } catch (error) {
      console.error("Failed to generate news:", error);
      toast({
        title: "Error",
        description: "Failed to generate news. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    generateNews();
  }, [categoryId, timeFilter]);

  const handleRefresh = () => {
    generateNews(true);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden">
      <PremiumBackground />

      {/* Header */}
      <header className="relative z-10 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/news/category/${categoryId}`)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{categoryEmoji}</span>
                <h1 className="font-bold text-foreground">{categoryName}</h1>
              </div>
              <p className="text-sm text-muted-foreground">{timeFilterName}</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="rounded-full"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 relative z-10 overflow-y-auto pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Generating news...</p>
            <p className="text-sm text-muted-foreground/60 mt-1">This may take a moment</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-muted-foreground mb-4">No news available</p>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article, index) => (
              <NewsCard 
                key={article.id} 
                article={article} 
                defaultExpanded={index === 0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NewsArticles;
