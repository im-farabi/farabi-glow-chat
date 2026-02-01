

# AI Website Generator - Complete Chat Interface Redesign

## Overview

Transform the current 3-panel layout into a conversational chat-style interface similar to the main `/` chat page, with:
- Multi-step option selection (theme, font, website type)
- Glassmorphic option buttons (inspired by the reference image)
- Collapsible code stream (hidden by default)
- Edit/iteration support for follow-up prompts
- Time tracking for generation

---

## User Flow

```
1. User sees welcome screen: "Describe your website" with input
2. User types prompt → clicks Send/Enter
3. AI shows option buttons:
   - Theme: Blue/Black, Purple/Black, Other (with textbox)
   - Font: Poppins, Montserrat, Rubik
   - Website Type: Rich/Premium, Fully Detailed, Static Testing
4. User selects options → clicks Submit
5. AI message: "Got it! I'll start creating your website..."
6. Collapsible "Generating code... ⌄" (code hidden by default)
7. On complete: "DONE!!! Click View App button..." + time taken
8. User can send follow-up messages to edit the website
```

---

## Technical Implementation

### File: `src/pages/WebGen.tsx`

**Complete rewrite with chat architecture:**

#### 1. New State Management

```typescript
// Chat messages state (like Index.tsx)
interface WebGenMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'prompt' | 'options' | 'generating' | 'complete' | 'edit';
  options?: {
    theme?: string;
    font?: string;
    websiteType?: string;
  };
  showCode?: boolean;
  generatedCode?: string;
  generationTime?: number;
}

const [messages, setMessages] = useState<WebGenMessage[]>([]);
const [inputValue, setInputValue] = useState('');
const [currentStep, setCurrentStep] = useState<'prompt' | 'options' | 'generating' | 'complete'>('prompt');

// Options selection state
const [selectedTheme, setSelectedTheme] = useState<string>('');
const [customTheme, setCustomTheme] = useState('');
const [selectedFont, setSelectedFont] = useState<string>('');
const [selectedType, setSelectedType] = useState<string>('');
```

#### 2. Welcome Screen (Empty State)

When no messages exist, show centered welcome:

```tsx
<div className="flex h-full items-center justify-center">
  <div className="text-center space-y-6">
    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
      <Globe className="h-10 w-10 text-white" />
    </div>
    <h2 className="text-3xl font-bold">
      <span className="text-white">Describe your </span>
      <span className="gradient-text">dream website</span>
    </h2>
    <p className="text-muted-foreground">
      Tell me what you want to build
    </p>
  </div>
</div>
```

#### 3. Glassmorphic Option Buttons

Inspired by reference image - rounded rectangles with glass effect:

```tsx
// Theme options
const THEME_OPTIONS = [
  { id: 'blue-black', label: 'Blue & Black', colors: 'from-blue-500 to-black' },
  { id: 'purple-black', label: 'Purple & Black', colors: 'from-purple-500 to-black' },
  { id: 'other', label: 'Other', isCustom: true }
];

// Font options
const FONT_OPTIONS = [
  { id: 'poppins', label: 'Poppins' },
  { id: 'montserrat', label: 'Montserrat' },
  { id: 'rubik', label: 'Rubik' }
];

// Website type options
const TYPE_OPTIONS = [
  { id: 'premium', label: 'Rich & Premium', desc: 'Luxurious, polished design' },
  { id: 'detailed', label: 'Fully Detailed', desc: 'Complete with all features' },
  { id: 'static', label: 'Static for Testing', desc: 'Simple, fast to generate' }
];

// Glass button component
<button
  onClick={() => setSelectedTheme(option.id)}
  className={cn(
    "p-4 rounded-2xl backdrop-blur-xl border transition-all duration-300",
    "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
    "hover:scale-105 hover:shadow-lg",
    selectedTheme === option.id && "bg-primary/20 border-primary/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
  )}
>
  <span className="font-medium">{option.label}</span>
</button>
```

#### 4. Options Message Component

When user submits prompt, show options as AI message:

```tsx
const OptionsMessage = () => (
  <div className="space-y-6">
    {/* Theme Selection */}
    <div className="space-y-3">
      <p className="font-medium">What theme would you like?</p>
      <div className="grid grid-cols-3 gap-3">
        {THEME_OPTIONS.map(option => (
          <GlassButton 
            key={option.id}
            selected={selectedTheme === option.id}
            onClick={() => setSelectedTheme(option.id)}
          >
            {option.label}
          </GlassButton>
        ))}
      </div>
      {selectedTheme === 'other' && (
        <input
          type="text"
          value={customTheme}
          onChange={(e) => setCustomTheme(e.target.value)}
          placeholder="Describe your theme..."
          className="w-full p-3 rounded-xl bg-white/5 border border-white/10"
        />
      )}
    </div>

    {/* Font Selection */}
    <div className="space-y-3">
      <p className="font-medium">Which font?</p>
      <div className="grid grid-cols-3 gap-3">
        {FONT_OPTIONS.map(option => (
          <GlassButton ...>
            <span style={{ fontFamily: option.id }}>{option.label}</span>
          </GlassButton>
        ))}
      </div>
    </div>

    {/* Website Type */}
    <div className="space-y-3">
      <p className="font-medium">What kind of website?</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TYPE_OPTIONS.map(option => (
          <GlassButton ...>
            <div className="text-left">
              <p className="font-medium">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.desc}</p>
            </div>
          </GlassButton>
        ))}
      </div>
    </div>

    {/* Submit Button */}
    <Button 
      onClick={handleStartGeneration}
      disabled={!selectedTheme || !selectedFont || !selectedType}
      className="w-full h-12 bg-gradient-to-r from-primary to-secondary"
    >
      <Sparkles className="mr-2" />
      Generate Website
    </Button>
  </div>
);
```

