import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APIFREE_URL = 'https://api.apifree.ai/v1/chat/completions';
const POLLINATIONS_URL = 'https://gen.pollinations.ai/v1/chat/completions';

// Model configurations with Gemini as primary
const MODELS: Record<string, { name: string; label: string; isPollinations?: boolean }> = {
  gemini: { 
    name: 'google/gemini-2.5-flash-lite',
    label: 'Gemini Flash'
  },
  haiku: { 
    name: 'anthropic/claude-haiku-4.5',
    label: 'Claude Haiku'
  },
  kimi: { 
    name: 'moonshotai/kimi-k2-instruct',
    label: 'Kimi K2'
  },
  pollinations: {
    name: 'openai-large',
    label: 'Pollinations GPT',
    isPollinations: true
  }
};

// Fallback order when a model fails - Pollinations as last resort
const FALLBACK_ORDER = ['gemini', 'haiku', 'kimi', 'pollinations'];

// System prompt for new website generation
const SYSTEM_PROMPT = `You are an expert web developer. Generate COMPLETE HTML code only.

CRITICAL RULES:
1. Return ONLY valid HTML - no markdown, no backticks, no explanations
2. Start with <!DOCTYPE html>
3. End with </html>
4. Include all CSS in a <style> tag in <head>
5. Include all JavaScript in a <script> tag before </body>
6. Dark theme by default unless specified otherwise
7. Make it responsive and modern with CSS Grid/Flexbox
8. Use Google Fonts and Font Awesome from CDN
9. Add smooth animations and hover effects

NEVER truncate. Complete every tag. Output must start with <!DOCTYPE html> and end with </html>.`;

// System prompt for TARGETED edits - minimal changes only
const EDIT_SYSTEM_PROMPT = `You are an expert web developer making TARGETED edits to existing HTML code.

CRITICAL RULES FOR EDITING:
1. ONLY modify the specific part the user requested
2. Keep ALL other code EXACTLY the same - do not rewrite or "improve" unchanged sections
3. Preserve the original structure, styling, formatting, colors, and fonts
4. Return the complete HTML but with MINIMAL changes
5. Do NOT add new features, sections, or improvements unless specifically asked
6. Do NOT change colors, fonts, animations, or styles unless specifically asked
7. Do NOT reorganize or restructure the code
8. Think like a surgeon: precise incisions, leave everything else untouched

The user will provide existing code and a specific change request. Make ONLY that change.
Output must start with <!DOCTYPE html> and end with </html>.`;

// Build dynamic system prompt based on selected modes
function buildSystemPrompt(modes: string[]): string {
  const baseRules = `
CRITICAL RULES:
1. Return ONLY valid HTML - no markdown, no backticks, no explanations
2. Start with <!DOCTYPE html>
3. End with </html>
4. Include all CSS in <style> or use appropriate CDN
5. Include all JavaScript in <script> tags
6. Dark theme by default unless specified otherwise
7. Make it responsive and modern
8. Use Google Fonts and Font Awesome from CDN

NEVER truncate. Complete every tag. Output must start with <!DOCTYPE html> and end with </html>.`;

  // GAME MODE - Full-featured games with everything
  if (modes.includes('game')) {
    return `You are an expert game developer. Generate a COMPLETE, PLAYABLE game in one HTML file.

GAME MODE REQUIREMENTS:
- Include Kaboom.js: <script src="https://unpkg.com/kaboom@3000/dist/kaboom.mjs" type="module"></script>
- Include Three.js if 3D elements needed: <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
- Include GSAP for smooth animations: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
- Create a COMPLETE, PLAYABLE experience
- ALL code in ONE HTML file
- Player controls (keyboard/mouse)
- Scoring system displayed on screen
- Game states: menu, playing, game over, restart
- Visual effects: particles, animations, transitions
- Sound effects if applicable
- Clear on-screen instructions
- Make it FUN and POLISHED

${baseRules}`;
  }
  
  // FUNCTIONAL MODE - JavaScript-heavy, everything works
  if (modes.includes('functional')) {
    return `You are an expert web developer. Generate a FULLY FUNCTIONAL website where everything works.

FUNCTIONAL MODE REQUIREMENTS:
- Include Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
- Include Alpine.js: <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
- Make EVERYTHING work: buttons, forms, navigation, modals, tabs
- Proper JavaScript event handling
- Form validation with feedback
- Dynamic content updates
- State management with Alpine x-data
- Mobile responsive navigation
- Dark mode toggle (functional)
- All interactive elements must work properly

${baseRules}`;
  }
  
  // DESIGNED MODE - Premium visual design with animations
  if (modes.includes('designed')) {
    return `You are an expert web designer. Generate a BEAUTIFULLY DESIGNED website with premium animations.

DESIGNED MODE REQUIREMENTS:
- Include Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
- Include GSAP: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
- Include ScrollTrigger: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
- PREMIUM visual design: gradients, shadows, depth, layering
- Smooth hover effects on all interactive elements
- CSS transitions (300ms ease)
- Scroll-triggered reveal animations with GSAP
- Professional typography with Google Fonts
- Generous whitespace and visual hierarchy
- Modern, luxurious, expensive-looking aesthetic
- Subtle micro-interactions
- Polished and production-ready appearance

${baseRules}`;
  }
  
  // CLASSIC MODE - Pure HTML/CSS/JS, no frameworks
  if (modes.includes('classic')) {
    return `You are an expert web developer. Generate a clean, traditional website using ONLY pure HTML, CSS, and vanilla JavaScript.

CLASSIC MODE REQUIREMENTS:
- HTML5 semantic elements (header, main, section, article, footer)
- Custom CSS in <style> tag - NO frameworks
- Vanilla JavaScript only - NO libraries
- Clean, traditional structure
- CSS Grid and Flexbox for layout
- Responsive with media queries
- Simple, effective, fast-loading
- Classic web development approach
- Accessibility best practices
- Works in all modern browsers

${baseRules}`;
  }

  // Default fallback (standard mode)
  return `You are an expert web developer. Generate COMPLETE HTML code only.
${baseRules}`;
}

// Create transform stream with proper UTF-8 handling and line buffering
function createTransformStream() {
  let buffer = '';
  const decoder = new TextDecoder('utf-8', { fatal: false });
  
  return new TransformStream({
    transform(chunk: Uint8Array, controller: TransformStreamDefaultController) {
      // Decode with streaming=true to handle multi-byte characters split across chunks
      buffer += decoder.decode(chunk, { stream: true });
      
      // Process complete lines only
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          } catch {
            // Skip malformed JSON - line may have been partial
          }
        }
      }
    },
    flush(controller: TransformStreamDefaultController) {
      // Flush remaining decoder buffer
      buffer += decoder.decode();
      
      // Process any remaining buffered content
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trim();
        if (data && data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
    }
  });
}

// Call API with timeout
async function callAPIStream(
  apiKey: string, 
  prompt: string, 
  modelConfig: { name: string; isPollinations?: boolean },
  systemPrompt: string,
  timeoutMs: number = 60000
): Promise<ReadableStream> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  const apiUrl = modelConfig.isPollinations ? POLLINATIONS_URL : APIFREE_URL;
  
  try {
    console.log(`[web-gen] Calling ${modelConfig.name} via ${modelConfig.isPollinations ? 'Pollinations' : 'APIFree'}...`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelConfig.name,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: true,
        max_tokens: 16384,
        temperature: 0.7
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[web-gen] API Error: ${response.status} - ${errorText.slice(0, 300)}`);
      throw new Error(`API Error ${response.status}: ${errorText.slice(0, 200)}`);
    }
    
    if (!response.body) {
      throw new Error('No response body');
    }
    
    // Tee the stream to log a preview
    const [stream1, stream2] = response.body.tee();
    const previewReader = stream2.getReader();
    const { value } = await previewReader.read();
    previewReader.releaseLock();
    
    if (value) {
      const preview = new TextDecoder().decode(value).slice(0, 500);
      console.log(`[web-gen] Response preview: ${preview}`);
      
      // Check if the response looks like an error
      if (preview.includes('"error"') || preview.includes('rate limit') || preview.includes('quota')) {
        throw new Error(`API returned error: ${preview.slice(0, 200)}`);
      }
    }
    
    return stream1;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, stream = true, model = 'gemini', isEdit = false, modes = [] } = await req.json();
    
    // Choose the appropriate system prompt
    const systemPrompt = isEdit ? EDIT_SYSTEM_PROMPT : buildSystemPrompt(modes as string[]);

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get API keys
    const apiFreeKeys = [
      Deno.env.get('APIFREE_API_KEY_1'),
      Deno.env.get('APIFREE_API_KEY_2'),
      Deno.env.get('APIFREE_API_KEY_3'),
    ].filter(Boolean) as string[];

    const pollinationsKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');

    if (apiFreeKeys.length === 0 && !pollinationsKey) {
      return new Response(JSON.stringify({ error: 'No API keys configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Shuffle keys for load balancing
    const shuffledApiFreeKeys = [...apiFreeKeys].sort(() => Math.random() - 0.5);
    
    // Build model fallback chain: user's choice first, then others
    const modelsToTry = [model, ...FALLBACK_ORDER.filter(m => m !== model)];
    
    let lastError: Error | null = null;

    // Try each model in order, with all API keys
    for (const modelKey of modelsToTry) {
      const modelConfig = MODELS[modelKey];
      if (!modelConfig) continue;
      
      // Get the right keys for this model
      const keysToTry = modelConfig.isPollinations 
        ? (pollinationsKey ? [pollinationsKey] : [])
        : shuffledApiFreeKeys;
      
      if (keysToTry.length === 0) {
        console.log(`[web-gen] No keys available for ${modelConfig.name}, skipping...`);
        continue;
      }
      
      console.log(`[web-gen] Trying model: ${modelConfig.name}`);
      
      for (let i = 0; i < keysToTry.length; i++) {
        const apiKey = keysToTry[i];
        
        try {
          if (stream) {
            const upstreamStream = await callAPIStream(apiKey, prompt, modelConfig, systemPrompt);
            const transformStream = createTransformStream();
            
            console.log(`[web-gen] Success with ${modelConfig.name}, key ${i + 1}`);
            
            return new Response(upstreamStream.pipeThrough(transformStream), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
              }
            });
          } else {
            // Non-streaming mode
            const apiUrl = modelConfig.isPollinations ? POLLINATIONS_URL : APIFREE_URL;
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: modelConfig.name,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: prompt }
                ],
                stream: false,
                max_tokens: 16384
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`[web-gen] Non-stream API Error: ${response.status} - ${errorText.slice(0, 300)}`);
              throw new Error(`API Error ${response.status}`);
            }

            const data = await response.json();
            console.log(`[web-gen] Non-stream response:`, JSON.stringify(data).slice(0, 500));
            
            const code = data.choices?.[0]?.message?.content;
            
            if (!code || !code.includes('<!DOCTYPE')) {
              throw new Error('Response is not valid HTML');
            }
            
            console.log(`[web-gen] Success with ${modelConfig.name}, length: ${code.length}`);
            
            return new Response(JSON.stringify({ code }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } catch (error) {
          console.error(`[web-gen] ${modelConfig.name} key ${i + 1} failed:`, error instanceof Error ? error.message : error);
          lastError = error instanceof Error ? error : new Error(String(error));
          // Continue to next key
        }
      }
      
      // All keys failed for this model, try next model
      console.log(`[web-gen] All keys failed for ${modelConfig.name}, trying next model...`);
    }

    // All models and keys failed
    console.error('[web-gen] All models and keys failed');
    return new Response(JSON.stringify({ 
      error: lastError?.message || 'All AI models failed. Please try again.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[web-gen] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
