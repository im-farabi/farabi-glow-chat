import { Newspaper, Sparkles, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumBackground from "@/components/PremiumBackground";

interface NewsIntroProps {
  onStart: () => void;
}

const NewsIntro = ({ onStart }: NewsIntroProps) => {
  const features = [
    { icon: Sparkles, label: "AI Generated" },
    { icon: Clock, label: "Always Fresh" },
    { icon: Zap, label: "Simple & Clear" }
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden">
      <PremiumBackground />
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-8 shadow-lg">
          <Newspaper className="w-12 h-12 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-center mb-3">
          <span className="text-foreground">Quick</span>
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">News</span>
        </h1>

        {/* Tagline */}
        <p className="text-muted-foreground text-center text-lg mb-8">
          Your AI-Powered News Companion
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm"
            >
              <feature.icon className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={onStart}
          size="lg"
          className="w-full max-w-xs h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02]"
        >
          GET STARTED
        </Button>

        {/* Subtitle */}
        <p className="text-muted-foreground/60 text-sm mt-6 text-center">
          Stay informed with personalized news
        </p>
      </div>
    </div>
  );
};

export default NewsIntro;
