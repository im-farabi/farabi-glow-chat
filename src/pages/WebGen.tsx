import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, ChevronDown, Eye, Send, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { checkSlugAvailability, validateWebsiteCode, publishWebsite, getUserWebsites, deleteWebsite } from "@/lib/api";

interface Website {
  id: string;
  slug: string;
  title: string;
  views_count: number;
  created_at: string;
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

  // Code sections
  const [htmlOpen, setHtmlOpen] = useState(true);
  const [cssOpen, setCssOpen] = useState(false);
  const [jsOpen, setJsOpen] = useState(false);

  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [userWebsites, setUserWebsites] = useState<Website[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

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

  const handleValidate = async () => {
    if (!html.trim()) {
      toast({
        title: "Validation Error",
        description: "HTML content is required",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateWebsiteCode(html, css, js);
      setValidationErrors(result.errors);
      setValidationWarnings(result.warnings);
      
      if (result.valid) {
        toast({
          title: "✅ Validation Passed",
          description: result.warnings.length > 0 
            ? `All checks passed with ${result.warnings.length} warning(s)`
            : "All checks passed!",
        });
      } else {
        toast({
          title: "❌ Validation Failed",
          description: `Found ${result.errors.length} error(s)`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Failed to validate code",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handlePreview = () => {
    if (!html.trim()) {
      toast({
        title: "Preview Error",
        description: "HTML content is required",
        variant: "destructive"
      });
      return;
    }

    let fullHtml = html;
    
    if (css) {
      fullHtml = fullHtml.includes('</head>')
        ? fullHtml.replace('</head>', `<style>${css}</style></head>`)
        : `<style>${css}</style>${fullHtml}`;
    }
    
    if (js) {
      fullHtml = fullHtml.includes('</body>')
        ? fullHtml.replace('</body>', `<script>${js}</script></body>`)
        : `${fullHtml}<script>${js}</script>`;
    }

    if (!fullHtml.includes('<!DOCTYPE')) {
      fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Preview'}</title>
</head>
<body>
${fullHtml}
</body>
</html>`;
    }

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePublish = async () => {
    if (!html.trim() || !slug.trim() || !title.trim()) {
      toast({
        title: "Publish Error",
        description: "HTML, title, and slug are required",
        variant: "destructive"
      });
      return;
    }

    if (slugStatus !== "available") {
      toast({
        title: "Publish Error",
        description: "Please choose an available slug",
        variant: "destructive"
      });
      return;
    }

    if (userWebsites.length >= 3) {
      toast({
        title: "Limit Reached",
        description: "You have reached the maximum of 3 websites. Delete one to create a new website.",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);
    try {
      const result = await publishWebsite({
        anonymousUserId,
        slug,
        title,
        html,
        css,
        js
      });

      if (result.success) {
        toast({
          title: "🎉 Website Published!",
          description: `Your website is live at /web/${slug}`,
        });
        
        // Reset form
        setHtml("");
        setCss("");
        setJs("");
        setTitle("");
        setSlug("");
        setValidationErrors([]);
        setValidationWarnings([]);
        
        // Reload websites
        await loadUserWebsites();
      }
    } catch (error: any) {
      toast({
        title: "Publish Error",
        description: error.message || "Failed to publish website",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (websiteId: string) => {
    if (!confirm("Are you sure you want to delete this website?")) return;

    try {
      await deleteWebsite(anonymousUserId, websiteId);
      toast({
        title: "Website Deleted",
        description: "Your website has been deleted successfully",
      });
      await loadUserWebsites();
    } catch (error) {
      toast({
        title: "Delete Error",
        description: "Failed to delete website",
        variant: "destructive"
      });
    }
  };

  const getSlugBadge = () => {
    switch (slugStatus) {
      case "available":
        return <span className="text-green-500 text-sm ml-2">✅ Available</span>;
      case "taken":
        return <span className="text-red-500 text-sm ml-2">❌ Taken</span>;
      case "invalid":
        return <span className="text-yellow-500 text-sm ml-2">⚠️ Invalid</span>;
      case "checking":
        return <span className="text-muted-foreground text-sm ml-2">🔄 Checking...</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">🌐 Website Generator</h1>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Your Website ({userWebsites.length}/3 created)</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Website Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Website"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Website URL</label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">farabi.me/web/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-website"
                  className="flex-1"
                  maxLength={50}
                />
                {getSlugBadge()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Only lowercase letters, numbers, and hyphens (3-50 characters)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Collapsible open={htmlOpen} onOpenChange={setHtmlOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted/50 rounded hover:bg-muted">
                {htmlOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium">index.html [REQUIRED]</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<!DOCTYPE html>&#10;<html>&#10;<head>&#10;  <title>My Website</title>&#10;</head>&#10;<body>&#10;  <h1>Hello World!</h1>&#10;</body>&#10;</html>"
                  className="font-mono text-sm min-h-[300px]"
                />
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={cssOpen} onOpenChange={setCssOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted/50 rounded hover:bg-muted">
                {cssOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium">styles.css [Optional]</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Textarea
                  value={css}
                  onChange={(e) => setCss(e.target.value)}
                  placeholder="body {&#10;  font-family: Arial, sans-serif;&#10;  margin: 0;&#10;  padding: 20px;&#10;}"
                  className="font-mono text-sm min-h-[200px]"
                />
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={jsOpen} onOpenChange={setJsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted/50 rounded hover:bg-muted">
                {jsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium">script.js [Optional]</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Textarea
                  value={js}
                  onChange={(e) => setJs(e.target.value)}
                  placeholder="console.log('Hello from my website!');&#10;&#10;document.addEventListener('DOMContentLoaded', () => {&#10;  // Your code here&#10;});"
                  className="font-mono text-sm min-h-[200px]"
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={handlePreview} variant="outline" disabled={!html.trim()}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleValidate} variant="outline" disabled={!html.trim() || isValidating}>
              {isValidating ? "Validating..." : "Validate Code"}
            </Button>
            <Button 
              onClick={handlePublish} 
              disabled={!html.trim() || !title.trim() || slugStatus !== "available" || isPublishing || userWebsites.length >= 3}
            >
              <Send className="h-4 w-4 mr-2" />
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>

          {(validationErrors.length > 0 || validationWarnings.length > 0) && (
            <div className="mt-4 p-4 bg-muted rounded">
              <h3 className="font-medium mb-2">📝 Validation Results:</h3>
              {validationErrors.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm text-red-500 font-medium">Errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-500">
                    {validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                  </ul>
                </div>
              )}
              {validationWarnings.length > 0 && (
                <div>
                  <p className="text-sm text-yellow-500 font-medium">Warnings:</p>
                  <ul className="list-disc list-inside text-sm text-yellow-500">
                    {validationWarnings.map((warn, idx) => <li key={idx}>{warn}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>

        {userWebsites.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">My Published Websites</h2>
            <div className="space-y-2">
              {userWebsites.map((website, idx) => (
                <div key={website.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div className="flex-1">
                    <span className="font-medium">{idx + 1}. {website.title}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({website.slug})
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      👁 {website.views_count} views
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/web/${website.slug}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(website.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
