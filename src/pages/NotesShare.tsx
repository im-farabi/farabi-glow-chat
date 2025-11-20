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
import { Eye, Send, Loader2, Copy, Check, FileText, Smartphone, Monitor, Apple, HelpCircle, ExternalLink, ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PremiumBackground from '@/components/PremiumBackground';
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
  return <div className="min-h-screen bg-black py-12 px-4 relative">
      <PremiumBackground />
      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Chat</span>
        </Link>

        {/* Hero Section */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
            NOTEZ.FUN    
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">Share yo    </p>
          
        </div>

        {/* Form & Preview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {/* Form Section */}
          <Card className="bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-2xl border-2 border-pink-500/40 shadow-[0_8px_32px_rgba(236,72,153,0.25),0_0_60px_rgba(168,85,247,0.15)] hover:shadow-[0_12px_48px_rgba(236,72,153,0.35),0_0_80px_rgba(168,85,247,0.25)] hover:border-pink-500/60 transition-all duration-500 p-8 space-y-6">
            <div>
              <Label htmlFor="title" className="text-sm font-semibold text-foreground">Title *</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Enter note title" 
                maxLength={limits.title.max} 
                className="mt-2 bg-background/50 border-border/50 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {title.length}/{limits.title.max} characters
              </p>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-semibold text-foreground">Description *</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Enter your note content" 
                maxLength={limits.description.max} 
                rows={8} 
                className="mt-2 bg-background/50 border-border/50 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/{limits.description.max} characters
              </p>
            </div>

            <Accordion type="single" collapsible className="border-2 border-pink-500/30 rounded-xl bg-gradient-to-br from-background/40 to-background/20 backdrop-blur-md shadow-[0_4px_16px_rgba(236,72,153,0.1)]">
              <AccordionItem value="advanced" className="border-none">
                <AccordionTrigger className="px-4 hover:text-pink-400 transition-colors group">
                  <span className="font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent group-hover:from-pink-300 group-hover:to-purple-300">Advanced Settings</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  {/* Short Description */}
                  <div>
                    <Label htmlFor="shortDesc" className="text-sm font-semibold text-foreground">Short Description</Label>
                    <Input 
                      id="shortDesc" 
                      value={shortDescription} 
                      onChange={e => setShortDescription(e.target.value)} 
                      placeholder="Brief summary (optional)" 
                      maxLength={limits.shortDescription.max} 
                      className="mt-2 bg-background/50 border-border/50 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {shortDescription.length}/{limits.shortDescription.max} characters
                    </p>
                  </div>


                  {/* Color Theme */}
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Color Theme</Label>
                    <RadioGroup value={colorTheme} onValueChange={(value: any) => setColorTheme(value)} className="mt-3 space-y-3">
                      <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${colorTheme === 'black-purple' ? 'border-purple-500/50 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'border-border/30 hover:border-purple-500/30'}`}>
                        <RadioGroupItem value="black-purple" id="theme-purple" />
                        <Label htmlFor="theme-purple" className="flex items-center gap-3 cursor-pointer flex-1">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-950 to-black border-2 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
                          <span className="font-medium">Black & Purple</span>
                        </Label>
                      </div>
                      <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${colorTheme === 'black-white' ? 'border-gray-500/50 bg-gray-500/10 shadow-[0_0_20px_rgba(156,163,175,0.2)]' : 'border-border/30 hover:border-gray-500/30'}`}>
                        <RadioGroupItem value="black-white" id="theme-white" />
                        <Label htmlFor="theme-white" className="flex items-center gap-3 cursor-pointer flex-1">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-900 to-black border-2 border-gray-500/50 shadow-[0_0_10px_rgba(156,163,175,0.3)]" />
                          <span className="font-medium">Black & White</span>
                        </Label>
                      </div>
                      <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${colorTheme === 'black-orange' ? 'border-orange-500/50 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'border-border/30 hover:border-orange-500/30'}`}>
                        <RadioGroupItem value="black-orange" id="theme-orange" />
                        <Label htmlFor="theme-orange" className="flex items-center gap-3 cursor-pointer flex-1">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-950 to-black border-2 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]" />
                          <span className="font-medium">Black & Orange</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-3">
              {!isValid && <p className="text-sm text-muted-foreground bg-muted/30 backdrop-blur-sm border border-border/30 rounded-lg p-3">
                  Fill in title (min {limits.title.min} chars) and description (min {limits.description.min} chars) to enable buttons
                </p>}
              <div className="flex gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-pink-500/30 hover:border-pink-500/50 hover:bg-pink-500/10 hover:text-pink-400 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all" 
                      disabled={!isValid}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-pink-500/20">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">Preview</DialogTitle>
                      <DialogDescription>
                        Preview how your note will look when published
                      </DialogDescription>
                    </DialogHeader>
                    <div className="animate-scale-in">
                      <NotePreview title={title} shortDescription={shortDescription} description={description} colorTheme={colorTheme} />
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all animate-pulse" 
                      disabled={!isValid}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Publish
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card/95 backdrop-blur-xl border-pink-500/20">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">Publish Note</DialogTitle>
                      <DialogDescription>
                        Choose a unique URL slug to publish your note
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="slug" className="text-sm font-semibold text-foreground">URL Slug *</Label>
                        <Input 
                          id="slug" 
                          value={slug} 
                          onChange={e => setSlug(e.target.value.toLowerCase())} 
                          placeholder="my-awesome-note" 
                          maxLength={limits.slug.max} 
                          className="mt-2 bg-background/50 border-border/50 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all" 
                        />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your note will be available at: /notes/{slug || 'your-slug'}
                      </p>
                      {isCheckingSlug && <p className="text-xs text-blue-500 mt-1">Checking availability...</p>}
                      {isSlugAvailable === true && <p className="text-xs text-green-500 mt-1">✓ This slug is available</p>}
                      {isSlugAvailable === false && <p className="text-xs text-red-500 mt-1">✗ This slug is already taken</p>}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handlePublish} 
                      disabled={isPublishing || !isSlugAvailable}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all"
                    >
                      {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Publish Note
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {!isValid}
          </div>

            {publishedUrl && <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-xl border-pink-500/30 shadow-[0_8px_32px_rgba(236,72,153,0.2)] p-6 space-y-4 animate-scale-in">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <Label className="text-lg font-bold text-foreground">Published Successfully! 🎉</Label>
                </div>
                
                {/* Primary URL */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Primary URL:</p>
                  <div className="flex gap-2">
                    <Input 
                      value={publishedUrl} 
                      readOnly 
                      className="flex-1 bg-background/50 border-border/50 font-mono text-sm" 
                    />
                    <Button 
                      onClick={copyToClipboard} 
                      size="icon" 
                      variant="outline"
                      className="border-pink-500/30 hover:border-pink-500/50 hover:bg-pink-500/10 hover:shadow-[0_0_10px_rgba(236,72,153,0.3)] transition-all"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Short URL */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Also available at (redirects to primary):
                  </p>
                  <div className="flex gap-2">
                    <Input 
                      value={`https://notez.fun/${publishedUrl.split('/notes/')[1]}`} 
                      readOnly 
                      className="flex-1 bg-background/50 border-border/50 font-mono text-sm" 
                    />
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(`https://notez.fun/${publishedUrl.split('/notes/')[1]}`);
                        toast({ title: 'Copied!', description: 'Short link copied to clipboard' });
                      }} 
                      size="icon" 
                      variant="outline"
                      className="border-pink-500/30 hover:border-pink-500/50 hover:bg-pink-500/10 hover:shadow-[0_0_10px_rgba(236,72,153,0.3)] transition-all"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>}
          </Card>

          {/* Live Preview Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Live Preview</h2>
            <div className="animate-fade-in">
              <NotePreview title={title} shortDescription={shortDescription} description={description} colorTheme={colorTheme} className="min-h-[400px] shadow-[0_8px_32px_rgba(236,72,153,0.15)] hover:shadow-[0_8px_40px_rgba(236,72,153,0.25)] transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Dashboard Section */}
      <div className="space-y-8 animate-fade-in" style={{
        animationDelay: '0.5s'
      }}>
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 mb-2">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Your Notes Dashboard
          </h2>
          <p className="text-lg text-muted-foreground">
            {dashboardData?.totalNotes > 0 ? `You've created ${dashboardData.totalNotes} note${dashboardData.totalNotes === 1 ? '' : 's'} (showing max 10)` : 'Create your first note to see it here!'}
          </p>
        </div>

        {dashboardLoading ? <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-pink-400" />
              <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-20 blur-xl"></div>
            </div>
            <p className="text-muted-foreground animate-pulse">Loading your notes...</p>
          </div> : dashboardData?.notes && dashboardData.notes.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboardData.notes.map((note: any, index: number) => <Card 
              key={note.id} 
              className="bg-card/60 backdrop-blur-xl border-pink-500/20 hover:border-pink-500/40 shadow-[0_8px_32px_rgba(236,72,153,0.15)] hover:shadow-[0_8px_48px_rgba(236,72,153,0.3)] transition-all duration-300 hover:scale-[1.02] group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
                <div className="p-6 space-y-4">
                  {/* Note Header */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-foreground truncate group-hover:text-pink-400 transition-colors">
                      {note.title}
                    </h3>
                    {note.short_description && <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {note.short_description}
                      </p>}
                  </div>

                  {/* Views & Link */}
                  <div className="flex items-center justify-between gap-4 py-4 border-y border-pink-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                        <Eye className="h-5 w-5 text-pink-400" />
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-foreground block">
                          {note.views_count?.toLocaleString() || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">total views</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild 
                      className="hover:text-pink-400 hover:bg-pink-500/10 border border-transparent hover:border-pink-500/30 transition-all"
                    >
                      <a href={`/notes/${note.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Note
                      </a>
                    </Button>
                  </div>

                  {/* Device Breakdown */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-pink-400" />
                      Device Breakdown
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {note.devices.mobile > 0 && <Badge className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)] px-3 py-1">
                          <Smartphone className="h-3 w-3 mr-1.5" />
                          Mobile: {note.devices.mobile}
                        </Badge>}
                      {note.devices.desktop > 0 && <Badge className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.2)] px-3 py-1">
                          <Monitor className="h-3 w-3 mr-1.5" />
                          Desktop: {note.devices.desktop}
                        </Badge>}
                      {note.devices.ios > 0 && <Badge className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)] px-3 py-1">
                          <Apple className="h-3 w-3 mr-1.5" />
                          iOS: {note.devices.ios}
                        </Badge>}
                      {note.devices.unknown > 0 && <Badge className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border-gray-500/40 px-3 py-1">
                          <HelpCircle className="h-3 w-3 mr-1.5" />
                          Unknown: {note.devices.unknown}
                        </Badge>}
                      {note.devices.mobile === 0 && note.devices.desktop === 0 && note.devices.ios === 0 && note.devices.unknown === 0 && 
                        <p className="text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-lg">No device data yet</p>
                      }
                    </div>
                  </div>

                  {/* Note Info */}
                  <div className="pt-3 flex items-center justify-between text-sm border-t border-pink-500/10">
                    <span className="truncate flex-1 font-mono text-muted-foreground">/{note.slug}</span>
                    <span className="text-muted-foreground">{new Date(note.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>)}
          </div> : <Card className="bg-card/50 backdrop-blur-xl border-pink-500/20 shadow-[0_8px_32px_rgba(236,72,153,0.15)] animate-fade-in">
            <div className="p-16 text-center space-y-6">
              <div className="inline-flex items-center justify-center p-6 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-sm border border-pink-500/30">
                <FileText className="h-16 w-16 text-pink-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground">No notes yet</h3>
                <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Create your first note above to see it appear here with view statistics and device breakdown!
                </p>
              </div>
            </div>
          </Card>}
      </div>
    </div>
  </div>;
}