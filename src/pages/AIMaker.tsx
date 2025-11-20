import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, Copy, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PremiumBackground from "@/components/PremiumBackground";
import { supabase } from "@/integrations/supabase/client";

interface CustomAI {
  id: string;
  random_id: string;
  name: string;
  short_description: string;
  full_instructions: string;
  views_count: number;
  created_at: string;
}

export default function AIMaker() {
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullInstructions, setFullInstructions] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [publishedRandomId, setPublishedRandomId] = useState("");
  const [dashboardData, setDashboardData] = useState<CustomAI[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  const getUserId = () => {
    const userId = localStorage.getItem('anonymousUserId');
    if (!userId) {
      const newUserId = `user${Math.floor(Math.random() * 10000000)}`;
      localStorage.setItem('anonymousUserId', newUserId);
      return newUserId;
    }
    return userId;
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoadingDashboard(true);
    try {
      const userId = getUserId();
      const { data, error } = await supabase
        .from('custom_ais')
        .select('*')
        .eq('anonymous_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setDashboardData(data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const handlePublish = async () => {
    if (name.length < 3 || name.length > 100) {
      toast({
        title: "Invalid name",
        description: "Name must be between 3 and 100 characters",
        variant: "destructive"
      });
      return;
    }

    if (shortDescription.length < 10 || shortDescription.length > 200) {
      toast({
        title: "Invalid description",
        description: "Short description must be between 10 and 200 characters",
        variant: "destructive"
      });
      return;
    }

    if (fullInstructions.length < 20 || fullInstructions.length > 5000) {
      toast({
        title: "Invalid instructions",
        description: "Full instructions must be between 20 and 5000 characters",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);

    try {
      const userId = getUserId();
      const { data, error } = await supabase.functions.invoke('create-ai', {
        body: {
          name,
          shortDescription,
          fullInstructions,
          anonymousUserId: userId
        }
      });

      if (error) throw error;

      const randomId = data.ai.random_id;
      setPublishedRandomId(randomId);
      setPublishedUrl(`https://farabi.me/ai/${randomId}/prompt/YOUR_PROMPT_HERE`);
      setPublishDialogOpen(true);

      // Reset form
      setName("");
      setShortDescription("");
      setFullInstructions("");

      // Reload dashboard
      await loadDashboard();

      toast({
        title: "AI Published!",
        description: "Your custom AI endpoint is ready to use"
      });

    } catch (error) {
      console.error('Error publishing AI:', error);
      toast({
        title: "Failed to publish",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard"
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <PremiumBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mb-6 shadow-[0_0_40px_rgba(236,72,153,0.3)]">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI Maker
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create your own custom AI endpoint with personalized instructions
          </p>
        </div>

        {/* Create AI Form */}
        <Card className="bg-card/60 backdrop-blur-xl border-border/50 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Create Your AI
            </CardTitle>
            <CardDescription>
              Define your AI's personality and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                AI Name <span className="text-muted-foreground">({name.length}/100)</span>
              </label>
              <Input
                placeholder="Apollo, Farabi or anything..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="bg-background/50"
              />
            </div>

            {/* Short Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Short Description <span className="text-muted-foreground">({shortDescription.length}/200)</span>
              </label>
              <Textarea
                placeholder="This is a roblox chatbot to answer roblox questions..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                maxLength={200}
                rows={2}
                className="bg-background/50 resize-none"
              />
            </div>

            {/* Full Instructions */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Full Instructions <span className="text-muted-foreground">({fullInstructions.length}/5000)</span>
              </label>
              <Textarea
                placeholder="You are a helpful assistant specialized in Roblox. Answer all questions about Roblox game development, scripting, and gameplay with enthusiasm and accuracy. Always be friendly and helpful..."
                value={fullInstructions}
                onChange={(e) => setFullInstructions(e.target.value)}
                maxLength={5000}
                rows={8}
                className="bg-background/50 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                These instructions will be used as the system prompt for your AI
              </p>
            </div>

            {/* Publish Button */}
            <Button
              onClick={handlePublish}
              disabled={isPublishing || name.length < 3 || shortDescription.length < 10 || fullInstructions.length < 20}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-[0_8px_32px_rgba(236,72,153,0.3)]"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Publish AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Dashboard */}
        <Card className="bg-card/60 backdrop-blur-xl border-border/50 animate-in fade-in slide-in-from-bottom duration-700 delay-400">
          <CardHeader>
            <CardTitle>Your AI Endpoints</CardTitle>
            <CardDescription>
              Manage and view your published AIs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDashboard ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground mt-2">Loading your AIs...</p>
              </div>
            ) : dashboardData.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No AIs created yet</p>
                <p className="text-sm text-muted-foreground">Create your first AI above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.map((ai) => (
                  <Card key={ai.id} className="bg-background/50 border-border/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Bot className="w-5 h-5 text-primary" />
                            {ai.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">{ai.short_description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{ai.views_count} uses</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-muted/50 px-3 py-2 rounded border border-border/30 font-mono">
                            farabi.me/ai/{ai.random_id}/prompt/YOUR_PROMPT
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(`https://farabi.me/ai/${ai.random_id}/prompt/YOUR_PROMPT`)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/ai/${ai.random_id}/prompt/hi`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Published Successfully!
            </DialogTitle>
            <DialogDescription>
              Your custom AI endpoint is now live and ready to use
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your AI Endpoint URL:</label>
              <div className="flex gap-2">
                <code className="flex-1 text-sm bg-muted/50 px-4 py-3 rounded border border-border/30 font-mono break-all">
                  {publishedUrl}
                </code>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(publishedUrl)}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Replace YOUR_PROMPT_HERE with any text to get a response from your AI
              </p>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
              <p className="text-sm font-medium mb-2">Example usage:</p>
              <code className="text-xs bg-background/50 px-3 py-2 rounded block font-mono break-all">
                https://farabi.me/ai/{publishedRandomId}/prompt/hello
              </code>
            </div>

            <Button
              onClick={() => setPublishDialogOpen(false)}
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
