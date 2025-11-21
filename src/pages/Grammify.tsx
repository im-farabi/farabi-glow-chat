import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import PremiumBackground from "@/components/PremiumBackground";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Sparkles, Zap, Scale, Brain, ArrowUpRight, ArrowDownRight, Smile, Briefcase, User, Rocket, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import openaiIcon from "@/assets/openai-icon.png";
import gmailIcon from "@/assets/gmail-icon.png";
import workIcon from "@/assets/work-icon.png";
import chatIcon from "@/assets/chat-icon.png";
const Grammify = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<"checking" | "enhancing">("checking");
  const [promptMode, setPromptMode] = useState("balanced");
  const [personalization, setPersonalization] = useState("normal");
  const [replyMode, setReplyMode] = useState("normal");
  const [enhancement, setEnhancement] = useState("prompt-engineering");
  const handleEnhance = async () => {
    if (inputText.length < 3 || inputText.length > 1000) {
      toast.error("Text must be between 3 and 1000 characters");
      return;
    }
    setIsLoading(true);
    setLoadingStage("checking");
    setOutputText("");
    
    // Show "Checking Prompt..." for 1.5 seconds
    setTimeout(() => {
      setLoadingStage("enhancing");
    }, 1500);
    
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("grammify", {
        body: {
          text: inputText,
          promptMode,
          personalization,
          replyMode,
          enhancement
        }
      });
      if (error) throw error;
      if (data?.enhancedText) {
        setOutputText(data.enhancedText);
        toast.success("Text enhanced successfully!");
      } else {
        throw new Error("No enhanced text received");
      }
    } catch (error) {
      console.error("Enhancement error:", error);
      toast.error("Failed to enhance text. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingStage("checking");
    }
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    toast.success("Copied to clipboard!");
  };
  const charCount = inputText.length;
  const isValid = charCount >= 3 && charCount <= 1000;
  return <div className="min-h-screen flex flex-col bg-black text-foreground relative overflow-hidden">
      {/* Tech-oriented background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        </div>
        
        {/* Glowing nodes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Animated circuit lines */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" stopOpacity="0" />
                <stop offset="50%" stopColor="#EC4899" stopOpacity="1" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,100 L200,100 L200,300 L400,300" stroke="url(#circuit-gradient)" strokeWidth="2" fill="none" className="animate-pulse" />
            <path d="M800,200 L600,200 L600,400 L400,400" stroke="url(#circuit-gradient)" strokeWidth="2" fill="none" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
            <circle cx="200" cy="100" r="4" fill="#EC4899" className="animate-pulse" />
            <circle cx="200" cy="300" r="4" fill="#A855F7" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
            <circle cx="600" cy="200" r="4" fill="#EC4899" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
          </svg>
        </div>
        
        {/* Tech particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      <Header showTemporaryToggle={false} />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        {/* Back to Chat Button */}
        <Link to="/">
          <Button variant="ghost" className="mb-6 hover:bg-accent/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>
        </Link>

        {/* Hero Section */}
        <div className="relative">
          {/* Radial gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent blur-3xl pointer-events-none" />
          
          <div className="text-center mb-12 animate-fade-in relative z-10">
            <div className="flex items-center justify-center gap-4 mb-6">
              
              <div className="inline-block px-8 py-3 rounded-2xl backdrop-blur-xl border-2 border-primary/50 shadow-[0_0_30px_rgba(236,72,153,0.3)] text-slate-300 bg-[#181a1a]">
                <h1 className="text-5xl md:text-6xl font-bold text-white">
                  Grammify
                </h1>
              </div>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Enhance your text with AI-powered grammar improvements, style adjustments, and tone optimization
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Input Section */}
          <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)] animate-fade-in" style={{
          animationDelay: "0.2s"
        }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Your Text
            </h2>
            <Textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Enter your text here (3-1000 characters)..." className="min-h-[150px] bg-background/50 border-border/50 focus:border-primary transition-colors resize-none" />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-sm ${isValid ? "text-muted-foreground" : "text-destructive"}`}>
                {charCount}/1000 characters
              </span>
              {!isValid && charCount > 0 && <span className="text-xs text-destructive">
                  {charCount < 3 ? "Too short" : "Too long"}
                </span>}
            </div>
          </Card>

          {/* Options Section */}
          <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)] animate-fade-in" style={{
          animationDelay: "0.3s"
        }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              Enhancement Options
            </h2>
            <div className="space-y-4">
              {/* First Row - Enhancements only */}
              <div className="grid grid-cols-1">
                <div>
                  <label className="text-sm font-medium mb-2 block">Enhancements</label>
                  <Select value={enhancement} onValueChange={setEnhancement}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-black dark:text-white">
                      <SelectItem value="prompt-engineering">
                        <div className="flex items-center">
                          <div className="w-6 h-6 flex items-center justify-center rounded bg-white/80 p-1 mr-2">
                            <img src={openaiIcon} alt="OpenAI" className="w-full h-full object-contain" />
                          </div>
                          Prompt Engineering
                        </div>
                      </SelectItem>
                      <SelectItem value="lettering-emailing">
                        <div className="flex items-center">
                          <div className="w-6 h-6 flex items-center justify-center rounded bg-white/80 p-1 mr-2">
                            <img src={gmailIcon} alt="Gmail" className="w-full h-full object-contain" />
                          </div>
                          Lettering / Emailing
                        </div>
                      </SelectItem>
                      <SelectItem value="work-purpose">
                        <div className="flex items-center">
                          <div className="w-6 h-6 flex items-center justify-center rounded bg-white/80 p-1 mr-2">
                            <img src={workIcon} alt="Work" className="w-full h-full object-contain" />
                          </div>
                          Work Purpose
                        </div>
                      </SelectItem>
                      <SelectItem value="normal-chatting">
                        <div className="flex items-center">
                          <div className="w-6 h-6 flex items-center justify-center rounded bg-white/80 p-1 mr-2">
                            <img src={chatIcon} alt="Chat" className="w-full h-full object-contain" />
                          </div>
                          Normal Chatting
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Second Row - Other 3 options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Prompt Mode</label>
                  <Select value={promptMode} onValueChange={setPromptMode}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-black dark:text-white">
                      <SelectItem value="longer">
                        <div className="flex items-center">
                          <ArrowUpRight className="w-4 h-4 mr-2" />
                          Longer
                        </div>
                      </SelectItem>
                      <SelectItem value="shorter">
                        <div className="flex items-center">
                          <ArrowDownRight className="w-4 h-4 mr-2" />
                          Shorter
                        </div>
                      </SelectItem>
                      <SelectItem value="balanced">
                        <div className="flex items-center">
                          <Scale className="w-4 h-4 mr-2" />
                          Balanced
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Personalization</label>
                  <Select value={personalization} onValueChange={setPersonalization}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-black dark:text-white">
                      <SelectItem value="friendly">
                        <div className="flex items-center">
                          <Smile className="w-4 h-4 mr-2" />
                          Friendly
                        </div>
                      </SelectItem>
                      <SelectItem value="professional">
                        <div className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-2" />
                          Professional
                        </div>
                      </SelectItem>
                      <SelectItem value="normal">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Normal
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Reply Mode</label>
                  <Select value={replyMode} onValueChange={setReplyMode}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-black dark:text-white">
                      <SelectItem value="fast">
                        <div className="flex items-center">
                          <Rocket className="w-4 h-4 mr-2" />
                          Fast
                        </div>
                      </SelectItem>
                      <SelectItem value="normal">
                        <div className="flex items-center">
                          <Zap className="w-4 h-4 mr-2" />
                          Normal
                        </div>
                      </SelectItem>
                      <SelectItem value="think">
                        <div className="flex items-center">
                          <Brain className="w-4 h-4 mr-2" />
                          Think
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button onClick={handleEnhance} disabled={!isValid || isLoading} className="w-full mt-6 h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(236,72,153,0.4)]">
              {isLoading ? <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {loadingStage === "checking" ? "Checking Prompt..." : "Enhancing Text..."}
                </div> : <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Enhance Text
                </div>}
            </Button>
          </Card>

          {/* Output Section */}
          {outputText && <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)] animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Enhanced Text
                </h2>
                <Button onClick={handleCopy} variant="outline" size="sm" className="hover:bg-primary/10">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {outputText}
                </p>
              </div>
              <div className="flex justify-between items-center mt-3 text-sm text-muted-foreground">
                <span>Before: {charCount} chars</span>
                <span>After: {outputText.length} chars</span>
              </div>
            </Card>}
        </div>
      </main>
    </div>;
};
export default Grammify;