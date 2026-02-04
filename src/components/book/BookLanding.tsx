import { BookOpen, ArrowRight, Sparkles, Target, TrendingUp, Compass, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookLandingProps {
  onStart: () => void;
}

const BookLanding = ({ onStart }: BookLandingProps) => {
  const categories = [
    { icon: Target, label: "Focus" },
    { icon: Brain, label: "Learn" },
    { icon: TrendingUp, label: "Grow" },
    { icon: Compass, label: "Discover" },
    { icon: Sparkles, label: "Explore" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Animated Book Icon */}
      <div className="relative mb-8 animate-fade-in">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(249,115,22,0.15)]">
          <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-white" strokeWidth={1.5} />
        </div>
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-[40px] blur-2xl -z-10 animate-pulse-slow" />
      </div>

      {/* Headline */}
      <h1 
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight animate-fade-in"
        style={{ animationDelay: '0.1s' }}
      >
        Books that change
        <br />
        <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
          your life
        </span>
      </h1>

      {/* Subtitle */}
      <p 
        className="text-white/60 text-lg md:text-xl max-w-md mb-10 animate-fade-in"
        style={{ animationDelay: '0.2s' }}
      >
        Get personalized book recommendations and AI-powered summaries tailored to you
      </p>

      {/* CTA Button */}
      <Button
        onClick={onStart}
        size="lg"
        className="group relative h-14 px-10 text-lg font-semibold bg-transparent border-2 border-orange-500 text-white hover:bg-orange-500/10 rounded-2xl transition-all duration-500 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] animate-fade-in"
        style={{ animationDelay: '0.3s' }}
      >
        GET STARTED
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>

      {/* Category Pills */}
      <div 
        className="flex flex-wrap justify-center gap-3 mt-12 max-w-lg animate-fade-in"
        style={{ animationDelay: '0.4s' }}
      >
        {categories.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 text-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default"
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Bottom branding */}
      <div 
        className="absolute bottom-8 left-0 right-0 text-center animate-fade-in"
        style={{ animationDelay: '0.5s' }}
      >
        <p className="text-white/30 text-sm font-medium tracking-wider">
          ReadME by <span className="text-white/50">FARABI</span>
        </p>
      </div>
    </div>
  );
};

export default BookLanding;
