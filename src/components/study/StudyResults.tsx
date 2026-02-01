import { Trophy, RotateCcw, Home, Star, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudyResultsProps {
  score: number;
  totalQuestions: number;
  timeSpent: number;
  subjectName: string;
  chapterName: string;
  onRetry: () => void;
  onNewTopic: () => void;
}

const StudyResults = ({ 
  score, 
  totalQuestions, 
  timeSpent, 
  subjectName, 
  chapterName,
  onRetry, 
  onNewTopic 
}: StudyResultsProps) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getFeedback = () => {
    if (percentage >= 90) {
      return {
        emoji: '🌟',
        title: 'Outstanding!',
        message: "You've shown excellent understanding of this topic. The Finnish method is working - you're learning deeply, not just memorizing!",
        color: 'text-yellow-400'
      };
    } else if (percentage >= 70) {
      return {
        emoji: '🎯',
        title: 'Great Progress!',
        message: "You're building solid understanding. A few concepts need more practice, but you're on the right track!",
        color: 'text-green-400'
      };
    } else if (percentage >= 50) {
      return {
        emoji: '💪',
        title: 'Good Effort!',
        message: "You're learning! Some concepts need more attention. Try reviewing the explanations and give it another shot.",
        color: 'text-blue-400'
      };
    } else {
      return {
        emoji: '📚',
        title: 'Keep Learning!',
        message: "Every expert was once a beginner. Focus on the explanations, understand the 'why', and try again. You've got this!",
        color: 'text-purple-400'
      };
    }
  };

  const feedback = getFeedback();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto animate-fade-in">
        {/* Trophy/Result Card */}
        <div className="glass-card p-8 border border-blue-500/20 text-center mb-6">
          {/* Emoji */}
          <div className="text-6xl mb-4">{feedback.emoji}</div>

          {/* Score Circle */}
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6 border-4 border-blue-500/30">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{score}/{totalQuestions}</div>
              <div className="text-sm text-muted-foreground">{percentage}%</div>
            </div>
          </div>

          {/* Feedback Title */}
          <h2 className={`text-2xl font-bold mb-2 ${feedback.color}`}>
            {feedback.title}
          </h2>

          {/* Feedback Message */}
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {feedback.message}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 rounded-xl bg-card/50 border border-border">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-muted-foreground">Time</span>
              </div>
              <div className="font-semibold">{formatTime(timeSpent)}</div>
            </div>
            <div className="p-3 rounded-xl bg-card/50 border border-border">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-muted-foreground">Accuracy</span>
              </div>
              <div className="font-semibold">{percentage}%</div>
            </div>
          </div>

          {/* Topic info */}
          <div className="text-sm text-muted-foreground">
            <span className="text-blue-400">{subjectName}</span>
            <span className="mx-2">•</span>
            <span>{chapterName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onRetry}
            size="lg"
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Button
            onClick={onNewTopic}
            variant="outline"
            size="lg"
            className="w-full h-12 border-blue-500/30 hover:bg-blue-500/10"
          >
            <Home className="w-4 h-4 mr-2" />
            Choose New Topic
          </Button>
        </div>

        {/* Finnish Method Note */}
        <div className="mt-8 p-4 rounded-xl bg-card/30 border border-border">
          <div className="flex items-start gap-3">
            <span className="text-xl">🇫🇮</span>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">Finnish Method Tip</h4>
              <p className="text-xs text-muted-foreground">
                In Finland, learning is about understanding, not grades. Focus on the concepts you found tricky and review the explanations. Progress matters more than perfection!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyResults;
