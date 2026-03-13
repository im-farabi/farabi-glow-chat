import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, BookOpen, ArrowLeft, RotateCcw, Sparkles, Shuffle, ChevronLeft, ChevronRight, Zap, Volume2, VolumeX, Pause, Play, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import PremiumBackground from '@/components/PremiumBackground';
import { useIsMobile } from '@/hooks/use-mobile';

import modernImg from '@/assets/comic-style-modern.png';

const useComicPageSEO = () => {
  useEffect(() => {
    document.title = "AI Story Generator - Farabi | Create Illustrated Stories with AI";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Generate AI-powered illustrated stories from any idea. Choose genre and watch your story come to life!');
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
  audioUrl?: string | null;
  audioStatus?: 'waiting' | 'generating' | 'done' | 'error';
}

type Phase = 'idle' | 'genre' | 'mode-select' | 'planning' | 'generating' | 'complete';

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

const MODERN_STYLE_PREFIX = 'Ultra high quality digital comic art, professional comic book illustration, vibrant saturated colors, dramatic cinematic lighting with volumetric rays, bold clean outlines, detailed backgrounds, dynamic perspective and foreshortening, professional color grading, studio quality rendering, masterpiece comic panel.';

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

const SPEED_OPTIONS = [
  { label: '0.75x', value: 0.75 },
  { label: '1x', value: 1 },
  { label: '1.10x', value: 1.1 },
  { label: '1.15x', value: 1.15 },
  { label: '1.25x', value: 1.25 },
  { label: '2x', value: 2 },
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
    const handleTouch = (e: TouchEvent) => { e.preventDefault(); jump(); };

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
  const isMobile = useIsMobile();

  const [storyInput, setStoryInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [comicTitle, setComicTitle] = useState('');
  const [panels, setPanels] = useState<ComicPanel[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [planningProgress, setPlanningProgress] = useState(0);
  const [aiPickingGenre, setAiPickingGenre] = useState(false);
  const [generationMode, setGenerationMode] = useState<'fast' | 'detailed' | null>(null);
  const [planningDuration, setPlanningDuration] = useState(15000);

  // Audiobook state
  const [audiobookActive, setAudiobookActive] = useState(false);
  const [audiobookPaused, setAudiobookPaused] = useState(false);
  const [audiobookLoading, setAudiobookLoading] = useState(false);
  const [audiobookSpeed, setAudiobookSpeed] = useState(1);
  const [allAudioReady, setAllAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const panelAudiosRef = useRef<Map<number, string>>(new Map());

  const totalPanels = panels.length;
  const donePanels = panels.filter(p => p.status === 'done').length;
  const allDone = totalPanels > 0 && panels.every(p => p.status === 'done' || p.status === 'error');
  const overallProgress = totalPanels > 0 ? (donePanels / totalPanels) * 100 : 0;
  const audiosDone = panels.filter(p => p.audioStatus === 'done').length;
  const allAudiosDone = totalPanels > 0 && panels.every(p => p.audioStatus === 'done' || p.audioStatus === 'error');

  // Planning progress bar
  useEffect(() => {
    if (phase !== 'planning') {
      setPlanningProgress(0);
      return;
    }
    const startTime = Date.now();
    const duration = planningDuration;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 99, 99);
      setPlanningProgress(progress);
    }, 200);
    return () => clearInterval(interval);
  }, [phase, planningDuration]);

  // Check if all audios are ready
  useEffect(() => {
    if (allAudiosDone && totalPanels > 0) {
      setAllAudioReady(true);
    }
  }, [allAudiosDone, totalPanels]);

  // Keyboard navigation (disabled during audiobook)
  useEffect(() => {
    if (phase !== 'generating' && phase !== 'complete') return;
    if (audiobookActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentPage(p => Math.min(p + 1, totalPanels - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentPage(p => Math.max(p - 1, 0));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, totalPanels, audiobookActive]);

  // Audiobook: auto-advance + play from cache
  useEffect(() => {
    if (!audiobookActive || audiobookPaused) return;
    const panel = panels[currentPage];
    if (!panel) return;

    const cachedUrl = panelAudiosRef.current.get(currentPage);
    if (!cachedUrl) {
      // Audio not ready yet, generate on the fly
      let cancelled = false;
      const genAudio = async () => {
        setAudiobookLoading(true);
        try {
          const text = `${panel.dialogue ? panel.dialogue + '. ' : ''}${panel.caption}`;
          if (!text.trim()) {
            if (currentPage < totalPanels - 1) setCurrentPage(p => p + 1);
            return;
          }
          const url = await generateTTSAudio(text);
          if (cancelled) return;
          panelAudiosRef.current.set(currentPage, url);
          playAudioFromUrl(url);
        } catch {
          setAudiobookLoading(false);
          if (!cancelled && currentPage < totalPanels - 1) {
            setTimeout(() => setCurrentPage(p => p + 1), 1500);
          }
        }
      };
      genAudio();
      return () => { cancelled = true; };
    } else {
      playAudioFromUrl(cachedUrl);
    }
  }, [audiobookActive, audiobookPaused, currentPage]);

  const playAudioFromUrl = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(url);
    audio.playbackRate = audiobookSpeed;
    audioRef.current = audio;

    audio.oncanplaythrough = () => {
      setAudiobookLoading(false);
      audio.play().catch(() => {});
    };

    audio.onended = () => {
      if (currentPage < totalPanels - 1) {
        setCurrentPage(p => p + 1);
      } else {
        setAudiobookActive(false);
        toast({ title: "Story finished! 📖🎉" });
      }
    };

    audio.onerror = () => {
      setAudiobookLoading(false);
      if (currentPage < totalPanels - 1) {
        setTimeout(() => setCurrentPage(p => p + 1), 1500);
      }
    };

    audio.load();
  };

  // Update playback speed when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = audiobookSpeed;
    }
  }, [audiobookSpeed]);

  const generateTTSAudio = async (text: string): Promise<string> => {
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
      .replace(/#\w+/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const response = await fetch(
      `https://gjlxuvcfoqjhwzcmpaju.supabase.co/functions/v1/pollinations-tts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqbHh1dmNmb3FqaHd6Y21wYWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI5NjEsImV4cCI6MjA3ODM2ODk2MX0.5QgFtSCjSbwzudA8iz2-laO1st46ekY_tJIE2a41Vms',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqbHh1dmNmb3FqaHd6Y21wYWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI5NjEsImV4cCI6MjA3ODM2ODk2MX0.5QgFtSCjSbwzudA8iz2-laO1st46ekY_tJIE2a41Vms`,
        },
        body: JSON.stringify({ text: cleanText, voice: 'matilda', model: 'openai-audio' }),
      }
    );

    if (!response.ok) throw new Error('TTS failed');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  const handleSurprise = () => {
    setStoryInput(SURPRISE_IDEAS[Math.floor(Math.random() * SURPRISE_IDEAS.length)]);
  };

  const goToGenre = () => {
    if (!storyInput.trim()) {
      toast({ title: "Write a story first!", description: "Describe your story idea or tap Surprise Me", variant: "destructive" });
      return;
    }
    setPhase('genre');
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(g => g !== genreId) : [...prev, genreId]
    );
  };

  // === LET AI PICK — Genre (improved reliability) ===
  const letAiPickGenre = async () => {
    setAiPickingGenre(true);
    try {
      const { data, error } = await supabase.functions.invoke('pollinations-chat', {
        body: {
          prompt: `Pick 2-4 best genres for this story. Story: "${storyInput}"

Available: ${GENRES.map(g => g.id).join(', ')}

Reply with ONLY a JSON array like ["dark","mystery"]. No other text.`,
          model: 'mistral',
          temperature: 0.2,
          max_tokens: 60,
        }
      });

      if (error) throw error;
      let text = data?.text?.trim() || '';
      text = text.replace(/```json\s*\n?/gi, '').replace(/```\s*\n?/g, '').trim();
      
      // Try to extract JSON array
      const match = text.match(/\[[\s\S]*?\]/);
      if (match) {
        const arr = JSON.parse(match[0]);
        const validIds = arr.filter((id: string) => GENRES.some(g => g.id === id));
        if (validIds.length > 0) {
          setSelectedGenres(validIds);
          toast({ title: "AI picked genres! 🎯", description: validIds.map((id: string) => GENRES.find(g => g.id === id)?.label).join(', ') });
          setAiPickingGenre(false);
          return;
        }
      }
      
      // Fallback: try to find genre IDs in the text
      const foundGenres = GENRES.filter(g => text.toLowerCase().includes(g.id)).map(g => g.id);
      if (foundGenres.length > 0) {
        setSelectedGenres(foundGenres.slice(0, 4));
        toast({ title: "AI picked genres! 🎯", description: foundGenres.slice(0, 4).map(id => GENRES.find(g => g.id === id)?.label).join(', ') });
      } else {
        // Ultimate fallback: pick random 3
        const shuffled = [...GENRES].sort(() => Math.random() - 0.5).slice(0, 3);
        setSelectedGenres(shuffled.map(g => g.id));
        toast({ title: "AI picked genres! 🎯", description: shuffled.map(g => g.label).join(', ') });
      }
    } catch (err) {
      console.error('AI genre pick error:', err);
      // Fallback on error: pick 3 random
      const shuffled = [...GENRES].sort(() => Math.random() - 0.5).slice(0, 3);
      setSelectedGenres(shuffled.map(g => g.id));
      toast({ title: "AI picked genres! 🎯", description: shuffled.map(g => g.label).join(', ') });
    }
    setAiPickingGenre(false);
  };

  const showModeSelect = () => {
    if (selectedGenres.length === 0) {
      toast({ title: "Pick at least one genre!", variant: "destructive" });
      return;
    }
    setPhase('mode-select');
  };

  const startGeneration = async (mode: 'fast' | 'detailed') => {
    setGenerationMode(mode);
    const duration = mode === 'fast' ? 15000 : 38000;
    setPlanningDuration(duration);
    setPhase('planning');
    setPanels([]);
    setComicTitle('');
    setCurrentPage(0);
    setAudiobookActive(false);
    setAllAudioReady(false);
    panelAudiosRef.current.clear();

    const storyModel = mode === 'fast' ? 'mistral' : 'openai-fast';
    const genreLabels = selectedGenres.map(id => GENRES.find(g => g.id === id)?.label || id).join(', ');
    const genreDescs = selectedGenres.map(id => GENRES.find(g => g.id === id)?.desc || '').join('. ');

    try {
      const plan = await planStory(storyInput, genreLabels, genreDescs, storyModel);

      setPlanningProgress(100);
      setComicTitle(plan.title || 'Untitled Story');

      // Always use imagen-4, fallback handled by image-gen-multi
      const primaryModel = 'imagen-4';

      const initialPanels: ComicPanel[] = plan.panels.map((p: any) => ({
        id: p.id,
        prompt: p.prompt,
        dialogue: p.dialogue || '',
        caption: p.caption,
        imageUrl: null,
        model: primaryModel,
        status: 'waiting' as const,
        audioUrl: null,
        audioStatus: 'waiting' as const,
      }));
      setPanels(initialPanels);
      setPhase('generating');

      toast({ title: "Story planned! 📖", description: "Generating images and audio..." });

      // Generate images + audio in parallel for each panel
      const promises = initialPanels.map((panel, i) =>
        (async () => {
          setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'generating' } : p));
          try {
            const result = await generatePanelImage(panel.prompt, primaryModel);
            setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'done', imageUrl: result.imageUrl, model: result.modelUsed } : p));
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error', errorMsg: errMsg } : p));
          }
        })()
      );

      // Generate audio for all panels in parallel
      const audioPromises = initialPanels.map((panel, i) =>
        (async () => {
          setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, audioStatus: 'generating' } : p));
          try {
            const text = `${panel.dialogue ? panel.dialogue + '. ' : ''}${panel.caption}`;
            if (!text.trim()) {
              setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, audioStatus: 'done' } : p));
              return;
            }
            const audioUrl = await generateTTSAudio(text);
            panelAudiosRef.current.set(i, audioUrl);
            setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, audioStatus: 'done', audioUrl } : p));
          } catch {
            setPanels(prev => prev.map((p, idx) => idx === i ? { ...p, audioStatus: 'error' } : p));
          }
        })()
      );

      await Promise.allSettled([...promises, ...audioPromises]);
      setPhase('complete');
      toast({ title: "Story complete! 🎉", description: `${initialPanels.length} scenes generated` });
    } catch (err) {
      console.error('Story generation error:', err);
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : 'Unknown error', variant: "destructive" });
      setPhase('idle');
    }
  };

  const planStory = async (story: string, genreLabels: string, genreDescs: string, model: string) => {
    const planPrompt = `You are a story writer for KIDS aged 8-14. Write in SIMPLE, EASY English. Short words. Short sentences. Fun and exciting!

The user wants a ${genreLabels} illustrated story about: "${story}"

IMPORTANT LANGUAGE RULES:
- Write like you're talking to a 10 year old kid
- Use simple words a kid would understand
- Keep sentences SHORT (max 15 words each)
- Use fun expressions like "WOW!", "OH NO!", "WHAT IS THAT?!", "NO WAY!", "AWESOME!", "UH OH!"
- NO big fancy words. NO complex sentences.
- The dialogue should sound like how real kids talk
- The captions should be easy to read out loud

CRITICAL — Each scene is illustrated. The image prompt must describe EXACTLY what you'd see.

=== SCENE DESCRIPTION RULES ===
Each prompt must be a COMPLETE scene description:
- WHO is there (full look from character sheet)
- WHERE they are
- WHAT POSITION (standing, sitting, running, etc.)
- WHAT they are doing
- CAMERA ANGLE
- LIGHTING and MOOD

=== CHARACTER RULES ===
- Do NOT give characters names. Use "the boy", "the girl", "the old man" etc.
- Create a character sheet with: hair, skin, clothes, height, one special feature
- Clothes STAY THE SAME in every scene

=== STORY RULES ===
- Start with a HOOK that grabs attention
- Keep it exciting — every scene matters
- Drop twists and surprises
- End with a BANG
- Genres: ${genreLabels} (${genreDescs}). Make the story FEEL like these genres.

=== SPATIAL LOGIC (MANDATORY) ===
1. If a character is lying down, show their view looking UP
2. If character A gets hurt, A shows pain — not someone else
3. Characters stay in same location until they move
4. Actions must make physical sense

ART STYLE PREFIX (use at start of every prompt):
"${MODERN_STYLE_PREFIX}"

Create 15-40 scenes. Return ONLY valid JSON:
{
  "title": "Story Title",
  "panels": [
    {
      "id": 1,
      "prompt": "Scene continuation: opening. ${MODERN_STYLE_PREFIX} [full scene description]",
      "dialogue": "WHAT IS THAT?!",
      "caption": "He saw something weird in the sky. It was coming closer. He couldn't move!"
    }
  ]
}`;

    const { data, error } = await supabase.functions.invoke('pollinations-chat', {
      body: {
        prompt: planPrompt,
        model: model,
        seed: Math.floor(Math.random() * 1000000),
        temperature: 0.85,
        max_tokens: 32000,
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
    setSelectedGenres([]);
    setCurrentPage(0);
    setAudiobookActive(false);
    setAudiobookPaused(false);
    setGenerationMode(null);
    setAllAudioReady(false);
    panelAudiosRef.current.clear();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const retryPanelImage = async (panelIndex: number) => {
    const panel = panels[panelIndex];
    setPanels(prev => prev.map((p, i) => i === panelIndex ? { ...p, status: 'generating', errorMsg: undefined } : p));
    try {
      const result = await generatePanelImage(panel.prompt, 'imagen-4');
      setPanels(prev => prev.map((p, i) => i === panelIndex ? { ...p, status: 'done', imageUrl: result.imageUrl, model: result.modelUsed } : p));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setPanels(prev => prev.map((p, i) => i === panelIndex ? { ...p, status: 'error', errorMsg: errMsg } : p));
    }
  };

  const startAudiobook = () => {
    if (!allAudioReady) {
      setAudiobookLoading(true);
      toast({ title: "Audio is still loading...", description: "Please wait, it will start automatically." });
    }
    setCurrentPage(0);
    setAudiobookActive(true);
    setAudiobookPaused(false);
    setAudiobookLoading(!allAudioReady);
  };

  const stopAudiobook = () => {
    setAudiobookActive(false);
    setAudiobookPaused(false);
    setAudiobookLoading(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
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
  const cardClass = isMobile
    ? "bg-card/60 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(236,72,153,0.15)] rounded-xl"
    : "bg-card/60 backdrop-blur-xl border-2 border-primary/30 shadow-[0_12px_48px_rgba(236,72,153,0.2),0_0_80px_rgba(147,51,234,0.1)] rounded-2xl";

  // ========== PHASE: IDLE — Story Input ==========
  if (phase === 'idle') {
    return (
      <div className="min-h-screen flex flex-col">
        <PremiumBackground />
        <Header showTemporaryToggle={false} />
        <main className={`flex-1 container mx-auto px-4 py-8 animate-fade-in ${isMobile ? 'max-w-lg' : 'max-w-3xl'}`}>
          <Card className={cardClass}>
            <CardContent className={`space-y-6 ${isMobile ? 'pt-6 px-4' : 'pt-8 px-10'}`}>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              </div>

              <div className="text-center space-y-2">
                <BookOpen className={`text-primary mx-auto ${isMobile ? 'h-10 w-10' : 'h-14 w-14'}`} />
                <h1 className={`font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${isMobile ? 'text-3xl' : 'text-4xl'}`}>AI Story Generator</h1>
                <p className="text-muted-foreground">Tell a story and watch it become an illustrated masterpiece</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Story Idea</label>
                <Textarea
                  placeholder="Describe your story... what happens, who's in it, where does it take place?"
                  value={storyInput}
                  onChange={(e) => setStoryInput(e.target.value.slice(0, 500))}
                  maxLength={500}
                  className={`text-base border-primary/20 focus:border-primary/50 ${isMobile ? 'min-h-[120px]' : 'min-h-[160px] text-lg'}`}
                />
                <p className="text-xs text-muted-foreground text-right">{storyInput.length}/500</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={goToGenre} disabled={!storyInput.trim()} className={`w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity ${isMobile ? 'h-12 text-lg' : 'h-14 text-xl'}`} size="lg">
                  <Sparkles className="mr-2 h-5 w-5" /> Next: Pick Genre
                </Button>
                <Button variant="outline" onClick={handleSurprise} className="w-full border-primary/30 hover:bg-primary/5">
                  <Shuffle className="mr-2 h-4 w-4" /> Surprise Me
                </Button>
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
        <main className={`flex-1 container mx-auto px-4 py-8 animate-fade-in ${isMobile ? 'max-w-lg' : 'max-w-4xl'}`}>
          <Card className={cardClass}>
            <CardContent className={`space-y-6 ${isMobile ? 'pt-6 px-4' : 'pt-8 px-10'}`}>
              <Button variant="ghost" size="sm" onClick={() => setPhase('idle')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              <div className="text-center space-y-2">
                <h2 className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'}`}>What kind of story?</h2>
                <p className="text-muted-foreground">Pick genres or let AI choose for you</p>
              </div>

              {/* LET AI PICK */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={letAiPickGenre}
                  disabled={aiPickingGenre}
                  className="border-primary/50 hover:bg-primary/10 hover:border-primary px-6 py-3"
                >
                  {aiPickingGenre ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI is thinking...</>
                  ) : (
                    <><Zap className="mr-2 h-4 w-4" /> LET AI PICK</>
                  )}
                </Button>
              </div>

              <div className={`flex flex-wrap gap-3 justify-center ${isMobile ? '' : 'gap-4'}`}>
                {GENRES.map(genre => (
                  <Button
                    key={genre.id}
                    variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                    className={`h-auto transition-all ${isMobile ? 'py-3 px-4 text-sm' : 'py-4 px-6 text-base'} ${
                      selectedGenres.includes(genre.id)
                        ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(236,72,153,0.3)] scale-105'
                        : 'hover:bg-primary/10 hover:border-primary border-primary/20'
                    }`}
                    onClick={() => toggleGenre(genre.id)}
                  >
                    {genre.label}
                  </Button>
                ))}
              </div>

              {selectedGenres.length > 0 && (
                <div className="flex flex-col items-center gap-3 pt-2">
                  <p className="text-sm text-muted-foreground">{selectedGenres.length} genre{selectedGenres.length > 1 ? 's' : ''} selected</p>
                  <Button
                    onClick={showModeSelect}
                    className={`bg-gradient-to-r from-primary to-secondary hover:opacity-90 ${isMobile ? 'h-12 px-8 text-lg' : 'h-14 px-12 text-xl'}`}
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

  // ========== PHASE: MODE SELECT — Fast vs Detailed ==========
  if (phase === 'mode-select') {
    return (
      <div className="min-h-screen flex flex-col">
        <PremiumBackground />
        <Header showTemporaryToggle={false} />
        <main className={`flex-1 container mx-auto px-4 py-8 animate-fade-in flex items-center justify-center ${isMobile ? 'max-w-lg' : 'max-w-3xl'}`}>
          <Card className={cardClass + ' w-full'}>
            <CardContent className={`space-y-8 ${isMobile ? 'pt-6 px-4' : 'pt-10 px-10'}`}>
              <Button variant="ghost" size="sm" onClick={() => setPhase('genre')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              <div className="text-center space-y-2">
                <h2 className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'}`}>How do you want your story?</h2>
                <p className="text-muted-foreground">Choose speed or quality</p>
              </div>

              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {/* FAST */}
                <button
                  onClick={() => startGeneration('fast')}
                  className={`group relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-card/80 backdrop-blur-sm p-6 text-left transition-all hover:border-primary hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] ${isMobile ? '' : 'p-8'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="h-8 w-8 text-yellow-400" />
                    <h3 className="text-xl font-bold">⚡ FAST</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">Quick story generation using Mistral AI. Ready in ~15 seconds.</p>
                  <p className="text-xs text-muted-foreground mt-2">Best for: Quick stories, testing ideas</p>
                </button>

                {/* MORE DETAILED */}
                <button
                  onClick={() => startGeneration('detailed')}
                  className={`group relative overflow-hidden rounded-2xl border-2 border-secondary/30 bg-card/80 backdrop-blur-sm p-6 text-left transition-all hover:border-secondary hover:shadow-[0_0_30px_rgba(147,51,234,0.3)] ${isMobile ? '' : 'p-8'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="h-8 w-8 text-purple-400" />
                    <h3 className="text-xl font-bold">✨ MORE DETAILED</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">Rich, detailed story using OpenAI. Takes ~38 seconds but much better quality.</p>
                  <p className="text-xs text-muted-foreground mt-2">Best for: Epic stories, longer narratives</p>
                </button>
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
          <Card className={`${cardClass} w-full ${isMobile ? 'max-w-sm' : 'max-w-lg'}`}>
            <CardContent className={`text-center space-y-6 ${isMobile ? 'py-8' : 'py-12'}`}>
              <Loader2 className={`animate-spin text-primary mx-auto ${isMobile ? 'h-12 w-12' : 'h-16 w-16'}`} />
              <div>
                <h2 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>GENERATING YOUR STORY</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  {generationMode === 'fast' ? 'Using Mistral AI for quick generation...' : 'Using OpenAI for detailed generation...'}
                </p>
              </div>

              <div className="space-y-2 px-4">
                <Progress value={planningProgress} className="h-3" />
                <p className="text-sm text-muted-foreground font-medium">{Math.floor(planningProgress)}%</p>
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

  // ========== PHASE: GENERATING / COMPLETE — Book Reader ==========
  return (
    <div className="min-h-screen flex flex-col">
      <PremiumBackground />
      <Header showTemporaryToggle={false} />

      {/* GENERATING BANNER */}
      {!allDone && (
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b-2 border-primary/20 text-center py-4 px-4">
          <p className="font-bold text-sm text-primary">
            ✨ GENERATING — {donePanels}/{totalPanels} images • {audiosDone}/{totalPanels} audio clips ready
          </p>
          <Progress value={overallProgress} className={`h-2.5 mt-2 mx-auto ${isMobile ? 'max-w-xs' : 'max-w-lg'}`} />
          <p className="text-xs text-muted-foreground mt-1">🎮 Play while you wait!</p>
          <div className="mt-3">
            <DinoGame />
          </div>
        </div>
      )}

      {/* AUDIOBOOK OVERLAY — locks everything when active */}
      {audiobookActive && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()} />
      )}

      {/* Audiobook controls bar */}
      {allDone && (
        <div className={`border-b-2 border-primary/20 py-3 px-4 flex items-center justify-center gap-3 flex-wrap ${audiobookActive ? 'fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-secondary shadow-[0_4px_30px_rgba(236,72,153,0.4)]' : 'bg-card/80'}`}>
          {!audiobookActive ? (
            <Button
              variant="outline"
              size="default"
              onClick={startAudiobook}
              className="gap-2 border-primary/40 hover:bg-primary/10 font-bold"
            >
              <Volume2 className="h-4 w-4" />
              🔊 Listen Audiobook
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={stopAudiobook}
                className="text-primary-foreground hover:bg-white/20 font-bold gap-2"
              >
                <Square className="h-4 w-4" /> STOP AUDIOBOOK
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleAudiobookPause} className="text-primary-foreground hover:bg-white/20">
                {audiobookPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              {/* Speed selector */}
              <div className="flex items-center gap-1">
                {SPEED_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAudiobookSpeed(opt.value)}
                    className={`text-xs px-2 py-1 rounded-full transition-all ${
                      audiobookSpeed === opt.value
                        ? 'bg-white/30 text-white font-bold'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {audiobookLoading && (
                <span className="text-xs text-white/80 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                </span>
              )}
            </>
          )}
        </div>
      )}

      <main className={`flex-1 flex flex-col items-center justify-center px-4 py-6 ${audiobookActive ? 'relative z-50' : ''}`}>
        {/* Title */}
        <h1 className={`font-bold mb-2 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${isMobile ? 'text-2xl' : 'text-4xl'}`}>{comicTitle}</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Scene {currentPage + 1} of {totalPanels}
        </p>

        {/* Story Page with SIDE NAVIGATION */}
        {currentPanel && (
          <div className={`w-full flex items-stretch gap-2 ${isMobile ? 'max-w-lg' : 'max-w-5xl'}`}>
            {/* LEFT ARROW */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="lg"
                disabled={currentPage === 0 || audiobookActive}
                onClick={() => setCurrentPage(p => p - 1)}
                className={`h-full p-0 rounded-xl hover:bg-primary/10 ${isMobile ? 'min-h-[200px] w-10' : 'min-h-[400px] w-14'}`}
              >
                <ChevronLeft className={isMobile ? 'h-6 w-6' : 'h-8 w-8'} />
              </Button>
            </div>

            {/* STORY CONTENT */}
            <div className="flex-1 space-y-0">
              {/* Dialogue — top */}
              <div className={`bg-card/80 backdrop-blur-sm border-2 border-primary/20 border-b-0 rounded-t-2xl flex items-center justify-center ${isMobile ? 'px-4 py-3 min-h-[48px]' : 'px-8 py-5 min-h-[70px]'}`}>
                {currentPanel.status === 'done' ? (
                  <p className={`text-center font-bold uppercase tracking-wide text-foreground ${isMobile ? 'text-base' : 'text-xl'}`}>
                    {currentPanel.dialogue || '...'}
                  </p>
                ) : (
                  <p className="text-center text-muted-foreground text-sm italic blur-sm select-none">
                    {currentPanel.dialogue || 'Loading...'}
                  </p>
                )}
              </div>

              {/* Image */}
              <div className={`relative bg-muted/20 border-x-2 border-primary/20 ${isMobile ? 'aspect-square' : 'aspect-[16/10]'}`}>
                {currentPanel.status === 'done' && currentPanel.imageUrl ? (
                  <div className="relative w-full h-full">
                    <img src={currentPanel.imageUrl} alt={currentPanel.caption} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-xs px-3 py-1.5 rounded-full border border-primary/20 font-medium">
                      {currentPanel.model}
                    </div>
                  </div>
                ) : currentPanel.status === 'generating' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Generating image...</p>
                  </div>
                ) : currentPanel.status === 'error' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                    <p className="text-destructive text-sm text-center">{currentPanel.errorMsg || 'Failed'}</p>
                    <Button size="sm" variant="outline" onClick={() => retryPanelImage(currentPage)} className="border-primary/30">
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
              <div className={`bg-card/80 backdrop-blur-sm border-2 border-primary/20 border-t-0 rounded-b-2xl flex items-center justify-center ${isMobile ? 'px-4 py-3 min-h-[64px]' : 'px-8 py-5 min-h-[80px]'}`}>
                {currentPanel.status === 'done' ? (
                  <p className={`text-center leading-relaxed text-muted-foreground ${isMobile ? 'text-sm' : 'text-lg'}`}>
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
                disabled={currentPage >= totalPanels - 1 || audiobookActive}
                onClick={() => setCurrentPage(p => p + 1)}
                className={`h-full p-0 rounded-xl hover:bg-primary/10 ${isMobile ? 'min-h-[200px] w-10' : 'min-h-[400px] w-14'}`}
              >
                <ChevronRight className={isMobile ? 'h-6 w-6' : 'h-8 w-8'} />
              </Button>
            </div>
          </div>
        )}

        {/* Page hint */}
        {!audiobookActive && (
          <p className="text-xs text-muted-foreground mt-3">Use ← → arrow keys to navigate</p>
        )}

        {/* Actions */}
        {allDone && !audiobookActive && (
          <div className="mt-6">
            <Button variant="outline" onClick={handleReset} className="border-primary/30 hover:bg-primary/5">
              <RotateCcw className="mr-2 h-4 w-4" /> Create Another Story
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ComicGen;
