

# Fix Website Mode Combinations & Background

## Issues Identified

### Issue 1: Background Animations Not Working
The `WebGenBackground` component uses these animation classes that **don't exist** in `tailwind.config.ts`:
- `animate-pulse-slow`
- `animate-float-1`
- `animate-float-2`
- `animate-float-3`
- `animate-gradient-mesh`

This is why you don't see the Huly-style background effects.

### Issue 2: Mode Combinations Failing
Current failures:
- **3D Experience alone** - fails (too complex prompt for solo)
- **Interactive + Animated** - fails (GSAP conflicts with Alpine.js transitions)
- **Interactive + Game Mode** - fails (Kaboom canvas conflicts with Alpine.js DOM)

**Root cause**: The AI models struggle with conflicting JS libraries and complex prompts.

---

## Solution: Pre-defined Valid Combinations

Instead of free multi-select, provide curated "stacks" that are tested to work together.

### New Stack-Based System

| Stack Name | Technologies | Description |
|------------|-------------|-------------|
| **Standard** | HTML/CSS/JS | Classic website, always works |
| **Interactive** | Tailwind + Alpine.js | Dynamic UI with state management |
| **Animated** | Tailwind + GSAP | Scroll animations & effects |
| **Interactive + Animated** | Tailwind + Alpine + GSAP (careful usage) | Dynamic + animated (simplified prompt) |
| **Game Mode** | Kaboom.js | 2D browser games |
| **3D Experience** | Three.js + Basic CSS | 3D visualizations |

**Removed combinations** (conflicting):
- Game + Interactive (canvas vs DOM)
- Game + 3D (two canvases)
- 3D + Interactive (complex)
- Any 3+ mode combos

---

## Technical Changes

### File 1: `tailwind.config.ts`

Add missing keyframes and animations:

```typescript
keyframes: {
  // ... existing keyframes ...
  
  "float-1": {
    "0%, 100%": { transform: "translate(0, 0) scale(1)" },
    "50%": { transform: "translate(30px, -30px) scale(1.05)" }
  },
  "float-2": {
    "0%, 100%": { transform: "translate(0, 0) scale(1)" },
    "50%": { transform: "translate(-20px, 20px) scale(1.03)" }
  },
  "float-3": {
    "0%, 100%": { transform: "translate(0, 0)" },
    "50%": { transform: "translate(15px, -15px)" }
  },
  "pulse-slow": {
    "0%, 100%": { opacity: "1" },
    "50%": { opacity: "0.7" }
  },
  "gradient-mesh": {
    "0%": { transform: "translate(0, 0) rotate(0deg)" },
    "50%": { transform: "translate(50px, 30px) rotate(5deg)" },
    "100%": { transform: "translate(0, 0) rotate(0deg)" }
  }
},
animation: {
  // ... existing animations ...
  
  "float-1": "float-1 20s ease-in-out infinite",
  "float-2": "float-2 25s ease-in-out infinite",
  "float-3": "float-3 18s ease-in-out infinite",
  "pulse-slow": "pulse-slow 4s ease-in-out infinite",
  "gradient-mesh": "gradient-mesh 30s ease-in-out infinite"
}
```

### File 2: `src/pages/WebGen.tsx`

Replace multi-select with stack selection:

```typescript
// Replace MODE_OPTIONS with STACK_OPTIONS
const STACK_OPTIONS = [
  { 
    id: 'standard', 
    label: 'Standard', 
    desc: 'Classic HTML/CSS/JS',
    modes: ['standard'],
    icon: Globe 
  },
  { 
    id: 'interactive', 
    label: 'Interactive', 
    desc: 'Tailwind + Alpine.js',
    modes: ['interactive'],
    icon: MousePointer 
  },
  { 
    id: 'animated', 
    label: 'Animated', 
    desc: 'GSAP scroll animations',
    modes: ['animated'],
    icon: Sparkles 
  },
  { 
    id: 'interactive-animated', 
    label: 'Interactive + Animated', 
    desc: 'Dynamic UI with animations',
    modes: ['interactive', 'animated'],
    icon: Zap,
    badge: 'Combo'
  },
  { 
    id: 'game', 
    label: 'Game Mode', 
    desc: 'Kaboom.js 2D games',
    modes: ['game'],
    icon: Gamepad2 
  },
  { 
    id: '3d', 
    label: '3D Experience', 
    desc: 'Three.js visuals',
    modes: ['threejs'],
    icon: Box 
  }
];
```

**State change**: Replace `selectedModes: string[]` with `selectedStack: string | null`

**UI change**: Single-select radio-style buttons instead of checkboxes

### File 3: `supabase/functions/web-gen/index.ts`

Improve 3D-only and combo prompts:

```typescript
// Simplified Three.js prompt for standalone 3D
if (modes.includes('threejs') && modes.length === 1) {
  prompt += `THREE.JS (3D Experience):
- Include Three.js and OrbitControls from unpkg
- Create a simple but impressive 3D scene
- Add ambient and directional lighting
- One main geometry (sphere, torus, box)
- OrbitControls for rotation
- Animate with requestAnimationFrame
- Keep JavaScript under 50 lines
`;
}

// Safer Interactive + Animated combo prompt
if (modes.includes('interactive') && modes.includes('animated')) {
  prompt += `IMPORTANT: Use GSAP ONLY for entrance/scroll animations.
Use Alpine.js ONLY for UI state (toggles, menus).
Do NOT animate the same elements with both libraries.
`;
}
```

---

## UI Preview

### Before (Multi-select, confusing):
```text
Website Mode [Max 2]
[ ] Standard  [x] Interactive  [x] Game Mode  <-- Broken combo
[ ] 3D Experience  [ ] Animated
```

### After (Stack selection, clear):
```text
Website Stack
○ Standard        - Classic HTML/CSS/JS
○ Interactive     - Tailwind + Alpine.js  
○ Animated        - GSAP scroll animations
○ Interactive+    - Dynamic UI + animations [Combo]
  Animated
○ Game Mode       - Kaboom.js 2D games
○ 3D Experience   - Three.js visuals
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `tailwind.config.ts` | Add 5 missing keyframes and animations for background |
| `src/pages/WebGen.tsx` | Replace multi-select modes with single-select stacks |
| `supabase/functions/web-gen/index.ts` | Simplify 3D-only prompt, add safer combo instructions |

---

## Expected Outcomes

After these changes:
- Background gradient orbs will animate smoothly (Huly-style effects visible)
- Users can only select pre-tested, working combinations
- 3D Experience will work standalone with simplified prompt
- Interactive + Animated combo will work with conflict-free instructions
- No more broken generations from incompatible mode combinations