#### 5. Generating Message with Collapsible Code

```tsx
const GeneratingMessage = ({ showCode, onToggleCode, code, isGenerating }) => (
  <div className="space-y-4">
    <p className="text-lg">
      Got it! I'll start creating your website. It might take a while, please wait!
    </p>
    
    {/* Collapsible code section */}
    <button
      onClick={onToggleCode}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <Code2 className="h-4 w-4" />
      <span>Generating code...</span>
      <ChevronDown className={cn(
        "h-4 w-4 transition-transform",
        showCode && "rotate-180"
      )} />
    </button>
    
    {showCode && (
      <div 
        ref={codeContainerRef}
        className="max-h-[300px] overflow-y-scroll rounded-lg bg-black/50 border border-border/50 p-4"
      >
        <pre className="text-sm font-mono whitespace-pre-wrap">
          <code>{code}</code>
          {isGenerating && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
          )}
        </pre>
      </div>
    )}
  </div>
);
```

#### 6. Complete Message

```tsx
const CompleteMessage = ({ generationTime, onViewApp }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 text-lg font-bold text-green-500">
      <CheckCircle className="h-6 w-6" />
      DONE!!!
    </div>
    <p>Click the View App button to visit your website!</p>
    <p className="text-sm text-muted-foreground">
      Generated in {(generationTime / 1000).toFixed(1)} seconds
    </p>
    <div className="flex gap-3">
      <Button onClick={onViewApp} className="bg-gradient-to-r from-primary to-secondary">
        <ExternalLink className="mr-2 h-4 w-4" />
        View App
      </Button>
      <Button variant="outline" onClick={copyCode}>
        <Copy className="mr-2 h-4 w-4" />
        Copy Code
      </Button>
      <Button variant="outline" onClick={downloadCode}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  </div>
);
```

#### 7. Chat Input for Edits

After generation complete, show input for follow-up edits:

```tsx
{currentStep === 'complete' && (
  <div className="p-4 border-t border-border/50">
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-3 items-end">
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Want to make changes? e.g., 'Remove the About Me button'"
          className="flex-1 resize-none bg-card/50 backdrop-blur-xl"
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleEditRequest} className="h-12 w-12 rounded-full">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  </div>
)}
```

#### 8. Enhanced Prompt Building

When user submits options, build enhanced prompt:

```typescript
const buildEnhancedPrompt = () => {
  const theme = selectedTheme === 'other' ? customTheme : selectedTheme;
  const themeText = theme === 'blue-black' ? 'blue and black color scheme' 
                  : theme === 'purple-black' ? 'purple and black color scheme'
                  : `custom theme: ${customTheme}`;
  
  const fontText = `using ${selectedFont} font`;
  
  const typeText = selectedType === 'premium' ? 'rich, premium, luxurious design with animations and effects'
                 : selectedType === 'detailed' ? 'fully detailed with all features and sections'
                 : 'simple static site for testing purposes';

  return `${userPrompt}

Design Requirements:
- Theme: ${themeText}
- Font: ${fontText}
- Style: ${typeText}`;
};
```

---

## Complete Layout Structure

```tsx
return (
  <div className="min-h-screen flex flex-col">
    <PremiumBackground />
    <Header showTemporaryToggle={false} />
    
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Chat Messages Area */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Input Area */}
      {(currentStep === 'prompt' || currentStep === 'complete') && (
        <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto">
            {/* Model selector (Haiku on top as requested) */}
            <div className="flex gap-2 mb-3">
              <Button variant={model === 'haiku' ? 'default' : 'outline'} size="sm">
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Haiku (Best)
              </Button>
              <Button variant={model === 'kimi' ? 'default' : 'outline'} size="sm">
                <Brain className="h-3.5 w-3.5 mr-1" />
                Kimi
              </Button>
              <Button variant={model === 'gemini' ? 'default' : 'outline'} size="sm">
                <Zap className="h-3.5 w-3.5 mr-1" />
                Gemini
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Textarea ... />
              <Button onClick={handleSend} className="h-14 w-14 rounded-full">
                <Send className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  </div>
);
```

---

## Key Features Summary

| Feature | Implementation |
|---------|---------------|
| Chat-like interface | Messages array with different types (prompt, options, generating, complete) |
| Glass option buttons | Glassmorphic cards with backdrop-blur, subtle borders, hover/selected states |
| Theme options | Blue/Black, Purple/Black, Other with custom textbox |
| Font options | Poppins, Montserrat, Rubik |
| Website type | Premium, Detailed, Static |
| Collapsible code | Hidden by default, click chevron to expand |
| Time tracking | Track generation start/end, display in completion message |
| Edit support | After completion, allow follow-up prompts to modify code |
| Model order | Haiku first (as requested), then Kimi, then Gemini |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/WebGen.tsx` | Complete rewrite to chat-based interface with options flow |

---

## Important Notes

- **NO changes to edge function** - it works perfectly now, we're only changing the frontend
- Model order: Haiku → Kimi → Gemini (Haiku first as you said it works best)
- Glass buttons inspired by the reference image's rounded, glowing card style
- Code is hidden during generation by default, expandable with chevron
- Full edit/iteration support after initial generation

