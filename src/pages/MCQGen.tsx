import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, BookCheck, ArrowRight, RotateCcw, Sparkles, Clock, Timer, ArrowLeft, Home, X, History, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { sendNormal } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { getMCQHistory, saveMCQToHistory, deleteMCQFromHistory, MCQHistoryItem } from '@/lib/storage';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

// Set page-specific SEO
const useMCQPageSEO = () => {
  useEffect(() => {
    document.title = "MCQ Quiz Generator - Farabi's AI Chatbot | Free AI Quiz Maker";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Generate AI-powered multiple choice quiz questions on any topic. Free MCQ generator with customizable difficulty levels and instant feedback.');
    }
  }, []);
};

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizSettings {
  topic: string;
  numQuestions: 2 | 4 | 6 | 8 | 10;
  level: 'Easy' | 'Medium' | 'Hard';
}

const MCQGen = () => {
  useMCQPageSEO(); // Apply page-specific SEO
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<QuizSettings>({
    topic: '',
    numQuestions: 4,
    level: 'Medium'
  });
  
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [history, setHistory] = useState<MCQHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(10);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);

  useEffect(() => {
    setHistory(getMCQHistory());
  }, []);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Timer effect
  useEffect(() => {
    if (!quizStarted || quizCompleted || showFeedback) return;
    
    if (questionStartTime === null) {
      setQuestionStartTime(Date.now());
      setTimeLeft(10);
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentIndex, showFeedback, quizStarted, quizCompleted, questionStartTime]);

  const handleTimeUp = () => {
    if (showFeedback) return;
    
    if (questionStartTime) {
      setTotalTimeElapsed(prev => prev + (Date.now() - questionStartTime));
    }
    
    setSelectedAnswer(-1);
    setShowFeedback(true);
    setQuestionStartTime(null);
    
    toast({
      title: "Time's up!",
      description: "Moving to feedback",
      variant: "destructive"
    });
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${remainingSeconds}s`;
  };

  const generateMCQs = async () => {
    if (!settings.topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for the quiz",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    const prompt = `Generate exactly ${settings.numQuestions} multiple choice questions about: "${settings.topic}"

Difficulty Level: ${settings.level}

IMPORTANT RULES:
1. Each question MUST have exactly 4 options
2. Options should be challenging but fair for ${settings.level} level
3. Provide a brief explanation (max 100 characters) for the correct answer
4. correctAnswer should be the index (0-3) of the correct option

Format your response as a valid JSON array with this EXACT structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1,
    "explanation": "Brief explanation of correct answer"
  }
]

