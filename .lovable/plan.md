

# Model-Specific Prompt Optimization for Better Quality

## Problem Analysis

Based on user feedback and model behavior:

| Model | Strength | Weakness |
|-------|----------|----------|
| **Claude** (`claude`) | Complete functionality, all features work | Can lack visual polish, glass effects, luxury feel |
| **GPT 5.2** (`openai-large`) | Stunning visuals, glass cards, luxury aesthetic | Often skips functionality, just makes pretty UI shells |
| **Qwen Coder** (`qwen-coder`) | Good code structure | Needs explicit guidance for both design and function |

## Solution: Model-Specific System Prompt Enhancements

Instead of one generic system prompt, we'll add model-specific "enhancement layers" that address each model's weaknesses while leveraging their strengths.

---

## Implementation

### File: `supabase/functions/web-gen/index.ts`

### 1. Add Model-Specific Enhancement Functions (after line 170)

```typescript
// Model-specific enhancements to address each model's weaknesses
function getModelEnhancement(modelKey: string): string {
  switch (modelKey) {
    case 'claude':
      // Claude is great at functionality but needs visual polish
      return `

VISUAL DESIGN PRIORITY (Claude-specific):
You tend to focus too much on functionality. For this request, ALSO prioritize:
- Premium visual aesthetics with glassmorphism (backdrop-blur, bg-opacity, glass cards)
- Gradient backgrounds (linear-gradient, radial-gradient with multiple color stops)
- Box shadows with multiple layers for depth (0 4px 6px, 0 10px 15px, 0 20px 25px)
- Hover effects that feel expensive (scale, glow, color transitions)
- Professional spacing and visual hierarchy
- Make it look like a $10,000 professionally designed website
- Include visual polish ALONGSIDE full functionality`;

    case 'gpt':
      // GPT is great at visuals but needs complete functionality
      return `

COMPLETE FUNCTIONALITY PRIORITY (GPT-specific):
You tend to focus too much on visuals and create beautiful but empty shells. For this request:
- Every button MUST have working onclick handlers
- Every form MUST have validation and submit logic
- Navigation MUST work (use hash routing or show/hide sections)
- Include REAL mock data (names, descriptions, images from picsum.photos)
- Modals and dropdowns MUST open/close properly
- Include ALL features the user asked for, not just the pretty UI
- If it's a YouTube clone: working video player, functional like/share buttons, comment system
- If it's a dashboard: charts with real data, working filters, functional tables
- Don't sacrifice functionality for aesthetics - include BOTH`;

    case 'qwen':
      // Qwen needs guidance on both visual and functional aspects
      return `

BALANCED QUALITY PRIORITY (Qwen-specific):
Create a website that excels in BOTH visual design AND functionality:

VISUALS:
- Use Tailwind CSS for styling
- Add glassmorphism effects (backdrop-blur-xl, bg-white/10)
- Include gradients and shadows for depth
- Smooth CSS transitions on all interactive elements

FUNCTIONALITY:
- All buttons must work with proper JavaScript
- Forms must validate and show feedback
- Navigation must work properly
- Include realistic placeholder content`;

    default:
      return '';
  }
}
```

### 2. Modify `callAPIStream` to Accept Model Key (line 232-300)

Change the function signature and use model enhancement:

```typescript
async function callAPIStream(
  apiKey: string, 
  prompt: string, 
  modelConfig: { name: string },
  systemPrompt: string,
  modelKey: string,  // ADD THIS PARAMETER
  timeoutMs: number = 90000
): Promise<ReadableStream> {
  // ... existing code ...
  
  // Add model-specific enhancement to system prompt
  const enhancedSystemPrompt = systemPrompt + getModelEnhancement(modelKey);
  
  const response = await fetch(POLLINATIONS_URL, {
    // ... existing fetch config ...
    body: JSON.stringify({
      model: modelConfig.name,
      messages: [
        { role: 'system', content: enhancedSystemPrompt },  // Use enhanced prompt
        { role: 'user', content: prompt }
      ],
      // ... rest of config
    }),
  });
```

### 3. Modify `generateWithStreaming` for Multi-Model (line 303-416)

Add modelKey parameter:

```typescript
async function generateWithStreaming(
  apiKey: string,
  prompt: string,
  modelConfig: { name: string; label: string },
  systemPrompt: string,
  modelKey: string,  // ADD THIS PARAMETER
  timeoutMs: number = 120000
): Promise<{ code: string; model: string; time: number }> {
  // ... existing code ...
  
  // Add model-specific enhancement
  const enhancedSystemPrompt = systemPrompt + getModelEnhancement(modelKey);
  
  const response = await fetch(POLLINATIONS_URL, {
    // ... existing fetch config ...
    body: JSON.stringify({
      model: modelConfig.name,
      messages: [
        { role: 'system', content: enhancedSystemPrompt },  // Use enhanced prompt
        { role: 'user', content: prompt }
      ],
      // ... rest of config
    }),
  });
```

### 4. Update Multi-Model Call (line 450-455)

Pass modelKey to generateWithStreaming:

```typescript
const modelKeys = ['claude', 'gpt', 'qwen'];
const results = await Promise.allSettled(
  modelKeys.map(key => 
    generateWithStreaming(pollinationsKey, prompt, MODELS[key], systemPrompt, key)  // Pass key
  )
);
```

### 5. Update Single Model Call (line 499-500)

Pass modelKey to callAPIStream:

```typescript
const upstreamStream = await callAPIStream(
  pollinationsKey, 
  prompt, 
  modelConfig, 
  systemPrompt, 
  modelKey  // Pass modelKey
);
```

---

## Expected Results

### Claude (Before vs After)

**Before**: Full YouTube clone with all features working, but basic styling
**After**: Full YouTube clone with all features + glassmorphism, gradients, premium feel

### GPT 5.2 (Before vs After)

**Before**: Beautiful YouTube interface with glass cards, but buttons don't work
**After**: Beautiful YouTube interface + working video player, functional like/share, real comments

### Qwen Coder (Before vs After)

**Before**: Inconsistent quality
**After**: Balanced quality with both good visuals and working functionality

---

## Files Changed

| File | Changes |
|------|---------|
| `supabase/functions/web-gen/index.ts` | Add `getModelEnhancement()` function, modify API call functions to use enhanced prompts |

---

## Technical Notes

1. The enhancement prompts are appended to the mode-specific system prompts, not replacing them
2. Each model gets tailored instructions that address its specific tendencies
3. The core functionality rules remain the same, enhancements are additive
4. This approach respects each model's strengths while compensating for weaknesses

