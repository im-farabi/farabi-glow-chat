import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Sparkles, Zap, DollarSign } from 'lucide-react';
import { useWebGenAuth, MODEL_COSTS } from '@/hooks/useWebGenAuth';
import WebGenBackground from '@/components/WebGenBackground';

// Model icons
import gptIcon from '@/assets/gpt52-new-icon.png';
import claudeIcon from '@/assets/claude-icon.png';
import qwenIcon from '@/assets/qwen-icon.png';

const LoginGate = () => {
  const { signInWithGitHub } = useWebGenAuth();

  const handleGitHubSignIn = async () => {
    try {
      await signInWithGitHub();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <WebGenBackground />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                AI Website Generator
              </CardTitle>
            </div>
            <CardDescription className="text-gray-400 text-base">
              Create stunning websites with AI in seconds
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Free credits banner */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-lg">
                <DollarSign className="w-5 h-5" />
                Get $5.00 FREE Credits
              </div>
              <p className="text-green-300/70 text-sm mt-1">
                Start generating immediately after sign up
              </p>
            </div>

            {/* GitHub sign in button */}
            <Button 
              onClick={handleGitHubSignIn}
              className="w-full h-14 bg-white hover:bg-gray-100 text-black font-semibold text-lg gap-3 transition-all hover:scale-[1.02]"
            >
              <Github className="w-6 h-6" />
              Sign in with GitHub
            </Button>

            {/* Pricing info */}
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-500 font-medium">
                Pricing per Generation
              </div>
              
              <div className="space-y-2">
                {/* Claude */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <img src={claudeIcon} alt="Claude" className="w-6 h-6 rounded" />
                    <span className="text-white font-medium">Claude</span>
                    <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">Best</span>
                  </div>
                  <span className="text-white font-bold">${MODEL_COSTS.claude.toFixed(2)}</span>
                </div>

                {/* GPT */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <img src={gptIcon} alt="GPT 5.2" className="w-6 h-6 rounded" />
                    <span className="text-white font-medium">GPT 5.2</span>
                  </div>
                  <span className="text-white font-bold">${MODEL_COSTS.gpt.toFixed(2)}</span>
                </div>

                {/* Qwen */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <img src={qwenIcon} alt="Qwen Coder" className="w-6 h-6 rounded" />
                    <span className="text-white font-medium">Qwen Coder</span>
                    <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">Budget</span>
                  </div>
                  <span className="text-white font-bold">${MODEL_COSTS.qwen.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Instant Generation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Premium Quality</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-gray-500 text-xs mt-4">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default LoginGate;
