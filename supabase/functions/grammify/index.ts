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
    if (!text || text.length < 3 || text.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Text must be between 3 and 500 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt based on options
    let systemPrompt = "You are a grammar and style enhancement AI. ";

    // Prompt Mode
    if (promptMode === 'longer') {
      systemPrompt += "Expand the text with more details and elaboration. ";
    } else if (promptMode === 'shorter') {
      systemPrompt += "Make the text more concise and brief. ";
    } else {
      systemPrompt += "Analyze the text and optimize it to the ideal length naturally. ";
    }

    // Personalization
    if (personalization === 'friendly') {
      systemPrompt += "Use a casual, fun, and approachable tone that's slightly shorter. ";
    } else if (personalization === 'professional') {
      systemPrompt += "Use a professional yet human tone, avoiding robotic language. ";
    } else {
      systemPrompt += "Detect the appropriate tone from the context and apply it naturally. ";
    }

    // Reply Mode
    let model = 'gemini-search';
    if (replyMode === 'fast') {
      systemPrompt += "Provide quick, direct improvements.";
    } else if (replyMode === 'think') {
      systemPrompt += "Carefully analyze and provide the best possible improvements with attention to nuance.";
      model = 'openai-large';
    } else {
      systemPrompt += "Provide balanced improvements.";
    }

    systemPrompt += "\n\nIMPORTANT: Return ONLY the enhanced text. Do not include any explanations, notes, or additional commentary.";

    console.log('Enhancing text with:', { promptMode, personalization, replyMode, model });

    // Try primary API key first
    const apiKey = Deno.env.get('POLLINATIONS_API_KEY');
    const fallbackKey = Deno.env.get('POLLINATIONS_FALLBACK_API_KEY');

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    let response;
    let usedFallback = false;

    try {
      response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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

      if (!response.ok) {
        throw new Error(`Primary API failed: ${response.status}`);
      }
    } catch (primaryError) {
      console.log('Primary API failed, trying fallback:', primaryError);
      
      if (!fallbackKey) {
        throw new Error('Fallback API key not configured');
      }

      response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${fallbackKey}`,
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

      usedFallback = true;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
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
