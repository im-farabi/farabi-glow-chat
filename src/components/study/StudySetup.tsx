import { useState } from 'react';
import { ArrowRight, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudySetupProps {
  onComplete: (age: number) => void;
  onBack: () => void;
}

const AGES = [14, 15, 16, 17, 18];

const StudySetup = ({ onComplete, onBack }: StudySetupProps) => {
  const [selectedAge, setSelectedAge] = useState<number | null>(null);

  const handleContinue = () => {
    if (selectedAge) {
      onComplete(selectedAge);
    }
  };

  const handleSkip = () => {
    onComplete(16); // Default to 16
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto animate-fade-in">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Card */}
        <div className="glass-card p-8 border border-blue-500/20">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
            <User className="w-10 h-10 text-blue-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2">
            How old are you?
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            This helps us personalize your learning experience
          </p>

          {/* Age buttons */}
          <div className="grid grid-cols-5 gap-3 mb-8">
            {AGES.map(age => (
              <button
                key={age}
                onClick={() => setSelectedAge(age)}
                className={`
                  aspect-square rounded-2xl text-xl font-bold transition-all duration-300
                  ${selectedAge === age 
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-105' 
                    : 'bg-card/50 text-foreground hover:bg-card border border-border hover:border-blue-500/50'}
                `}
              >
                {age}
              </button>
            ))}
          </div>

          {/* Age description */}
          {selectedAge && (
            <div className="mb-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 animate-fade-in">
              <p className="text-sm text-center text-foreground/80">
                {selectedAge <= 15 && "📚 We'll use simpler language and relatable examples for you."}
                {selectedAge === 16 || selectedAge === 17 ? "🎯 We'll focus on practical applications and real-world connections." : null}
                {selectedAge === 18 && "🧠 We'll include advanced concepts and critical thinking challenges."}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleContinue}
              disabled={!selectedAge}
              size="lg"
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Continue
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <button
              onClick={handleSkip}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudySetup;
