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

// System prompt for Tailwind + Alpine.js websites
const ALPINE_SYSTEM_PROMPT = `You are an expert web developer creating modern websites with Tailwind CSS and Alpine.js.

Generate COMPLETE HTML code with these REQUIRED technologies:
1. Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
2. Alpine.js via CDN: <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
3. Google Fonts for typography
4. Font Awesome via CDN for icons

ALPINE.JS FEATURES TO USE:
- x-data for reactive state (e.g., x-data="{ open: false, dark: true }")
- x-show with x-transition for smooth show/hide animations
- x-on:click or @click for click handlers
- x-bind or :class for dynamic classes
- x-init for initialization logic
- Create a dark mode toggle using Alpine state
- Create mobile hamburger menu with x-show

TAILWIND BEST PRACTICES:
- Use utility classes for all styling
- Use dark: variants for dark mode (dark:bg-gray-900 dark:text-white)
- Use responsive variants (sm:, md:, lg:)
- Use hover: and focus: states
- Use gradient backgrounds: bg-gradient-to-r from-blue-500 to-purple-600
- Use transitions: transition-all duration-300

CRITICAL RULES:
1. Return ONLY valid HTML - no markdown, no backticks, no explanations
2. Start with <!DOCTYPE html>
3. End with </html>
4. Include Tailwind config in <script> for custom colors if needed
5. Make it fully responsive and interactive
6. Dark theme by default

NEVER truncate. Complete every tag. Output must start with <!DOCTYPE html> and end with </html>.`;

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
        max_tokens: 8192,
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
    const { prompt, stream = true, model = 'gemini', isEdit = false, isAlpine = false } = await req.json();
    
    // Choose the appropriate system prompt
    const systemPrompt = isEdit ? EDIT_SYSTEM_PROMPT 
                       : isAlpine ? ALPINE_SYSTEM_PROMPT 
                       : SYSTEM_PROMPT;

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
                max_tokens: 8192
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
