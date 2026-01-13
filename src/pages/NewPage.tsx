import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Image, Video, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumBackground from "@/components/PremiumBackground";

const NewPage = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const modes = [
    {
      id: "chat",
      title: "AI Chat",
      subtitle: "Gemini 3 Pro",
      description: "Have intelligent conversations with advanced AI. Get answers, explanations, and creative content.",
      icon: MessageSquare,
      gradient: "from-blue-500 to-cyan-500",
      bgGlow: "bg-blue-500/20",
      path: "/new/chat"
    },
    {
      id: "image",
      title: "AI Image",
      subtitle: "GPT Image 1.5",
      description: "Generate stunning images from text descriptions. Create art, designs, and visualizations.",
      icon: Image,
      gradient: "from-pink-500 to-rose-500",
      bgGlow: "bg-pink-500/20",
      path: "/new/image"
    },
    {
      id: "video",
      title: "AI Video",
      subtitle: "Veo 3.1 Fast",
      description: "Create short videos from text prompts. Bring your ideas to life with AI-generated motion.",
      icon: Video,
      gradient: "from-purple-500 to-violet-500",
      bgGlow: "bg-purple-500/20",
      path: "/new/video"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <PremiumBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold">FARABI.me</span>
          </div>
          <div className="w-20" /> {/* Spacer for centering */}
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                AI Studio
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Create with the power of AI. Choose your creative mode below.
            </p>
          </div>

          {/* Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isHovered = hoveredCard === mode.id;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => navigate(mode.path)}
                  onMouseEnter={() => setHoveredCard(mode.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`
                    relative group p-6 rounded-2xl border border-border/50 
                    bg-card/50 backdrop-blur-sm text-left
                    transition-all duration-300 ease-out
                    hover:scale-[1.02] hover:border-primary/50
                    ${isHovered ? 'shadow-2xl' : 'shadow-lg'}
                  `}
                >
                  {/* Background Glow */}
                  <div className={`
                    absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                    transition-opacity duration-300 ${mode.bgGlow} blur-xl
                  `} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`
                      w-14 h-14 rounded-xl bg-gradient-to-br ${mode.gradient}
                      flex items-center justify-center mb-4
                      shadow-lg group-hover:shadow-xl transition-shadow
                    `}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-xl font-bold mb-1">{mode.title}</h3>
                    <p className={`text-sm font-medium bg-gradient-to-r ${mode.gradient} bg-clip-text text-transparent mb-3`}>
                      {mode.subtitle}
                    </p>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {mode.description}
                    </p>

                    {/* Arrow indicator */}
                    <div className={`
                      mt-4 flex items-center gap-2 text-sm font-medium
                      bg-gradient-to-r ${mode.gradient} bg-clip-text text-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity
                    `}>
                      Get started →
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <p className="text-muted-foreground/60 text-sm mt-12 text-center">
            Powered by Pollinations AI • All generations are processed securely
          </p>
        </main>
      </div>
    </div>
  );
};

export default NewPage;
