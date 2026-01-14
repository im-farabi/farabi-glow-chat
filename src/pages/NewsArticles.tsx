import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Newspaper } from "lucide-react";
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
  canRefreshNews,
  setLastRefreshTime,
  getRefreshCooldownRemaining,
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
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const categoryName = getCategoryDisplayName(categoryId || "");
  const categoryEmoji = getCategoryEmoji(categoryId || "");
  const timeFilterName = getTimeFilterDisplayName(timeFilter || "");

  // Update cooldown timer
  useEffect(() => {
    if (!categoryId || !timeFilter) return;
    
    const updateCooldown = () => {
      const remaining = getRefreshCooldownRemaining(categoryId, timeFilter);
      setCooldownRemaining(remaining);
    };
    
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [categoryId, timeFilter]);

  const getArticleCount = () => {
    switch (timeFilter) {
      case "latest": return "3";
      case "week": return "4";
      case "month": return "5";
      default: return "3";
    }
  };

  const getTimeContext = () => {
    switch (timeFilter) {
      case "latest": return "from today";
      case "week": return "from this week";
      case "month": return "from this month";
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

      const prompt = `Generate ${getArticleCount()} news about ${categoryName} ${getTimeContext()} (January 2026).

Return JSON only:
{"articles":[{"headline":"...","context":"...","body":"..."}]}

Rules: realistic news, age ${userAge} language, include dates/names, no markdown.`;

      const { data, error } = await supabase.functions.invoke("pollinations-chat", {
        body: {
          prompt,
          model: "gemini-large",
          temperature: 0.7,
          max_tokens: 2000
        }
      });

      if (error) throw error;

      const responseText = data?.text || "";
      
      // Parse JSON from response
      let parsed;
      try {
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

      // Save to cache and set refresh time
      saveNews(categoryId, timeFilter, newArticles);
      if (forceRefresh) {
        setLastRefreshTime(categoryId, timeFilter);
      }
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
    if (!categoryId || !timeFilter) return;
    
    if (!canRefreshNews(categoryId, timeFilter)) {
      const mins = Math.ceil(cooldownRemaining / 60000);
      toast({
        title: "Cooldown Active",
        description: `Please wait ${mins} minute${mins !== 1 ? 's' : ''} before refreshing`,
      });
      return;
    }
    generateNews(true);
  };

  const formatCooldown = () => {
    const mins = Math.floor(cooldownRemaining / 60000);
    const secs = Math.floor((cooldownRemaining % 60000) / 1000);
    return mins > 0 ? `${mins}m` : `${secs}s`;
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
            disabled={isLoading || isRefreshing || cooldownRemaining > 0}
            className="rounded-full relative"
          >
            {cooldownRemaining > 0 ? (
              <span className="text-xs font-medium">{formatCooldown()}</span>
            ) : (
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 relative z-10 overflow-y-auto pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            {/* Animated newspaper icon */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center mb-6 shadow-lg shadow-primary/20 animate-pulse">
              <Newspaper className="w-10 h-10 text-primary" />
            </div>
            
            {/* Loading text */}
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Gathering News
            </h3>
            <p className="text-muted-foreground text-center max-w-xs">
              Our AI is finding the latest stories for you...
            </p>
            
            {/* Progress dots */}
            <div className="flex gap-2 mt-6">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay: "0ms"}} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay: "150ms"}} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay: "300ms"}} />
            </div>
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