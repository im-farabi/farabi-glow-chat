

# Fix Study Quiz - AI Returning Conversational Text Instead of JSON

## Root Cause Identified

The error `"Unexpected token 'I', \"I'm ready \"... is not valid JSON"` reveals that the AI is responding with conversational text like "I'm ready to help you generate questions..." instead of pure JSON.

**Why this happens:**

The `sendNormal` function in `src/lib/api.ts` **always injects chatbot system instructions** that tell the AI to:
- Be friendly with "Gen Z vibes"
- Explain step-by-step
- Use bullets, headings, emojis
- Talk casually

These persona instructions conflict with the quiz prompt's requirement for pure JSON output. The AI gets confused and starts a conversation instead of outputting raw JSON.

**MCQGen sometimes works** because:
- Shorter/simpler prompt structure
- AI luck/randomness
- Different model routing timing

---

## Solution

Create a dedicated function that calls the AI **without** chatbot system instructions - just the raw JSON generation prompt.

---

## Technical Changes

### File: `src/lib/api.ts`

Add a new function `sendRawJSON` that bypasses chatbot instructions:

```typescript
/**
 * Send a raw prompt for JSON generation (no chatbot persona)
 * Used for MCQ/Quiz generation where pure JSON output is required
 */
export async function sendRawJSON(prompt: string): Promise<string> {
  const modelConfigs = [
    { model: 'gemini-search', label: 'Primary: gemini-search', useFallbackKey: false },
    { model: 'openai-large', label: 'Fallback: openai-large', useFallbackKey: false },
    { model: 'openai', label: 'Fallback: openai', useFallbackKey: true }
  ];

  let lastError: Error | null = null;

  for (const config of modelConfigs) {
    try {
      const { data, error } = await supabase.functions.invoke('pollinations-chat', {
        body: {
          prompt: prompt,  // Just the prompt, no system instructions
          model: config.model,
          seed: Math.random(),
          image: null,
          useFallback: config.useFallbackKey
        }
      });

      if (error) {
        lastError = error;
        continue;
      }

      const text = data?.text;
      if (text && text.trim().length > 0) {
        return text.trim();
      }
      continue;
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }

  throw lastError || new Error('All AI models failed to respond');
}
```

---

### File: `src/components/study/StudyQuiz.tsx`

Change from `sendNormal` to `sendRawJSON`:

| Before | After |
|--------|-------|
| `import { sendNormal } from '@/lib/api';` | `import { sendRawJSON } from '@/lib/api';` |
| `const response = await sendNormal(prompt, []);` | `const response = await sendRawJSON(prompt);` |

Also strengthen the prompt to be even more explicit about JSON-only output:

```typescript
const prompt = `You are a JSON generator. Output ONLY a valid JSON array. No explanations, no markdown, no text before or after.

Generate ${numQuestions} educational MCQ questions using the Finnish education method.

SUBJECT: ${subject.name}
CHAPTER: ${chapter.name}
TOPICS: ${chapter.topics.join(', ')}
STUDENT AGE: ${userAge} years old (${ageContext})

FINNISH METHOD REQUIREMENTS:
1. Questions should TEACH, not just TEST
2. Use relatable, real-world examples for a ${userAge}-year-old
3. Include "why" explanations
4. Focus on conceptual understanding over memorization
5. Avoid trick questions
6. Use encouraging language in explanations

OUTPUT FORMAT - Return EXACTLY this JSON structure:
[
  {
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Why this is correct",
    "learnMore": "Fun fact or tip"
  }
]

RESPOND WITH ONLY THE JSON ARRAY. START WITH [ AND END WITH ]`;
```

---

### File: `src/pages/MCQGen.tsx` (Optional Improvement)

Also update MCQGen to use `sendRawJSON` for consistency and reliability:

| Before | After |
|--------|-------|
| `const response = await sendNormal(prompt);` | `const response = await sendRawJSON(prompt);` |

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/lib/api.ts` | Add `sendRawJSON()` function that bypasses chatbot persona |
| `src/components/study/StudyQuiz.tsx` | Use `sendRawJSON` instead of `sendNormal`, strengthen prompt |
| `src/pages/MCQGen.tsx` | Use `sendRawJSON` for consistency (optional) |

---

## Expected Result

After this fix:
- AI receives ONLY the JSON generation prompt (no "be friendly" persona)
- AI will output pure JSON starting with `[` and ending with `]`
- Quiz generation will work reliably
- Both `/study` and `/mcq-gen` will use the same reliable pattern

