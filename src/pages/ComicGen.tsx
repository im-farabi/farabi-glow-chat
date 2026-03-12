import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, BookOpen, ArrowLeft, ArrowRight, RotateCcw, Sparkles, Shuffle, ChevronLeft, ChevronRight, Crown, Zap, Volume2, VolumeX, Pause, Play } from 'lucide-react';
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
    if (meta) meta.setAttribute('content', 'Generate AI-powered illustrated stories from any idea. Choose art style, genre, and watch your story come to life!');
  }, []);
};

interface ComicPanel {
  id: number;
  prompt: string;
  dialogue: string;
  caption: string;
  imageUrl: string | null;
  model: string;
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
  { id: 'unexpected', label: '😱 Unexpected', desc: 'MASSIVE jaw-dropping plot twists that flip EVERYTHING upside down' },
  { id: 'adventure', label: '⚔️ Adventure', desc: 'exciting dangerous journey with epic moments' },
  { id: 'scifi', label: '🚀 Sci-Fi', desc: 'futuristic world with mind-bending technology' },
  { id: 'horror', label: '👻 Horror', desc: 'genuinely creepy and scary, builds dread slowly' },
  { id: 'mystery', label: '🔍 Mystery', desc: 'deep puzzle where clues slowly reveal a shocking truth' },
  { id: 'action', label: '💥 Action', desc: 'non-stop high energy fights and explosions' },
  { id: 'thriller', label: '🔥 Thriller', desc: 'intense suspense that keeps you on the edge, heart-pounding tension' },
  { id: 'fantasy', label: '🧙 Fantasy', desc: 'magical worlds with epic quests and mythical creatures' },
  { id: 'survival', label: '🏝️ Survival', desc: 'fight to stay alive against impossible odds' },
];

