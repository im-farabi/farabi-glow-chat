
# Fix Website Generator - Auto-scroll, Better CSS/JS, No Token Limits

## Issues to Fix

| Issue | Problem | Solution |
|-------|---------|----------|
| No auto-scroll | Code streams but view doesn't scroll down | Add ref and auto-scroll to bottom during streaming |
| No auto-switch to code | User can't see streaming in action | Switch to "Code" tab when generation starts, then to "Preview" when done |
| Random/plain websites | System prompt isn't explicit enough about CSS/JS | Improve system prompt with detailed design requirements |
| Token limits | 16k/38k limits may truncate output | Remove max_tokens limit (let API decide) |

---

## Technical Changes

### File 1: `supabase/functions/web-gen/index.ts`

**1. Remove token limits:**

```typescript
// BEFORE
const MODELS = {
  haiku: { name: 'anthropic/claude-haiku-4.5', maxTokens: 16000 },
  claude: { name: 'anthropic/claude-sonnet-4.5', maxTokens: 16000 },
  gpt: { name: 'openai/gpt-5.2', maxTokens: 38000 }
};

// AFTER - No maxTokens, let API use full capacity
const MODELS = {
  haiku: { name: 'anthropic/claude-haiku-4.5' },
  claude: { name: 'anthropic/claude-sonnet-4.5' },
  gpt: { name: 'openai/gpt-5.2' }
};
```

**2. Improve system prompt for better CSS/JS:**

```typescript
const SYSTEM_PROMPT = `You are an expert web developer creating BEAUTIFUL, FUNCTIONAL websites. Return ONLY valid HTML code - no markdown, no backticks, no explanations.

CRITICAL REQUIREMENTS:
1. Start with <!DOCTYPE html> - complete valid HTML5 document
2. Include EXTENSIVE CSS in <style> tag in <head>:
   - Modern gradients and color schemes
   - Glassmorphism effects (backdrop-blur, semi-transparent backgrounds)
   - Smooth animations and transitions
   - Flexbox and CSS Grid layouts
   - Responsive design with media queries
   - Custom scrollbars
   - Hover effects and micro-interactions
   - Google Fonts for typography

3. Include FUNCTIONAL JavaScript in <script> before </body>:
   - Interactive elements (menus, modals, tabs)
   - Form validation if forms exist
   - Smooth scroll behavior
   - Dynamic content updates
   - Animation triggers

4. Use CDN resources:
   - Google Fonts: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
   - Font Awesome: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

5. Default to DARK THEME unless user asks for light theme
6. Mobile-first responsive design
7. NO placeholder content - real, complete working code

OUTPUT: Complete HTML document with embedded CSS and JavaScript. Nothing else.`;
```

---

### File 2: `src/pages/WebGen.tsx`

**1. Add code container ref for auto-scroll:**

```typescript
const codeContainerRef = useRef<HTMLDivElement>(null);
```

**2. Auto-scroll during streaming:**

```typescript
// Add useEffect to auto-scroll when generatedCode changes
useEffect(() => {
  if (loading && codeContainerRef.current) {
    codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
  }
}, [generatedCode, loading]);
```

**3. Switch to "code" tab when generation starts:**

```typescript
// In generateWebsite function, after setting loading:
setLoading(true);
setGeneratedCode('');
setActiveTab('code');  // ← Switch to code tab immediately
```

**4. Add ref to code container div:**

```tsx
// Update the code display div
<div 
  ref={codeContainerRef}
  className="h-full overflow-auto rounded-lg bg-background/80 border border-border/50"
>
  <pre className="p-4 text-sm text-foreground font-mono whitespace-pre-wrap break-words">
    <code>{generatedCode}</code>
  </pre>
</div>
```

**5. Show streaming code even during loading (instead of showing loading animation in code tab):**

```tsx
<TabsContent value="code" className="h-full m-0">
  {generatedCode || loading ? (
    <div 
      ref={codeContainerRef}
      className="h-full overflow-auto rounded-lg bg-background/80 border border-border/50"
    >
      <pre className="p-4 text-sm text-foreground font-mono whitespace-pre-wrap break-words">
        <code>{generatedCode}</code>
        {loading && (
          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
        )}
      </pre>
    </div>
  ) : (
    // Empty state...
  )}
</TabsContent>
```

---

## User Flow After Changes

```text
User clicks "Generate Website"
         │
         ▼
┌─────────────────────────────┐
│  Switch to CODE tab         │
│  Start streaming...         │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Code streams in real-time  │
│  Auto-scroll to bottom ↓    │
│  Cursor blinks at end       │
└─────────────────────────────┘
         │
         ▼ (Done)
┌─────────────────────────────┐
│  Switch to PREVIEW tab      │
│  Show live website          │
│  Toast: "Website generated!"│
└─────────────────────────────┘
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/web-gen/index.ts` | Remove token limits, improve system prompt for CSS/JS |
| `src/pages/WebGen.tsx` | Add auto-scroll, switch tabs automatically, show blinking cursor |

---

## Expected Results

After these changes:
- Click Generate → automatically switches to Code tab
- Code streams in real-time with auto-scroll to bottom
- Blinking cursor shows where new code is appearing
- When complete → automatically switches to Preview tab
- Websites include beautiful CSS styling and functional JavaScript
- No output truncation due to token limits
