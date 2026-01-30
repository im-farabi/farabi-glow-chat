
# Switch from GPT 5.2 to Claude Sonnet 4.5

## Summary
Replace the GPT 5.2 model with Claude Sonnet 4.5 (`anthropic/claude-sonnet-4.5`) for better streaming performance. The API endpoint and key rotation system stay the same - only the model and some parameters change.

---

## Changes Required

### 1. Update Edge Function: `supabase/functions/apifree-chat/index.ts`

| Change | From | To |
|--------|------|-----|
| Model | `openai/gpt-5.2` | `anthropic/claude-sonnet-4.5` |
| Max tokens | `4096` | `8192` |
| System prompt name | `FARABI-GPT5.2` | `FARABI-Claude` |
| Log prefix | `[GPT-5.2]` | `[Claude]` |
| Temperature | (not set) | `1` (Claude default) |

The streaming format is identical - both use SSE with `choices[0].delta.content`.

### 2. Update API Library: `src/lib/api.ts`

| Change | From | To |
|--------|------|-----|
| System prompt | References GPT-5.2 | References Claude Sonnet 4.5 |
| Function name | Keep as `sendGPT52` or rename | Keep same for simplicity |

### 3. Update UI Labels: `src/components/ChatInput.tsx`

| Change | From | To |
|--------|------|-----|
| Menu label | "GPT 5.2" | "Claude 4.5" or keep same |

The icon stays the same (the colorful flower logo works for both).

---

## Technical Details

### Edge Function Changes

```text
- const MODEL = 'openai/gpt-5.2';
- const MAX_TOKENS = 4096;
+ const MODEL = 'anthropic/claude-sonnet-4.5';
+ const MAX_TOKENS = 8192;
```

Add temperature parameter to API request:
```text
body: JSON.stringify({
  model: MODEL,
  max_tokens: MAX_TOKENS,
  messages,
  stream: true,
  temperature: 1  // Claude default
})
```

### Why Claude Streams Better
Claude's streaming implementation sends smaller, more frequent chunks compared to some other models. The SSE format is OpenAI-compatible, so no changes needed to the parsing logic.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/apifree-chat/index.ts` | Switch model to Claude, update max_tokens to 8192, add temperature |
| `src/lib/api.ts` | Update system prompt to reference Claude |
| `src/components/ChatInput.tsx` | Optionally update label (or keep as "GPT 5.2") |

---

## Summary of Key Points

1. Same API endpoint (`api.apifree.ai`)
2. Same 3-key rotation strategy
3. Same streaming SSE format
4. Only model name, max_tokens, and temperature change
5. Better streaming reliability with Claude