const AI_MODEL_INFO = `Available image models and their strengths:
1. flux-2-dev: Best overall photorealism + prompt adherence. Excellent character consistency with multi-reference. Best for realistic/production stories, detailed scenes, and consistent characters across poses. Slightly less artistic than Grok.
2. zimage: Extremely fast & cheap. Strong photorealism. Great for quick generations. Consistency is prompt-dependent without extras. Good for action-heavy stories with less character focus.
3. grok-imagine: Most uncensored/creative. Artistic flair, good for edgy/dark/violent content. Creative meme-like style. Good for horror, dark, thriller genres. New reference support helps consistency.
4. imagen-4: Outstanding photorealism and clarity. Best text rendering. But heavily censored — blocks violent/scary content. Best for romantic, wholesome, light-hearted stories only.`;

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
        for (const obs of g.obstacles) obs.x -= g.speed;
        g.obstacles = g.obstacles.filter(o => o.x > -20);

        const dx = 30, dy = g.dino.y, dw = g.dino.width, dh = g.dino.height;
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
      <p className="text-xs text-muted-foreground">🎮 Play while you wait! Press Space or tap to jump</p>
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
  const [selectedModel, setSelectedModel] = useState('');
  const [comicTitle, setComicTitle] = useState('');
  const [panels, setPanels] = useState<ComicPanel[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [planningProgress, setPlanningProgress] = useState(0);
  const [aiPickingGenre, setAiPickingGenre] = useState(false);

  // Audiobook state
  const [audiobookActive, setAudiobookActive] = useState(false);
  const [audiobookPaused, setAudiobookPaused] = useState(false);
  const [audiobookLoading, setAudiobookLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalPanels = panels.length;
  const donePanels = panels.filter(p => p.status === 'done').length;
  const allDone = totalPanels > 0 && panels.every(p => p.status === 'done' || p.status === 'error');
  const overallProgress = totalPanels > 0 ? (donePanels / totalPanels) * 100 : 0;

  // Planning progress bar — fills to 99% over ~23 seconds
  useEffect(() => {
    if (phase !== 'planning') {
      setPlanningProgress(0);
      return;
    }
    const startTime = Date.now();
    const duration = 23000; // 23 seconds to reach 99%
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 99, 99);
      setPlanningProgress(progress);
    }, 200);
    return () => clearInterval(interval);
  }, [phase]);

  // Keyboard navigation (only when not in dino game phases)
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

  // Audiobook: auto-advance to next page when audio ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audiobookActive) return;
    const onEnded = () => {
      if (currentPage < totalPanels - 1) {
        setCurrentPage(p => p + 1);
      } else {
        // Story finished
        setAudiobookActive(false);
        toast({ title: "Audiobook finished! 📖" });
      }
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [audiobookActive, currentPage, totalPanels, toast]);

  // Audiobook: generate TTS for current page when active
  useEffect(() => {
    if (!audiobookActive || audiobookPaused) return;
    const panel = panels[currentPage];
    if (!panel || panel.status !== 'done') return;

    const text = `${panel.dialogue ? panel.dialogue + '. ' : ''}${panel.caption}`;
    if (!text.trim()) return;

    let cancelled = false;
    const generateAudio = async () => {
      setAudiobookLoading(true);
      try {
        // Stop any current audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const response = await fetch(
          `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'gjlxuvcfoqjhwzcmpaju'}.supabase.co/functions/v1/pollinations-tts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqbHh1dmNmb3FqaHd6Y21wYWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI5NjEsImV4cCI6MjA3ODM2ODk2MX0.5QgFtSCjSbwzudA8iz2-laO1st46ekY_tJIE2a41Vms',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqbHh1dmNmb3FqaHd6Y21wYWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI5NjEsImV4cCI6MjA3ODM2ODk2MX0.5QgFtSCjSbwzudA8iz2-laO1st46ekY_tJIE2a41Vms'}`,
            },
            body: JSON.stringify({ text, voice: 'nova', model: 'openai-audio' }),
          }
        );

        if (!response.ok) throw new Error('TTS failed');
        if (cancelled) return;

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        setAudiobookLoading(false);
        await audio.play();
      } catch (err) {
        console.error('Audiobook TTS error:', err);
        setAudiobookLoading(false);
        if (!cancelled) {
          // Auto-advance even on error
          if (currentPage < totalPanels - 1) {
            setTimeout(() => setCurrentPage(p => p + 1), 2000);
          }
        }
      }
    };

    generateAudio();
    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audiobookActive, audiobookPaused, currentPage, panels, totalPanels]);

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

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(g => g !== genreId) : [...prev, genreId]
    );
  };

  // === LET AI PICK — Genre ===
  const letAiPickGenre = async () => {
    setAiPickingGenre(true);
    try {
      const { data, error } = await supabase.functions.invoke('pollinations-chat', {
        body: {
          prompt: `You are a story genre expert. Read this story idea and pick the 2-4 BEST genres that would make it amazing.

Story: "${storyInput}"

Available genres (pick by ID): ${GENRES.map(g => `${g.id} (${g.label}: ${g.desc})`).join(', ')}

Think about what would make this story the most engaging, emotional, and entertaining. Pick genres that COMPLEMENT each other.

Return ONLY a JSON array of genre IDs. Example: ["dark", "mystery", "thriller"]
No explanation, just the JSON array.`,
          model: 'mistral',
          temperature: 0.3,
          max_tokens: 100,
        }
      });

      if (error) throw error;
      let text = data?.text?.trim() || '[]';
      text = text.replace(/```json\s*\n?/gi, '').replace(/```\s*\n?/g, '').trim();
      const startIdx = text.indexOf('[');
      const endIdx = text.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1) {
        const arr = JSON.parse(text.substring(startIdx, endIdx + 1));
        const validIds = arr.filter((id: string) => GENRES.some(g => g.id === id));
        if (validIds.length > 0) {
          setSelectedGenres(validIds);
          toast({ title: "AI picked genres! 🎯", description: validIds.map((id: string) => GENRES.find(g => g.id === id)?.label).join(', ') });
        }
      }
    } catch (err) {
      console.error('AI genre pick error:', err);
      toast({ title: "AI couldn't pick, choose manually!", variant: "destructive" });
    }
    setAiPickingGenre(false);
  };

  // === AI picks best model during planning ===
  const aiPickModel = async (story: string, genres: string[], styleName: string): Promise<string> => {
    try {
      const genreNames = genres.map(id => GENRES.find(g => g.id === id)?.label || id).join(', ');
      const { data, error } = await supabase.functions.invoke('pollinations-chat', {
        body: {
          prompt: `You are an AI image model expert. Pick the BEST image generation model for this story.

Story: "${story}"
Genres: ${genreNames}
Art Style: ${styleName}

${AI_MODEL_INFO}

Rules:
- If genres include horror, dark, thriller, or action → prefer grok-imagine or flux-2-dev (NOT imagen-4, it censors violence)
- If genres include romantic, humor, or wholesome → imagen-4 is great
- For pixel art style → zimage or flux-2-dev work well
- For maximum quality and consistency → flux-2-dev
- For speed → zimage

Return ONLY the model name (one of: flux-2-dev, zimage, grok-imagine, imagen-4). Nothing else.`,
          model: 'mistral',
          temperature: 0.2,
          max_tokens: 30,
        }
      });

      if (error) throw error;
      const text = (data?.text || '').trim().toLowerCase();
      const validModels = ['flux-2-dev', 'zimage', 'grok-imagine', 'imagen-4'];
      const picked = validModels.find(m => text.includes(m));
      return picked || 'flux-2-dev';
    } catch {
      return 'flux-2-dev'; // fallback
    }
  };

  const startGeneration = async () => {
    if (selectedGenres.length === 0) {
      toast({ title: "Pick at least one genre!", variant: "destructive" });
      return;
    }

    setPhase('planning');
    setPanels([]);
    setComicTitle('');
    setCurrentPage(0);
    setAudiobookActive(false);

    const style = ART_STYLES.find(s => s.id === selectedStyle)!;
    const genres = selectedGenres;
    const genreLabels = genres.map(id => GENRES.find(g => g.id === id)?.label || id).join(', ');
    const genreDescs = genres.map(id => GENRES.find(g => g.id === id)?.desc || '').join('. ');

    try {
      // Run story planning and AI model pick in parallel
      const [plan, pickedModel] = await Promise.all([
        planStory(storyInput, style, genreLabels, genreDescs),
        aiPickModel(storyInput, genres, style.label),
      ]);

      setPlanningProgress(100);
      setSelectedModel(pickedModel);
      setComicTitle(plan.title || 'Untitled Story');

      const initialPanels: ComicPanel[] = plan.panels.map((p: any) => ({
        id: p.id,
        prompt: p.prompt,
        dialogue: p.dialogue || '',
        caption: p.caption,
        imageUrl: null,
        model: pickedModel,
        status: 'waiting' as const,
      }));
      setPanels(initialPanels);
      setPhase('generating');

      toast({ title: `AI picked: ${pickedModel}`, description: "Starting image generation..." });

      // Generate all images in parallel
      const promises = initialPanels.map((panel, i) =>
        (async () => {
          setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'generating' } : p));
          try {
            const result = await generatePanelImage(panel.prompt, pickedModel);
            setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'done', imageUrl: result.imageUrl } : p));
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error', errorMsg: errMsg } : p));
          }
        })()
      );

      await Promise.allSettled(promises);
      setPhase('complete');
      toast({ title: "Story complete! 🎉", description: `${initialPanels.length} scenes generated` });
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
    setSelectedModel('');
    setCurrentPage(0);
    setAudiobookActive(false);
    setAudiobookPaused(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const retryPanelImage = async (panelIndex: number) => {
    const panel = panels[panelIndex];
    setPanels(prev => prev.map((p, i) => i === panelIndex ? { ...p, status: 'generating', errorMsg: undefined } : p));
    try {
      const result = await generatePanelImage(panel.prompt, panel.model);
      setPanels(prev => prev.map((p, i) => i === panelIndex ? { ...p, status: 'done', imageUrl: result.imageUrl } : p));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setPanels(prev => prev.map((p, i) => i === panelIndex ? { ...p, status: 'error', errorMsg: errMsg } : p));
    }
  };

  const toggleAudiobook = () => {
    if (audiobookActive) {
      setAudiobookActive(false);
      setAudiobookPaused(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    } else {
      setAudiobookActive(true);
      setAudiobookPaused(false);
    }
  };

  const toggleAudiobookPause = () => {
    if (audiobookPaused) {
      setAudiobookPaused(false);
      audioRef.current?.play();
    } else {
      setAudiobookPaused(true);
      audioRef.current?.pause();
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

  // ========== PHASE: GENRE — Story Type Selection with LET AI PICK ==========
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
                <p className="text-muted-foreground">Pick genres or let AI choose for you</p>
              </div>

              {/* LET AI PICK button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={letAiPickGenre}
                  disabled={aiPickingGenre}
                  className="border-primary/50 hover:bg-primary/10 hover:border-primary"
                >
                  {aiPickingGenre ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI is thinking...</>
                  ) : (
                    <><Zap className="mr-2 h-4 w-4" /> LET AI PICK</>
                  )}
                </Button>
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
                  <p className="text-sm text-muted-foreground">{selectedGenres.length} genre{selectedGenres.length > 1 ? 's' : ''} selected — AI will pick the best image model</p>
                  <Button
                    onClick={startGeneration}
                    className="h-12 px-8 text-lg bg-gradient-to-r from-primary to-secondary"
                    size="lg"
                  >
                    <Sparkles className="mr-2 h-5 w-5" /> Generate Story
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ========== PHASE: PLANNING (with Progress Bar + Dino Game) ==========
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
                <h2 className="text-2xl font-bold">GENERATING YOUR STORY</h2>
                <p className="text-muted-foreground mt-2 text-sm">AI is crafting your narrative and choosing the best image model...</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 px-4">
                <Progress value={planningProgress} className="h-2.5" />
                <p className="text-xs text-muted-foreground">{Math.floor(planningProgress)}%</p>
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

  // ========== PHASE: GENERATING / COMPLETE — Book Reader with Side Nav ==========
  return (
    <div className="min-h-screen flex flex-col">
      <PremiumBackground />
      <Header showTemporaryToggle={false} />

      {/* GENERATING BANNER with progress + dino game */}
      {!allDone && (
        <div className="bg-primary/10 border-b border-primary/20 text-center py-4 px-4">
          <p className="font-bold text-sm text-primary">
            ✨ GENERATING IMAGES — {donePanels}/{totalPanels} scenes ready ({selectedModel})
          </p>
          <Progress value={overallProgress} className="h-2 mt-2 max-w-md mx-auto" />
          <p className="text-xs text-muted-foreground mt-1">🎮 Play while you wait!</p>
          <div className="mt-3">
            <DinoGame />
          </div>
        </div>
      )}

      {/* Audiobook controls */}
      {allDone && (
        <div className="bg-card/80 border-b border-border/30 py-2 px-4 flex items-center justify-center gap-3">
          <Button
            variant={audiobookActive ? "default" : "outline"}
            size="sm"
            onClick={toggleAudiobook}
            className="gap-2"
          >
            {audiobookActive ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {audiobookActive ? 'Stop Audiobook' : '🔊 Listen Audiobook'}
          </Button>
          {audiobookActive && (
            <Button variant="ghost" size="sm" onClick={toggleAudiobookPause}>
              {audiobookPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          )}
          {audiobookLoading && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading audio...
            </span>
          )}
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">{comicTitle}</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Scene {currentPage + 1} of {totalPanels} • {selectedModel}
        </p>

        {/* Story Page with SIDE NAVIGATION */}
        {currentPanel && (
          <div className="w-full max-w-3xl flex items-stretch gap-2">
            {/* LEFT ARROW */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="lg"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(p => p - 1)}
                className="h-full min-h-[200px] w-10 md:w-12 p-0 rounded-xl hover:bg-primary/10"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>

            {/* STORY CONTENT */}
            <div className="flex-1 space-y-0">
              {/* Dialogue — top */}
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 border-b-0 rounded-t-xl px-4 py-3 min-h-[48px] flex items-center justify-center">
                {currentPanel.status === 'done' ? (
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
              <div className="aspect-square relative bg-muted/20 border-x border-border/50">
                {currentPanel.status === 'done' && currentPanel.imageUrl ? (
                  <div className="relative w-full h-full">
                    <img src={currentPanel.imageUrl} alt={currentPanel.caption} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-full">
                      {currentPanel.model}
                    </div>
                  </div>
                ) : currentPanel.status === 'generating' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Generating with {currentPanel.model}...</p>
                  </div>
                ) : currentPanel.status === 'error' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                    <p className="text-destructive text-sm text-center">{currentPanel.errorMsg || 'Failed'}</p>
                    <Button size="sm" variant="outline" onClick={() => retryPanelImage(currentPage)}>
                      <RotateCcw className="mr-1 h-3 w-3" /> Retry
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 text-muted-foreground/40 animate-spin" />
                    <p className="text-xs text-muted-foreground/50">In queue...</p>
                  </div>
                )}
              </div>

              {/* Caption — bottom */}
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 border-t-0 rounded-b-xl px-4 py-3 min-h-[64px] flex items-center justify-center">
                {currentPanel.status === 'done' ? (
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

            {/* RIGHT ARROW */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="lg"
                disabled={currentPage >= totalPanels - 1}
                onClick={() => setCurrentPage(p => p + 1)}
                className="h-full min-h-[200px] w-10 md:w-12 p-0 rounded-xl hover:bg-primary/10"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}

        {/* Page hint */}
        <p className="text-xs text-muted-foreground mt-3">Use ← → arrow keys to navigate</p>

        {/* Actions */}
        {allDone && (
          <div className="mt-6">
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
