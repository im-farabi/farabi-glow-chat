

# Website Generator Improvements Plan

## Problem 1: AI Remakes Entire Code When Editing

### Current Issue
The edit prompt tells the AI:
```
"Return the complete updated HTML."
```
This instructs the AI to regenerate the entire website even for small changes.

### Solution
Update the system prompt and edit prompt to instruct the AI to:
1. Only modify the specific section requested
2. Keep all other code exactly the same
3. Use a "diff-style" approach mentally

### Changes to `supabase/functions/web-gen/index.ts`

Add an `EDIT_SYSTEM_PROMPT` specifically for edits:

```typescript
const EDIT_SYSTEM_PROMPT = `You are an expert web developer making TARGETED edits to existing code.

CRITICAL RULES FOR EDITING:
1. ONLY modify the specific part the user requested
2. Keep ALL other code EXACTLY the same - do not rewrite or "improve" unchanged sections
3. Preserve the original structure, styling, and formatting
4. Return the complete HTML but with MINIMAL changes
5. Do NOT add new features, sections, or improvements unless specifically asked
6. Do NOT change colors, fonts, or styles unless specifically asked

Think of yourself as a surgeon - precise, minimal incisions, leave everything else untouched.`;
```

### Changes to `src/pages/WebGen.tsx`

Update the edit prompt (line 169-170):

```typescript
const fullPrompt = isEdit 
  ? `EXISTING CODE TO EDIT:\n\`\`\`html\n${generatedCode}\n\`\`\`\n\nUSER'S SPECIFIC REQUEST:\n"${prompt}"\n\nIMPORTANT: Make ONLY the change requested above. Keep everything else EXACTLY the same. Return the full HTML with the minimal targeted edit.`
  : prompt;
```

Also pass an `isEdit` flag to the edge function so it can use the correct system prompt.

---

## Problem 2: Better Technology Than HTML/CSS/JS

### Current Limitations of HTML/CSS/JS
- No database or backend functionality
- No user authentication
- Limited interactivity without external services
- Can't process payments, send emails, etc.

### Recommended Alternatives

| Technology | What It Enables | Complexity |
|------------|-----------------|------------|
| **React (JSX)** | Component-based UI, state management, more complex interactions | Medium |
| **React + TailwindCSS** | Modern styling, utility classes, faster development | Medium |
| **Svelte** | Simpler than React, compiles to vanilla JS, very fast | Medium |
| **Vue (Single File Components)** | Easy to learn, good for interactive apps | Medium |
| **Astro** | Static site generation with islands of interactivity | Low-Medium |

### Best Option for FARABI: React + TailwindCSS

This is actually what Lovable itself uses! Benefits:
- Can run directly in CodeSandbox, StackBlitz, or similar
- Modern component architecture
- TailwindCSS for rapid styling
- Can add Supabase for backend (auth, database, storage)
- Much more maintainable than a single HTML file

### Implementation Approach

Add a new option in the website type selection:

```typescript
const TYPE_OPTIONS = [
  { id: 'premium', label: 'Rich & Premium', desc: 'Luxurious HTML site' },
  { id: 'detailed', label: 'Fully Detailed', desc: 'Complete HTML site' },
  { id: 'static', label: 'Static Testing', desc: 'Simple HTML site' },
  { id: 'react', label: 'React App', desc: 'Modern component-based app' }  // NEW
];
```

For React output, the system prompt would generate:
- A complete React component with TailwindCSS
- Can be exported and run in any React environment
- More functional, maintainable, and extensible

---

## Summary of Changes

| File | Changes |
|------|---------|
| `supabase/functions/web-gen/index.ts` | Add `EDIT_SYSTEM_PROMPT`, accept `isEdit` parameter, use different prompt for edits |
| `src/pages/WebGen.tsx` | Update edit prompt wording, pass `isEdit` flag, optionally add React output type |

---

## Technical Details

### Edge Function Update

```typescript
// Add separate prompt for edits
const EDIT_SYSTEM_PROMPT = `You are making TARGETED edits to existing HTML code.

RULES:
1. ONLY change what the user specifically asked for
2. Keep ALL other code exactly the same
3. Do NOT rewrite, reorganize, or "improve" unchanged parts
4. Do NOT change styling unless asked
5. Return complete HTML with minimal changes`;

// In the handler, check for isEdit flag
const { prompt, stream = true, model = 'gemini', isEdit = false } = await req.json();

// Use appropriate system prompt
const systemPrompt = isEdit ? EDIT_SYSTEM_PROMPT : SYSTEM_PROMPT;
```

### Frontend Update

```typescript
// Pass isEdit flag to edge function
body: JSON.stringify({ 
  prompt: fullPrompt, 
  stream: true,
  model: selectedModel,
  isEdit: isEdit  // NEW
}),
```

---

## Expected Outcome

After these changes:
- Editing "remove the about button" will ONLY remove that button
- The rest of the code stays exactly the same
- Much faster edits (less tokens to generate)
- Optional: React output for more functional websites

