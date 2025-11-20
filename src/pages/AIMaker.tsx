import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Bot, Copy, ExternalLink, Sparkles, Loader2, Trash2, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PremiumBackground from "@/components/PremiumBackground";
import { supabase } from "@/integrations/supabase/client";
import { deleteAI, updateAI } from "@/lib/api";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [aiToDelete, setAiToDelete] = useState<CustomAI | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [aiToEdit, setAiToEdit] = useState<CustomAI | null>(null);
  const [editName, setEditName] = useState('');
  const [editShortDescription, setEditShortDescription] = useState('');
  const [editFullInstructions, setEditFullInstructions] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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
      setPublishedUrl(`https://farabi.me/api/ai/${randomId}/YOUR_PROMPT_HERE`);
      setPublishDialogOpen(true);

      setName("");
      setShortDescription("");
      setFullInstructions("");

      await loadDashboard();

      toast({
        title: "AI Published!",
        description: "Your AI endpoint is ready to use",
      });
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: "Error",
        description: "Failed to publish AI. Please try again.",
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
      description: "URL copied to clipboard",
    });
  };

  const handleDelete = async () => {
    if (!aiToDelete) return;
    
    try {
      await deleteAI(aiToDelete.id, getUserId());
      toast({
        title: "Deleted!",
        description: "AI deleted successfully",
      });
      setDeleteDialogOpen(false);
      setAiToDelete(null);
      loadDashboard();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete AI",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (ai: CustomAI) => {
    setAiToEdit(ai);
    setEditName(ai.name);
    setEditShortDescription(ai.short_description);
    setEditFullInstructions(ai.full_instructions);
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!aiToEdit) return;

    if (editName.length < 3 || editName.length > 100) {
      toast({
        title: "Invalid name",
        description: "Name must be between 3 and 100 characters",
        variant: "destructive"
      });
      return;
    }
    if (editShortDescription.length < 10 || editShortDescription.length > 200) {
      toast({
        title: "Invalid description",
        description: "Short description must be between 10 and 200 characters",
        variant: "destructive"
      });
      return;
    }
    if (editFullInstructions.length < 20 || editFullInstructions.length > 5000) {
      toast({
        title: "Invalid instructions",
        description: "Full instructions must be between 20 and 5000 characters",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateAI({
        aiId: aiToEdit.id,
        anonymousUserId: getUserId(),
        name: editName,
        shortDescription: editShortDescription,
        fullInstructions: editFullInstructions,
      });
      toast({
        title: "Updated!",
        description: "AI updated successfully",
      });
      setEditDialogOpen(false);
      setAiToEdit(null);
      loadDashboard();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update AI",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <PremiumBackground />
      
      <div className="container max-w-4xl mx-auto px-4 py-8 relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Maker
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Create your own custom AI endpoints with personalized instructions
          </p>
        </div>

        <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)] mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Create Your AI
            </CardTitle>
            <CardDescription>
              Define your AI's personality and behavior with custom instructions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-muted-foreground text-xs">({name.length}/100)</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Apollo, Farabi or anything..."
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short-description">
                Short Description <span className="text-muted-foreground text-xs">({shortDescription.length}/200)</span>
              </Label>
              <Textarea
                id="short-description"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="This is a roblox chatbot to answer roblox questions..."
                maxLength={200}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full-instructions">
                Full Instructions <span className="text-muted-foreground text-xs">({fullInstructions.length}/5000)</span>
              </Label>
              <Textarea
                id="full-instructions"
                value={fullInstructions}
                onChange={(e) => setFullInstructions(e.target.value)}
                placeholder="You are a helpful assistant specialized in..."
                maxLength={5000}
                rows={12}
              />
            </div>

            <Button
              onClick={handlePublish}
              disabled={isPublishing || name.length < 3 || shortDescription.length < 10 || fullInstructions.length < 20}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg hover:shadow-pink-500/50 transition-all"
              size="lg"
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

        <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Your AI Endpoints
            </CardTitle>
            <CardDescription>
              Manage and share your custom AI endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDashboard ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : dashboardData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No AIs created yet</p>
                <p className="text-sm">Create your first AI above to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.map((ai) => (
                  <Card key={ai.id} className="bg-background/50 border-border/30">
                    <CardHeader>
                      <CardTitle className="text-xl">{ai.name}</CardTitle>
                      <CardDescription>{ai.short_description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">API Endpoint (Plain Text)</Label>
                          <div className="flex gap-2">
                            <code className="flex-1 p-2 bg-background/50 rounded text-xs break-all">
                              /api/ai/{ai.random_id}/YOUR_PROMPT
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(`https://farabi.me/api/ai/${ai.random_id}/hello`)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Web UI URL</Label>
                          <div className="flex gap-2">
                            <code className="flex-1 p-2 bg-background/50 rounded text-xs break-all">
                              /ai/{ai.random_id}/prompt/YOUR_PROMPT
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/ai/${ai.random_id}/prompt/hello`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="pt-2 text-sm text-muted-foreground">
                          <p>Total Views: <span className="font-semibold text-foreground">{ai.views_count || 0}</span></p>
                          <p className="text-xs mt-1">Created: {new Date(ai.created_at!).toLocaleDateString()}</p>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(ai)}
                            className="flex-1"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAiToDelete(ai);
                              setDeleteDialogOpen(true);
                            }}
                            className="flex-1 text-red-500 hover:text-red-600 hover:border-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
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

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Published Successfully!
            </DialogTitle>
            <DialogDescription>
              Your AI endpoint is ready to use
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">API Endpoint (Plain Text Response)</Label>
              <div className="flex gap-2">
                <code className="flex-1 p-3 bg-muted rounded text-sm break-all">
                  https://farabi.me/api/ai/{publishedRandomId}/YOUR_PROMPT_HERE
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`https://farabi.me/api/ai/${publishedRandomId}/hello`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this URL in your applications - returns plain text response like Pollinations AI
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Web UI URL</Label>
              <div className="flex gap-2">
                <code className="flex-1 p-3 bg-muted rounded text-sm break-all">
                  {publishedUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(publishedUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this URL for a formatted view with UI
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">Example Usage:</p>
              <code className="text-xs block whitespace-pre-wrap">
{`// JavaScript/TypeScript
const response = await fetch('https://farabi.me/api/ai/${publishedRandomId}/hello');
const text = await response.text();
console.log(text); // Plain text response`}
              </code>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete AI?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{aiToDelete?.name}"? This action cannot be undone and all usage data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit AI</DialogTitle>
            <DialogDescription>
              Update your AI's details and instructions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-muted-foreground text-xs">({editName.length}/100)</span>
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Apollo, Farabi or anything..."
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-short-description">
                Short Description <span className="text-muted-foreground text-xs">({editShortDescription.length}/200)</span>
              </Label>
              <Textarea
                id="edit-short-description"
                value={editShortDescription}
                onChange={(e) => setEditShortDescription(e.target.value)}
                placeholder="This is a roblox chatbot to answer roblox questions..."
                maxLength={200}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-full-instructions">
                Full Instructions <span className="text-muted-foreground text-xs">({editFullInstructions.length}/5000)</span>
              </Label>
              <Textarea
                id="edit-full-instructions"
                value={editFullInstructions}
                onChange={(e) => setEditFullInstructions(e.target.value)}
                placeholder="You are a helpful assistant specialized in..."
                maxLength={5000}
                rows={12}
              />
            </div>

            <Button
              onClick={handleUpdate}
              disabled={isUpdating || editName.length < 3 || editShortDescription.length < 10 || editFullInstructions.length < 20}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Update AI
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
