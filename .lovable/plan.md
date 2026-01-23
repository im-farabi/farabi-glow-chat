

# Personal Notes Feature Implementation Plan

## Overview

Create a personal note-taking feature at `/notes` with the premium glassmorphic theme matching the main chat interface. The feature will allow users to add, edit, delete notes with rich text formatting support. A "SAVE NOTES" button will be added to the `/book` section (specifically in `BookReader.tsx`) to redirect users to the notes page.

---

## Feature Details

### Notes Structure
- **Heading**: Title of the note (required, 3-100 characters)
- **Body Text**: Note content with formatting support (required, 10-5000 characters)
- **Timestamp**: Auto-generated on creation/update
- **ID**: Unique identifier for each note

### Text Formatting (Discord-like)
| Syntax | Result |
|--------|--------|
| `**text**` | **Bold text** |
| `__text__` | <u>Underlined text</u> |
| `https://...` | Clickable link |

### Storage
Notes will be stored in **localStorage** (no database needed), consistent with other history features in the app (image history, MCQ history, flashcard history, voice history).

---

## Files to Create

### 1. `src/pages/NotesPage.tsx` - Main Notes Page

**Features:**
- Premium glassmorphic UI matching the main chat theme
- "ADD NOTE" floating action button
- Notes list showing all saved notes with:
  - Title preview
  - Body preview (first 100 chars)
  - Timestamp
  - Edit/Delete actions
- Add/Edit dialog with:
  - Heading input field
  - Body textarea with character count
  - Preview of formatted text
  - Save/Cancel buttons
- Empty state when no notes exist
- Confirmation dialog for delete

**UI Components:**
- PremiumBackground
- Header with back navigation
- Card components with glassmorphic styling
- Dialog for add/edit
- AlertDialog for delete confirmation

---

### 2. `src/lib/notesStorage.ts` - Notes Storage Functions

**Interfaces:**
```typescript
interface Note {
  id: string;
  heading: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}
```

**Functions:**
- `getAllNotes(): Note[]` - Get all notes sorted by updatedAt
- `getNote(id: string): Note | null` - Get single note
- `saveNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note` - Create new note
- `updateNote(id: string, updates: Partial<Note>): Note | null` - Update existing note
- `deleteNote(id: string): void` - Delete note by ID

**Storage Key:** `farabi_personal_notes`

---

## Files to Modify

### 1. `src/App.tsx`
- Add import for `NotesPage`
- Add route: `<Route path="/notes" element={<NotesPage />} />`

### 2. `src/pages/BookReader.tsx`
- Add "SAVE NOTES" button in the header or as a floating action button
- Button navigates to `/notes` when clicked
- Positioned alongside the existing chat button

### 3. `src/components/Sidebar.tsx`
- Add "Notes" navigation link in the sidebar quick actions section
- Icon: `StickyNote` from lucide-react

---

## UI Design Specifications

### Color Theme
- Primary gradient: Pink (#EC4899) to Purple (#A855F7)
- Cards: `bg-card/60 backdrop-blur-xl`
- Shadows: `shadow-[0_8px_32px_rgba(236,72,153,0.15)]`
- Border: `border-border/50` with pink/purple hover effects

### Note Card Design
```text
┌────────────────────────────────────────┐
│ 📝 Note Title                    ⋮     │
│                                        │
│ Preview of note body text...           │
│                                        │
│ 🕐 Jan 23, 2026 at 2:30 PM            │
└────────────────────────────────────────┘
```

### Add/Edit Dialog
```text
┌─────────────────────────────────────────┐
│           Add New Note                  │
├─────────────────────────────────────────┤
│                                         │
│  Heading *                              │
│  ┌───────────────────────────────────┐  │
│  │ Enter note title                  │  │
│  └───────────────────────────────────┘  │
│  3/100 characters                       │
│                                         │
│  Body *                                 │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │ Enter note content...             │  │
│  │ Use **bold** __underline__        │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│  10/5000 characters                     │
│                                         │
│  Preview                                │
│  ┌───────────────────────────────────┐  │
│  │ Formatted preview of body text    │  │
│  └───────────────────────────────────┘  │
│                                         │
│         [Cancel]    [Save Note]         │
└─────────────────────────────────────────┘
```

### Text Formatting Preview
The preview section will render:
- `**text**` as bold
- `__text__` as underlined
- URLs as clickable links (blue, underlined)

---

## Technical Details

### Text Formatting Function
```typescript
function formatNoteText(text: string): React.ReactNode {
  // 1. Split by formatting patterns
  // 2. Bold: /\*\*(.*?)\*\*/g → <strong>$1</strong>
  // 3. Underline: /__(.*?)__/g → <u>$1</u>
  // 4. Links: /(https?:\/\/[^\s]+)/g → <a href="$1">$1</a>
  // 5. Preserve newlines with whitespace-pre-wrap
}
```

### BookReader Integration
The "SAVE NOTES" button will be placed:
- As a second floating action button below the existing chat button
- Or in the sticky header alongside the back button

---

## Implementation Order

1. Create `src/lib/notesStorage.ts` - Storage layer
2. Create `src/pages/NotesPage.tsx` - Main page with all UI
3. Update `src/App.tsx` - Add route
4. Update `src/pages/BookReader.tsx` - Add "SAVE NOTES" button
5. Update `src/components/Sidebar.tsx` - Add navigation link

---

## Accessibility & Mobile

- Full mobile responsiveness with touch-friendly targets
- Proper ARIA labels on all interactive elements
- Keyboard navigation support in dialogs
- Safe area padding for mobile devices
- Swipe gestures consideration for delete actions

