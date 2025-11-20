import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, SquareStack, ArrowLeft, RotateCcw, Sparkles, Home, History, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendNormal } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import FlashcardItem from '@/components/FlashcardItem';
import { getFlashcardHistory, saveFlashcardToHistory, deleteFlashcardFromHistory, FlashcardHistoryItem } from '@/lib/storage';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import PremiumBackground from '@/components/PremiumBackground';

const useFlashcardPageSEO = () => {
  useEffect(() => {
    document.title = "Flashcard Generator - Farabi's AI Chatbot | Free Study Cards";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Generate AI-powered flashcards on any topic. Free study tool with 3D flip cards and customizable difficulty levels.');
    }
  }, []);
};

export interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardSettings {
  topic: string;
  numCards: 2 | 4 | 6 | 8 | 10;
  level: 'Easy' | 'Medium' | 'Hard';
}

const FlashcardGen = () => {
  useFlashcardPageSEO();
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<FlashcardSettings>({
    topic: '',
    numCards: 4,
    level: 'Medium'
  });
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [flipMode, setFlipMode] = useState<'click' | 'hover'>('click');
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 2;
  const [history, setHistory] = useState<FlashcardHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    setHistory(getFlashcardHistory());
  }, []);

  const generateFlashcards = async () => {
    if (!settings.topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for flashcards",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
const prompt = `Generate exactly ${settings.numCards} educational flashcards about: "${settings.topic}"

Difficulty Level: ${settings.level}

IMPORTANT RULES:
1. Each flashcard should have a clear, concise question (max 150 characters)
2. Each answer should be informative but brief (max 200 characters)
3. Questions should be appropriate for ${settings.level} difficulty
4. Make questions specific and testable
5. Answers should be factual and educational

Format your response as a valid JSON array with this EXACT structure:
[
  {
    "question": "Clear, specific question here?",
    "answer": "Concise, accurate answer here"
  }
]

CRITICAL REQUIREMENTS:
- Return ONLY the JSON array, nothing else
- NO markdown formatting, NO backticks, NO code blocks
- NO explanatory text before or after the JSON
- NO phrases like "Hope this helps" or "Here you go"
- Start your response with [ and end with ]
- If you include ANY text outside the JSON array, the system will fail`;

    try {
      const response = await sendNormal(prompt);
      
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const generatedCards: Flashcard[] = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(generatedCards) || generatedCards.length !== settings.numCards) {
        throw new Error('Invalid response format: incorrect number of flashcards');
      }
      
      generatedCards.forEach((card, idx) => {
        if (!card.question || !card.answer) {
          throw new Error(`Invalid flashcard structure at index ${idx}`);
        }
      });
      
      setFlashcards(generatedCards);
      setStarted(true);
      
      // Save to history
      saveFlashcardToHistory({
        topic: settings.topic,
        numCards: settings.numCards,
        level: settings.level
      });
      setHistory(getFlashcardHistory());
      
      toast({
        title: "Flashcards generated!",
        description: `${settings.numCards} flashcards ready`,
      });
    } catch (error) {
      console.error('Flashcard Generation Error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate flashcards. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewSet = () => {
    setStarted(false);
    setFlashcards([]);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(flashcards.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentCards = flashcards.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const deleteHistoryItem = (id: string) => {
    deleteFlashcardFromHistory(id);
    setHistory(getFlashcardHistory());
    toast({
      title: 'Deleted',
      description: 'History item removed'
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col">
        <PremiumBackground />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://farabi.me/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Flashcard Generator",
                "item": "https://farabi.me/flashcard-gen"
              }
            ]
          })}
        </script>
        
        <Header />
        <main className="flex-1 container max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 animate-fade-in">
          <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)]">
            <CardHeader className="pb-6 md:pb-8">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-base md:text-lg"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to Chat
                </Button>
                <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <History className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                      <SheetTitle>Flashcard History</SheetTitle>
                      <SheetDescription>
                        Your recent flashcard generations
                      </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                      <div className="space-y-4 pr-4">
                        {history.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">No history yet</p>
                        ) : (
                          history.map((item) => (
                            <Card key={item.id} className="p-4 space-y-2 hover:bg-accent/50 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 space-y-2">
                                  <p className="text-sm font-medium line-clamp-2">{item.topic}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(item.timestamp)}
                                  </div>
                                  <div className="text-xs space-y-1">
                                    <p>Cards: <span className="font-medium">{item.numCards}</span></p>
                                    <p>Level: <span className="font-medium">{item.level}</span></p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive shrink-0"
                                  onClick={() => deleteHistoryItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>
              <CardTitle className="flex items-center gap-3 text-3xl md:text-4xl">
                <SquareStack className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                Flashcard Generator
              </CardTitle>
              <p className="text-base md:text-lg text-muted-foreground mt-3">
                Generate AI-powered study flashcards with 3D flip animation
              </p>
            </CardHeader>
            <CardContent className="space-y-6 md:space-y-8">
              <div className="space-y-3">
                <Label htmlFor="topic" className="text-lg md:text-xl">Topic</Label>
                <Textarea
                  id="topic"
                  placeholder="Enter a topic (e.g., Spanish Vocabulary, Chemistry, Programming)"
                  value={settings.topic}
                  onChange={(e) => setSettings({ ...settings, topic: e.target.value.slice(0, 200) })}
                  maxLength={200}
                  className="min-h-[100px] md:min-h-[120px] text-base md:text-lg p-4"
                />
                <p className="text-sm md:text-base text-muted-foreground text-right">
                  {settings.topic.length}/200
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3">
                  <Label htmlFor="cards" className="text-lg md:text-xl">Number of Flashcards</Label>
                  <Select
                    value={settings.numCards.toString()}
                    onValueChange={(value) => setSettings({ ...settings, numCards: parseInt(value) as 2 | 4 | 6 | 8 | 10 })}
                  >
                    <SelectTrigger id="cards" className="text-base md:text-lg h-12 md:h-14">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Flashcards</SelectItem>
                      <SelectItem value="4">4 Flashcards</SelectItem>
                      <SelectItem value="6">6 Flashcards</SelectItem>
                      <SelectItem value="8">8 Flashcards</SelectItem>
                      <SelectItem value="10">10 Flashcards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="level" className="text-lg md:text-xl">Difficulty Level</Label>
                  <Select
                    value={settings.level}
                    onValueChange={(value) => setSettings({ ...settings, level: value as 'Easy' | 'Medium' | 'Hard' })}
                  >
                    <SelectTrigger id="level" className="text-base md:text-lg h-12 md:h-14">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={generateFlashcards}
                disabled={loading || !settings.topic.trim()}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all h-14 md:h-16 text-lg md:text-xl"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 md:h-6 md:w-6 animate-spin" />
                    Generating Flashcards...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                    Generate Flashcards
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PremiumBackground />
      <Header />
      <main className="flex-1 container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 animate-fade-in">
        <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)]">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <div className="text-lg md:text-xl font-semibold mb-2">
                    {flashcards.length} Flashcards - {settings.topic}
                  </div>
                  <div className="text-base md:text-lg text-muted-foreground mb-2">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Progress value={(currentPage / totalPages) * 100} className="h-3 md:h-4 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-secondary" />
                </div>
                <div className="flex gap-2">
                  <Select value={flipMode} onValueChange={(value: 'click' | 'hover') => setFlipMode(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="click">Click to Flip</SelectItem>
                      <SelectItem value="hover">Hover to Flip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)]">
            <CardContent className="pt-6">
              <div className="flex justify-center gap-3">
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="h-12 md:h-14 text-base md:text-lg px-6 cursor-pointer hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all"
                  size="lg"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="h-12 md:h-14 text-base md:text-lg px-6 cursor-pointer hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all"
                  size="lg"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {currentCards.map((card, index) => (
            <FlashcardItem
              key={startIndex + index}
              card={card}
              index={startIndex + index}
              flipMode={flipMode}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)]">
            <CardContent className="pt-6">
              <div className="flex justify-center gap-3">
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="h-12 md:h-14 text-base md:text-lg px-6 cursor-pointer hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all"
                  size="lg"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="h-12 md:h-14 text-base md:text-lg px-6 cursor-pointer hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all"
                  size="lg"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)]">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Button
                onClick={handleNewSet}
                variant="outline"
                className="flex-1 h-12 md:h-14 text-base md:text-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all"
                size="lg"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                New Flashcard Set
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1 h-12 md:h-14 text-base md:text-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all"
                size="lg"
              >
                <Home className="mr-2 h-5 w-5" />
                Back to Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FlashcardGen;
