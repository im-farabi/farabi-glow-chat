// Personal Notes Storage

export interface Note {
  id: string;
  heading: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'farabi_personal_notes';

export function getAllNotes(): Note[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const notes: Note[] = JSON.parse(stored);
    // Sort by updatedAt descending (newest first)
    return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function getNote(id: string): Note | null {
  const notes = getAllNotes();
  return notes.find(n => n.id === id) || null;
}

export function saveNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
  const notes = getAllNotes();
  const now = Date.now();
  const newNote: Note = {
    id: `note-${now}-${Math.random().toString(36).slice(2, 9)}`,
    heading: note.heading,
    body: note.body,
    createdAt: now,
    updatedAt: now
  };
  notes.push(newNote);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  return newNote;
}

export function updateNote(id: string, updates: Partial<Pick<Note, 'heading' | 'body'>>): Note | null {
  const notes = getAllNotes();
  const index = notes.findIndex(n => n.id === id);
  if (index === -1) return null;
  
  notes[index] = {
    ...notes[index],
    ...updates,
    updatedAt: Date.now()
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  return notes[index];
}

export function deleteNote(id: string): void {
  const notes = getAllNotes();
  const filtered = notes.filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Format note text with Discord-like syntax - returns HTML string
export function formatNoteText(text: string): string {
  if (!text) return '';
  
  let formatted = text;
  
  // Bold: **text**
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  
  // Underline: __text__
  formatted = formatted.replace(/__(.+?)__/g, '<u>$1</u>');
  
  // Links: https://...
  formatted = formatted.replace(
    /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:opacity-80">$1</a>'
  );
  
  return formatted;
}
