import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Loader2, AlertCircle, Sparkles, Send } from "lucide-react";
import PremiumBackground from "@/components/PremiumBackground";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

export default function AIEndpoint() {
  const { id, prompt } = useParams<{ id: string; prompt: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiName, setAiName] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [response, setResponse] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (id && prompt) {
      generateResponse(id, decodeURIComponent(prompt));
    }
  }, [id, prompt]);

  const generateResponse = async (aiId: string, userPrompt: string) => {
    setLoading(true);
    setError(null);
    setResponse("");

    try {
      // Get AI details first
      const { data: aiData, error: aiError } = await supabase.functions.invoke('get-ai', {
        body: { randomId: aiId }
      });

      if (aiError || !aiData?.ai) {
        setError("AI not found. Please check the URL and try again.");
        setLoading(false);
        return;
      }

      setAiName(aiData.ai.name);
      setAiDescription(aiData.ai.short_description);

      // Generate response
      const { data: chatData, error: chatError } = await supabase.functions.invoke('ai-chat', {
        body: { aiId, prompt: userPrompt }
      });

      if (chatError) {
        setError("Failed to generate response. Please try again.");
        setLoading(false);
        return;
      }

      setResponse(chatData.text);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTryAnother = async () => {
    if (!newPrompt.trim() || !id) return;

    setIsGenerating(true);
    setResponse("");

    try {
      const { data: chatData, error: chatError } = await supabase.functions.invoke('ai-chat', {
        body: { aiId: id, prompt: newPrompt }
      });

      if (chatError) {
        setError("Failed to generate response. Please try again.");
        return;
      }

      setResponse(chatData.text);
      setNewPrompt("");
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <PremiumBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-3xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary animate-pulse shadow-[0_0_60px_rgba(236,72,153,0.5)]" />
              <Loader2 className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
            </div>
            <p className="text-lg text-muted-foreground mt-6">Processing your prompt...</p>
            <p className="text-sm text-muted-foreground/70 mt-2">This may take a few seconds</p>
          </div>
        ) : error ? (
          <Card className="bg-card/60 backdrop-blur-xl border-destructive/50 animate-in fade-in slide-in-from-bottom duration-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-6 h-6" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
                <Button asChild>
                  <Link to="/ai-maker">Create Your Own AI</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* AI Info Header */}
            <div className="text-center animate-in fade-in slide-in-from-top duration-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-4 shadow-[0_0_40px_rgba(236,72,153,0.3)]">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {aiName}
              </h1>
              <p className="text-muted-foreground">{aiDescription}</p>
            </div>

            {/* Prompt Display */}
            <Card className="bg-card/60 backdrop-blur-xl border-border/50 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
              <CardHeader>
                <CardTitle className="text-lg">Your Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">"{decodeURIComponent(prompt || '')}"</p>
              </CardContent>
            </Card>

            {/* Response Display */}
            <Card className="bg-card/60 backdrop-blur-xl border-border/50 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{response}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Try Another Prompt */}
            <Card className="bg-card/60 backdrop-blur-xl border-border/50 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
              <CardHeader>
                <CardTitle className="text-lg">Try Another Prompt</CardTitle>
                <CardDescription>
                  Ask {aiName} anything else
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your prompt here..."
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTryAnother()}
                    disabled={isGenerating}
                    className="bg-background/50"
                  />
                  <Button
                    onClick={handleTryAnother}
                    disabled={!newPrompt.trim() || isGenerating}
                    className="shrink-0"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="text-center animate-in fade-in slide-in-from-bottom duration-700 delay-400">
              <p className="text-muted-foreground mb-4">Want to create your own AI endpoint?</p>
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary shadow-[0_8px_32px_rgba(236,72,153,0.3)]">
                <Link to="/ai-maker">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Create Your AI
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
