import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POLLINATIONS_URL = 'https://gen.pollinations.ai/v1/chat/completions';

// Model configurations - Pollinations only
const MODELS: Record<string, { name: string; label: string }> = {
  gpt: { 
    name: 'openai-large',
    label: 'GPT 5.2'
  },
  claude: { 
    name: 'claude',
    label: 'Claude'
  },
  deepseek: { 
    name: 'deepseek',
    label: 'DeepSeek'
  }
};

// Fallback order
const FALLBACK_ORDER = ['gpt', 'claude', 'deepseek'];

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

// Call API with timeout for streaming
async function callAPIStream(
  apiKey: string, 
  prompt: string, 
  modelConfig: { name: string },
  systemPrompt: string,
  timeoutMs: number = 90000
): Promise<ReadableStream> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    console.log(`[web-gen] Calling ${modelConfig.name} via Pollinations...`);
    
    const response = await fetch(POLLINATIONS_URL, {
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

// Streaming generation for multi-model mode (Pollinations requires stream=true for max_tokens > 4096)
async function generateWithStreaming(
  apiKey: string,
  prompt: string,
  modelConfig: { name: string; label: string },
  systemPrompt: string,
  timeoutMs: number = 120000  // Increased timeout for full generation
): Promise<{ code: string; model: string; time: number }> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    console.log(`[web-gen] Multi-model: Calling ${modelConfig.name} (streaming)...`);
    
    const response = await fetch(POLLINATIONS_URL, {
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
        stream: true,  // Must be true for max_tokens > 4096
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
    
    // Collect all streamed content
    let fullContent = '';
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    if (!reader) throw new Error('No response body');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines only
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullContent += content;
          } catch {
            // Skip malformed JSON - may be split across chunks
          }
        }
      }
    }
    
    // Flush remaining buffer
    buffer += decoder.decode();
    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6).trim();
      if (data && data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) fullContent += content;
        } catch { /* ignore */ }
      }
    }
    
    // Clean up code
    let cleanedCode = fullContent
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
      
    if (!cleanedCode.startsWith('<!DOCTYPE')) {
      const doctypeIndex = cleanedCode.indexOf('<!DOCTYPE');
      if (doctypeIndex > 0) cleanedCode = cleanedCode.substring(doctypeIndex);
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`[web-gen] ${modelConfig.label} completed in ${elapsed}ms, ${cleanedCode.length} chars`);
    
    return {
      code: cleanedCode,
      model: modelConfig.label,
      time: elapsed
    };
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
    const { prompt, stream = true, model = 'gpt', isEdit = false, modes = [], multiModel = false } = await req.json();
    
    // Choose the appropriate system prompt
    const systemPrompt = isEdit ? EDIT_SYSTEM_PROMPT : buildSystemPrompt(modes as string[]);

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get API key
    const pollinationsKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');

    if (!pollinationsKey) {
      return new Response(JSON.stringify({ error: 'No API key configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Multi-model mode: generate with all 3 models in parallel
    if (multiModel) {
      console.log('[web-gen] Multi-model mode: generating with all 3 models...');
      
      const modelKeys = ['gpt', 'claude', 'deepseek'];
      const results = await Promise.allSettled(
        modelKeys.map(key => 
          generateWithStreaming(pollinationsKey, prompt, MODELS[key], systemPrompt)
        )
      );
      
      const multiResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return {
            model: modelKeys[index],
            label: MODELS[modelKeys[index]].label,
            success: true,
            code: result.value.code,
            time: result.value.time
          };
        } else {
          return {
            model: modelKeys[index],
            label: MODELS[modelKeys[index]].label,
            success: false,
            error: result.reason?.message || 'Unknown error',
            code: null,
            time: 0
          };
        }
      });
      
      console.log(`[web-gen] Multi-model results: ${multiResults.map(r => `${r.label}: ${r.success ? 'OK' : 'FAIL'}`).join(', ')}`);
      
      return new Response(JSON.stringify({ results: multiResults }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Single model streaming mode
    // Build model fallback chain: user's choice first, then others
    const modelsToTry = [model, ...FALLBACK_ORDER.filter(m => m !== model)];
    
    let lastError: Error | null = null;

    // Try each model in order
    for (const modelKey of modelsToTry) {
      const modelConfig = MODELS[modelKey];
      if (!modelConfig) continue;
      
      console.log(`[web-gen] Trying model: ${modelConfig.name}`);
      
      try {
        if (stream) {
          const upstreamStream = await callAPIStream(pollinationsKey, prompt, modelConfig, systemPrompt);
          const transformStream = createTransformStream();
          
          console.log(`[web-gen] Success with ${modelConfig.name}`);
          
          return new Response(upstreamStream.pipeThrough(transformStream), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            }
          });
        } else {
          // Non-streaming single model mode
          const result = await generateWithStreaming(pollinationsKey, prompt, modelConfig, systemPrompt);
          
          if (!result.code || !result.code.includes('<!DOCTYPE')) {
            throw new Error('Response is not valid HTML');
          }
          
          console.log(`[web-gen] Success with ${modelConfig.name}, length: ${result.code.length}`);
          
          return new Response(JSON.stringify({ code: result.code }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error(`[web-gen] ${modelConfig.name} failed:`, error instanceof Error ? error.message : error);
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continue to next model
      }
    }

    // All models failed
    console.error('[web-gen] All models failed');
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
