import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookIntroProps {
  onStart: () => void;
}

const BookIntro = ({ onStart }: BookIntroProps) => {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center relative overflow-hidden px-6">

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        {/* Logo */}
        <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20">
          <BookOpen className="w-16 h-16 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground mb-3">
          Read<span className="text-primary">ME</span>
        </h1>

        {/* Tagline */}
        <p className="text-muted-foreground text-lg mb-8">
          Your Smart Reading Companion
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {["AI Recommendations", "Track Books", "Personalized"].map((feature) => (
            <span
              key={feature}
              className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={onStart}
          size="lg"
          className="w-full max-w-xs h-14 text-lg font-semibold rounded-xl shadow-lg active:scale-[0.98] transition-transform"
        >
          GET STARTED
        </Button>
      </div>
    </div>
  );
};

export default BookIntro;
