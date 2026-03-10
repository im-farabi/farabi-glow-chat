import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, BookOpen, ArrowLeft, ArrowRight, RotateCcw, Sparkles, Shuffle, ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import PremiumBackground from '@/components/PremiumBackground';

import pixelImg from '@/assets/comic-style-pixel.png';
import colorlessImg from '@/assets/comic-style-colorless.png';
import modernImg from '@/assets/comic-style-modern.png';

const useComicPageSEO = () => {
  useEffect(() => {
    document.title = "AI Comic Generator - Farabi | Create Comics with AI";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Generate AI-powered comics from any story idea. Choose art style, genre, and watch your comic come to life!');
  }, []);
};

interface ComicPanel {
  id: number;
  prompt: string;
  dialogue: string;
  caption: string;
  imageUrl: string | null;
  status: 'waiting' | 'generating' | 'done' | 'error';
  errorMsg?: string;
}

type Phase = 'idle' | 'style' | 'genre' | 'planning' | 'generating' | 'complete';

const SURPRISE_IDEAS = [
  "A kid finds a magic backpack that takes him to a new world every time he opens it",
  "Two best friends accidentally swap bodies during a science experiment gone wrong",
  "A pizza delivery guy discovers that his last delivery is to a house full of aliens",
  "A detective cat solves a mystery about who stole all the cookies from the bakery",
  "A girl finds out her grandma is secretly a retired superhero",
  "A boy and his robot friend go on a treasure hunt in a sunken city",
  "A magician accidentally turns the whole school into a jungle",
  "A group of kids discover a secret door in their school that leads to another dimension",
  "Two rival chefs compete in a cooking contest where the ingredients come alive",
  "A shy kid discovers they can talk to animals and uncovers a big secret",
  "A time traveler accidentally brings a dinosaur to modern day school",
  "A young inventor builds a machine that makes dreams real but something goes wrong",
];

const ART_STYLES = [
  { id: 'pixel', label: 'Pixelated', image: pixelImg, prefix: 'Pixel art style, 8-bit retro game aesthetic, blocky pixels, nostalgic color palette, crisp edges.' },
  { id: 'colorless', label: 'Colorless', image: colorlessImg, prefix: 'Black and white ink illustration, manga style, detailed line work, dramatic shading, no color.' },
  { id: 'modern', label: 'Modern', image: modernImg, prefix: 'Modern comic book style, vibrant rich colors, bold outlines, dynamic composition, cinematic lighting.', recommended: true },
];

const GENRES = [
  { id: 'romantic', label: '💕 Romantic', desc: 'heartfelt love story' },
  { id: 'humor', label: '😂 Good Humor', desc: 'wholesome funny moments' },
  { id: 'funny', label: '🤣 Funny', desc: 'laugh-out-loud comedy' },
  { id: 'dark', label: '🌑 Dark', desc: 'dark mysterious tone' },
  { id: 'suspicious', label: '🕵️ Suspicious', desc: 'who can you trust?' },
  { id: 'heist', label: '💰 Heist', desc: 'clever plans and twists' },
  { id: 'unexpected', label: '😱 Unexpected', desc: 'shocking plot twists' },
  { id: 'adventure', label: '⚔️ Adventure', desc: 'exciting journey' },
  { id: 'scifi', label: '🚀 Sci-Fi', desc: 'futuristic world' },
  { id: 'horror', label: '👻 Horror', desc: 'spooky and scary' },
  { id: 'mystery', label: '🔍 Mystery', desc: 'solve the puzzle' },
  { id: 'action', label: '💥 Action', desc: 'non-stop excitement' },
];

