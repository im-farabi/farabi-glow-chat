import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, BookOpen, ArrowLeft, ArrowRight, RotateCcw, Sparkles, Shuffle, ChevronLeft, ChevronRight, Crown, Star, Zap, Check } from 'lucide-react';
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
    document.title = "AI Story Generator - Farabi | Create Illustrated Stories with AI";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Generate AI-powered illustrated stories from any idea. Choose art style, genre, and watch your story come to life with dual-model image generation!');
  }, []);
};

interface PanelImage {
  url: string | null;
  model: string;
  status: 'waiting' | 'generating' | 'done' | 'error';
  error?: string;
}

interface ComicPanel {
  id: number;
  prompt: string;
  dialogue: string;
  caption: string;
  imageA: PanelImage;
  imageB: PanelImage;
  selectedImage: 'A' | 'B' | null;
}

type Phase = 'idle' | 'style' | 'genre' | 'duo-select' | 'planning' | 'generating' | 'complete';

interface DuoOption {
  id: string;
  label: string;
  modelA: string;
  modelB: string;
  labelA: string;
  labelB: string;
  desc: string;
  recommended?: boolean;
}

const DUOS: DuoOption[] = [
  { id: 'duo1', label: 'FLUX + IMAGEN', modelA: 'flux-2-dev', modelB: 'imagen-4', labelA: 'Flux', labelB: 'Imagen', desc: 'Best quality, great redundancy', recommended: true },
  { id: 'duo2', label: 'GROK + ZIMAGE', modelA: 'grok-imagine', modelB: 'zimage', labelA: 'Grok', labelB: 'ZImage', desc: 'Fast alternative pair' },
];

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
  "A street artist's graffiti comes alive at night and starts causing chaos in the city",
  "A kid wins a contest and the prize is spending a day as the president",
  "Two siblings find a map that leads to their missing parents in another world",
];

const ART_STYLES = [
  { id: 'pixel', label: 'Pixelated', image: pixelImg, prefix: 'Pixel art style, Minecraft-inspired blocky voxel aesthetic, 16-bit retro video game look, chunky square pixels, limited color palette like old games, pixelated characters and environments, nostalgic retro gaming feel.' },
  { id: 'colorless', label: 'Colorless', image: colorlessImg, prefix: 'Black and white pencil sketch, hand-drawn look, NO color at all, pure grayscale, rough pencil strokes, sketchy line art, like a notebook doodle or manga draft, crosshatching for shadows, zero saturation.' },
  { id: 'modern', label: 'Modern', image: modernImg, prefix: 'Ultra high quality digital comic art, professional comic book illustration, vibrant saturated colors, dramatic cinematic lighting with volumetric rays, bold clean outlines, detailed backgrounds, dynamic perspective and foreshortening, professional color grading, studio quality rendering, masterpiece comic panel.', recommended: true },
];

const GENRES = [
  { id: 'romantic', label: '💕 Romantic', desc: 'deeply heartfelt love story that makes you feel butterflies' },
  { id: 'humor', label: '😂 Good Humor', desc: 'wholesome and warm funny moments that make you smile' },
  { id: 'funny', label: '🤣 Funny', desc: 'laugh-out-loud hilarious comedy with unexpected gags' },
  { id: 'dark', label: '🌑 Dark', desc: 'dark mysterious tone with an eerie unsettling atmosphere' },
  { id: 'suspicious', label: '🕵️ Suspicious', desc: 'nobody can be trusted, betrayal lurks everywhere, paranoid tension' },
  { id: 'heist', label: '💰 Heist', desc: 'clever mastermind plans, double crosses, edge-of-seat tension' },
  { id: 'unexpected', label: '😱 Unexpected', desc: 'MASSIVE jaw-dropping plot twists that flip EVERYTHING upside down, nothing is what it seems, the reader should gasp out loud' },
  { id: 'adventure', label: '⚔️ Adventure', desc: 'exciting dangerous journey with epic moments' },
  { id: 'scifi', label: '🚀 Sci-Fi', desc: 'futuristic world with mind-bending technology' },
  { id: 'horror', label: '👻 Horror', desc: 'genuinely creepy and scary, builds dread slowly' },
  { id: 'mystery', label: '🔍 Mystery', desc: 'deep puzzle where clues slowly reveal a shocking truth' },
  { id: 'action', label: '💥 Action', desc: 'non-stop high energy fights and explosions' },
  { id: 'thriller', label: '🔥 Thriller', desc: 'intense suspense that keeps you on the edge, heart-pounding tension' },
  { id: 'fantasy', label: '🧙 Fantasy', desc: 'magical worlds with epic quests and mythical creatures' },
  { id: 'survival', label: '🏝️ Survival', desc: 'fight to stay alive against impossible odds' },
];

