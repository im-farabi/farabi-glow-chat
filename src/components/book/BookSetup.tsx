import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, BookOpen, AlertTriangle } from "lucide-react";
import { POPULAR_BOOKS, INTEREST_CATEGORIES } from "@/data/popularBooks";
import { saveBookUserProfile } from "@/lib/bookStorage";
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

  const handleBookToggle = (bookId: string) => {
    setSelectedBooks(prev =>
      prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleComplete = () => {
    saveBookUserProfile({
      name: name.trim(),
      age: parseInt(age),
      selectedBooks,
      interests: selectedInterests,
      isSetupComplete: true,
      createdAt: Date.now()
    });
    onComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return name.trim().length >= 2;
      case 2:
        return parseInt(age) >= 8 && parseInt(age) <= 100;
      case 3:
        return selectedBooks.length >= 1;
      case 4:
        return selectedInterests.length >= 1;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">ReadME</h1>
        </div>
        <p className="text-muted-foreground mt-1">Your Smart Reading Companion</p>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">Step {step} of 4</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">What should we call you?</h2>
              <p className="text-muted-foreground text-sm">The name people usually call you - can be real or fictional</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="text-lg"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">How old are you?</h2>
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-200">
                  Please enter your correct age to receive better and more accurate book recommendations.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Your Age</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age..."
                min={8}
                max={100}
                className="text-lg"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Select books you love</h2>
              <p className="text-muted-foreground text-sm">Choose books that interest you (select at least 1)</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {POPULAR_BOOKS.map((book) => (
                <BookCard
                  key={book.id}
                  title={book.title}
                  author={book.author}
                  cover={book.cover}
                  selected={selectedBooks.includes(book.id)}
                  onClick={() => handleBookToggle(book.id)}
                  size="md"
                />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">What topics interest you?</h2>
              <p className="text-muted-foreground text-sm">Select categories you'd like to explore (select at least 1)</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {INTEREST_CATEGORIES.map((interest) => (
                <label
                  key={interest}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedInterests.includes(interest)
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <Checkbox
                    checked={selectedInterests.includes(interest)}
                    onCheckedChange={() => handleInterestToggle(interest)}
                  />
                  <span className="font-medium text-foreground">{interest}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border flex gap-3">
        {step > 1 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}
        <Button
          onClick={() => {
            if (step < 4) {
              setStep(step + 1);
            } else {
              handleComplete();
            }
          }}
          disabled={!canProceed()}
          className="flex-1 flex items-center justify-center gap-2"
        >
          {step < 4 ? (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            "Get Started"
          )}
        </Button>
      </div>
    </div>
  );
};

export default BookSetup;
