import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { NotePreview } from '@/components/NotePreview';
import { createNote, checkNoteSlug, getNotesDashboard } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Eye, Send, Loader2, Copy, Check, FileText, Smartphone, Monitor, Apple, HelpCircle, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
export default function NotesShare() {
  const {
    toast
  } = useToast();
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [colorTheme, setColorTheme] = useState<'black-purple' | 'black-white' | 'black-orange'>('black-purple');
  const [slug, setSlug] = useState('');
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const anonymousUserId = localStorage.getItem('anonymousUserId') || '';

  // Dashboard state
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Character limits
  const limits = {
    title: {
      min: 3,
      max: 100
    },
    shortDescription: {
      min: 10,
      max: 200
    },
    description: {
      min: 20,
      max: 5000
    },
    slug: {
      min: 3,
      max: 50
    }
  };

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      const autoSlug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
      setSlug(autoSlug);
    }
  }, [title]);

  // Check slug availability
  useEffect(() => {
    const checkSlug = async () => {
      if (slug.length >= limits.slug.min && /^[a-z0-9-]+$/.test(slug)) {
        setIsCheckingSlug(true);
        try {
          const result = await checkNoteSlug(slug);
          setIsSlugAvailable(result.available);
        } catch (error) {
          console.error('Error checking slug:', error);
        } finally {
          setIsCheckingSlug(false);
        }
      } else {
        setIsSlugAvailable(null);
      }
    };
    const timer = setTimeout(checkSlug, 500);
    return () => clearTimeout(timer);
  }, [slug]);

  // Fetch dashboard on mount
  useEffect(() => {
    const fetchDashboard = async () => {
      if (!anonymousUserId) return;
      setDashboardLoading(true);
      try {
        const data = await getNotesDashboard(anonymousUserId);
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setDashboardLoading(false);
      }
    };
    fetchDashboard();
  }, [anonymousUserId]);
  const handlePublish = async () => {
    // Validation
    if (title.length < limits.title.min || title.length > limits.title.max) {
      toast({
        title: 'Error',
        description: `Title must be ${limits.title.min}-${limits.title.max} characters`,
        variant: 'destructive'
      });
      return;
    }
    if (description.length < limits.description.min || description.length > limits.description.max) {
      toast({
        title: 'Error',
        description: `Description must be ${limits.description.min}-${limits.description.max} characters`,
        variant: 'destructive'
      });
      return;
    }
    if (shortDescription && (shortDescription.length < limits.shortDescription.min || shortDescription.length > limits.shortDescription.max)) {
      toast({
        title: 'Error',
        description: `Short description must be ${limits.shortDescription.min}-${limits.shortDescription.max} characters`,
        variant: 'destructive'
      });
      return;
    }
    if (!slug || slug.length < limits.slug.min || slug.length > limits.slug.max || !/^[a-z0-9-]+$/.test(slug)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid slug (3-50 characters, lowercase, alphanumeric and hyphens)',
        variant: 'destructive'
      });
      return;
    }
    if (isSlugAvailable === false) {
      toast({
        title: 'Error',
        description: 'This slug is already taken. Please choose another.',
        variant: 'destructive'
      });
      return;
    }
    setIsPublishing(true);
    try {
      const result = await createNote({
        title,
        shortDescription: shortDescription || undefined,
        description,
        colorTheme,
        anonymousUserId,
        slug
      });
      if (result.success) {
        const fullUrl = `${window.location.origin}${result.url}`;
        setPublishedUrl(fullUrl);
        toast({
          title: 'Success!',
          description: 'Your note has been published.'
        });

        // Reset form
        setTitle('');
        setShortDescription('');
        setDescription('');
        setSlug('');
        setPublishDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish note',
        variant: 'destructive'
      });
    } finally {
      setIsPublishing(false);
    }
  };
  const copyToClipboard = () => {
    navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Link copied to clipboard'
    });
  };
  const isValid = title.length >= limits.title.min && description.length >= limits.description.min;
  return <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-black py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
            NOTEZ.FUN    
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">Share yo    </p>
          
        </div>

        {/* Form & Preview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter note title" maxLength={limits.title.max} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {title.length}/{limits.title.max} characters
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter your note content" maxLength={limits.description.max} rows={8} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/{limits.description.max} characters
              </p>
            </div>

            <Accordion type="single" collapsible className="border rounded-lg">
              <AccordionItem value="advanced">
                <AccordionTrigger className="px-4">Advanced Settings</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  {/* Short Description */}
                  <div>
                    <Label htmlFor="shortDesc">Short Description</Label>
                    <Input id="shortDesc" value={shortDescription} onChange={e => setShortDescription(e.target.value)} placeholder="Brief summary (optional)" maxLength={limits.shortDescription.max} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {shortDescription.length}/{limits.shortDescription.max} characters
                    </p>
                  </div>


                  {/* Color Theme */}
                  <div>
                    <Label>Color Theme</Label>
                    <RadioGroup value={colorTheme} onValueChange={(value: any) => setColorTheme(value)} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="black-purple" id="theme-purple" />
                        <Label htmlFor="theme-purple" className="flex items-center gap-2 cursor-pointer">
                          <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-950 to-black border border-purple-500/30" />
                          Black & Purple
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="black-white" id="theme-white" />
                        <Label htmlFor="theme-white" className="flex items-center gap-2 cursor-pointer">
                          <div className="w-6 h-6 rounded bg-gradient-to-br from-gray-900 to-black border border-gray-500/30" />
                          Black & White
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="black-orange" id="theme-orange" />
                        <Label htmlFor="theme-orange" className="flex items-center gap-2 cursor-pointer">
                          <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-950 to-black border border-orange-500/30" />
                          Black & Orange
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-2">
              {!isValid && <p className="text-sm text-muted-foreground">
                  Fill in title (min {limits.title.min} chars) and description (min {limits.description.min} chars) to enable buttons
                </p>}
              <div className="flex gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1" disabled={!isValid}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Preview</DialogTitle>
                      <DialogDescription>
                        Preview how your note will look when published
                      </DialogDescription>
                    </DialogHeader>
                    <NotePreview title={title} shortDescription={shortDescription} description={description} colorTheme={colorTheme} />
                  </DialogContent>
                </Dialog>

                <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1" disabled={!isValid}>
                      <Send className="mr-2 h-4 w-4" />
                      Publish
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Publish Note</DialogTitle>
                      <DialogDescription>
                        Choose a unique URL slug to publish your note
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="slug">URL Slug *</Label>
                        <Input id="slug" value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} placeholder="my-awesome-note" maxLength={limits.slug.max} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your note will be available at: /notes/{slug || 'your-slug'}
                      </p>
                      {isCheckingSlug && <p className="text-xs text-blue-500 mt-1">Checking availability...</p>}
                      {isSlugAvailable === true && <p className="text-xs text-green-500 mt-1">✓ This slug is available</p>}
                      {isSlugAvailable === false && <p className="text-xs text-red-500 mt-1">✗ This slug is already taken</p>}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handlePublish} disabled={isPublishing || !isSlugAvailable}>
                      {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Publish Note
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {!isValid}
          </div>

            {publishedUrl && <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                <Label className="text-sm font-semibold mb-2 block">Published Successfully! 🎉</Label>
                
                {/* Primary URL */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Primary URL:</p>
                  <div className="flex gap-2">
                    <Input value={publishedUrl} readOnly className="flex-1" />
                    <Button onClick={copyToClipboard} size="icon" variant="outline">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Short URL */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Also available at (redirects to primary):
                  </p>
                  <div className="flex gap-2">
                    <Input 
                      value={`https://notez.fun/${publishedUrl.split('/notes/')[1]}`} 
                      readOnly 
                      className="flex-1" 
                    />
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(`https://notez.fun/${publishedUrl.split('/notes/')[1]}`);
                        toast({ title: 'Copied!', description: 'Short link copied to clipboard' });
                      }} 
                      size="icon" 
                      variant="outline"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>}
          </div>

          {/* Live Preview Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Live Preview</h2>
            <NotePreview title={title} shortDescription={shortDescription} description={description} colorTheme={colorTheme} className="min-h-[400px]" />
          </div>
        </div>

        {/* Dashboard Section */}
      <div className="space-y-8 animate-fade-in" style={{
        animationDelay: '0.3s'
      }}>
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Your Notes Dashboard
          </h2>
          <p className="text-gray-400">
            {dashboardData?.totalNotes > 0 ? `You've created ${dashboardData.totalNotes} note${dashboardData.totalNotes === 1 ? '' : 's'} (showing max 10)` : 'Create your first note to see it here!'}
          </p>
        </div>

        {dashboardLoading ? <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div> : dashboardData?.notes && dashboardData.notes.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboardData.notes.map((note: any) => <Card key={note.id} className="glass-card border-purple-400/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-[1.02] bg-white/5 backdrop-blur-xl">
                <div className="p-6 space-y-4">
                  {/* Note Header */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground truncate">
                      {note.title}
                    </h3>
                    {note.short_description && <p className="text-sm text-muted-foreground line-clamp-2">
                        {note.short_description}
                      </p>}
                  </div>

                  {/* Views & Link */}
                  <div className="flex items-center justify-between gap-4 py-3 border-y border-border/20">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-purple-400" />
                      <span className="text-lg font-semibold text-foreground">
                        {note.views_count?.toLocaleString() || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">views</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="hover:text-purple-400">
                      <a href={`/notes/${note.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </Button>
                  </div>

                  {/* Device Breakdown */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Device Breakdown
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {note.devices.mobile > 0 && <Badge variant="secondary" className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30">
                          <Smartphone className="h-3 w-3 mr-1" />
                          Mobile: {note.devices.mobile}
                        </Badge>}
                      {note.devices.desktop > 0 && <Badge variant="secondary" className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30">
                          <Monitor className="h-3 w-3 mr-1" />
                          Desktop: {note.devices.desktop}
                        </Badge>}
                      {note.devices.ios > 0 && <Badge variant="secondary" className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/30">
                          <Apple className="h-3 w-3 mr-1" />
                          iOS: {note.devices.ios}
                        </Badge>}
                      {note.devices.unknown > 0 && <Badge variant="secondary" className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border-gray-500/30">
                          <HelpCircle className="h-3 w-3 mr-1" />
                          Unknown: {note.devices.unknown}
                        </Badge>}
                      {note.devices.mobile === 0 && note.devices.desktop === 0 && note.devices.ios === 0 && note.devices.unknown === 0 && <p className="text-xs text-muted-foreground">No device data yet</p>}
                    </div>
                  </div>

                  {/* Note Info */}
                  <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate flex-1">/{note.slug}</span>
                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>)}
          </div> : <Card className="glass-card border-purple-400/20 bg-white/5 backdrop-blur-xl">
            <div className="p-12 text-center space-y-4">
              <FileText className="h-16 w-16 mx-auto text-purple-400/50" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">No notes yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Create your first note above to see it appear here with view statistics and device breakdown!
                </p>
              </div>
            </div>
          </Card>}
      </div>
    </div>
  </div>;
}