import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getNote } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Flag, Home, ArrowUp } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ShareButton } from '@/components/ShareButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const themeClasses = {
  'black-purple': {
    background: 'glass-card',
    title: 'bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500 bg-clip-text text-transparent',
    text: 'text-purple-50',
    border: 'border-purple-400/40',
    shortDesc: 'text-purple-200',
    glow: 'shadow-[0_0_60px_rgba(168,85,247,0.5),0_0_30px_rgba(168,85,247,0.3)]',
    accent: 'purple' as const,
  },
  'black-white': {
    background: 'glass-card',
    title: 'bg-gradient-to-r from-gray-100 via-white to-gray-200 bg-clip-text text-transparent',
    text: 'text-gray-100',
    border: 'border-gray-300/40',
    shortDesc: 'text-gray-200',
    glow: 'shadow-[0_0_60px_rgba(255,255,255,0.3),0_0_30px_rgba(255,255,255,0.2)]',
    accent: 'white' as const,
  },
  'black-orange': {
    background: 'glass-card',
    title: 'bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent',
    text: 'text-orange-50',
    border: 'border-orange-400/40',
    shortDesc: 'text-orange-200',
    glow: 'shadow-[0_0_60px_rgba(249,115,22,0.5),0_0_30px_rgba(249,115,22,0.3)]',
    accent: 'orange' as const,
  },
};

export default function ViewNote() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const fetchNote = async () => {
    if (!slug) return;

    setLoading(true);
    try {
      const result = await getNote(slug);
      if (result?.success) {
        setNote(result.note);
      } else if (result?.note) {
        setNote(result.note);
      } else if (result?.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNote();
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <AnimatedBackground theme="purple" />
        <div className="max-w-4xl mx-auto px-6 w-full space-y-8 animate-fade-in">
          <div className="glass-card p-8 md:p-12">
            <Skeleton className="h-12 w-3/4 mb-4 bg-purple-500/20" />
            <Skeleton className="h-6 w-full mb-2 bg-purple-500/10" />
            <Skeleton className="h-6 w-5/6 mb-6 bg-purple-500/10" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full bg-purple-500/10" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }


  if (!note) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <AnimatedBackground theme="purple" />
        <div className="text-center glass-card p-12 max-w-md animate-scale-in">
          <div className="text-6xl mb-6 animate-pulse">📝</div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
            Note Not Found
          </h1>
          <p className="text-gray-300 mb-6">The note you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')} variant="outline" className="glass-card">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const theme = themeClasses[note.color_theme as keyof typeof themeClasses] || themeClasses['black-purple'];
  const currentUrl = window.location.href;

  return (
    <div className="min-h-screen bg-black relative">
      <Helmet>
        <title>A user sent you a note. Click the link to view</title>
        <meta name="description" content="This is a note made by a user. Make notes and publish for free without sign up required. FARABI.me to get started!" />
        <meta property="og:title" content="A user sent you a note. Click the link to view" />
        <meta property="og:description" content="This is a note made by a user. Make notes and publish for free without sign up required. FARABI.me to get started!" />
        <meta property="og:url" content={currentUrl} />
        <meta property="twitter:title" content="A user sent you a note. Click the link to view" />
        <meta property="twitter:description" content="This is a note made by a user. Make notes and publish for free without sign up required. FARABI.me to get started!" />
      </Helmet>
      
      <AnimatedBackground theme={theme.accent} />
      
      {/* Header Section */}
      <header 
        className="relative backdrop-blur-xl bg-white/5 py-8 px-6 shadow-lg border-b border-white/10 animate-fade-in"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 animate-slide-in-right">
              FARABI.me
            </h1>
            <p className="text-white/90 text-lg">Best Tool for Students!</p>
          </div>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="glass-card border-white/30 text-white hover:border-white/50 hover:scale-105 transition-all duration-300"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>
      </header>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <div 
          className={`${theme.background} ${theme.border} ${theme.glow} border-[3px] rounded-2xl p-8 md:p-12 backdrop-blur-3xl bg-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:scale-[1.01] transition-all duration-500 animate-scale-in`}
          style={{ animationDelay: '0.3s' }}
        >
          {/* Title with gradient animation */}
          <h2 
            className={`${theme.title} text-4xl md:text-6xl font-bold mb-6 animate-fade-in`}
            style={{ animationDelay: '0.5s' }}
          >
            {note.title}
          </h2>
          
          {/* Short Description */}
          {note.short_description && (
            <p 
              className={`${theme.shortDesc} text-lg md:text-xl mb-8 italic border-l-4 ${theme.border} pl-4 animate-fade-in`}
              style={{ animationDelay: '0.6s' }}
            >
              {note.short_description}
            </p>
          )}
          
          {/* Main Content */}
          <div 
            className={`${theme.text} text-base md:text-lg whitespace-pre-wrap break-words leading-relaxed mb-8 animate-fade-in`}
            style={{ animationDelay: '0.7s' }}
          >
            {note.description}
          </div>

          {/* Share Buttons */}
          <div className="border-t border-border/20 pt-6 mt-6">
            <ShareButton url={currentUrl} title={note.title} />
          </div>
        </div>

        {/* Stats */}
        <div 
          className="mt-6 text-center text-sm text-muted-foreground animate-fade-in"
          style={{ animationDelay: '0.9s' }}
        >
          {note.views_count && (
            <p>👁️ {note.views_count} views</p>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <footer className="py-12 flex justify-center relative z-10 animate-fade-in" style={{ animationDelay: '1s' }}>
        <button
          className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-all duration-300 group glass-card px-6 py-3 rounded-full hover:scale-105"
          onClick={() => toast({ 
            title: 'Report Feature', 
            description: 'Reporting system coming soon!',
          })}
        >
          <Flag className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Report Note</span>
        </button>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 glass-card p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-50 animate-fade-in border border-primary/30"
        >
          <ArrowUp className="h-5 w-5 text-primary" />
        </button>
      )}
    </div>
  );
}
