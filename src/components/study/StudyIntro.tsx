import { GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudyIntroProps {
  onStart: () => void;
}

const StudyIntro = ({ onStart }: StudyIntroProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto animate-fade-in">
        {/* Icon */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.4)] animate-pulse-glow">
            <GraduationCap className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center animate-float">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            StudyME
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-4">
          Finnish Method Learning
        </p>

        {/* Description */}
        <div className="glass-card p-6 mb-8 border border-blue-500/20">
          <p className="text-foreground/80 leading-relaxed">
            Designed to make you <span className="text-blue-400 font-semibold">top 1%</span> using the proven Finnish education method.
            Learn smarter, not harder.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-3 border border-blue-500/10">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-xs text-muted-foreground">Age-Adaptive</div>
          </div>
          <div className="glass-card p-3 border border-blue-500/10">
            <div className="text-2xl mb-1">🧠</div>
            <div className="text-xs text-muted-foreground">Learn First</div>
          </div>
          <div className="glass-card p-3 border border-blue-500/10">
            <div className="text-2xl mb-1">🇫🇮</div>
            <div className="text-xs text-muted-foreground">Finnish Method</div>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={onStart}
          size="lg"
          className="w-full max-w-xs h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all duration-300"
        >
          GET STARTED
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default StudyIntro;
