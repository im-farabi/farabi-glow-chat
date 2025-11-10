import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, BookCheck, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendNormal } from '@/lib/api';
import Header from '@/components/Header';

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizSettings {
  topic: string;
  numQuestions: 2 | 4 | 6;
  level: 'Easy' | 'Medium' | 'Hard';
}

const MCQGen = () => {
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
  
  const { toast } = useToast();

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
    } else {
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
  };

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Settings Panel
  if (!quizStarted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
        <Header />
        <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BookCheck className="h-6 w-6 text-primary" />
                MCQ Generator
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Generate AI-powered multiple choice questions on any topic
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Textarea
                  id="topic"
                  placeholder="Enter a topic (e.g., World History, JavaScript, Biology)"
                  value={settings.topic}
                  onChange={(e) => setSettings({ ...settings, topic: e.target.value.slice(0, 200) })}
                  maxLength={200}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {settings.topic.length}/200
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="questions">Number of Questions</Label>
                  <Select
                    value={settings.numQuestions.toString()}
                    onValueChange={(value) => setSettings({ ...settings, numQuestions: parseInt(value) as 2 | 4 | 6 })}
                  >
                    <SelectTrigger id="questions">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Questions</SelectItem>
                      <SelectItem value="4">4 Questions</SelectItem>
                      <SelectItem value="6">6 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Difficulty Level</Label>
                  <Select
                    value={settings.level}
                    onValueChange={(value) => setSettings({ ...settings, level: value as 'Easy' | 'Medium' | 'Hard' })}
                  >
                    <SelectTrigger id="level">
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
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
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
        <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                  <BookCheck className="h-10 w-10 text-primary" />
                </div>
                
                <div>
                  <h2 className="text-4xl font-bold mb-2">{performanceMessage}</h2>
                  <p className="text-2xl">
                    You scored <span className="font-bold text-primary">{score}</span> out of{' '}
                    <span className="font-bold">{questions.length}</span>
                  </p>
                  <p className="text-xl text-muted-foreground mt-2">
                    Score: {percentage}%
                  </p>
                </div>

                <Progress value={percentage} className="h-3" />
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleNewQuiz}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  size="lg"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  New Quiz
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
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {/* Progress Header */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Question {currentIndex + 1} of {questions.length}</span>
                  <span className="text-muted-foreground">{settings.topic}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Question Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                    variant={showCorrect ? 'default' : showIncorrect ? 'destructive' : 'outline'}
                    className={`w-full justify-start text-left h-auto py-4 px-4 transition-all ${
                      !showFeedback && 'hover:scale-[1.02]'
                    } ${isSelected && !showFeedback && 'bg-accent'} ${
                      showCorrect && 'bg-green-600 hover:bg-green-600 text-white'
                    }`}
                  >
                    <span className="font-semibold mr-3 text-base">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="flex-1 text-base">{option}</span>
                    {showCorrect && <CheckCircle2 className="h-5 w-5 ml-2" />}
                    {showIncorrect && <XCircle className="h-5 w-5 ml-2" />}
                  </Button>
                );
              })}

              {/* Feedback Section */}
              {showFeedback && (
                <div className="pt-4 space-y-4">
                  <div className={`p-4 rounded-lg border-2 ${
                    selectedAnswer === currentQuestion.correctAnswer
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-500'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-500'
                  }`}>
                    <div className="flex items-start gap-3">
                      {selectedAnswer === currentQuestion.correctAnswer ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          {selectedAnswer === currentQuestion.correctAnswer ? 'Correct! ✓' : 'Incorrect ✗'}
                        </h3>
                        {selectedAnswer !== currentQuestion.correctAnswer && (
                          <p className="text-sm mb-2">
                            Correct answer: <span className="font-semibold">
                              {String.fromCharCode(65 + currentQuestion.correctAnswer)}. {currentQuestion.options[currentQuestion.correctAnswer]}
                            </span>
                          </p>
                        )}
                        <p className="text-sm opacity-90">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleNext}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
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
        </div>
      </main>
    </div>
  );
};

export default MCQGen;
