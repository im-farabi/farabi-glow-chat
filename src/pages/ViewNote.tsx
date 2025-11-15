import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { NotePreview } from '@/components/NotePreview';
import { getNote } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye } from 'lucide-react';

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
      if (result.success) {
        setNote(result.note);
        setPasswordRequired(false);
      }
    } catch (error: any) {
      if (error.message.includes('Password required') || error.message.includes('Incorrect password')) {
        setPasswordRequired(true);
        if (pwd) {
          toast({ title: 'Error', description: 'Incorrect password', variant: 'destructive' });
        }
      } else if (error.message.includes('not found')) {
        toast({ title: 'Error', description: 'Note not found', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Password Protected</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This note is password protected. Please enter the password to view it.
              </p>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
            </div>
            <DialogFooter>
              <Button onClick={handlePasswordSubmit} disabled={isVerifying}>
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Unlock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{note.views_count || 0} views</span>
          </div>
        </div>
        
        <NotePreview
          title={note.title}
          shortDescription={note.short_description}
          description={note.description}
          colorTheme={note.color_theme}
          className="min-h-[500px]"
        />
      </div>
    </div>
  );
}