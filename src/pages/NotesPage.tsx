import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, StickyNote, MoreVertical, Edit2, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from "dompurify";
import PremiumBackground from "@/components/PremiumBackground";
import { getAllNotes, getNote, saveNote, updateNote, deleteNote, formatNoteText, type Note } from "@/lib/notesStorage";

const NotesPage = () => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  
  // Form state
  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    setNotes(getAllNotes());
  };

  const resetForm = () => {
    setHeading("");
    setBody("");
    setEditingNote(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (note: Note) => {
    setEditingNote(note);
    setHeading(note.heading);
    setBody(note.body);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    // Validation
    if (heading.trim().length < 3) {
      toast({
        title: "Heading too short",
        description: "Heading must be at least 3 characters",
        variant: "destructive"
      });
      return;
    }
    if (body.trim().length < 10) {
      toast({
        title: "Body too short",
        description: "Body must be at least 10 characters",
        variant: "destructive"
      });
      return;
    }

    if (editingNote) {
      updateNote(editingNote.id, { heading: heading.trim(), body: body.trim() });
      toast({ title: "Note updated!" });
    } else {
      saveNote({ heading: heading.trim(), body: body.trim() });
      toast({ title: "Note saved!" });
    }

    setIsDialogOpen(false);
    resetForm();
    loadNotes();
  };

  const handleDeleteConfirm = () => {
    if (deleteNoteId) {
      deleteNote(deleteNoteId);
      toast({ title: "Note deleted!" });
      setIsDeleteDialogOpen(false);
      setDeleteNoteId(null);
      loadNotes();
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteNoteId(id);
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getPreview = (text: string, maxLength = 100) => {
    // Strip formatting for preview
    const stripped = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1');
    return stripped.length > maxLength ? stripped.slice(0, maxLength) + '...' : stripped;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <PremiumBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="p-4 md:p-6 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              My Notes
            </h1>
          </div>
          <Button
            onClick={handleOpenAddDialog}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white font-bold px-6 py-3 text-base"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
        {notes.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 
              border border-primary/30 flex items-center justify-center mb-6">
              <StickyNote className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No notes yet</h2>
            <p className="text-muted-foreground text-center mb-6">
              Start by adding your first note!
            </p>
            <Button
              onClick={handleOpenAddDialog}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Note
            </Button>
          </div>
        ) : (
          // Notes List
          <div className="space-y-5">
            {notes.map((note) => (
              <HoverCard key={note.id} openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Card
                    className="bg-card/60 backdrop-blur-xl border-border/50 p-5 md:p-6
                      shadow-[0_8px_32px_rgba(236,72,153,0.1)] hover:shadow-[0_8px_32px_rgba(236,72,153,0.25)]
                      transition-all duration-300 group cursor-pointer hover:scale-[1.01]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <StickyNote className="w-5 h-5 text-primary flex-shrink-0" />
                          <h3 className="font-bold text-lg md:text-xl text-foreground truncate">{note.heading}</h3>
                        </div>
                        <p className="text-muted-foreground text-base font-medium line-clamp-2">
                          {getPreview(note.body, 150)}
                        </p>
                        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground font-medium">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(note.updatedAt)}</span>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(note)} className="font-semibold">
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(note.id)}
                            className="text-destructive font-semibold"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                </HoverCardTrigger>
                <HoverCardContent 
                  className="w-[400px] md:w-[500px] max-h-[400px] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(236,72,153,0.2)]"
                  side="right"
                  align="start"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <StickyNote className="w-5 h-5 text-primary" />
                      <h4 className="font-bold text-lg text-foreground">{note.heading}</h4>
                    </div>
                    <div 
                      className="text-foreground text-base whitespace-pre-wrap break-words leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatNoteText(note.body)) }}
                    />
                    <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground border-t border-border/50">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(note.updatedAt)}</span>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              {editingNote ? 'Edit Note' : 'Add New Note'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Heading */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Heading <span className="text-destructive">*</span>
              </label>
              <Input
                value={heading}
                onChange={(e) => setHeading(e.target.value.slice(0, 100))}
                placeholder="Enter note title"
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground mt-1">{heading.length}/100 characters</p>
            </div>

            {/* Body */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Body <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 5000))}
                placeholder="Enter note content...&#10;Use **bold** __underline__ https://links"
                className="bg-background/50 min-h-[150px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{body.length}/5000 characters</p>
            </div>

            {/* Preview */}
            {body.length > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Preview</label>
                <div 
                  className="bg-background/50 border border-border/50 rounded-lg p-3 text-sm whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatNoteText(body)) }}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white"
            >
              {editingNote ? 'Update Note' : 'Save Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The note will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NotesPage;
