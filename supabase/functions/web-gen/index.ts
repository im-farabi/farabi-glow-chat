import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_URL = 'https://api.apifree.ai/v1/chat/completions';

// Model configurations with Gemini as primary
const MODELS: Record<string, { name: string; label: string }> = {
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
  }
};

// Fallback order when a model fails
const FALLBACK_ORDER = ['gemini', 'haiku', 'kimi'];

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
4. Include all CSS in <style> or use Tailwind CDN
5. Include all JavaScript in <script> tags
6. Dark theme by default unless specified otherwise
7. Make it responsive and modern
8. Use Google Fonts and Font Awesome from CDN

NEVER truncate. Complete every tag. Output must start with <!DOCTYPE html> and end with </html>.`;

  // Standard mode (no special requirements)
  if (modes.includes('standard') || modes.length === 0) {
    return `You are an expert web developer. Generate COMPLETE HTML code only.
${baseRules}`;
  }

  // Build combined prompt for multiple modes
  let prompt = `You are an expert web developer creating a website with the following technologies:\n\n`;
  
  if (modes.includes('interactive')) {
    prompt += `TAILWIND + ALPINE.JS (Interactive Mode):
- Include: <script src="https://cdn.tailwindcss.com"></script>
- Include: <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
- Use x-data for reactive state, x-show with x-transition for animations
- Use @click for handlers, :class for dynamic classes
- Create dark mode toggle and responsive mobile menu
- Use Tailwind utility classes, dark: variants, responsive variants (sm:, md:, lg:)

`;
  }
  
  if (modes.includes('game')) {
    prompt += `KABOOM.JS (Game Mode):
- Include: <script src="https://unpkg.com/kaboom@3000/dist/kaboom.mjs" type="module"></script>
- Create a COMPLETE, PLAYABLE 2D game
- Use kaboom() initialization with canvas
- Use add() to create game objects with rect(), color(), pos(), area()
- Use onKeyDown/onKeyPress for player controls
- Use onCollide() for collision detection
- Track and display score with text()
- Include clear game instructions on screen
- Add game states: menu, playing, gameover

`;
  }
  
  if (modes.includes('threejs')) {
    prompt += `THREE.JS (3D Experience Mode):
- Include: <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
- Include: <script src="https://unpkg.com/three@0.160.0/examples/js/controls/OrbitControls.js"></script>
- Create Scene, Camera (PerspectiveCamera), and WebGLRenderer
- Add proper lighting (AmbientLight, DirectionalLight, PointLight)
- Create geometries with materials (MeshStandardMaterial, MeshPhongMaterial)
- Implement animation loop with requestAnimationFrame
- Add OrbitControls for camera interaction
- Make canvas responsive to window resize

`;
  }
  
  if (modes.includes('animated')) {
    prompt += `GSAP (Animated Mode):
- Include: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
- Include: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
- Use gsap.from() and gsap.to() for element animations
- Use ScrollTrigger.create() for scroll-based animations
- Use stagger property for sequential animations
- Create timelines with gsap.timeline() for complex sequences
- Use professional easing: "power2.out", "elastic.out", "bounce.out"
- Animate on page load and on scroll

`;
  }

  // Add priority ordering for multi-mode combinations
  if (modes.length > 1) {
    prompt += `\nIMPORTANT: When combining technologies, prioritize them in this order:
1. Game Mode (Kaboom.js) - Core game mechanics must work first
2. 3D Experience (Three.js) - Use as background/visual enhancement only
3. Interactive (Alpine.js) - For UI elements outside the main canvas
4. Animated (GSAP) - For entrance animations and non-conflicting elements

Ensure the technologies work together harmoniously without conflicts.
`;
  }

  prompt += `Generate COMPLETE HTML code combining all the above technologies seamlessly.
${baseRules}`;

  return prompt;
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
  modelConfig: { name: string },
  systemPrompt: string,
  timeoutMs: number = 60000
): Promise<ReadableStream> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    console.log(`[web-gen] Calling ${modelConfig.name}...`);
    
    const response = await fetch(API_URL, {
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
      throw new Error(`API Error ${response.status}: ${errorText.slice(0, 200)}`);
    }
    
    if (!response.body) {
      throw new Error('No response body');
    }
    
    return response.body;
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
    const apiKeys = [
      Deno.env.get('APIFREE_API_KEY_1'),
      Deno.env.get('APIFREE_API_KEY_2'),
      Deno.env.get('APIFREE_API_KEY_3'),
    ].filter(Boolean) as string[];

    if (apiKeys.length === 0) {
      return new Response(JSON.stringify({ error: 'No API keys configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Shuffle keys for load balancing
    const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);
    
    // Build model fallback chain: user's choice first, then others
    const modelsToTry = [model, ...FALLBACK_ORDER.filter(m => m !== model)];
    
    let lastError: Error | null = null;

    // Try each model in order, with all API keys
    for (const modelKey of modelsToTry) {
      const modelConfig = MODELS[modelKey];
      if (!modelConfig) continue;
      
      console.log(`[web-gen] Trying model: ${modelConfig.name}`);
      
      for (let i = 0; i < shuffledKeys.length; i++) {
        const apiKey = shuffledKeys[i];
        
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
            const response = await fetch(API_URL, {
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
              throw new Error(`API Error ${response.status}`);
            }

            const data = await response.json();
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
