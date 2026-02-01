import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, XCircle, Lightbulb, Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Subject, Chapter } from '@/data/studySubjects';
import { sendRawJSON } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface StudyQuizProps {
  subject: Subject;
  chapter: Chapter;
  numQuestions: number;
  userAge: number;
  onComplete: (score: number, totalQuestions: number, timeSpent: number) => void;
  onBack: () => void;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  learnMore: string;
}

const MAX_RECHECKS = 2;

const StudyQuiz = ({ subject, chapter, numQuestions, userAge, onComplete, onBack }: StudyQuizProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [recheckCount, setRecheckCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = async () => {
    setLoading(true);
    setError(null);

    const ageContext = userAge <= 15 
      ? "beginner level, simple language, relatable examples for a young teen"
      : userAge <= 17
      ? "intermediate level, practical real-world applications for a high schooler"
      : "advanced level, critical thinking, deeper analysis for a graduating student";

    const prompt = `You are a JSON generator. Output ONLY a valid JSON array. No explanations, no markdown, no text before or after.

Generate ${numQuestions} educational MCQ questions in ENGLISH language using the Finnish education METHOD (not Finnish language).

SUBJECT: ${subject.name}
CHAPTER: ${chapter.name}
TOPICS: ${chapter.topics.join(', ')}
STUDENT AGE: ${userAge} years old (${ageContext})

FINNISH METHOD REQUIREMENTS:
1. Questions should TEACH, not just TEST
2. Use relatable, real-world examples for a ${userAge}-year-old
3. Focus on conceptual understanding over memorization
4. Avoid trick questions
5. Use encouraging language in explanations

IMPORTANT EXPLANATION FORMAT:
- Keep explanations SHORT (max 3-4 lines)
- Use STEP-BY-STEP format with line breaks
- Example format:
  "Step 1: Calculate liters = $100 ÷ $2 = 50 liters\\nStep 2: Calculate distance = 50 ÷ 0.1 = 500 km\\n✅ Answer: 500 kilometers"

OUTPUT FORMAT - Return EXACTLY this JSON structure:
[
  {
    "question": "Question text in ENGLISH",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Step 1: First step\\nStep 2: Second step\\n✅ Answer: Correct answer",
    "learnMore": "One short fun fact"
  }
]

RESPOND WITH ONLY THE JSON ARRAY. START WITH [ AND END WITH ]`;

    try {
      const response = await sendRawJSON(prompt);
      
      // Clean response - remove markdown code blocks if present (same robust logic as MCQGen)
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      cleanedResponse = cleanedResponse.trim();

      const parsed = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Invalid response format');
      }

      // Validate structure
      const validQuestions = parsed.filter((q: Question) => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 &&
        typeof q.correctAnswer === 'number' &&
        q.explanation
      );

      if (validQuestions.length === 0) {
        throw new Error('No valid questions in response');
      }

      setQuestions(validQuestions);
      setLoading(false);
    } catch (err) {
      console.error('Failed to generate questions:', err);
      setError('Failed to generate questions. Please try again.');
      setLoading(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === questions[currentIndex].correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setRecheckCount(0); // Reset recheck count for new question
    } else {
      // Quiz complete
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      onComplete(score + (selectedAnswer === questions[currentIndex].correctAnswer ? 1 : 0), questions.length, timeSpent);
    }
  };

  const handleRecheckAnswer = () => {
    if (recheckCount >= MAX_RECHECKS) return;
    setRecheckCount(prev => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Preparing your questions...</h2>
          <p className="text-muted-foreground text-sm">
            Using Finnish education method for {chapter.name}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onBack}>
              Go Back
            </Button>
            <Button onClick={generateQuestions} className="bg-gradient-to-r from-blue-500 to-cyan-500">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-blue-400">
              Score: {score}/{currentIndex + (showResult ? 1 : 0)}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-card" />
        </div>

        {/* Subject/Chapter info */}
        <div className="flex items-center gap-2 mb-6">
          <span className="px-3 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {subject.name}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground">{chapter.name}</span>
        </div>

        {/* Question Card */}
        <div className="glass-card p-6 border border-blue-500/20 mb-6">
          <h2 className="text-lg md:text-xl font-medium leading-relaxed">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            
            let optionStyle = 'bg-card/50 border-border hover:border-blue-500/50';
            if (showResult) {
              if (isCorrect) {
                optionStyle = 'bg-green-500/20 border-green-500/50';
              } else if (isSelected && !isCorrect) {
                optionStyle = 'bg-red-500/20 border-red-500/50';
              }
            } else if (isSelected) {
              optionStyle = 'bg-blue-500/20 border-blue-500/50';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`
                  w-full p-4 rounded-xl text-left transition-all duration-300 border
                  ${optionStyle}
                  ${!showResult ? 'hover:bg-card' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  <span className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0
                    ${isSelected || (showResult && isCorrect) 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-card text-muted-foreground'}
                  `}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-foreground pt-1">{option}</span>
                  {showResult && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-green-400 ml-auto flex-shrink-0 mt-1" />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-400 ml-auto flex-shrink-0 mt-1" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation (after answer) */}
        {showResult && (
          <div className="animate-fade-in space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-400 mb-1">Explanation</h4>
                  <p className="text-sm text-foreground/80 whitespace-pre-line">{currentQuestion.explanation}</p>
                </div>
              </div>
            </div>

            {currentQuestion.learnMore && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-400 mb-1">Learn More</h4>
                    <p className="text-sm text-foreground/80 whitespace-pre-line">{currentQuestion.learnMore}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recheck Answer Button */}
            {recheckCount < MAX_RECHECKS && (
              <Button
                variant="outline"
                onClick={handleRecheckAnswer}
                className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Recheck Answer ({MAX_RECHECKS - recheckCount} left)
              </Button>
            )}
          </div>
        )}

        {/* Action Button */}
        {!showResult ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 transition-all duration-300"
          >
            Check Answer
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300"
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default StudyQuiz;
