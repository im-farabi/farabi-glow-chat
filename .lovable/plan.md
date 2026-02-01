

# Add Claude 4.5 Streaming to Website Generator

## Overview

Integrate the Claude 4.5 model (same one used in main chat's "toolbox" mode) into the `/web` website generator for live code streaming. This will allow users to see the website code being written in real-time, character by character.

---

## Current State

| Component | Model | Status |
|-----------|-------|--------|
| `/web` generator | GPT-5.2 via `web-gen` | Working but slower |
| Main chat Claude | Claude 4.5 via `apifree-chat` | Working with streaming |

---

## Implementation Plan

### File 1: `supabase/functions/web-gen/index.ts`

**Add Claude 4.5 as an option alongside GPT-5.2:**

- Accept a `model` parameter: `'claude'` or `'gpt'` (default: `'claude'`)
- When `model === 'claude'`:
  - Use Claude Sonnet 4.5 (`anthropic/claude-sonnet-4.5`)
  - Use 16,000 token limit (sufficient for websites)
  - Apply web developer system prompt

```typescript
// Model configuration
const MODELS = {
  claude: {
    name: 'anthropic/claude-sonnet-4.5',
    maxTokens: 16000
  },
  gpt: {
    name: 'openai/gpt-5.2', 
    maxTokens: 38000
  }
};

// In request handler:
const { prompt, stream = true, model = 'claude' } = await req.json();
const modelConfig = MODELS[model] || MODELS.claude;
```

---

### File 2: `src/pages/WebGen.tsx`

**Update UI to use Claude by default and show model indicator:**

| Change | Description |
|--------|-------------|
| Default model | Send `model: 'claude'` to edge function |
| Loading messages | Update to say "Claude 4.5" instead of "GPT-5.2" |
| Header subtitle | Change "GPT-5.2" to "Claude 4.5" |
| Model badge | Add small badge showing which model is active |

**Update the fetch call:**

```typescript
// Before
body: JSON.stringify({ prompt: prompt.trim(), stream: true })

// After  
body: JSON.stringify({ 
  prompt: prompt.trim(), 
  stream: true,
  model: 'claude'  // Use Claude 4.5 for faster streaming
})
```

**Update loading messages:**

```typescript
const LOADING_MESSAGES = [
  'Connecting to Claude 4.5...',
  'Analyzing your request...',
  'Designing layout structure...',
  // ... rest
];
```

**Update description text:**

```typescript
// Before
<p>Describe your dream website and let GPT-5.2 build it for you</p>

// After
<p>Describe your dream website and let Claude 4.5 build it for you</p>
```

---

## Optional: Model Selector Toggle

Add a small toggle to let users switch between Claude 4.5 (faster) and GPT-5.2 (larger output):

```tsx
<div className="flex gap-2">
  <Button 
    variant={selectedModel === 'claude' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setSelectedModel('claude')}
  >
    Claude 4.5 (Fast)
  </Button>
  <Button
    variant={selectedModel === 'gpt' ? 'default' : 'outline'}  
    size="sm"
    onClick={() => setSelectedModel('gpt')}
  >
    GPT-5.2 (Large)
  </Button>
</div>
```

---

## Architecture Flow

```text
User Input (WebGen.tsx)
         │
         ▼
   ┌─────────────────┐
   │  web-gen edge   │
   │    function     │
   └────────┬────────┘
            │
     model === 'claude'?
            │
    ┌───────┴───────┐
    ▼               ▼
┌────────┐    ┌──────────┐
│Claude  │    │ GPT-5.2  │
│4.5     │    │          │
└────┬───┘    └────┬─────┘
     │             │
     └──────┬──────┘
            │
            ▼
   SSE Stream → Frontend
         │
         ▼
   Live Code Display
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/web-gen/index.ts` | Add Claude 4.5 model option with lower token limit |
| `src/pages/WebGen.tsx` | Default to Claude, update UI text, optional model toggle |

---

## Benefits

- **Faster streaming**: Claude 4.5 streams code faster than GPT-5.2
- **Live preview**: See code appear character-by-character
- **Consistent**: Uses same model/API as main chat's Claude mode
- **Fallback**: Can still use GPT-5.2 if needed for very large websites