CRITICAL: Return ONLY the JSON array, no markdown, no backticks, no extra text.`;

    try {
      const response = await sendNormal(prompt);
      
      // Clean response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const generatedQuestions: MCQQuestion[] = JSON.parse(cleanedResponse);
      
      // Validate structure
      if (!Array.isArray(generatedQuestions) || generatedQuestions.length !== settings.numQuestions) {
        throw new Error('Invalid response format: incorrect number of questions');
      }
      
      generatedQuestions.forEach((q, idx) => {
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
            typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3 ||
            !q.explanation) {
          throw new Error(`Invalid question structure at index ${idx}`);
        }
      });
      
      setQuestions(generatedQuestions);
      setQuizStarted(true);
      setCurrentIndex(0);
      setScore(0);
      setQuizCompleted(false);
      
      toast({
        title: "Quiz generated!",
        description: `${settings.numQuestions} questions ready`,
      });
    } catch (error) {
      console.error('MCQ Generation Error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback) return;
    
    if (questionStartTime) {
      setTotalTimeElapsed(prev => prev + (Date.now() - questionStartTime));
      setQuestionStartTime(null);
    }
    
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);
    
    if (answerIndex === questions[currentIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuestionStartTime(null);
      setTimeLeft(10);
    } else {
      // Save to history when quiz is completed
      saveMCQToHistory({
        topic: settings.topic,
        numQuestions: settings.numQuestions,
        level: settings.level,
        score: score + (selectedAnswer === questions[currentIndex].correctAnswer ? 1 : 0),
        totalQuestions: questions.length
      });
      setHistory(getMCQHistory());
      setQuizCompleted(true);
    }
  };

  const handleNewQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setTotalTimeElapsed(0);
    setQuestionStartTime(null);
    setTimeLeft(10);
  };

  const deleteHistoryItem = (id: string) => {
    deleteMCQFromHistory(id);
    setHistory(getMCQHistory());
    toast({
      title: 'Deleted',
      description: 'History item removed'
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Settings Panel
  if (!quizStarted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
        {/* Breadcrumb Schema */}
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
                "name": "MCQ Quiz Generator",
                "item": "https://farabi.me/mcq-gen"
              }
            ]
          })}
        </script>
        
        <Header />
        <main className="flex-1 container max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <Card className="border-2 md:border-4">
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
                      <SheetTitle>MCQ History</SheetTitle>
                      <SheetDescription>
                        Your recent quiz completions
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
                                    <p>Level: <span className="font-medium">{item.level}</span></p>
                                    <p>Score: <span className="font-medium text-primary">{item.score}/{item.totalQuestions}</span> ({Math.round((item.score / item.totalQuestions) * 100)}%)</p>
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
                <BookCheck className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                MCQ Generator
              </CardTitle>
              <p className="text-base md:text-lg text-muted-foreground mt-3">
                Generate AI-powered multiple choice questions on any topic
              </p>
            </CardHeader>
            <CardContent className="space-y-6 md:space-y-8">
              <div className="space-y-3">
                <Label htmlFor="topic" className="text-lg md:text-xl">Topic</Label>
                <Textarea
                  id="topic"
                  placeholder="Enter a topic (e.g., World History, JavaScript, Biology)"
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
                  <Label htmlFor="questions" className="text-lg md:text-xl">Number of Questions</Label>
                  <Select
                    value={settings.numQuestions.toString()}
                    onValueChange={(value) => setSettings({ ...settings, numQuestions: parseInt(value) as 2 | 4 | 6 | 8 | 10 })}
                  >
                    <SelectTrigger id="questions" className="text-base md:text-lg h-12 md:h-14">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Questions</SelectItem>
                      <SelectItem value="4">4 Questions</SelectItem>
                      <SelectItem value="6">6 Questions</SelectItem>
                      <SelectItem value="8">8 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
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
                onClick={generateMCQs}
                disabled={loading || !settings.topic.trim()}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all h-14 md:h-16 text-lg md:text-xl"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 md:h-6 md:w-6 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Results Panel
  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    let performanceMessage = '';
    
    if (percentage === 100) performanceMessage = 'Perfect! 🎉';
    else if (percentage >= 75) performanceMessage = 'Great job! 👏';
    else if (percentage >= 50) performanceMessage = 'Good effort! 👍';
    else performanceMessage = 'Keep practicing! 💪';

    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
        <Header />
        <main className="flex-1 container max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <Card className="border-2 md:border-4">
            <CardHeader>
              <CardTitle className="text-center text-3xl md:text-4xl">Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 md:space-y-8 py-8 md:py-12">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/10">
                  <BookCheck className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </div>
                
                <div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3">{performanceMessage}</h2>
                  <p className="text-2xl md:text-3xl">
                    You scored <span className="font-bold text-primary">{score}</span> out of{' '}
                    <span className="font-bold">{questions.length}</span>
                  </p>
                  <p className="text-xl md:text-2xl text-muted-foreground mt-3">
                    Score: {percentage}%
                  </p>
                </div>

                <Progress value={percentage} className="h-4 md:h-5" />

                <div className="mt-6 p-5 md:p-6 bg-accent/50 rounded-lg md:rounded-xl">
                  <p className="text-lg md:text-xl flex items-center justify-center gap-2">
                    <Timer className="h-5 w-5 md:h-6 md:w-6" />
                    Completed in: <span className="font-bold text-primary">{formatTime(totalTimeElapsed)}</span>
                  </p>
                  <p className="text-sm md:text-base text-muted-foreground mt-2">
                    Average: {formatTime(totalTimeElapsed / questions.length)} per question
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:gap-4">
                <Button
                  onClick={handleNewQuiz}
                  variant="outline"
                  className="w-full h-12 md:h-14 text-base md:text-lg"
                  size="lg"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  New Quiz
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full h-12 md:h-14 text-base md:text-lg"
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
  }

  // Quiz Display Panel
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      <main className="flex-1 container max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6">
        {/* Progress Header with Timer */}
        <Card className="border-2 md:border-4">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-lg md:text-xl font-semibold mb-2">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <div className={`flex items-center gap-2 ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                      <Clock className="h-5 w-5 md:h-6 md:w-6" />
                      <span className="text-2xl md:text-3xl font-bold">{timeLeft}s</span>
                    </div>
                  </div>
                  <Progress value={progress} className="h-3 md:h-4" />
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="ml-4 text-sm md:text-base">
                      <X className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl md:text-2xl">Cancel Quiz?</AlertDialogTitle>
                      <AlertDialogDescription className="text-base md:text-lg">
                        Your progress will be lost. Are you sure you want to exit?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-base">Continue Quiz</AlertDialogCancel>
                      <AlertDialogAction onClick={handleNewQuiz} className="text-base">
                        Yes, Cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">{settings.topic}</p>
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="border-2 md:border-4">
          <CardHeader className="pb-6 md:pb-8">
            <CardTitle className="text-2xl md:text-3xl lg:text-4xl leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-5">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showCorrect = showFeedback && isCorrect;
              const showIncorrect = showFeedback && isSelected && !isCorrect;
              
              return (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showFeedback}
                  variant="outline"
                  className={`w-full justify-start text-left h-auto py-5 md:py-6 px-5 md:px-6 transition-all
                    ${!showFeedback && 'hover:scale-[1.02]'}
                    ${isSelected && !showFeedback && 'bg-accent'}
                    ${showCorrect && 'bg-green-100 dark:bg-green-900/30 border-green-600 text-green-900 dark:text-green-100 hover:bg-green-100 dark:hover:bg-green-900/30'}
                    ${showIncorrect && 'bg-red-100 dark:bg-red-900/30 border-red-600 text-red-900 dark:text-red-100'}`}
                >
                  <span className="font-bold mr-3 md:mr-4 text-xl md:text-2xl">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="flex-1 text-base md:text-lg">{option}</span>
                  {showCorrect && <CheckCircle2 className="h-6 w-6 md:h-7 md:w-7 ml-2" />}
                  {showIncorrect && <XCircle className="h-6 w-6 md:h-7 md:w-7 ml-2" />}
                </Button>
              );
            })}

            {/* Feedback Section */}
            {showFeedback && (
              <div className="pt-4 md:pt-6 space-y-4">
                <div className={`p-5 md:p-6 rounded-lg md:rounded-xl border-3 ${
                  selectedAnswer === currentQuestion.correctAnswer
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-500'
                    : 'bg-red-50 dark:bg-red-950/30 border-red-500'
                }`}>
                  <div className="flex items-start gap-3 md:gap-4">
                    {selectedAnswer === currentQuestion.correctAnswer ? (
                      <CheckCircle2 className="h-7 w-7 md:h-8 md:w-8 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-7 w-7 md:h-8 md:w-8 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg md:text-xl mb-2">
                        {selectedAnswer === currentQuestion.correctAnswer ? 'Correct! ✓' : 'Incorrect ✗'}
                      </h3>
                      {selectedAnswer !== currentQuestion.correctAnswer && selectedAnswer !== -1 && (
                        <p className="text-sm md:text-base mb-2">
                          Correct answer: <span className="font-semibold">
                            {String.fromCharCode(65 + currentQuestion.correctAnswer)}. {currentQuestion.options[currentQuestion.correctAnswer]}
                          </span>
                        </p>
                      )}
                      <p className="text-base md:text-lg opacity-90 leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-12 md:h-14 text-base md:text-lg"
                  size="lg"
                >
                  {currentIndex < questions.length - 1 ? (
                    <>
                      Next Question
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    <>
                      See Results
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MCQGen;
