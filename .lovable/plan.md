
# Complete WebGen Overhaul: Premium Interface + Simplified Stacks

## Part 1: Simplify Website Stacks to 4 Clear Modes

### New Stack System

| Stack | Description | Technologies | Icon |
|-------|-------------|--------------|------|
| **Game Mode** | Full-featured games with animations, interactions, 3D models - all in one file | Kaboom.js + Three.js + GSAP + Canvas | Gamepad2 |
| **Functional Mode** | JavaScript-heavy sites where everything works properly | Tailwind + Alpine.js + Full JS logic | Zap |
| **Designed Mode** | Beautiful HTML/CSS with animations and premium design | Tailwind + GSAP + CSS animations | Palette |
| **Classic Mode** | Basic HTML, CSS, and vanilla JS | Pure HTML/CSS/JS only | FileCode |

### Edge Function Prompt Updates

**Game Mode prompt:**
- Include Kaboom.js for 2D games
- Include Three.js for 3D elements
- Include GSAP for animations
- Create complete playable experience
- All logic in one HTML file

**Functional Mode prompt:**
- Tailwind CSS for styling
- Alpine.js for reactivity
- Full JavaScript functionality
- Forms work, buttons work, everything works

**Designed Mode prompt:**
- Tailwind CSS
- GSAP for scroll animations
- CSS animations and transitions
- Premium visual design, gradients, hover effects

**Classic Mode prompt:**
- Pure HTML5
- Custom CSS (no frameworks)
- Vanilla JavaScript
- Simple, clean, traditional

---

## Part 2: Premium Interface Redesign

### Hero Section (Welcome Screen)

**Before:**
```text
[Globe Icon]
AI Website Generator
Describe what you want to build
[HTML/CSS/JS] [Tailwind] [Three.js] [Games]
```

**After:**
```text
Cannot code? Just an Excuse!

Build the
NEXT! ← rotates every 3s to: IMAGINATION! → WEB! → FUTURE!

[Massive input area with premium glassmorphism]
"Design your dream website"  [Enhance] [Send]
```

### Key Visual Changes

1. **Bold tagline**: "Cannot code? Just an Excuse!" in large gradient text
2. **Rotating headline**: "Build the NEXT!" with animated word rotation
3. **Extra-large input area**: Multi-line, PC-friendly, premium glass card
4. **Removed feature badges**: Cleaner look
5. **Removed globe icon**: Let the text be the hero

### Typography Hierarchy

```text
"Cannot code?"         → text-xl md:text-2xl text-muted-foreground
"Just an Excuse!"     → text-xl md:text-2xl gradient text

"Build the"           → text-5xl md:text-7xl font-bold
"NEXT!"               → text-5xl md:text-7xl font-black gradient + animated

Input placeholder     → text-xl "Design your dream website"
```

### Rotating Word Animation

Words cycle every 3 seconds:
1. NEXT!
2. IMAGINATION!
3. WEB!
4. FUTURE!

Uses React state + setInterval + fade transition

---

## Part 3: File Changes Summary

| File | Changes |
|------|---------|
| `src/pages/WebGen.tsx` | 1. Replace STACK_OPTIONS with 4 new modes<br>2. Complete hero section redesign with rotating words<br>3. Larger input area with multi-line support<br>4. Remove feature badges<br>5. Premium glassmorphism styling |
| `supabase/functions/web-gen/index.ts` | 1. Add new mode prompts (game, functional, designed, classic)<br>2. Update buildSystemPrompt function |

---

## Part 4: Technical Implementation

### Rotating Words Component

```tsx
const ROTATING_WORDS = ['NEXT!', 'IMAGINATION!', 'WEB!', 'FUTURE!'];

const [wordIndex, setWordIndex] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setWordIndex(prev => (prev + 1) % ROTATING_WORDS.length);
  }, 3000);
  return () => clearInterval(interval);
}, []);
```

### New Hero Layout

```tsx
<div className="flex h-[70vh] items-center justify-center">
  <div className="text-center space-y-8 max-w-4xl px-4">
    {/* Tagline */}
    <p className="text-xl md:text-2xl">
      <span className="text-muted-foreground">Cannot code? </span>
      <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-semibold">
        Just an Excuse!
      </span>
    </p>
    
    {/* Main headline */}
    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold">
      Build the{' '}
      <span className="bg-gradient-to-r from-primary via-pink-400 to-secondary bg-clip-text text-transparent font-black animate-pulse">
        {ROTATING_WORDS[wordIndex]}
      </span>
    </h1>
    
    {/* Large premium input */}
    <div className="relative max-w-3xl mx-auto">
      <div className="absolute inset-0 -m-4 bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl rounded-3xl" />
      <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-6">
        <Textarea
          placeholder="Design your dream website"
          className="w-full min-h-[120px] md:min-h-[150px] text-lg md:text-xl bg-transparent border-0 resize-none focus:ring-0"
        />
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            {/* Model buttons */}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost">
              <Wand2 /> Enhance
            </Button>
            <Button gradient>
              <Send /> Build
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### New Stack Options

```tsx
const STACK_OPTIONS = [
  { 
    id: 'game', 
    label: 'Game Mode', 
    desc: 'Games with animations, interactions & 3D',
    modes: ['game'],
    icon: Gamepad2 
  },
  { 
    id: 'functional', 
    label: 'Functional Mode', 
    desc: 'Everything works properly with JavaScript',
    modes: ['functional'],
    icon: Zap 
  },
  { 
    id: 'designed', 
    label: 'Designed Mode', 
    desc: 'Beautiful HTML/CSS with premium animations',
    modes: ['designed'],
    icon: Palette 
  },
  { 
    id: 'classic', 
    label: 'Classic Mode', 
    desc: 'Traditional HTML, CSS, and vanilla JS',
    modes: ['classic'],
    icon: FileCode 
  }
];
```

---

## Part 5: Edge Function Mode Prompts

### Game Mode Prompt
```text
GAME MODE (Full-Featured):
- Include Kaboom.js for 2D gameplay
- Include Three.js for 3D elements if needed
- Include GSAP for smooth animations
- Create COMPLETE, PLAYABLE game
- All code in ONE HTML file
- Player controls, scoring, game states
- Visual effects, particles, sounds
- Mobile-friendly if possible
```

### Functional Mode Prompt
```text
FUNCTIONAL MODE (JavaScript-Heavy):
- Include Tailwind CSS from CDN
- Include Alpine.js for reactivity
- Make EVERYTHING work: buttons, forms, navigation
- Proper JavaScript event handling
- Form validation and submission
- Dynamic content updates
- Responsive and interactive
```

### Designed Mode Prompt
```text
DESIGNED MODE (Premium Design):
- Include Tailwind CSS from CDN
- Include GSAP + ScrollTrigger for animations
- PREMIUM visual design with gradients and shadows
- Smooth hover effects and transitions
- Scroll-triggered reveal animations
- Professional typography
- Modern, luxurious aesthetic
```

### Classic Mode Prompt
```text
CLASSIC MODE (Pure Basics):
- HTML5 semantic elements
- Custom CSS (no frameworks)
- Vanilla JavaScript only
- Clean, traditional structure
- Responsive with media queries
- Simple and effective
```

---

## Expected Visual Outcome

When users visit `/web`:
1. See bold "Cannot code? Just an Excuse!" tagline
2. See massive "Build the NEXT!" with rotating animated words
3. Large premium glass input box ready for typing
4. 4 simple, clear stack options when selecting
5. Overall feel: expensive, premium, professional AI tool

Background will still show the pink/purple gradients behind this content.