// ===== CHROME DINO GAME COMPONENT =====
const DinoGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<{
    dino: { y: number; vy: number; jumping: boolean; ducking: boolean; width: number; height: number };
    obstacles: { x: number; width: number; height: number; y: number }[];
    ground: number;
    speed: number;
    score: number;
    gameOver: boolean;
    frame: number;
    spawnTimer: number;
  }>({
    dino: { y: 0, vy: 0, jumping: false, ducking: false, width: 24, height: 30 },
    obstacles: [],
    ground: 0,
    speed: 4,
    score: 0,
    gameOver: false,
    frame: 0,
    spawnTimer: 0,
  });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const GROUND = H - 30;
    const g = gameRef.current;
    g.ground = GROUND;
    g.dino.y = GROUND - g.dino.height;
    g.obstacles = [];
    g.speed = 4;
    g.score = 0;
    g.gameOver = false;
    g.frame = 0;
    g.spawnTimer = 0;

    const jump = () => {
      if (g.gameOver) {
        g.dino.y = GROUND - g.dino.height;
        g.dino.vy = 0;
        g.dino.jumping = false;
        g.obstacles = [];
        g.speed = 4;
        g.score = 0;
        g.gameOver = false;
        g.spawnTimer = 0;
        return;
      }
      if (!g.dino.jumping) {
        g.dino.vy = -10;
        g.dino.jumping = true;
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      jump();
    };

    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('click', jump);

    const loop = () => {
      g.frame++;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = '#555';
      ctx.fillRect(0, GROUND, W, 2);

      if (!g.gameOver) {
        g.dino.vy += 0.6;
        g.dino.y += g.dino.vy;
        if (g.dino.y >= GROUND - g.dino.height) {
          g.dino.y = GROUND - g.dino.height;
          g.dino.vy = 0;
          g.dino.jumping = false;
        }

        g.spawnTimer++;
        if (g.spawnTimer > 60 + Math.random() * 40) {
          const h = 20 + Math.random() * 20;
          g.obstacles.push({ x: W, width: 14, height: h, y: GROUND - h });
          g.spawnTimer = 0;
        }

        for (const obs of g.obstacles) {
          obs.x -= g.speed;
        }
        g.obstacles = g.obstacles.filter(o => o.x > -20);

        const dx = 30;
        const dy = g.dino.y;
        const dw = g.dino.width;
        const dh = g.dino.height;
        for (const obs of g.obstacles) {
          if (dx + dw > obs.x + 2 && dx < obs.x + obs.width - 2 && dy + dh > obs.y + 2) {
            g.gameOver = true;
          }
        }

        g.score++;
        if (g.frame % 300 === 0) g.speed += 0.3;
      }

      ctx.fillStyle = '#ccc';
      const dy2 = g.dino.y;
      ctx.fillRect(30, dy2 + 6, 20, 18);
      ctx.fillRect(38, dy2, 16, 12);
      ctx.fillStyle = '#333';
      ctx.fillRect(48, dy2 + 3, 3, 3);
      ctx.fillStyle = '#ccc';
      if (!g.gameOver) {
        if (g.frame % 10 < 5) {
          ctx.fillRect(34, dy2 + 24, 4, 8);
          ctx.fillRect(44, dy2 + 24, 4, 8);
        } else {
          ctx.fillRect(36, dy2 + 24, 4, 8);
          ctx.fillRect(42, dy2 + 24, 4, 8);
        }
      } else {
        ctx.fillRect(34, dy2 + 24, 4, 8);
        ctx.fillRect(44, dy2 + 24, 4, 8);
      }
      ctx.fillRect(22, dy2 + 8, 10, 6);

      ctx.fillStyle = '#888';
      for (const obs of g.obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillRect(obs.x - 4, obs.y + 6, 5, 4);
        ctx.fillRect(obs.x + obs.width - 1, obs.y + 10, 5, 4);
      }

      ctx.fillStyle = '#aaa';
      ctx.font = '12px monospace';
      ctx.fillText(`Score: ${Math.floor(g.score / 5)}`, W - 90, 20);

      if (g.gameOver) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
        ctx.font = '11px monospace';
        ctx.fillText('Tap or Space to restart', W / 2, H / 2 + 10);
        ctx.textAlign = 'start';
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', handleKey);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('click', jump);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground">Play while you wait! Press Space or tap to jump</p>
      <canvas
        ref={canvasRef}
        width={360}
        height={120}
        className="rounded-lg border border-border/30 bg-background/50"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

const ComicGen = () => {
  useComicPageSEO();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [storyInput, setStoryInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedDuo, setSelectedDuo] = useState<DuoOption | null>(null);
  const [comicTitle, setComicTitle] = useState('');
  const [panels, setPanels] = useState<ComicPanel[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPanels = panels.length;
  const donePanels = panels.filter(p => p.imageA.status === 'done' || p.imageB.status === 'done').length;
  const allDone = totalPanels > 0 && panels.every(p =>
    (p.imageA.status === 'done' || p.imageA.status === 'error') &&
    (p.imageB.status === 'done' || p.imageB.status === 'error')
  );
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
      toast({ title: "Write a story first!", description: "Describe your story idea or tap Surprise Me", variant: "destructive" });
      return;
    }
    setPhase('style');
  };

  const goToGenre = (styleId: string) => {
    setSelectedStyle(styleId);
    setPhase('genre');
  };

  const goToDuoSelect = () => {
    if (selectedGenres.length === 0) {
      toast({ title: "Pick at least one genre!", variant: "destructive" });
      return;
    }
    setPhase('duo-select');
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(g => g !== genreId) : [...prev, genreId]
    );
  };

  const selectImage = (panelIndex: number, choice: 'A' | 'B') => {
    setPanels(prev => prev.map((p, i) => i === panelIndex ? { ...p, selectedImage: choice } : p));
  };

  const startGeneration = async (duo: DuoOption) => {
    setSelectedDuo(duo);
    setPhase('planning');
    setPanels([]);
    setComicTitle('');
    setCurrentPage(0);

    const style = ART_STYLES.find(s => s.id === selectedStyle)!;
    const genres = selectedGenres.map(id => GENRES.find(g => g.id === id)!);
    const genreLabels = genres.map(g => g.label).join(', ');
    const genreDescs = genres.map(g => g.desc).join('. ');

    try {
      const plan = await planStory(storyInput, style, genreLabels, genreDescs);
      setComicTitle(plan.title || 'Untitled Story');

      const initialPanels: ComicPanel[] = plan.panels.map((p: any) => ({
        id: p.id,
        prompt: p.prompt,
        dialogue: p.dialogue || '',
        caption: p.caption,
        imageA: { url: null, model: duo.modelA, status: 'waiting' as const },
        imageB: { url: null, model: duo.modelB, status: 'waiting' as const },
        selectedImage: null,
      }));
      setPanels(initialPanels);
      setPhase('generating');

      // Generate ALL panels — 2 images each, all in parallel
      const promises = initialPanels.flatMap((panel, i) => [
        // Image A
        (async () => {
          setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, imageA: { ...p.imageA, status: 'generating' } } : p));
          try {
            const result = await generatePanelImage(panel.prompt, duo.modelA);
            setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, imageA: { ...p.imageA, status: 'done', url: result.imageUrl } } : p));
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, imageA: { ...p.imageA, status: 'error', error: errMsg } } : p));
          }
        })(),
        // Image B
        (async () => {
          setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, imageB: { ...p.imageB, status: 'generating' } } : p));
          try {
            const result = await generatePanelImage(panel.prompt, duo.modelB);
            setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, imageB: { ...p.imageB, status: 'done', url: result.imageUrl } } : p));
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, imageB: { ...p.imageB, status: 'error', error: errMsg } } : p));
          }
        })(),
      ]);

      await Promise.allSettled(promises);
      setPhase('complete');
      toast({ title: "Story complete! 🎉", description: `${initialPanels.length} scenes generated with dual images` });
    } catch (err) {
      console.error('Story generation error:', err);
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : 'Unknown error', variant: "destructive" });
      setPhase('idle');
    }
  };

  const planStory = async (story: string, style: typeof ART_STYLES[0], genreLabels: string, genreDescs: string) => {
    const planPrompt = `You are a LEGENDARY illustrated story writer. You write stories with such vivid scenes that every illustration matches PERFECTLY.

The user wants a ${genreLabels} illustrated story about: "${story}"

CRITICAL — YOU ARE WRITING AN ILLUSTRATED STORY, NOT A COMIC. Each scene is a moment in the narrative. The image prompt must describe exactly what the reader would SEE in that moment as a photograph or painting.

=== SPATIAL LOGIC RULES (MANDATORY) ===
These are the #1 most important rules. Breaking them makes the story feel stupid and nonsensical:

1. POSITION CONSISTENCY: If a character is LYING DOWN, describe the scene FROM their perspective (looking up at things). If they're SITTING, the view is from sitting height. NEVER show a lying-down character standing in the image.

2. CAUSE AND EFFECT: If a CAT falls and gets hurt, the CAT shows pain — NOT the human. If a BOY trips, the BOY is on the ground — NOT someone else. The character who experiences something is the one who reacts.

3. LOCATION CONTINUITY: If someone is in a bedroom, they stay in the bedroom until you describe them moving somewhere else. Don't teleport characters between scenes without explanation.

4. PHYSICAL LOGIC: If someone is sleeping in bed and sees something, they SEE IT FROM BED — they don't magically appear next to it. If someone is running, their hair and clothes show motion.

5. INTERACTION ACCURACY: If character A is chasing character B, the image shows A running BEHIND B. If someone catches something, their hands are holding it. Every interaction must make spatial sense.

=== SCENE DESCRIPTION RULES ===
Each image prompt must be a COMPLETE SCENE DESCRIPTION like a movie screenshot:
- WHO is in the scene (full appearance from character sheet)
- WHERE they are (specific location details)
- WHAT POSITION each character is in (standing, sitting, lying, running, etc.)
- WHAT they are doing (specific actions)
- WHAT ANGLE we see this from (camera perspective)
- WHAT MOOD/LIGHTING the scene has

BAD prompt: "The boy and the cat in a room"
GOOD prompt: "${style.prefix} A boy with short spiky black hair, light brown skin, wearing a red hoodie and blue jeans, is crouching down on a wooden floor in a small dimly-lit bedroom, reaching his arms out toward a small orange tabby cat that is sitting on a windowsill looking back at him with wide curious eyes. Warm golden light from the window casts long shadows. Low angle shot from floor level."

=== STORY WRITING RULES ===
- Write like you're telling a story to a 10 year old. Simple words. Short punchy sentences.
- DO NOT give characters specific names. Use descriptions like "the boy", "the girl", "the old man", "the mysterious stranger".
- The genres are: ${genreLabels} (${genreDescs}). Make the story DEEPLY feel like these genres combined.

=== GEN Z STORYTELLING METHODS ===
1. KILLER HOOK: First 3-4 scenes must SLAP. Start with something shocking, funny, or mysterious.
2. KEEP IT CONCISE: Every scene must earn its place. No filler.
3. BOLD VISUALS: Describe dynamic angles — bird's eye, extreme close-ups, over-the-shoulder, worm's eye view.
4. RELATABLE CHARACTERS: Give them quirks and emotions readers feel.
5. CLIFFHANGER ENERGY: Every 4-8 scenes, drop a mini-bomb — a reveal, a joke, a twist.
6. MEMORABLE ENDING: End with a BANG.

=== FOR TENSION/MYSTERY/UNEXPECTED GENRES ===
- Build REAL dread. Foreshadow something terrible.
- Plant clues early that only make sense later.
- Use misdirection — make them think one thing, then flip it.
- Silence and empty spaces are scarier than monsters.

=== YOUR JOB ===
1. Create a CHARACTER SHEET. For EVERY character:
   - Reference name ("the boy", "the girl", "the stranger" — NOT real names)
   - Hair color and style
   - Skin tone
   - Clothing (MUST stay the same in EVERY scene)
   - Height/build
   - One unique visual feature

2. Create between 15 and 50 scenes. Use AT LEAST 25 for a good story. Go up to 40-50 for epic stories.

3. For EACH scene:
   - "prompt": Full illustrated scene description. MUST start with the art style prefix. MUST include FULL character appearance copied from character sheet. Must describe exact positions, actions, camera angle, lighting, and setting. Each prompt is self-contained — the AI has NO memory between images.
   - "dialogue": What characters SAY in this moment. 1-2 lines max. Use CAPS for shouting.
   - "caption": Narrator text. 2-3 simple short sentences telling what happened and what the character feels.

   IMPORTANT FOR PROMPT: Each scene prompt must include "Scene continuation:" followed by a brief note of what just happened, to maintain logical flow. Example: "Scene continuation: the boy just found a glowing door in the basement. ${style.prefix} A boy with..."

ART STYLE PREFIX (use at the start of every prompt after the scene continuation note):
"${style.prefix}"

RETURN ONLY VALID JSON:
{
  "title": "Story Title",
  "panels": [
    {
      "id": 1,
      "prompt": "Scene continuation: opening scene. ${style.prefix} [full scene description with character appearances, positions, camera angle, lighting]",
      "dialogue": "WHAT IS THAT?!",
      "caption": "He saw something in the sky. It was getting closer. He couldn't move."
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
        temperature: 0.85,
        max_tokens: 32000,
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
      throw new Error('Failed to parse story plan. Please try again.');
    }

    if (!plan.panels || !Array.isArray(plan.panels) || plan.panels.length < 5) throw new Error('Invalid plan');
    return plan;
  };

  const generatePanelImage = async (prompt: string, model: string): Promise<{ imageUrl: string; modelUsed: string }> => {
    const { data, error } = await supabase.functions.invoke('image-gen-multi', {
      body: { prompt, model, seed: Math.floor(Math.random() * 1000000), width: 1024, height: 1024 }
    });
    if (error) throw new Error(error.message);
    if (!data?.success || !data?.imageUrl) throw new Error(data?.error || 'No image');
    return { imageUrl: data.imageUrl, modelUsed: data.modelUsed };
  };

  const handleReset = () => {
    setPhase('idle');
    setPanels([]);
    setComicTitle('');
    setStoryInput('');
    setSelectedStyle('');
    setSelectedGenres([]);
    setSelectedDuo(null);
    setCurrentPage(0);
  };

  const retryPanelImage = async (panelIndex: number, side: 'A' | 'B') => {
    const panel = panels[panelIndex];
    const model = side === 'A' ? panel.imageA.model : panel.imageB.model;
    const key = side === 'A' ? 'imageA' : 'imageB';

    setPanels(prev => prev.map((p, i) => i === panelIndex ? { ...p, [key]: { ...p[key], status: 'generating', error: undefined } } : p));
    try {
      const result = await generatePanelImage(panel.prompt, model);
      setPanels(prev => prev.map((p, i) => i === panelIndex ? { ...p, [key]: { ...p[key], status: 'done', url: result.imageUrl } } : p));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setPanels(prev => prev.map((p, i) => i === panelIndex ? { ...p, [key]: { ...p[key], status: 'error', error: errMsg } } : p));
    }
  };

  const currentPanel = panels[currentPage];

  // Helper to get the display image for a panel (selected or first available)
  const getDisplayImage = (panel: ComicPanel): { url: string | null; label: string } => {
    if (panel.selectedImage === 'A' && panel.imageA.url) return { url: panel.imageA.url, label: panel.imageA.model };
    if (panel.selectedImage === 'B' && panel.imageB.url) return { url: panel.imageB.url, label: panel.imageB.model };
    if (panel.imageA.status === 'done' && panel.imageA.url) return { url: panel.imageA.url, label: panel.imageA.model };
    if (panel.imageB.status === 'done' && panel.imageB.url) return { url: panel.imageB.url, label: panel.imageB.model };
    return { url: null, label: '' };
  };

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
                <h1 className="text-3xl font-bold">AI Story Generator</h1>
                <p className="text-muted-foreground">Tell a story and watch it become an illustrated masterpiece</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Story Idea</label>
                <Textarea
                  placeholder="Describe your story... what happens, who's in it, where does it take place?"
                  value={storyInput}
                  onChange={(e) => setStoryInput(e.target.value.slice(0, 500))}
                  maxLength={500}
                  className="min-h-[120px] text-base"
                />
                <p className="text-xs text-muted-foreground text-right">{storyInput.length}/500</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={goToStyle} disabled={!storyInput.trim()} className="w-full h-12 text-lg bg-gradient-to-r from-primary to-secondary" size="lg">
                  <Sparkles className="mr-2 h-5 w-5" /> Generate Story
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
                <h2 className="text-2xl font-bold">How should your story look?</h2>
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

  // ========== PHASE: GENRE — Story Type Selection (MULTI-SELECT) ==========
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
                <p className="text-muted-foreground">Pick one or more genres to shape your story's vibe</p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {GENRES.map(genre => (
                  <Button
                    key={genre.id}
                    variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                    className={`h-auto py-3 px-5 text-base transition-all ${
                      selectedGenres.includes(genre.id)
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                        : 'hover:bg-primary/10 hover:border-primary'
                    }`}
                    onClick={() => toggleGenre(genre.id)}
                  >
                    {genre.label}
                  </Button>
                ))}
              </div>

              {selectedGenres.length > 0 && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <p className="text-sm text-muted-foreground">{selectedGenres.length} genre{selectedGenres.length > 1 ? 's' : ''} selected</p>
                  <Button
                    onClick={goToDuoSelect}
                    className="h-12 px-8 text-lg bg-gradient-to-r from-primary to-secondary"
                    size="lg"
                  >
                    <ArrowRight className="mr-2 h-5 w-5" /> Next: Choose Image Engine
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ========== PHASE: DUO SELECT — Choose Image Model Duo ==========
  if (phase === 'duo-select') {
    return (
      <div className="min-h-screen flex flex-col">
        <PremiumBackground />
        <Header showTemporaryToggle={false} />
        <main className="flex-1 container max-w-2xl mx-auto px-4 py-8 animate-fade-in">
          <Card className="bg-card/60 backdrop-blur-xl border-border/50">
            <CardContent className="pt-6 space-y-6">
              <Button variant="ghost" size="sm" onClick={() => setPhase('genre')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Choose Image Engine</h2>
                <p className="text-muted-foreground">Each scene generates 2 images — pick the one you like best</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DUOS.map(duo => (
                  <button
                    key={duo.id}
                    onClick={() => startGeneration(duo)}
                    className={`relative rounded-xl p-6 text-left border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      duo.recommended
                        ? 'border-primary/60 bg-primary/5 hover:border-primary hover:shadow-[0_0_25px_rgba(236,72,153,0.2)]'
                        : 'border-border/50 bg-card/40 hover:border-primary/40'
                    }`}
                  >
                    {duo.recommended && (
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3" /> Recommended
                      </div>
                    )}
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-foreground">{duo.label}</h3>
                      <p className="text-sm text-muted-foreground">{duo.desc}</p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-muted/50 px-2 py-1 rounded-full">{duo.labelA}</span>
                        <span className="text-xs text-muted-foreground">+</span>
                        <span className="text-xs bg-muted/50 px-2 py-1 rounded-full">{duo.labelB}</span>
                      </div>
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                          <Sparkles className="h-4 w-4" /> Generate Story
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ========== PHASE: PLANNING (with Dino Game) ==========
  if (phase === 'planning') {
    return (
      <div className="min-h-screen flex flex-col">
        <PremiumBackground />
        <Header showTemporaryToggle={false} />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="bg-card/60 backdrop-blur-xl border-border/50 w-full max-w-md">
            <CardContent className="py-10 text-center space-y-6">
              <Loader2 className="h-14 w-14 animate-spin text-primary mx-auto" />
              <div>
                <h2 className="text-2xl font-bold">WRITING YOUR STORY</h2>
                <p className="text-muted-foreground mt-2 text-sm">AI is crafting your narrative and creating characters...</p>
              </div>
              <div className="border-t border-border/30 pt-4">
                <DinoGame />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ========== PHASE: GENERATING / COMPLETE — Book Reader with Dual Images ==========
  const panelHasSelection = currentPanel?.selectedImage !== null;
  const bothImagesReady = currentPanel && (currentPanel.imageA.status === 'done' || currentPanel.imageA.status === 'error') && (currentPanel.imageB.status === 'done' || currentPanel.imageB.status === 'error');

  return (
    <div className="min-h-screen flex flex-col">
      <PremiumBackground />
      <Header showTemporaryToggle={false} />

      {/* GENERATING BANNER */}
      {!allDone && (
        <div className="bg-primary text-primary-foreground text-center py-3 px-4 font-bold text-sm animate-pulse">
          ✨ GENERATING STORY — {donePanels}/{totalPanels} scenes ready
          <Progress value={overallProgress} className="h-1.5 mt-2 max-w-md mx-auto bg-primary-foreground/20" />
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">{comicTitle}</h1>

        {/* Page indicator */}
        <p className="text-sm text-muted-foreground mb-4">
          Scene {currentPage + 1} of {totalPanels}
        </p>

        {/* Story Page */}
        {currentPanel && (
          <div className="w-full max-w-2xl space-y-0">
            {/* Dialogue — top */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 border-b-0 rounded-t-xl px-4 py-3 min-h-[48px] flex items-center justify-center">
              {(currentPanel.imageA.status === 'done' || currentPanel.imageB.status === 'done') ? (
                <p className="text-center font-bold text-base md:text-lg uppercase tracking-wide">
                  {currentPanel.dialogue || '...'}
                </p>
              ) : (
                <p className="text-center text-muted-foreground text-sm italic blur-sm select-none">
                  {currentPanel.dialogue || 'Loading...'}
                </p>
              )}
            </div>

            {/* Dual Image Area */}
            {panelHasSelection ? (
              // Selected — show single image full width
              <div className="aspect-square relative bg-muted/20 border border-border/50">
                {(() => {
                  const display = getDisplayImage(currentPanel);
                  return display.url ? (
                    <div className="relative w-full h-full">
                      <img src={display.url} alt={currentPanel.caption} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3 text-primary" /> {display.label}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No image available</p>
                    </div>
                  );
                })()}
              </div>
            ) : (
              // Not selected — show side by side
              <div className="grid grid-cols-2 gap-0 border border-border/50">
                {/* Image A */}
                <div className="aspect-square relative bg-muted/20 border-r border-border/30">
                  {currentPanel.imageA.status === 'done' && currentPanel.imageA.url ? (
                    <button
                      onClick={() => selectImage(currentPage, 'A')}
                      className="w-full h-full relative group cursor-pointer"
                    >
                      <img src={currentPanel.imageA.url} alt="Option A" className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                        <span className="text-white text-xs font-bold bg-primary/80 px-3 py-1 rounded-full">Keep this</span>
                      </div>
                      <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-0.5 rounded-full">
                        {currentPanel.imageA.model}
                      </div>
                    </button>
                  ) : currentPanel.imageA.status === 'generating' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">{currentPanel.imageA.model}</p>
                    </div>
                  ) : currentPanel.imageA.status === 'error' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                      <p className="text-destructive text-xs text-center">{currentPanel.imageA.error || 'Failed'}</p>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => retryPanelImage(currentPage, 'A')}>
                        <RotateCcw className="mr-1 h-3 w-3" /> Retry
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <Loader2 className="h-6 w-6 text-muted-foreground/40 animate-spin" />
                      <p className="text-[10px] text-muted-foreground/50">In queue...</p>
                    </div>
                  )}
                </div>

                {/* Image B */}
                <div className="aspect-square relative bg-muted/20">
                  {currentPanel.imageB.status === 'done' && currentPanel.imageB.url ? (
                    <button
                      onClick={() => selectImage(currentPage, 'B')}
                      className="w-full h-full relative group cursor-pointer"
                    >
                      <img src={currentPanel.imageB.url} alt="Option B" className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                        <span className="text-white text-xs font-bold bg-primary/80 px-3 py-1 rounded-full">Keep this</span>
                      </div>
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-0.5 rounded-full">
                        {currentPanel.imageB.model}
                      </div>
                    </button>
                  ) : currentPanel.imageB.status === 'generating' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">{currentPanel.imageB.model}</p>
                    </div>
                  ) : currentPanel.imageB.status === 'error' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                      <p className="text-destructive text-xs text-center">{currentPanel.imageB.error || 'Failed'}</p>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => retryPanelImage(currentPage, 'B')}>
                        <RotateCcw className="mr-1 h-3 w-3" /> Retry
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <Loader2 className="h-6 w-6 text-muted-foreground/40 animate-spin" />
                      <p className="text-[10px] text-muted-foreground/50">In queue...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selection hint */}
            {bothImagesReady && !panelHasSelection && (currentPanel.imageA.status === 'done' || currentPanel.imageB.status === 'done') && (
              <div className="bg-primary/10 border border-primary/20 px-3 py-2 text-center">
                <p className="text-xs text-primary font-medium">👆 Click the image you like best to keep it</p>
              </div>
            )}

            {/* Caption — bottom */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 border-t-0 rounded-b-xl px-4 py-3 min-h-[64px] flex items-center justify-center">
              {(currentPanel.imageA.status === 'done' || currentPanel.imageB.status === 'done') ? (
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
              <RotateCcw className="mr-2 h-4 w-4" /> Create Another Story
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ComicGen;
