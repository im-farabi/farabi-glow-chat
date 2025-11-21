import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, promptMode, personalization, replyMode } = await req.json();
    
    // Validation
    if (!text || text.length < 3 || text.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Text must be between 3 and 1000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt with strict constraints
    let systemPrompt = `You are a professional text enhancement AI. Your ONLY job is to fix and improve the text provided.

CRITICAL RULES YOU MUST FOLLOW:
1. NEVER add new information, facts, or content that is not already in the original text
2. NEVER respond to questions or statements conversationally - only fix their grammar and format
3. NEVER break character or engage with the text as if you're having a conversation
4. ONLY improve: grammar, spelling, punctuation, capitalization, sentence structure, clarity, and word choice
5. Keep the original meaning, intent, and all factual content completely unchanged
6. If the text is a question (like "how are you"), format it properly but DO NOT answer it

Example of CORRECT behavior:
- Input: "hi how are you ai"
- Output: "Hi, how are you, AI?" (✓ Fixed capitalization and punctuation)
- WRONG: "I'm doing well, thank you! How are you?" (✗ This is conversational and adds information)

Example of CORRECT behavior:
- Input: "the book was good i liked it"
- Output: "The book was good; I liked it." (✓ Fixed grammar and punctuation)
- WRONG: "The book was excellent and I thoroughly enjoyed reading it because..." (✗ This adds new opinions)

`;

    // Prompt Mode
    if (promptMode === 'longer') {
      systemPrompt += "\nLength Adjustment: Slightly expand sentences for better clarity and flow, but ONLY by improving structure and word choice - never by adding new facts or ideas. ";
    } else if (promptMode === 'shorter') {
      systemPrompt += "\nLength Adjustment: Make the text more concise by removing redundancy and tightening sentence structure, while keeping all original meaning. ";
    } else {
      systemPrompt += "\nLength Adjustment: Optimize the text to its natural ideal length by improving structure without forcing it to be longer or shorter. ";
    }

    // Personalization
    if (personalization === 'friendly') {
      systemPrompt += "\nTone: Use a warm, casual, and approachable tone while maintaining proper grammar. Make it sound friendly but still clear. ";
    } else if (personalization === 'professional') {
      systemPrompt += "\nTone: Use a professional yet natural tone. Sound polished and business-appropriate, but avoid stiff or robotic language. ";
    } else {
      systemPrompt += "\nTone: Detect the original tone from the text and enhance it naturally. Match the writer's intended style. ";
    }

    // Reply Mode
    let model = 'gemini-search';
    if (replyMode === 'fast') {
      systemPrompt += "\nApproach: Quick, direct improvements focusing on the most obvious grammar and clarity issues.";
    } else if (replyMode === 'think') {
      systemPrompt += "\nApproach: Thoroughly analyze every aspect of the text. Pay careful attention to nuance, flow, sentence variety, and subtle improvements in word choice and structure.";
      model = 'openai-large';
    } else {
      systemPrompt += "\nApproach: Balanced improvements covering grammar, clarity, and structure with moderate attention to detail.";
    }

    systemPrompt += "\n\nOUTPUT FORMAT: Return ONLY the enhanced text. No explanations, no notes, no commentary, no quotation marks around it. Just the improved text itself.";

    console.log('Enhancing text with:', { promptMode, personalization, replyMode, model });

    // Try primary API key first
    const apiKey = Deno.env.get('POLLINATIONS_API_KEY');
    const fallbackKey = Deno.env.get('POLLINATIONS_FALLBACK_API_KEY');

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    let response;
    let usedFallback = false;

    // Helper function to make API call with retry
    const makeAPICall = async (key: string, retries = 2): Promise<Response> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const res = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
              ]
            })
          });

          // If success or non-retryable error, return immediately
          if (res.ok || (res.status !== 502 && res.status !== 503 && res.status !== 504)) {
            return res;
          }

          // For 502/503/504, retry after delay
          if (attempt < retries) {
            console.log(`API returned ${res.status}, retrying in ${(attempt + 1) * 500}ms...`);
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 500));
          } else {
            return res;
          }
        } catch (error) {
          if (attempt === retries) throw error;
          console.log(`Request failed (attempt ${attempt + 1}), retrying...`);
          await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 500));
        }
      }
      throw new Error('Max retries exceeded');
    };

    try {
      response = await makeAPICall(apiKey);

      if (!response.ok) {
        throw new Error(`Primary API failed: ${response.status}`);
      }
    } catch (primaryError) {
      console.log('Primary API failed, trying fallback:', primaryError);
      
      if (!fallbackKey) {
        throw new Error('Fallback API key not configured');
      }

      response = await makeAPICall(fallbackKey);
      usedFallback = true;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new Error('AI service temporarily unavailable. Please try again in a moment.');
      }
      
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedText = data.choices[0].message.content;

    console.log('Enhancement successful, used fallback:', usedFallback);

    return new Response(
      JSON.stringify({ enhancedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in grammify:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
