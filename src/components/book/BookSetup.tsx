import { useState, useCallback, useMemo } from "react";
import { ArrowLeft, ArrowRight, Sparkles, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { saveBookUserProfile } from "@/lib/bookStorage";
import { POPULAR_BOOKS, INTEREST_CATEGORIES } from "@/data/popularBooks";
import BookCard from "./BookCard";

interface BookSetupProps {
  onComplete: () => void;
}

const BookSetup = ({ onComplete }: BookSetupProps) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const totalSteps = 4;

  const handleBookToggle = useCallback((bookId: string) => {
    setSelectedBooks(prev =>
      prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  }, []);

  const handleInterestToggle = useCallback((interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  }, []);

  const handleComplete = useCallback(() => {
    saveBookUserProfile({
      name: name.trim() || "Reader",
      age: parseInt(age) || 18,
      selectedBooks,
      interests: selectedInterests,
      isSetupComplete: true,
      createdAt: Date.now()
    });
    onComplete();
  }, [name, age, selectedBooks, selectedInterests, onComplete]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return true; // Name is skippable
      case 2: return age && parseInt(age) > 0 && parseInt(age) < 120;
      case 3: return selectedBooks.length >= 2;
      case 4: return true; // Interests are skippable
      default: return false;
    }
  }, [step, age, selectedBooks.length]);

  const handleNext = useCallback(() => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }, [step, handleComplete]);

  const handleSkip = useCallback(() => {
    if (step === 1) setName("");
    if (step === 4) setSelectedInterests([]);
    handleNext();
  }, [step, handleNext]);

  const stepContent = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl">👋</span>
              <h2 className="text-2xl font-bold text-foreground">Hey there!</h2>
              <p className="text-muted-foreground">What should we call you?</p>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name..."
              className="h-14 text-lg text-center rounded-xl"
              autoFocus
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl">🎂</span>
              <h2 className="text-2xl font-bold text-foreground">How old are you?</h2>
              <p className="text-muted-foreground">This helps us recommend age-appropriate books</p>
            </div>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Your age..."
              min={1}
              max={120}
              className="h-14 text-lg text-center rounded-xl"
              autoFocus
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <span className="text-4xl">📚</span>
              <h2 className="text-2xl font-bold text-foreground">Pick your favorites!</h2>
              <p className="text-muted-foreground">Select at least 2 books you love or want to read</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pb-4 px-1">
              {POPULAR_BOOKS.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isSelected={selectedBooks.includes(book.id)}
                  onToggle={() => handleBookToggle(book.id)}
                />
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {selectedBooks.length}/2 minimum selected
            </p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl">✨</span>
              <h2 className="text-2xl font-bold text-foreground">What excites you?</h2>
              <p className="text-muted-foreground">Pick topics that interest you (optional)</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pb-4">
              {INTEREST_CATEGORIES.map((interest) => (
                <label
                  key={interest}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                    selectedInterests.includes(interest)
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={selectedInterests.includes(interest)}
                    onCheckedChange={() => handleInterestToggle(interest)}
                  />
                  <span className="text-sm font-medium">{interest}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [step, name, age, selectedBooks, selectedInterests, handleBookToggle, handleInterestToggle]);

  const isSkippable = step === 1 || step === 4;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4 safe-area-top">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {step > 1 ? (
            <Button variant="ghost" size="icon" onClick={() => setStep(step - 1)}>
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
                    ? "w-6 bg-primary"
                    : i + 1 < step
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center p-6 max-w-lg mx-auto w-full">
        {stepContent}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border p-4 safe-area-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          {isSkippable && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1 h-12 text-muted-foreground"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className={`h-12 rounded-xl font-semibold ${isSkippable ? "flex-1" : "w-full"}`}
          >
            {step === totalSteps ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Let's Go!
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookSetup;
