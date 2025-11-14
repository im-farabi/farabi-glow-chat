import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, ChevronDown, ChevronLeft, Eye, Send, Trash2, ExternalLink, X, Copy, Sparkles, Code, Loader2, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { checkSlugAvailability, validateWebsiteCode, publishWebsite, getUserWebsites, deleteWebsite, updateWebsite } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface Website {
  id: string;
  slug: string;
  title: string;
  views_count: number;
  created_at: string;
  html_content?: string;
  css_content?: string;
  js_content?: string;
}

export default function WebGen() {
  const { toast } = useToast();
  const [anonymousUserId] = useState(() => {
    let id = localStorage.getItem('anonymousUserId');
    if (!id) {
      id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anonymousUserId', id);
    }
    return id;
  });

  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [htmlPrompt, setHtmlPrompt] = useState("");
  const [cssPrompt, setCssPrompt] = useState("");
  const [jsPrompt, setJsPrompt] = useState("");
  const [generatingHtml, setGeneratingHtml] = useState(false);
  const [generatingCss, setGeneratingCss] = useState(false);
  const [generatingJs, setGeneratingJs] = useState(false);
  const [htmlGenerated, setHtmlGenerated] = useState(false);
  const [cssGenerated, setCssGenerated] = useState(false);
  const [jsGenerated, setJsGenerated] = useState(false);

  const [htmlOpen, setHtmlOpen] = useState(true);
  const [cssOpen, setCssOpen] = useState(false);
  const [jsOpen, setJsOpen] = useState(false);

  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [userWebsites, setUserWebsites] = useState<Website[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingWebsiteId, setEditingWebsiteId] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Website Generator - Farabi's AI Chatbot | Create Free Websites";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Create and publish free HTML/CSS/JS websites with custom URLs. Build up to 3 websites with live preview and instant publishing.');
    }
    loadUserWebsites();
  }, []);

  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus("checking");
      const result = await checkSlugAvailability(slug);
      setSlugStatus(result.available ? "available" : "taken");
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  const loadUserWebsites = async () => {
    try {
      const websites = await getUserWebsites(anonymousUserId);
      setUserWebsites(websites);
    } catch (error) {
      console.error("Error loading websites:", error);
    }
  };

  const handleGenerateHtml = async () => {
    if (!htmlPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please describe the content you want",
        variant: "destructive"
      });
      return;
    }

    setGeneratingHtml(true);
    
    try {
      const response = await fetch(
        `https://gjlxuvcfoqjhwzcmpaju.supabase.co/functions/v1/generate-website`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: htmlPrompt, type: 'html' })
        }
      );

      if (!response.ok) throw new Error(`Generation failed: ${response.statusText}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setHtml(data.html || "");
      setHtmlGenerated(true);
      toast({ title: "HTML Generated!", description: "Now let's add some styling" });
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message || "Failed to generate HTML", variant: "destructive" });
    } finally {
      setGeneratingHtml(false);
    }
  };

  const handleGenerateCss = async () => {
    if (!cssPrompt.trim()) {
      toast({ title: "Prompt Required", description: "Please describe the styling you want", variant: "destructive" });
      return;
    }

    setGeneratingCss(true);
    
    try {
      const response = await fetch(
        `https://gjlxuvcfoqjhwzcmpaju.supabase.co/functions/v1/generate-website`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cssPrompt, type: 'css', context: { html } })
        }
      );

      if (!response.ok) throw new Error(`Generation failed: ${response.statusText}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setCss(data.css || "");
      setCssGenerated(true);
      toast({ title: "CSS Generated!", description: "Looking good! Now add interactivity (optional)" });
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message || "Failed to generate CSS", variant: "destructive" });
    } finally {
      setGeneratingCss(false);
    }
  };

  const handleGenerateJs = async () => {
    if (!jsPrompt.trim()) {
      toast({ title: "Prompt Required", description: "Please describe the interactivity you want", variant: "destructive" });
      return;
    }

    setGeneratingJs(true);
    
    try {
      const response = await fetch(
        `https://gjlxuvcfoqjhwzcmpaju.supabase.co/functions/v1/generate-website`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: jsPrompt, type: 'js', context: { html, css } })
        }
      );

      if (!response.ok) throw new Error(`Generation failed: ${response.statusText}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setJs(data.js || "");
      setJsGenerated(true);
      toast({ title: "JavaScript Generated!", description: "All done! Switch to Manual tab to publish" });
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message || "Failed to generate JavaScript", variant: "destructive" });
    } finally {
      setGeneratingJs(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setHtmlPrompt("");
    setCssPrompt("");
    setJsPrompt("");
    setHtml("");
    setCss("");
    setJs("");
    setHtmlGenerated(false);
    setCssGenerated(false);
    setJsGenerated(false);
  };

  const handlePreview = () => {
    const fullHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Preview</title><style>${css}</style></head><body>${html}<script>${js}</script></body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handlePublish = async () => {
    if (!title.trim() || !slug.trim() || !html.trim()) {
      toast({ title: "Required Fields", description: "Title, URL, and HTML are required", variant: "destructive" });
      return;
    }

    if (slugStatus === "taken" && !editingWebsiteId) {
      toast({ title: "URL Taken", description: "This URL is already in use", variant: "destructive" });
      return;
    }

    if (userWebsites.length >= 3 && !editingWebsiteId) {
      toast({ title: "Limit Reached", description: "You can only create 3 websites. Delete one first.", variant: "destructive" });
      return;
    }

    setIsPublishing(true);

    try {
      const validation = await validateWebsiteCode(html, css, js);
      if (!validation.valid) {
        toast({ title: "Validation Failed", description: validation.errors?.join(", ") || "Invalid code", variant: "destructive" });
        return;
      }

      if (editingWebsiteId) {
        await updateWebsite({
          websiteId: editingWebsiteId,
          anonymousUserId,
          title,
          html,
          css,
          js
        });
        toast({ title: "Website Updated!", description: "Your changes have been published" });
      } else {
        await publishWebsite({
          anonymousUserId,
          slug,
          title,
          html,
          css,
          js
        });
        toast({ title: "Website Published!", description: "Your website is now live" });
      }

      const websiteUrl = `${window.location.origin}/w/${slug}`;
      setPublishedUrl(websiteUrl);
      loadUserWebsites();
      setEditingWebsiteId(null);
    } catch (error: any) {
      toast({ title: "Publishing Failed", description: error.message || "Failed to publish website", variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleEdit = (website: Website) => {
    setHtml(website.html_content || "");
    setCss(website.css_content || "");
    setJs(website.js_content || "");
    setTitle(website.title);
    setSlug(website.slug);
    setEditingWebsiteId(website.id);
    setPublishedUrl(null);
    setActiveTab("manual");
    toast({ title: "Editing Website", description: `You're now editing "${website.title}"` });
  };

  const handleCancelEdit = () => {
    setEditingWebsiteId(null);
    setHtml("");
    setCss("");
    setJs("");
    setTitle("");
    setSlug("");
    setPublishedUrl(null);
  };

  const handleDelete = async (websiteId: string, websiteTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${websiteTitle}"?`)) return;

    try {
      await deleteWebsite(websiteId, anonymousUserId);
      toast({ title: "Website Deleted", description: `"${websiteTitle}" has been removed` });
      loadUserWebsites();
      if (editingWebsiteId === websiteId) handleCancelEdit();
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message || "Failed to delete website", variant: "destructive" });
    }
  };

  const getSlugBadge = () => {
    if (slugStatus === "checking") return <Badge variant="secondary">Checking...</Badge>;
    if (slugStatus === "available") return <Badge variant="default" className="bg-green-500">Available ✓</Badge>;
    if (slugStatus === "taken") return <Badge variant="destructive">Already Taken</Badge>;
    return null;
  };

  const examplePrompts = {
    html: ["Landing page for a pizza restaurant", "Portfolio with hero and projects", "Blog with header and sidebar"],
    css: ["Modern gradient purple and blue", "Professional dark theme", "Colorful with rounded corners"],
    js: ["Button that redirects to example.com", "Sticky header when scrolling", "Simple image slider"]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chat
          </Link>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Website Generator
            </h1>
            <p className="text-muted-foreground">Create and publish free websites - now with step-by-step AI generation</p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ai" | "manual")} className="mb-8">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="ai"><Sparkles className="mr-2 h-4 w-4" />AI Generate</TabsTrigger>
              <TabsTrigger value="manual"><Code className="mr-2 h-4 w-4" />Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-6">
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Step 1: Generate HTML</CardTitle>
                    <CardDescription>Describe the structure and content of your website</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="html-prompt">HTML Prompt</Label>
                      <Textarea
                        id="html-prompt"
                        placeholder="e.g., Landing page for a pizza restaurant"
                        value={htmlPrompt}
                        onChange={(e) => setHtmlPrompt(e.target.value)}
                        rows={4}
                        className="resize-none"
                        disabled={generatingHtml}
                      />
                      <ul className="list-none pl-0 mt-2 flex gap-2">
                        {examplePrompts.html.map((example, i) => (
                          <li key={i} className="inline-block">
                            <Button variant="link" size="sm" onClick={() => setHtmlPrompt(example)}>{example}</Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      onClick={handleGenerateHtml}
                      disabled={generatingHtml || !htmlPrompt.trim()}
                      className="w-full"
                    >
                      {generatingHtml ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating HTML...
                        </>
                      ) : (
                        <>
                          Generate HTML
                        </>
                      )}
                    </Button>
                    {htmlGenerated && (
                      <div className="flex items-center text-sm text-green-500">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        HTML Generated! Move to step 2.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Step 2: Generate CSS</CardTitle>
                    <CardDescription>Describe the visual style of your website</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="css-prompt">CSS Prompt</Label>
                      <Textarea
                        id="css-prompt"
                        placeholder="e.g., Modern gradient purple and blue"
                        value={cssPrompt}
                        onChange={(e) => setCssPrompt(e.target.value)}
                        rows={4}
                        className="resize-none"
                        disabled={generatingCss}
                      />
                      <ul className="list-none pl-0 mt-2 flex gap-2">
                        {examplePrompts.css.map((example, i) => (
                          <li key={i} className="inline-block">
                            <Button variant="link" size="sm" onClick={() => setCssPrompt(example)}>{example}</Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      onClick={handleGenerateCss}
                      disabled={generatingCss || !cssPrompt.trim()}
                      className="w-full"
                    >
                      {generatingCss ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating CSS...
                        </>
                      ) : (
                        <>
                          Generate CSS
                        </>
                      )}
                    </Button>
                    {cssGenerated && (
                      <div className="flex items-center text-sm text-green-500">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        CSS Generated! Move to step 3.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Step 3: Generate JavaScript (Optional)</CardTitle>
                    <CardDescription>Describe any interactive features you want</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="js-prompt">JavaScript Prompt</Label>
                      <Textarea
                        id="js-prompt"
                        placeholder="e.g., Button that redirects to example.com"
                        value={jsPrompt}
                        onChange={(e) => setJsPrompt(e.target.value)}
                        rows={4}
                        className="resize-none"
                        disabled={generatingJs}
                      />
                      <ul className="list-none pl-0 mt-2 flex gap-2">
                        {examplePrompts.js.map((example, i) => (
                          <li key={i} className="inline-block">
                            <Button variant="link" size="sm" onClick={() => setJsPrompt(example)}>{example}</Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      onClick={handleGenerateJs}
                      disabled={generatingJs || !jsPrompt.trim()}
                      className="w-full"
                    >
                      {generatingJs ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating JavaScript...
                        </>
                      ) : (
                        <>
                          Generate JavaScript
                        </>
                      )}
                    </Button>
                    {jsGenerated && (
                      <div className="flex items-center text-sm text-green-500">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        JavaScript Generated! Switch to Manual tab to publish.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {currentStep !== 1 && (
                <Button variant="secondary" onClick={() => setCurrentStep((currentStep - 1) as 1 | 2 | 3)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Step {currentStep - 1}
                </Button>
              )}

              {currentStep !== 3 && htmlGenerated && cssGenerated && (
                <Button onClick={() => setCurrentStep((currentStep + 1) as 1 | 2 | 3)}>
                  Continue to Step {currentStep + 1}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              {(htmlGenerated || cssGenerated || jsGenerated) && (
                <Button variant="ghost" onClick={handleStartOver}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-6">
              <Card className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    {editingWebsiteId ? "Edit Your Website" : `Create Your Website (${userWebsites.length}/3 created)`}
                  </h2>
                  {editingWebsiteId && (
                    <Button onClick={handleCancelEdit} variant="outline">
                      Cancel Edit
                    </Button>
                  )}
                </div>

                {!editingWebsiteId && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 <strong>New to coding?</strong> Use the <strong>AI Generate</strong> tab to create your website automatically!
                    </p>
                  </div>
                )}
                
                <div className="space-y-6 mb-8">
                  <div className="bg-muted/30 p-6 rounded-lg border-2 border-primary/20">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      Name Your Website
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-base font-medium mb-3">Website Name</label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="My Awesome Website"
                          maxLength={100}
                          className="h-14 text-lg"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          This is the title visitors will see
                        </p>
                      </div>

                      <div>
                        <label className="block text-base font-medium mb-3">Page Address (URL)</label>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-lg font-mono">farabi.me/web/</span>
                          <Input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="my-website"
                            className="flex-1 h-14 text-lg font-mono"
                            maxLength={50}
                          />
                          {getSlugBadge()}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Choose a unique address for your website (only letters, numbers, and hyphens)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-6 rounded-lg border-2 border-primary/20">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      Preview & Publish
                    </h3>
                    
                    <div className="flex gap-3 flex-wrap">
                      <Button 
                        onClick={handlePreview} 
                        variant="secondary"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Website
                      </Button>

                      {publishedUrl && (
                        <Button variant="outline" asChild>
                          <Link to={publishedUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Live Website
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 p-6 rounded-lg border-2 border-primary/20">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    Code
                  </h3>

                  <div className="space-y-4">
                    <Collapsible open={htmlOpen} onOpenChange={setHtmlOpen}>
                      <CollapsibleTrigger className="group flex items-center justify-between w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-primary data-[state=open]:text-primary">
                        HTML
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4">
                        <Textarea
                          value={html}
                          onChange={(e) => setHtml(e.target.value)}
                          placeholder="<h1>Hello World</h1>"
                          rows={8}
                          className="resize-none font-mono text-sm"
                        />
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={cssOpen} onOpenChange={setCssOpen}>
                      <CollapsibleTrigger className="group flex items-center justify-between w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-primary data-[state=open]:text-primary">
                        CSS
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4">
                        <Textarea
                          value={css}
                          onChange={(e) => setCss(e.target.value)}
                          placeholder=".container { color: red; }"
                          rows={4}
                          className="resize-none font-mono text-sm"
                        />
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={jsOpen} onOpenChange={setJsOpen}>
                      <CollapsibleTrigger className="group flex items-center justify-between w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-primary data-[state=open]:text-primary">
                        JavaScript
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4">
                        <Textarea
                          value={js}
                          onChange={(e) => setJs(e.target.value)}
                          placeholder="console.log('Hello World')"
                          rows={4}
                          className="resize-none font-mono text-sm"
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>

                <Button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full"
                  size="lg"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing Website...
                    </>
                  ) : (
                    <>
                      {editingWebsiteId ? "Update Website" : "Publish Website"}
                    </>
                  )}
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

