import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle, Sparkles, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { addBookToRead, getBookUserProfile } from "@/lib/bookStorage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookSummary {
  title: string;
  author: string;
  year: string;
  about: string;
  summary: string;
  keyPoints: string[];
  moral: string;
}

const BookReader = () => {
  const { bookTitle } = useParams<{ bookTitle: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<BookSummary | null>(null);
  const [isMarkedAsRead, setIsMarkedAsRead] = useState(false);

  const decodedTitle = decodeURIComponent(bookTitle || "");

  useEffect(() => {
    if (decodedTitle) {
      fetchBookSummary();
    }
  }, [decodedTitle]);

  const fetchBookSummary = async () => {
    setIsLoading(true);
    
    const profile = getBookUserProfile();
    const userAge = profile?.age || 18;

    // Simplified prompt for faster response
    const prompt = `Book: "${decodedTitle}"
Reader age: ${userAge}

Return ONLY this JSON:
{
  "title": "Book Title",
  "author": "Author Name",
  "year": "Year",
  "about": "2 sentences about what this book covers",
  "summary": "3-4 short paragraphs explaining the main ideas",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "moral": "1-2 sentences - the main lesson"
}

Keep language simple for age ${userAge}. Be concise.`;

    let responseText = '';
    let success = false;

    // Try gemini-large first
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

    // Fallback to openai
    if (!success) {
      try {
        const { data, error } = await supabase.functions.invoke('pollinations-chat', {
          body: { prompt, model: 'openai', seed: Date.now() }
        });

        if (error) throw error;
        responseText = data?.response || data?.text || '';
      } catch (error) {
        console.error('Summary error:', error);
        toast({
          title: "Failed to load summary",
          description: "Unable to generate book summary. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setSummary({
          title: parsed.title || decodedTitle,
          author: parsed.author || "Unknown Author",
          year: parsed.year || parsed.publishedYear || "",
          about: parsed.about || "",
          summary: parsed.summary || parsed.detailed || "",
          keyPoints: (parsed.keyPoints || []).slice(0, 3),
          moral: parsed.moral || ""
        });
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      toast({
        title: "Error parsing summary",
        description: "The summary format was unexpected. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = () => {
    if (summary) {
      addBookToRead({
        id: `read-${Date.now()}`,
        title: summary.title,
        author: summary.author,
        coverUrl: `https://placehold.co/200x300/1a1a2e/white?text=${encodeURIComponent(summary.title.slice(0, 15))}`
      });
      setIsMarkedAsRead(true);
      toast({
        title: "Added to library!",
        description: `"${summary.title}" has been marked as read.`
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="p-4 flex items-center gap-3">
            <Link to="/book/search">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="p-4 pb-24 space-y-6 max-w-2xl mx-auto">
          {/* Title skeleton */}
          <div className="text-center pt-4 space-y-3">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>

          {/* Book cover placeholder */}
          <div className="flex justify-center">
            <div className="w-32 h-48 bg-muted rounded-lg animate-pulse flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/50" />
            </div>
          </div>

          {/* Loading message */}
          <div className="text-center py-4">
            <p className="text-lg font-medium text-foreground animate-pulse">
              Summarizing the book for you...
            </p>
            <p className="text-sm text-muted-foreground mt-1">This won't take long</p>
          </div>

          {/* Content skeletons */}
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-semibold text-foreground">Couldn't load summary</p>
          <p className="text-muted-foreground mt-2">Please try again later</p>
          <Button className="mt-4" onClick={() => navigate('/book/search')}>
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Link to="/book/search">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground truncate">{summary.title}</span>
        </div>
      </div>

      <div className="p-4 pb-24 space-y-6 max-w-2xl mx-auto">
        {/* Book Title & Author */}
        <div className="text-center pt-4">
          <h1 className="text-3xl font-bold text-foreground">{summary.title}</h1>
          <p className="text-muted-foreground mt-2">
            by {summary.author} {summary.year && `· ${summary.year}`}
          </p>
        </div>

        {/* About Section */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">What This Book Is About</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">{summary.about}</p>
        </div>

        {/* Summary */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Summary</h2>
          </div>
          <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {summary.summary}
          </div>
        </div>

        {/* Key Points */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Key Points</h2>
          </div>
          <ul className="space-y-2">
            {summary.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Moral / Summary */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">The Moral</h2>
          </div>
          <p className="text-foreground leading-relaxed">{summary.moral}</p>
        </div>

        {/* Mark as Read Button */}
        <div className="pt-4">
          <Button
            onClick={handleMarkAsRead}
            disabled={isMarkedAsRead}
            className="w-full h-14 text-lg font-semibold rounded-xl"
          >
            {isMarkedAsRead ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Marked as Read
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Mark as Read
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookReader;