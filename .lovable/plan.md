
# Fix Empty Content & Missing Images in Web Generator

## Problems Identified

1. **Empty Body Content**: Claude and GPT generate navbar/footer correctly but leave body sections with no text
2. **Markdown Wrappers**: Despite instructions, models still sometimes output ` ```html ` at the start
3. **Missing Images/Icons**: Websites lack visual elements like icons, images, and illustrations

## Root Cause

The current system prompts focus on code structure and functionality but don't explicitly mandate:
- Real placeholder text content in every section
- Mandatory image usage with sources
- Icon usage from Font Awesome or similar CDN

## Solution: Enhanced Content Requirements

### File: `supabase/functions/web-gen/index.ts`

### 1. Update Base Rules with Content Requirements

Add explicit content and image requirements to `baseRules` (lines 73-86):

```typescript
const baseRules = `
CRITICAL RULES:
1. Return ONLY valid HTML - no markdown, no backticks, no explanations
2. DO NOT start with \`\`\`html or any code fence - start DIRECTLY with <!DOCTYPE html>
3. End with </html>
4. Include all CSS in <style> or use appropriate CDN
5. Include all JavaScript in <script> tags
6. Dark theme by default unless specified otherwise
7. Make it responsive and modern
8. Use Google Fonts and Font Awesome from CDN

MANDATORY CONTENT REQUIREMENTS:
- Every section MUST have real, readable text content (headings, paragraphs, descriptions)
- Include placeholder images using: https://picsum.photos/WIDTH/HEIGHT (e.g., https://picsum.photos/400/300)
- Use Font Awesome icons throughout: <i class="fas fa-icon-name"></i>
- Add realistic lorem ipsum or relevant placeholder text for ALL text areas
- Cards must have titles, descriptions, and images
- Hero sections need headings, subheadings, and call-to-action text
- NEVER leave empty divs or sections without visible content

NEVER use markdown code blocks. NEVER truncate. Complete every tag.
Your response must start with: <!DOCTYPE html>
Your response must end with: </html>`;
```

### 2. Update Main SYSTEM_PROMPT (lines 36-51)

```typescript
const SYSTEM_PROMPT = `You are an expert web developer. Generate COMPLETE HTML code with real content.

CRITICAL OUTPUT RULES:
1. DO NOT use markdown - no backticks, no \`\`\`html wrapper, no explanations
2. Start your response DIRECTLY with: <!DOCTYPE html>
3. End with: </html>
4. Include all CSS in a <style> tag in <head>
5. Include all JavaScript in a <script> tag before </body>

MANDATORY VISUAL CONTENT:
- Every section MUST contain real text (headings, paragraphs, button labels)
- Include images using: https://picsum.photos/WIDTH/HEIGHT
- Include Font Awesome icons: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
- Cards need: title text, description text, and an image
- Hero sections need: heading, subheading, CTA button with text
- Lists need actual items with text and icons
- NEVER create empty sections - every div must have visible content

DESIGN DEFAULTS:
- Dark theme unless specified otherwise
- Responsive with CSS Grid/Flexbox
- Google Fonts for typography
- Smooth animations and hover effects

NEVER truncate. Complete every tag.`;
```

### 3. Update Model-Specific Enhancements (lines 174-228)

Add content requirements to each model's enhancement:

**Claude Enhancement:**
```typescript
case 'claude':
  return `

VISUAL DESIGN PRIORITY (Claude-specific):
You tend to focus too much on functionality. For this request, ALSO prioritize:
- Premium visual aesthetics with glassmorphism (backdrop-blur, bg-opacity, glass cards)
- Gradient backgrounds (linear-gradient, radial-gradient with multiple color stops)
- Box shadows with multiple layers for depth
- Hover effects that feel expensive (scale, glow, color transitions)
- Professional spacing and visual hierarchy
- Make it look like a $10,000 professionally designed website

CONTENT REQUIREMENTS:
- Add real images: https://picsum.photos/400/300 for cards, /800/400 for heroes
- Include Font Awesome icons in buttons and features: <i class="fas fa-rocket"></i>
- Write compelling placeholder text for every heading and paragraph
- Every card needs: image, title (2-4 words), description (1-2 sentences)`;
```

**GPT Enhancement:**
```typescript
case 'gpt':
  return `

COMPLETE FUNCTIONALITY PRIORITY (GPT-specific):
You tend to focus too much on visuals and create beautiful but empty shells. For this request:
- Every button MUST have working onclick handlers
- Every form MUST have validation and submit logic
- Navigation MUST work (use hash routing or show/hide sections)
- Modals and dropdowns MUST open/close properly

MANDATORY CONTENT - DO NOT SKIP:
- Add TEXT to every section - no empty hero sections or cards
- Include images: https://picsum.photos/400/300?random=1 (use ?random=N for variety)
- Every card needs: an image, a title (real words), a description paragraph
- Hero sections need: a main heading, a subheading, button text
- Feature sections need: icon (<i class="fas fa-star"></i>), title, description
- If it's a YouTube clone: video thumbnails, video titles, channel names, view counts
- If it's a dashboard: chart labels, table data, card titles with numbers
- NEVER leave any section visually empty`;
```

**Qwen Enhancement:**
```typescript
case 'qwen':
  return `

BALANCED QUALITY PRIORITY (Qwen-specific):
Create a website that excels in BOTH visual design AND functionality:

VISUALS:
- Use Tailwind CSS for styling
- Add glassmorphism effects (backdrop-blur-xl, bg-white/10)
- Include gradients and shadows for depth

FUNCTIONALITY:
- All buttons must work with proper JavaScript
- Forms must validate and show feedback

MANDATORY CONTENT:
- Include images: https://picsum.photos/400/300?random=1
- Use Font Awesome icons: <i class="fas fa-check"></i>
- Write real text for all headings and descriptions
- Every card: image + title + description text
- No empty sections allowed`;
```

### 4. Update Mode-Specific Prompts

Add content requirements to designed, functional, game, and classic modes.

---

## Summary of Changes

| Issue | Fix |
|-------|-----|
| Empty body sections | Added "MANDATORY CONTENT REQUIREMENTS" with explicit rules for text in every section |
| Missing images | Added `https://picsum.photos/WIDTH/HEIGHT` as mandatory image source |
| Missing icons | Added Font Awesome CDN and icon usage requirement |
| ```html wrapper | Strengthened "DO NOT use markdown" and "start DIRECTLY with <!DOCTYPE" language |
| Model-specific gaps | Added content requirements to each model's enhancement prompt |

## Expected Result

**Before**: Navbar/footer renders, body is empty or has placeholder structure without text

**After**: 
- Every section has readable text content
- Cards have images from picsum.photos
- Buttons and features have Font Awesome icons
- No empty divs or skeleton-only sections
- Models understand they MUST include visible content everywhere
