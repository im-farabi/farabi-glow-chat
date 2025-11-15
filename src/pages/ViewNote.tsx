import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { getNote } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Flag } from 'lucide-react';

const themeClasses = {
  'black-purple': {
    background: 'bg-gradient-to-br from-purple-950 to-black',
    title: 'text-purple-300',
    text: 'text-purple-100',
    border: 'border-purple-500/30',
    shortDesc: 'text-purple-200/80',
  },
  'black-white': {
    background: 'bg-gradient-to-br from-gray-900 to-black',
    title: 'text-white',
    text: 'text-gray-200',
    border: 'border-gray-500/30',
    shortDesc: 'text-gray-300/80',
  },
  'black-orange': {
    background: 'bg-gradient-to-br from-orange-950 to-black',
    title: 'text-orange-300',
    text: 'text-orange-100',
    border: 'border-orange-500/30',
    shortDesc: 'text-orange-200/80',
  },
};

export default function ViewNote() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchNote = async (pwd?: string) => {
    if (!slug) return;

    setLoading(true);
    try {
      const result = await getNote(slug, pwd);
      
      // Check if password is required
      if (result.passwordRequired) {
        setPasswordRequired(true);
        if (pwd) {
          toast({ title: 'Error', description: 'Incorrect password', variant: 'destructive' });
        }
      } else if (result.success) {
        setNote(result.note);
        setPasswordRequired(false);
      } else if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    fetchNote();
  }, [slug]);

  const handlePasswordSubmit = async () => {
    if (!password) {
      toast({ title: 'Error', description: 'Please enter a password', variant: 'destructive' });
      return;
    }
    setIsVerifying(true);
    await fetchNote(password);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (passwordRequired) {
    const theme = themeClasses['black-purple']; // Default theme for password screen
    
    return (
      <div className="min-h-screen bg-background">
        {/* Header Section */}
        <header className="bg-gradient-to-r from-primary to-purple-600 py-8 px-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">FARABI.me</h1>
            <p className="text-white/90 text-lg">Best Tool for Students!</p>
          </div>
        </header>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className={`${theme.background} ${theme.border} border-2 rounded-2xl p-8 md:p-12 shadow-2xl`}>
            <h2 className={`${theme.title} text-4xl md:text-5xl font-bold mb-8 text-center`}>
              🔒 Password Protected Note
            </h2>
            
            <div className="max-w-md mx-auto space-y-4">
              <p className={`${theme.text} text-center mb-6 text-lg`}>
                This note is password protected. Enter the password to view the content.
              </p>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-background/50 border-border"
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              <Button 
                onClick={handlePasswordSubmit} 
                disabled={isVerifying}
                className="w-full"
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Unlock Note
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Note Not Found</h1>
          <p className="text-muted-foreground">The note you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const theme = themeClasses[note.color_theme as keyof typeof themeClasses] || themeClasses['black-purple'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <header className="bg-gradient-to-r from-primary to-purple-600 py-8 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">FARABI.me</h1>
          <p className="text-white/90 text-lg">Best Tool for Students!</p>
        </div>
      </header>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className={`${theme.background} ${theme.border} border-2 rounded-2xl p-8 md:p-12 shadow-2xl`}>
          <h2 className={`${theme.title} text-4xl md:text-5xl font-bold mb-4`}>
            {note.title}
          </h2>
          
          {note.short_description && (
            <p className={`${theme.shortDesc} text-lg md:text-xl mb-6 italic`}>
              {note.short_description}
            </p>
          )}
          
          <div className={`${theme.text} text-base md:text-lg whitespace-pre-wrap break-words leading-relaxed`}>
            {note.description}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="py-12 flex justify-center">
        <button
          className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors group"
          onClick={() => toast({ 
            title: 'Report Feature', 
            description: 'Reporting system coming soon!',
          })}
        >
          <Flag className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Report</span>
        </button>
      </footer>
    </div>
  );
}
