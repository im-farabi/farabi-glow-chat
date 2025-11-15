import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { NotePreview } from '@/components/NotePreview';
import { createNote, checkNoteSlug } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Eye, Send, Loader2, Copy, Check } from 'lucide-react';

export default function NotesShare() {
  const { toast } = useToast();
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

  // Character limits
  const limits = {
    title: { min: 3, max: 100 },
    shortDescription: { min: 10, max: 200 },
    description: { min: 20, max: 5000 },
    slug: { min: 3, max: 50 },
  };

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      const autoSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
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

  const handlePublish = async () => {
    // Validation
    if (title.length < limits.title.min || title.length > limits.title.max) {
      toast({ title: 'Error', description: `Title must be ${limits.title.min}-${limits.title.max} characters`, variant: 'destructive' });
      return;
    }

    if (description.length < limits.description.min || description.length > limits.description.max) {
      toast({ title: 'Error', description: `Description must be ${limits.description.min}-${limits.description.max} characters`, variant: 'destructive' });
      return;
    }

    if (shortDescription && (shortDescription.length < limits.shortDescription.min || shortDescription.length > limits.shortDescription.max)) {
      toast({ title: 'Error', description: `Short description must be ${limits.shortDescription.min}-${limits.shortDescription.max} characters`, variant: 'destructive' });
      return;
    }


    if (!slug || slug.length < limits.slug.min || slug.length > limits.slug.max || !/^[a-z0-9-]+$/.test(slug)) {
      toast({ title: 'Error', description: 'Please enter a valid slug (3-50 characters, lowercase, alphanumeric and hyphens)', variant: 'destructive' });
      return;
    }

    if (isSlugAvailable === false) {
      toast({ title: 'Error', description: 'This slug is already taken. Please choose another.', variant: 'destructive' });
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
        slug,
      });

      if (result.success) {
        const fullUrl = `${window.location.origin}${result.url}`;
        setPublishedUrl(fullUrl);
        toast({ title: 'Success!', description: 'Your note has been published.' });
        
        // Reset form
        setTitle('');
        setShortDescription('');
        setDescription('');
        setSlug('');
        setPublishDialogOpen(false);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to publish note', variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  };

  const isValid = title.length >= limits.title.min && description.length >= limits.description.min;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          Notes Share
        </h1>
        <p className="text-muted-foreground mb-8">Create and share beautiful notes with custom themes</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title"
                maxLength={limits.title.max}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {title.length}/{limits.title.max} characters
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter your note content"
                maxLength={limits.description.max}
                rows={8}
                className="mt-2"
              />
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
                    <Input
                      id="shortDesc"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="Brief summary (optional)"
                      maxLength={limits.shortDescription.max}
                      className="mt-2"
                    />
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
              {!isValid && (
                <p className="text-sm text-muted-foreground">
                  Fill in title (min {limits.title.min} chars) and description (min {limits.description.min} chars) to enable buttons
                </p>
              )}
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
                    <NotePreview
                      title={title}
                      shortDescription={shortDescription}
                      description={description}
                      colorTheme={colorTheme}
                    />
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
                        <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase())}
                        placeholder="my-awesome-note"
                        maxLength={limits.slug.max}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your note will be available at: /notes/{slug || 'your-slug'}
                      </p>
                      {isCheckingSlug && (
                        <p className="text-xs text-blue-500 mt-1">Checking availability...</p>
                      )}
                      {isSlugAvailable === true && (
                        <p className="text-xs text-green-500 mt-1">✓ This slug is available</p>
                      )}
                      {isSlugAvailable === false && (
                        <p className="text-xs text-red-500 mt-1">✗ This slug is already taken</p>
                      )}
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
            
            {!isValid && (
              <p className="text-xs text-muted-foreground">
                Fill in all required fields (Title: min 3 chars, Description: min 20 chars) to enable publishing
              </p>
            )}
          </div>

            {publishedUrl && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <Label className="text-sm font-semibold mb-2 block">Published Successfully! 🎉</Label>
                <div className="flex gap-2">
                  <Input value={publishedUrl} readOnly className="flex-1" />
                  <Button onClick={copyToClipboard} size="icon" variant="outline">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Live Preview</h2>
            <NotePreview
              title={title}
              shortDescription={shortDescription}
              description={description}
              colorTheme={colorTheme}
              className="min-h-[400px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}