const ComicGen = () => {
  useComicPageSEO();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [storyInput, setStoryInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [comicTitle, setComicTitle] = useState('');
  const [panels, setPanels] = useState<ComicPanel[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const abortRef = useState(false);

  const totalPanels = panels.length;
  const donePanels = panels.filter(p => p.status === 'done').length;
  const allDone = totalPanels > 0 && panels.every(p => p.status === 'done' || p.status === 'error');
  const overallProgress = totalPanels > 0 ? (donePanels / totalPanels) * 100 : 0;

  // Keyboard navigation
  useEffect(() => {
    if (phase !== 'generating' && phase !== 'complete') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentPage(p => Math.min(p + 1, totalPanels - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentPage(p => Math.max(p - 1, 0));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, totalPanels]);

  const handleSurprise = () => {
    const random = SURPRISE_IDEAS[Math.floor(Math.random() * SURPRISE_IDEAS.length)];
    setStoryInput(random);
  };

  const goToStyle = () => {
    if (!storyInput.trim()) {
      toast({ title: "Write a story first!", description: "Describe your comic idea or tap Surprise Me", variant: "destructive" });
      return;
    }
    setPhase('style');
  };

  const goToGenre = (styleId: string) => {
    setSelectedStyle(styleId);
    setPhase('genre');
  };

  const startGeneration = async (genreId: string) => {
    setSelectedGenre(genreId);
    setPhase('planning');
    setPanels([]);
    setComicTitle('');
    setCurrentPage(0);

    const style = ART_STYLES.find(s => s.id === selectedStyle)!;
    const genre = GENRES.find(g => g.id === genreId)!;

    try {
      const plan = await planComic(storyInput, style, genre);
      setComicTitle(plan.title || 'Untitled Comic');

      const initialPanels: ComicPanel[] = plan.panels.map((p: any) => ({
        id: p.id,
        prompt: p.prompt,
        dialogue: p.dialogue || '',
        caption: p.caption,
        imageUrl: null,
        status: 'waiting' as const
      }));
      setPanels(initialPanels);
      setPhase('generating');

      // Generate ALL panels in parallel
      const promises = initialPanels.map((panel, i) =>
        (async () => {
          setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'generating' } : p));
          try {
            const imageUrl = await generatePanelImage(panel.prompt, panel.id);
            setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'done', imageUrl } : p));
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error', errorMsg: errMsg } : p));
          }
        })()
      );

      await Promise.allSettled(promises);
      setPhase('complete');
      toast({ title: "Comic complete! 🎉", description: `${initialPanels.length} panels generated` });
    } catch (err) {
      console.error('Comic generation error:', err);
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : 'Unknown error', variant: "destructive" });
      setPhase('idle');
    }
  };

  const planComic = async (story: string, style: typeof ART_STYLES[0], genre: typeof GENRES[0]) => {
    const planPrompt = `You are a comic book story planner. The user wants a ${genre.desc} comic about: "${story}"

IMPORTANT RULES:
- Write like you are telling a story to a 10 year old kid. Use simple short words. Easy sentences. No big fancy words.
- The story genre is "${genre.label}" so make the story DEEPLY feel like that genre. If romantic, make it so sweet people cry. If unexpected, make jaw-dropping twists. If heist, build crazy tension. If funny, make it hilarious.

YOUR JOB:
1. Create a CHARACTER SHEET first. For EVERY character define:
   - Name
   - Hair color and style (e.g. "short spiky black hair")
   - Skin tone (e.g. "light brown skin")
   - Clothing (e.g. "red hoodie, blue jeans, white sneakers")
   - Height/build (e.g. "tall and thin")
   - One unique feature (e.g. "scar on left cheek" or "always wears green glasses")

2. Decide how many panels (minimum 15, maximum 50).

3. For EACH panel write:
   - "prompt": A detailed image prompt. MUST start with: "${style.prefix}" MUST include FULL character appearance description every time (copy from character sheet). MUST describe setting, action, expressions, camera angle. The image generator has NO memory between panels.
   - "dialogue": What characters say or yell (shown at TOP of image). Keep it short and punchy like "WHATS THAT?!" or "Oh no... he's here." or "I KNEW IT!" Use CAPS for shouting. 1-2 lines max.
   - "caption": Narrator text (shown BELOW image). Simple storytelling. 2-3 short sentences. Tell what happened and what the character feels. Like "Ariyan looked at the old map. His hands were shaking. Something was buried under the school."

RETURN ONLY VALID JSON (no markdown, no backticks):
{
  "title": "Comic Title",
  "panels": [
    {
      "id": 1,
      "prompt": "${style.prefix} ...",
      "dialogue": "WHAT IS THAT?!",
      "caption": "Ariyan saw something strange in the sky. He couldn't believe his eyes. It was getting closer."
    }
  ]
}`;

    const { data, error } = await supabase.functions.invoke('pollinations-chat', {
      body: {
        prompt: planPrompt,
        model: 'gemini-fast',
        seed: Math.floor(Math.random() * 1000000),
        image: null,
        useFallback: false,
        temperature: 0.8,
        max_tokens: 16000,
        fallbackModel: 'mistral'
      }
    });

    if (error) throw new Error('Planning failed: ' + error.message);

    let text = data?.text?.trim();
    if (!text) throw new Error('Empty planning response');

    text = text.replace(/```json\s*\n?/gi, '').replace(/```\s*\n?/g, '').trim();
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) throw new Error('No valid JSON in response');
    text = text.substring(startIdx, endIdx + 1);
    text = text.replace(/,\s*([}\]])/g, '$1');

    let plan;
    try {
      plan = JSON.parse(text);
    } catch {
      throw new Error('Failed to parse comic plan. Please try again.');
    }

    if (!plan.panels || !Array.isArray(plan.panels) || plan.panels.length < 5) throw new Error('Invalid plan');
    return plan;
  };

  const generatePanelImage = async (prompt: string, panelId: number): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('image-gen-multi', {
      body: { prompt, model: 'zimage', seed: Math.floor(Math.random() * 1000000), width: 1024, height: 1024 }
    });
    if (error) throw new Error(`Panel ${panelId}: ${error.message}`);
    if (!data?.success || !data?.imageUrl) throw new Error(data?.error || `Panel ${panelId}: No image`);
    return data.imageUrl;
  };

  const handleReset = () => {
    setPhase('idle');
    setPanels([]);
    setComicTitle('');
    setStoryInput('');
    setSelectedStyle('');
    setSelectedGenre('');
    setCurrentPage(0);
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

  const currentPanel = panels[currentPage];

  // ========== PHASE: IDLE — Story Input ==========
  if (phase === 'idle') {
    return (
      <div className="min-h-screen flex flex-col">
        <PremiumBackground />
        <Header showTemporaryToggle={false} />
        <main className="flex-1 container max-w-2xl mx-auto px-4 py-8 animate-fade-in">
          <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.15)]">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              </div>

              <div className="text-center space-y-2">
                <BookOpen className="h-10 w-10 text-primary mx-auto" />
                <h1 className="text-3xl font-bold">AI Comic Generator</h1>
                <p className="text-muted-foreground">Tell a story and watch it become a comic</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Story Idea</label>
                <Textarea
                  placeholder="Describe your comic story... what happens, who's in it, where does it take place?"
                  value={storyInput}
                  onChange={(e) => setStoryInput(e.target.value.slice(0, 500))}
                  maxLength={500}
                  className="min-h-[120px] text-base"
                />
                <p className="text-xs text-muted-foreground text-right">{storyInput.length}/500</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={goToStyle} disabled={!storyInput.trim()} className="w-full h-12 text-lg bg-gradient-to-r from-primary to-secondary" size="lg">
                  <Sparkles className="mr-2 h-5 w-5" /> Generate Comic
                </Button>
                <Button variant="outline" onClick={handleSurprise} className="w-full">
                  <Shuffle className="mr-2 h-4 w-4" /> Surprise Me
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ========== PHASE: STYLE — Art Style Selection ==========
  if (phase === 'style') {
    return (
      <div className="min-h-screen flex flex-col">
        <PremiumBackground />
        <Header showTemporaryToggle={false} />
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-8 animate-fade-in">
          <Card className="bg-card/60 backdrop-blur-xl border-border/50">
            <CardContent className="pt-6 space-y-6">
              <Button variant="ghost" size="sm" onClick={() => setPhase('idle')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">How should your comic look?</h2>
                <p className="text-muted-foreground">Pick an art style</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ART_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => goToGenre(style.id)}
                    className="group relative rounded-xl overflow-hidden border-2 border-border/50 hover:border-primary transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] focus:outline-none focus:border-primary"
                  >
                    <img src={style.image} alt={style.label} className="w-full aspect-[3/4] object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent p-4">
                      <p className="font-bold text-lg text-foreground">{style.label}</p>
                    </div>
                    {style.recommended && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Crown className="h-3 w-3" /> Recommended
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ========== PHASE: GENRE — Story Type Selection ==========
  if (phase === 'genre') {
    return (
      <div className="min-h-screen flex flex-col">
        <PremiumBackground />
        <Header showTemporaryToggle={false} />
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-8 animate-fade-in">
          <Card className="bg-card/60 backdrop-blur-xl border-border/50">
            <CardContent className="pt-6 space-y-6">
              <Button variant="ghost" size="sm" onClick={() => setPhase('style')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">What kind of story?</h2>
                <p className="text-muted-foreground">Pick a genre to shape your comic's vibe</p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {GENRES.map(genre => (
                  <Button
                    key={genre.id}
                    variant="outline"
                    className="h-auto py-3 px-5 text-base hover:bg-primary/10 hover:border-primary transition-all"
                    onClick={() => startGeneration(genre.id)}
                  >
                    {genre.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ========== PHASE: PLANNING ==========
  if (phase === 'planning') {
    return (
      <div className="min-h-screen flex flex-col">
        <PremiumBackground />
        <Header showTemporaryToggle={false} />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="bg-card/60 backdrop-blur-xl border-border/50 w-full max-w-md">
            <CardContent className="py-16 text-center space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <div>
                <h2 className="text-2xl font-bold">GENERATING STORY</h2>
                <p className="text-muted-foreground mt-2">AI is writing your comic script, creating characters, and planning every panel...</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ========== PHASE: GENERATING / COMPLETE — Book Reader ==========
  return (
    <div className="min-h-screen flex flex-col">
      <PremiumBackground />
      <Header showTemporaryToggle={false} />

      {/* GENERATING BANNER */}
      {!allDone && (
        <div className="bg-primary text-primary-foreground text-center py-3 px-4 font-bold text-sm animate-pulse">
          ✨ GENERATING COMICS — {donePanels}/{totalPanels} panels ready
          <Progress value={overallProgress} className="h-1.5 mt-2 max-w-md mx-auto bg-primary-foreground/20" />
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">{comicTitle}</h1>

        {/* Page indicator */}
        <p className="text-sm text-muted-foreground mb-4">
          Panel {currentPage + 1} of {totalPanels}
        </p>

        {/* Comic Page */}
        {currentPanel && (
          <div className="w-full max-w-lg space-y-0">
            {/* Dialogue — top */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 border-b-0 rounded-t-xl px-4 py-3 min-h-[48px] flex items-center justify-center">
              {currentPanel.status === 'done' || currentPanel.status === 'error' ? (
                <p className="text-center font-bold text-base md:text-lg uppercase tracking-wide">
                  {currentPanel.dialogue || '...'}
                </p>
              ) : (
                <p className="text-center text-muted-foreground text-sm italic blur-sm select-none">
                  {currentPanel.dialogue || 'Loading...'}
                </p>
              )}
            </div>

            {/* Image */}
            <div className="aspect-square relative bg-muted/20 border border-border/50">
              {currentPanel.status === 'done' && currentPanel.imageUrl && (
                <img src={currentPanel.imageUrl} alt={currentPanel.caption} className="w-full h-full object-cover" />
              )}
              {currentPanel.status === 'generating' && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Generating this panel...</p>
                </div>
              )}
              {currentPanel.status === 'waiting' && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 text-muted-foreground/40 animate-spin" />
                  <p className="text-xs text-muted-foreground/50">In queue...</p>
                </div>
              )}
              {currentPanel.status === 'error' && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                  <p className="text-destructive text-sm text-center">{currentPanel.errorMsg || 'Failed'}</p>
                  <Button size="sm" variant="outline" onClick={() => retryPanel(currentPage)}>
                    <RotateCcw className="mr-1 h-3 w-3" /> Retry
                  </Button>
                </div>
              )}
            </div>

            {/* Caption — bottom */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 border-t-0 rounded-b-xl px-4 py-3 min-h-[64px] flex items-center justify-center">
              {currentPanel.status === 'done' || currentPanel.status === 'error' ? (
                <p className="text-center text-sm md:text-base leading-relaxed text-muted-foreground">
                  {currentPanel.caption}
                </p>
              ) : (
                <p className="text-center text-sm text-muted-foreground italic blur-sm select-none">
                  {currentPanel.caption}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-4 mt-6">
          <Button
            variant="outline"
            size="lg"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(p => p - 1)}
            className="h-12 w-12 p-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            Use ← → keys
          </span>

          <Button
            variant="outline"
            size="lg"
            disabled={currentPage >= totalPanels - 1}
            onClick={() => setCurrentPage(p => p + 1)}
            className="h-12 w-12 p-0"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Actions */}
        {allDone && (
          <div className="mt-8">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Create Another Comic
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ComicGen;
