import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, BookOpen, ArrowLeft, Download, RotateCcw, Sparkles, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import PremiumBackground from '@/components/PremiumBackground';

const useComicPageSEO = () => {
  useEffect(() => {
    document.title = "AI Comic Generator - Farabi | Create Comics with AI";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Generate AI-powered comics from any story idea. AI plans panels and creates stunning illustrations using Imagen 4.');
  }, []);
};

interface ComicPanel {
  id: number;
  prompt: string;
  caption: string;
  imageUrl: string | null;
  status: 'waiting' | 'generating' | 'done' | 'error';
  errorMsg?: string;
}

type Phase = 'idle' | 'planning' | 'generating' | 'complete';

const EXAMPLE_STORIES = [
  "A bank robbery gone wrong where the robbers accidentally rob a bakery instead",
  "A cat secretly runs a spy agency from a suburban house",
  "An astronaut discovers a pizza restaurant on Mars",
  "A time traveler keeps accidentally creating paradoxes",
  "A superhero whose only power is making perfect toast"
];

const ComicGen = () => {
  useComicPageSEO();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [storyInput, setStoryInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [comicTitle, setComicTitle] = useState('');
  const [panels, setPanels] = useState<ComicPanel[]>([]);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [planningStatus, setPlanningStatus] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  const totalPanels = panels.length;
  const donePanels = panels.filter(p => p.status === 'done').length;
  const errorPanels = panels.filter(p => p.status === 'error').length;
  const overallProgress = totalPanels > 0 ? (donePanels / totalPanels) * 100 : 0;

  // Auto-scroll to latest generating panel
  useEffect(() => {
    if (phase === 'generating' && gridRef.current) {
      const generatingEl = gridRef.current.querySelector('[data-generating="true"]');
      if (generatingEl) {
        generatingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentPanelIndex, phase]);

  const planComic = async (story: string): Promise<{ title: string; panels: { id: number; prompt: string; caption: string }[] }> => {
    setPlanningStatus('AI is analyzing your story and planning panels...');

    const planPrompt = `You are a comic book story planner. The user wants a comic about: "${story}"

Your job:
1. Decide how many panels this story needs (minimum 15, maximum 50). Use good judgment based on complexity.
2. For EACH panel, write a detailed image generation prompt AND a short caption.

CRITICAL RULES FOR PROMPTS:
- Every prompt MUST be completely self-contained (the image generator has NO memory between panels)
- Every prompt MUST start with: "Comic book style illustration, bold outlines, vibrant colors, dynamic composition."
- Every prompt MUST include full character descriptions every time (appearance, clothing, distinguishing features)
- Every prompt MUST describe the setting/location from scratch
- Every prompt MUST include the story context (what happened before, what's happening now)
- Keep character appearances EXACTLY consistent across all prompts (same hair color, clothing, features)
- Make prompts vivid and detailed (lighting, mood, camera angle, expressions)

CAPTION RULES:
- Captions should be 1-3 sentences long (20-40 words). They tell the story.
- Include dialogue in quotes, narrator text, inner thoughts, or action descriptions.
- Each caption should advance the plot meaningfully so the reader understands the story even without images.
- Use dramatic, engaging comic-book narration style.

Return ONLY valid JSON (no markdown, no backticks, no extra text):
{
  "title": "Comic Title Here",
  "panelCount": 20,
  "panels": [
    {
      "id": 1,
      "prompt": "Comic book style illustration, bold outlines, vibrant colors, dynamic composition. A dimly lit office at night with...",
      "caption": "The plan begins..."
    }
  ]
}`;

    const { data, error } = await supabase.functions.invoke('pollinations-chat', {
      body: {
        prompt: planPrompt,
        model: 'gemini-search',
        seed: Math.floor(Math.random() * 1000000),
        image: null,
        useFallback: false,
        temperature: 0.7,
        max_tokens: 16000
      }
    });

    if (error) throw new Error('Planning failed: ' + error.message);

    let text = data?.text?.trim();
    if (!text) throw new Error('Empty planning response');

    console.log('[ComicGen] Raw planning response length:', text.length);

    // Robust JSON extraction: strip markdown fences completely
    text = text.replace(/```json\s*\n?/gi, '').replace(/```\s*\n?/g, '');
    text = text.trim();

    // Extract the JSON object between first { and last }
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      console.error('[ComicGen] No valid JSON found in:', text.substring(0, 200));
      throw new Error('No valid JSON in planning response');
    }
    text = text.substring(startIdx, endIdx + 1);

    // Fix common JSON issues: remove trailing commas before } or ]
    text = text.replace(/,\s*([}\]])/g, '$1');

    let plan;
    try {
      plan = JSON.parse(text);
    } catch (parseErr) {
      console.error('[ComicGen] JSON parse error:', parseErr, 'Text preview:', text.substring(0, 300));
      throw new Error('Failed to parse comic plan. Please try again.');
    }

    if (!plan.panels || !Array.isArray(plan.panels) || plan.panels.length < 5) {
      throw new Error('Invalid plan: not enough panels');
    }

    console.log('[ComicGen] Successfully parsed plan with', plan.panels.length, 'panels');

    return plan;
  };

  const generatePanelImage = async (prompt: string, panelId: number): Promise<string> => {
    console.log(`[ComicGen] Generating panel ${panelId}...`);
    
    const { data, error } = await supabase.functions.invoke('image-gen-multi', {
      body: {
        prompt,
        model: 'zimage',
        seed: Math.floor(Math.random() * 1000000),
        width: 1024,
        height: 1024
      }
    });

    if (error) {
      console.error(`[ComicGen] Panel ${panelId} edge function error:`, error);
      throw new Error(`Panel ${panelId}: ${error.message || 'Edge function error'}`);
    }
    
    if (!data?.success || !data?.imageUrl) {
      console.error(`[ComicGen] Panel ${panelId} API error:`, data?.error);
      throw new Error(data?.error || `Panel ${panelId}: No image returned`);
    }

    console.log(`[ComicGen] Panel ${panelId} generated successfully`);
    return data.imageUrl;
  };

  const startGeneration = async () => {
    if (!storyInput.trim()) {
      toast({ title: "Story required", description: "Please describe your comic story", variant: "destructive" });
      return;
    }

    abortRef.current = false;
    setPhase('planning');
    setPanels([]);
    setComicTitle('');
    setCurrentPanelIndex(0);

    try {
      // Step 1: Plan
      const plan = await planComic(storyInput);
      setComicTitle(plan.title || 'Untitled Comic');

      const initialPanels: ComicPanel[] = plan.panels.map(p => ({
        id: p.id,
        prompt: p.prompt,
        caption: p.caption,
        imageUrl: null,
        status: 'waiting' as const
      }));
      setPanels(initialPanels);

      toast({ title: `${initialPanels.length} panels planned!`, description: `"${plan.title}" — generating images...` });

      // Step 2: Generate images one by one
      setPhase('generating');

      for (let i = 0; i < initialPanels.length; i++) {
        if (abortRef.current) break;

        setCurrentPanelIndex(i);

        // Mark current as generating
        setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'generating' } : p));

        try {
          const imageUrl = await generatePanelImage(initialPanels[i].prompt, initialPanels[i].id);
          setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'done', imageUrl } : p));
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error';
          setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error', errorMsg: errMsg } : p));
          console.error(`Panel ${i + 1} error:`, err);
        }

        // Small delay to avoid rate limits
        if (i < initialPanels.length - 1 && !abortRef.current) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      setPhase('complete');
      toast({ title: "Comic complete! 🎉", description: `Generated ${initialPanels.length} panels` });

    } catch (err) {
      console.error('Comic generation error:', err);
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : 'Unknown error', variant: "destructive" });
      setPhase('idle');
    }
  };

  const handleStop = () => {
    abortRef.current = true;
    setPhase('complete');
    toast({ title: "Stopped", description: "Generation stopped. Completed panels are preserved." });
  };

  const handleReset = () => {
    abortRef.current = true;
    setPhase('idle');
    setPanels([]);
    setComicTitle('');
    setStoryInput('');
    setCurrentPanelIndex(0);
  };

  const retryPanel = async (index: number) => {
    setPanels(prev => prev.map((p, i) => i === index ? { ...p, status: 'generating', errorMsg: undefined } : p));
    try {
      const imageUrl = await generatePanelImage(panels[index].prompt, panels[index].id);
      setPanels(prev => prev.map((p, i) => i === index ? { ...p, status: 'done', imageUrl } : p));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setPanels(prev => prev.map((p, i) => i === index ? { ...p, status: 'error', errorMsg: errMsg } : p));
    }
  };

  // Idle: Story Input
  if (phase === 'idle') {
    return (
      <div className="min-h-screen flex flex-col">
        <PremiumBackground />
        <Header showTemporaryToggle={false} />
        <main className="flex-1 container max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 animate-fade-in">
          <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)]">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between mb-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-base">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
              </div>
              <CardTitle className="flex items-center gap-3 text-3xl md:text-4xl">
                <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                AI Comic Generator
              </CardTitle>
              <p className="text-base md:text-lg text-muted-foreground mt-3">
                Describe a story and AI will create a full comic with 15-50 panels using Imagen 4
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-lg font-medium">Your Story Idea</label>
                <Textarea
                  placeholder="Describe your comic story... (e.g., A bank robbery gone wrong where the robbers accidentally rob a bakery instead)"
                  value={storyInput}
                  onChange={(e) => setStoryInput(e.target.value.slice(0, 500))}
                  maxLength={500}
                  className="min-h-[120px] text-base p-4"
                />
                <p className="text-sm text-muted-foreground text-right">{storyInput.length}/500</p>
              </div>

              {/* Example stories */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Try an example:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_STORIES.map((story, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1.5 px-3 whitespace-normal text-left"
                      onClick={() => setStoryInput(story)}
                    >
                      {story.length > 50 ? story.slice(0, 50) + '...' : story}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={startGeneration}
                disabled={!storyInput.trim()}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all h-14 text-lg"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Comic
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Planning phase
  if (phase === 'planning') {
    return (
      <div className="min-h-screen flex flex-col">
        <PremiumBackground />
        <Header showTemporaryToggle={false} />
        <main className="flex-1 container max-w-2xl mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="bg-card/60 backdrop-blur-xl border-border/50 w-full">
            <CardContent className="py-12 text-center space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Planning Your Comic</h2>
                <p className="text-muted-foreground">{planningStatus}</p>
                <p className="text-sm text-muted-foreground mt-2">AI is deciding panel count, writing prompts, and designing scenes...</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Generating / Complete phase
  return (
    <div className="min-h-screen flex flex-col">
      <PremiumBackground />
      <Header showTemporaryToggle={false} />
      <main className="flex-1 container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold truncate">{comicTitle}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> {donePanels}
              </span>
              {errorPanels > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-destructive" /> {errorPanels}
                </span>
              )}
              <span>{donePanels + errorPanels}/{totalPanels} panels</span>
            </div>
          </div>
          <div className="flex gap-2">
            {phase === 'generating' && (
              <Button variant="destructive" size="sm" onClick={handleStop}>
                Stop
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-1 h-4 w-4" /> New Comic
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <Progress value={overallProgress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {phase === 'generating' ? `Generating panel ${currentPanelIndex + 1} of ${totalPanels}...` : 'Generation complete!'}
          </p>
        </div>

        {/* Comic grid */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {panels.map((panel, index) => (
            <div
              key={panel.id}
              data-generating={panel.status === 'generating' ? 'true' : 'false'}
              className={`rounded-xl overflow-hidden border transition-all duration-300 ${
                panel.status === 'done' ? 'border-border/50 bg-card/40' :
                panel.status === 'generating' ? 'border-primary/50 bg-card/60 shadow-[0_0_20px_rgba(236,72,153,0.2)]' :
                panel.status === 'error' ? 'border-destructive/50 bg-card/40' :
                'border-border/20 bg-card/20 opacity-50'
              }`}
            >
              {/* Panel number badge */}
              <div className="relative">
                <div className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-xs font-bold">
                  #{panel.id}
                </div>

                {/* Image area */}
                <div className="aspect-square relative">
                  {panel.status === 'done' && panel.imageUrl && (
                    <img
                      src={panel.imageUrl}
                      alt={panel.caption}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {panel.status === 'generating' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Generating...</p>
                    </div>
                  )}
                  {panel.status === 'waiting' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/10 gap-2">
                      <Clock className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground/50">Waiting</p>
                    </div>
                  )}
                  {panel.status === 'error' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-destructive/5 gap-3 p-4">
                      <XCircle className="h-10 w-10 text-destructive" />
                      <p className="text-xs text-destructive text-center">{panel.errorMsg || 'Failed'}</p>
                      <Button size="sm" variant="outline" onClick={() => retryPanel(index)}>
                        <RotateCcw className="mr-1 h-3 w-3" /> Retry
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Caption */}
              <div className="p-3">
                <p className="text-sm font-medium leading-snug">{panel.caption}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Complete actions */}
        {phase === 'complete' && donePanels > 0 && (
          <div className="flex justify-center gap-3 mt-8 mb-12">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Create Another
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ComicGen;
