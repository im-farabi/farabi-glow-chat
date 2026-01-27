
# Giyaat AI Integration Plan

## Overview

Add a new "Giyaat" option to the ChatInput tool dropdown menu. When selected, users can choose between three Giyaat AI modes (Fast, Mid, Large) that use the external Giyaat API at `giyaaat.vercel.app`.

---

## Feature Details

### Giyaat Models

| Mode | API Model | Description |
|------|-----------|-------------|
| **GIYAAT Fast** | `fast` | OpenAI-powered, speed-focused, fewer instructions |
| **GIYAAT Mid** | `mid` | Grok-powered, balanced, great for chatbots |
| **GIYAAT Large** | `large` | Gemini-powered, deep analysis, real-time info |

### API Endpoint

```
GET: https://giyaaat.vercel.app/[prompt]?model=[fast|mid|large]
```

Response: Plain text (not JSON)

---

## Files to Modify

### 1. `src/components/ChatInput.tsx`

**Changes:**
- Add 3 new mode types: `giyaatFast`, `giyaatMid`, `giyaatLarge`
- Add a "G" button in the tool dropdown with a submenu for the 3 Giyaat modes
- Add visual indicator when a Giyaat mode is active (orange/yellow gradient)
- Import a suitable icon (using lucide's `Zap` for speed or custom "G" text)

**New Mode Types:**
```typescript
type Mode = 'chat' | 'fast' | 'normal' | 'super' | 'imageGen' | 'coder' | 'think' | 'giyaatFast' | 'giyaatMid' | 'giyaatLarge';
```

**UI Addition (in tool dropdown):**
```text
┌──────────────────────┐
│ 💻 Coder Mode        │
│ 🧠 Deep Thinker      │
│ ─────────────────    │
│ G  GIYAAT Fast       │
│ G  GIYAAT Mid        │
│ G  GIYAAT Large      │
└──────────────────────┘
```

---

### 2. `src/lib/api.ts`

**Changes:**
- Add `sendGiyaat()` function that calls the Giyaat API directly
- Handle plain text response (not JSON)
- URL encode the prompt properly
- Add error handling for API failures

**New Function:**
```typescript
export async function sendGiyaat(
  prompt: string, 
  model: 'fast' | 'mid' | 'large' = 'fast'
): Promise<string> {
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://giyaaat.vercel.app/${encodedPrompt}?model=${model}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Giyaat API error: ${response.status}`);
  }
  
  return await response.text();
}
```

---

### 3. `src/pages/Index.tsx`

**Changes:**
- Import `sendGiyaat` from api.ts
- Update `handleSendMessage` function signature to include new mode types
- Add switch cases for `giyaatFast`, `giyaatMid`, `giyaatLarge`
- Add loading stage text for Giyaat modes

**New Switch Cases:**
```typescript
case 'giyaatFast':
  response = await sendGiyaat(message, 'fast');
  break;
case 'giyaatMid':
  response = await sendGiyaat(message, 'mid');
  break;
case 'giyaatLarge':
  response = await sendGiyaat(message, 'large');
  break;
```

**Loading Stages for Giyaat:**
```typescript
const giyaatStages = [
  { time: 500, text: 'Connecting to GIYAAT...' },
  { time: 1500, text: 'Processing with GIYAAT AI...' },
  { time: Infinity, text: 'Generating response...' }
];
```

---

## UI Design Specifications

### G Icon Button
- Display as a bold "G" letter or use `Zap` icon from lucide
- Orange/yellow accent color to differentiate from other modes
- Active state: gradient from orange (#F59E0B) to yellow (#EAB308)

### Dropdown Menu Item Styling
```tsx
<DropdownMenuItem className={activeMode.startsWith('giyaat') ? 'bg-orange-500/20' : ''}>
  <span className="font-bold text-orange-500 mr-2">G</span>
  GIYAAT Fast
</DropdownMenuItem>
```

### Active Mode Indicator
When any Giyaat mode is active, show a subtle orange glow on the tool button:
```tsx
className={`h-8 w-8 ${activeMode.startsWith('giyaat') ? 'text-orange-500 bg-orange-500/10' : ''}`}
```

---

## Implementation Order

1. **Update `src/lib/api.ts`**
   - Add `sendGiyaat()` function with proper URL encoding
   - Handle plain text response

2. **Update `src/components/ChatInput.tsx`**
   - Extend mode types to include Giyaat modes
   - Add Giyaat options to tool dropdown with "G" icon
   - Add visual feedback for active Giyaat mode

3. **Update `src/pages/Index.tsx`**
   - Import new Giyaat function
   - Extend `handleSendMessage` type signature
   - Add switch cases for Giyaat modes
   - Add loading stage text

---

## Technical Considerations

### CORS
The Giyaat API is a public API that should support CORS from browser requests. If CORS issues occur, we may need to proxy through a Supabase edge function.

### Error Handling
- Timeout after 30 seconds
- Show toast on API failure
- Fallback message if API is unavailable

### No Conversation History
Unlike the existing modes, Giyaat API is stateless (single prompt → response). Each message is independent without conversation context.

---

## Accessibility

- Proper ARIA labels on new dropdown items
- Keyboard navigation support in submenu
- Clear visual distinction for active Giyaat mode
