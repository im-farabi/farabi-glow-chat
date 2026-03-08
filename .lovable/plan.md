

# Why /study is Slower Than /mcq-gen — Fix Plan

## Root Cause

| Feature | API Function | Model | Speed |
|---------|-------------|-------|-------|
| `/mcq-gen` | `sendNormal()` | `gemini-search` | Fast (optimized for quick responses) |
| `/study` | `sendRawJSON()` | `openai` → `openai-large` → `gemini-search` | Slow (tries slow models first) |

The `/study` quiz uses `sendRawJSON()` which tries `openai` first (slowest), then `openai-large`, and only falls back to `gemini-search` as a last resort. Meanwhile `/mcq-gen` uses `sendNormal()` which goes straight to `gemini-search` — the fastest model.

Additionally, the `/study` prompt is significantly longer (Finnish method requirements, age context, learn more field, step-by-step explanation format) which compounds the delay with slower models.

## Fix

**File: `src/components/study/StudyQuiz.tsx`**

Switch from `sendRawJSON` to `sendNormal` (same as MCQGen), which uses `gemini-search` directly. The `gemini-search` model handles JSON generation perfectly fine — MCQGen proves this every day.

Single change:
- Line 6: Change `import { sendRawJSON } from '@/lib/api'` → `import { sendNormal } from '@/lib/api'`
- Line 90: Change `await sendRawJSON(prompt)` → `await sendNormal(prompt)`

This will make `/study` quiz generation as fast as `/mcq-gen` with no quality loss.

