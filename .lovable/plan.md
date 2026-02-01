
# Fix Website Generator - Multiple Issues

## Issues to Address

| Issue | Root Cause | Solution |
|-------|------------|----------|
| Auto-scroll not working | The useEffect only checks `loading` but scroll needs to happen on every `generatedCode` change | Use `requestAnimationFrame` for smoother scrolling on every code update |
| Remove Sonnet and GPT-5.2 | User wants only Haiku and Kimi K2 | Remove those models from both backend and frontend |
| "Generated successfully" with no code | Stream may complete without content validation | Add validation before showing success toast |
| Haiku produces broken code | Model may truncate output; system prompt can be improved | Improve system prompt with stricter instructions for complete code |
| Add Kimi K2 model | User wants `moonshotai/kimi-k2-instruct` as alternative | Add to model configs in backend and UI |

---

## Technical Changes

### File 1: `supabase/functions/web-gen/index.ts`

**1. Update MODELS - Remove Sonnet/GPT, Add Kimi K2:**

```typescript
const MODELS = {
  haiku: { name: 'anthropic/claude-haiku-4.5' },
  kimi: { name: 'moonshotai/kimi-k2-instruct' }
};
```

**2. Improve SYSTEM_PROMPT to prevent truncation:**

Add explicit instructions:
- "NEVER truncate or cut off your output mid-code"
- "Complete ALL CSS rules - no partial properties"
- "Complete ALL JavaScript functions"
- "Ensure every opening tag has a closing tag"

---

### File 2: `src/pages/WebGen.tsx`

**1. Fix Auto-Scroll - Use requestAnimationFrame:**

```typescript
// Replace current useEffect
useEffect(() => {
  if (codeContainerRef.current && generatedCode) {
    requestAnimationFrame(() => {
      if (codeContainerRef.current) {
        codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
      }
    });
  }
}, [generatedCode]);
```

**2. Update Model Types and Labels:**

```typescript
type ModelType = 'haiku' | 'kimi';

const MODEL_LABELS = {
  haiku: 'Claude Haiku 4.5',
  kimi: 'Kimi K2'
};

const LOADING_MESSAGES = {
  haiku: [...],
  kimi: [
    'Connecting to Kimi K2...',
    'Analyzing your request...',
    // ...rest
  ]
};
```

**3. Update Model Selector UI - Only 2 buttons:**

```tsx
<div className="flex gap-2">
  <Button
    variant={selectedModel === 'haiku' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setSelectedModel('haiku')}
    disabled={loading}
    className="flex-1 gap-1"
  >
    <Zap className="h-3.5 w-3.5" />
    Haiku
    <span className="text-xs opacity-70">(Fast)</span>
  </Button>
  <Button
    variant={selectedModel === 'kimi' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setSelectedModel('kimi')}
    disabled={loading}
    className="flex-1 gap-1"
  >
    <Sparkles className="h-3.5 w-3.5" />
    Kimi K2
    <span className="text-xs opacity-70">(Smart)</span>
  </Button>
</div>
```

**4. Add Code Validation Before Success Toast:**

```typescript
// After streaming completes
const code = accumulatedCode;
// ... cleanup

// Validate code before showing success
if (!code || code.trim().length < 100 || !code.includes('<!DOCTYPE')) {
  toast({
    title: "Generation incomplete",
    description: "The AI didn't produce complete code. Please try again.",
    variant: "destructive"
  });
  return;
}

// Only show success if code is valid
setGeneratedCode(code);
const blob = new Blob([code], { type: 'text/html' });
// ...
toast({
  title: "Website generated!",
  description: `Your website is ready (${MODEL_LABELS[selectedModel]})`,
});
```

---

## Updated System Prompt

```typescript
const SYSTEM_PROMPT = `You are an expert web developer creating BEAUTIFUL, FUNCTIONAL websites. Return ONLY valid HTML code - no markdown, no backticks, no explanations.

CRITICAL - NEVER TRUNCATE YOUR OUTPUT:
- Complete ALL code - do not stop mid-output
- Ensure every opening tag has a closing tag
- Complete ALL CSS rules - no partial properties like "color: var(--"
- Complete ALL JavaScript functions
- End with </html>

REQUIREMENTS:
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
8. ALWAYS end with </script></body></html>

OUTPUT: Complete HTML document with embedded CSS and JavaScript. Nothing else.`;
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `supabase/functions/web-gen/index.ts` | Remove Sonnet/GPT models, add Kimi K2, improve system prompt |
| `src/pages/WebGen.tsx` | Fix auto-scroll, update model selector to 2 buttons, add code validation |

---

## Expected Results After Changes

- Auto-scroll works smoothly during streaming
- Only Haiku and Kimi K2 model options
- No false "success" messages when code is empty/broken
- Better quality output with complete CSS/JS
- Haiku produces fully valid HTML with no truncation
