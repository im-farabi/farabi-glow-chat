import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BookOnboardingProps {
  onComplete: (name: string, age: number) => void;
}

const BookOnboarding = ({ onComplete }: BookOnboardingProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState(18);

  const handleSkipName = () => {
    setStep(2);
  };

  const handleContinueName = () => {
    setStep(2);
  };

  const handleComplete = () => {
    onComplete(name.trim() || "Reader", age);
  };

  const decreaseAge = () => {
    setAge(prev => Math.max(5, prev - 1));
  };

  const increaseAge = () => {
    setAge(prev => Math.min(99, prev + 1));
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
      {step === 1 && (
        <div className="w-full max-w-md text-center animate-fade-in">
          {/* Emoji */}
          <div className="text-6xl mb-6">👋</div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-white mb-2">Hey there!</h2>
          <p className="text-white/60 mb-8">What should we call you?</p>

          {/* Glassmorphic Input */}
          <div className="relative mb-8">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name..."
              className="h-14 text-lg text-center bg-white/5 backdrop-blur-xl border-white/20 text-white placeholder:text-white/40 rounded-2xl focus:border-orange-500/50 focus:ring-orange-500/20"
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              variant="ghost"
              onClick={handleSkipName}
              className="text-white/50 hover:text-white hover:bg-white/5"
            >
              Skip
            </Button>
            <Button
              onClick={handleContinueName}
              className="bg-transparent border-2 border-orange-500 text-white hover:bg-orange-500/10 rounded-xl px-8 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            >
              Continue
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="w-full max-w-md text-center animate-fade-in">
          {/* Emoji */}
          <div className="text-6xl mb-6">🎂</div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-white mb-2">Your Age</h2>
          <p className="text-white/60 mb-10">This helps us personalize your experience</p>

          {/* Arrow-Based Age Selector */}
          <div className="flex items-center justify-center gap-6 mb-10">
            {/* Left Arrow */}
            <button
              onClick={decreaseAge}
              className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-orange-500/50 transition-all duration-300 active:scale-95"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            {/* Age Display */}
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.15)]">
                <span className="text-5xl font-bold text-white tabular-nums">
                  {age}
                </span>
              </div>
              {/* Glow */}
              <div className="absolute -inset-2 bg-orange-500/10 rounded-[32px] blur-xl -z-10" />
            </div>

            {/* Right Arrow */}
            <button
              onClick={increaseAge}
              className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-orange-500/50 transition-all duration-300 active:scale-95"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </div>

          {/* Age range hint */}
          <p className="text-white/40 text-sm mb-8">
            Age range: 5 - 99
          </p>

          {/* Complete Button */}
          <Button
            onClick={handleComplete}
            size="lg"
            className="bg-transparent border-2 border-orange-500 text-white hover:bg-orange-500/10 rounded-2xl px-10 h-14 text-lg font-semibold shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] transition-all duration-500"
          >
            Let's Go
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Step indicator */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 1 ? 'bg-orange-500 w-6' : 'bg-white/20'}`} />
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 2 ? 'bg-orange-500 w-6' : 'bg-white/20'}`} />
      </div>
    </div>
  );
};

export default BookOnboarding;
