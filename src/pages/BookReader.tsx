import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, BookOpen, CheckCircle, Sparkles, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addBookToRead, getBookUserProfile } from "@/lib/bookStorage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookSummary {
  title: string;
  author: string;
  publishedYear: string;
  about: string;
  detailed: string;
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

    const prompt = `Generate a comprehensive book summary for "${decodedTitle}".

The reader is ${userAge} years old. Adjust your language complexity:
- Age 8-12: Simple words, short sentences, fun explanations, avoid complex vocabulary
- Age 13-17: Medium complexity, relatable examples, some advanced words explained
- Age 18-25: Standard adult language, clear explanations
- Age 26+: More sophisticated vocabulary allowed, deeper analysis

IMPORTANT: Make it easy to understand, easy to memorize, and engaging for a ${userAge}-year-old.

Return ONLY valid JSON, no other text:
{
  "title": "Full Book Title",
  "author": "Author Name",
  "publishedYear": "Year or approximate decade",
  "about": "2-3 sentences about what this book covers - the main theme",
  "detailed": "A thorough explanation of the book's main ideas, concepts, and story. Write 4-6 paragraphs. This is NOT a summary - explain the content in depth, cover the key concepts, the journey, what readers learn. Make it engaging and educational.",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "moral": "The main lesson or takeaway from this book in 2-3 impactful sentences"
}`;

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
          publishedYear: parsed.publishedYear || "",
          about: parsed.about || "",
          detailed: parsed.detailed || "",
          keyPoints: parsed.keyPoints || [],
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
        coverUrl: `https://covers.openlibrary.org/b/title/${encodeURIComponent(summary.title)}-M.jpg`
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl font-semibold text-foreground">Please wait a second</p>
          <p className="text-muted-foreground mt-2">We're summarizing the book for you!</p>
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
            by {summary.author} {summary.publishedYear && `· ${summary.publishedYear}`}
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

        {/* Detailed Breakdown */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Detailed Breakdown</h2>
          </div>
          <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {summary.detailed}
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
