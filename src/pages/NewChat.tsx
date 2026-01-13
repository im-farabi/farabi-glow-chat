import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Copy, Check, Loader2, MessageSquare, Settings2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PremiumBackground from "@/components/PremiumBackground";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const NewChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Settings
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [seed, setSeed] = useState<string>("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("pollinations-chat", {
        body: {
          prompt: input.trim(),
          model: "gemini-large",
          temperature,
          max_tokens: maxTokens,
          seed: seed ? parseInt(seed) : undefined,
          systemPrompt: "You are a helpful, friendly AI assistant. Provide clear and concise responses."
        }
      });

      if (error) throw error;

      const assistantMessage: Message = { 
        role: "assistant", 
        content: data.text || "I couldn't generate a response." 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <PremiumBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/new")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="text-center">
              <span className="font-semibold">AI Chat</span>
              <p className="text-xs text-muted-foreground">Gemini 3 Pro</p>
            </div>
          </div>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Settings Panel */}
        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleContent>
            <div className="p-4 border-b border-border/50 backdrop-blur-sm bg-card/30">
              <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Temperature: {temperature.toFixed(1)}</Label>
                  <Slider
                    value={[temperature]}
                    onValueChange={([v]) => setTemperature(v)}
                    min={0.1}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Lower = factual, Higher = creative</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Max Tokens: {maxTokens}</Label>
                  <Slider
                    value={[maxTokens]}
                    onValueChange={([v]) => setMaxTokens(v)}
                    min={100}
                    max={4000}
                    step={100}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Maximum response length</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Seed (optional)</Label>
                  <Input
                    type="number"
                    placeholder="Random"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">For reproducible outputs</p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Start a Conversation</h2>
                <p className="text-muted-foreground max-w-sm">
                  Ask anything! Get explanations, creative content, code help, and more.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`
                      max-w-[85%] rounded-2xl p-4 relative group
                      ${msg.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
                        : "bg-card/80 backdrop-blur-sm border border-border/50"
                      }
                    `}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                    
                    {msg.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                        onClick={() => handleCopy(msg.content, index)}
                      >
                        {copied === index ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area */}
        <div className="p-4 border-t border-border/50 backdrop-blur-sm bg-background/50">
          <div className="max-w-2xl mx-auto flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[50px] max-h-[150px] resize-none bg-card/50 border-border/50"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-auto"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChat;
