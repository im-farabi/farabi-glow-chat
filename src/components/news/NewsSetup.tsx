import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PremiumBackground from "@/components/PremiumBackground";
import { saveNewsUserProfile } from "@/lib/newsStorage";

interface NewsSetupProps {
  onComplete: () => void;
}

const NewsSetup = ({ onComplete }: NewsSetupProps) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const totalSteps = 2;

  const canProceed = useMemo(() => {
    if (step === 1) return true; // Name is optional
    if (step === 2) {
      const ageNum = parseInt(age);
      return !isNaN(ageNum) && ageNum >= 5 && ageNum <= 120;
    }
    return false;
  }, [step, age]);

  const handleComplete = () => {
    saveNewsUserProfile({
      name: name.trim() || "Reader",
      age: parseInt(age),
      isSetupComplete: true,
      createdAt: Date.now()
    });
    onComplete();
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    if (step === 1) {
      setName("");
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const stepContent = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                What should we call you?
              </h2>
              <p className="text-muted-foreground">
                Enter your name or nickname (optional)
              </p>
            </div>
            <Input
              type="text"
              placeholder="Your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 text-lg rounded-xl bg-card/50 border-border/50 text-center"
              maxLength={30}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                How old are you?
              </h2>
              <p className="text-muted-foreground">
                This helps us adjust the news for you
              </p>
            </div>
            <Input
              type="number"
              placeholder="Your age..."
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="h-14 text-lg rounded-xl bg-card/50 border-border/50 text-center"
              min={5}
              max={120}
            />
          </div>
        );

      default:
        return null;
    }
  }, [step, name, age]);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden">
      <PremiumBackground />

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-10" />
          )}

          {/* Progress dots */}
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i + 1 === step
                    ? "w-8 bg-primary"
                    : i + 1 < step
                    ? "w-2 bg-primary/60"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {step === 1 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip
            </Button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 relative z-10">
        {stepContent}
      </div>

      {/* Footer */}
      <div className="relative z-10 px-6 pb-8">
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          size="lg"
          className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === totalSteps ? (
            "Complete Setup"
          ) : (
            <>
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default NewsSetup;
