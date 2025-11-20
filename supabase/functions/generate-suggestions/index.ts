import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { aiResponse } = await req.json();
    
    const apiKey = Deno.env.get('POLLINATIONS_API_KEY');
    const fallbackApiKey = Deno.env.get('POLLINATIONS_FALLBACK_API_KEY');

    if (!apiKey) {
      throw new Error('POLLINATIONS_API_KEY not configured');
    }

    const systemPrompt = `You are a smart suggestion generator. Based on the AI's response, generate exactly 2 relevant follow-up questions that a curious student might ask next.

Rules:
- Generate EXACTLY 2 questions
- Each question must be 5-10 words maximum
- Questions should dig deeper into the topic or explore related concepts
- Questions should be natural and conversational
- Return ONLY a JSON array of 2 strings, nothing else
- Example format: ["What are the main features?", "How does it compare to alternatives?"]`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `AI Response: "${aiResponse}"\n\nGenerate 2 follow-up questions:` }
    ];

    // Try primary model (gemini-search)
    console.log('Attempting suggestion generation with gemini-search model...');
    let response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemini-search',
        messages,
        temperature: 0.8,
        max_tokens: 100
      }),
    });

    // Fallback with same model but different API key
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Primary gemini-search failed (${response.status}):`, errorText);
      
      if (!fallbackApiKey) {
        throw new Error('POLLINATIONS_FALLBACK_API_KEY not configured for fallback');
      }

      console.log('Retrying with fallback API key...');
      response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${fallbackApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gemini-search',
          messages,
          temperature: 0.8,
          max_tokens: 100
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fallback gemini-search also failed:', response.status, errorText);
        throw new Error(`Both API keys failed. Status: ${response.status}`);
      }
      
      console.log('Fallback API key succeeded');
    } else {
      console.log('Primary model succeeded');
    }

    const data = await response.json();
    const suggestionsText = data.choices[0].message.content.trim();
    
    console.log('Raw suggestions response:', suggestionsText);
    
    // Strip markdown code blocks if present
    let cleanedText = suggestionsText;
    if (suggestionsText.includes('```')) {
      cleanedText = suggestionsText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      console.log('Cleaned JSON (removed markdown):', cleanedText);
    }
    
    // Parse JSON from response
    let suggestions;
    try {
      suggestions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse suggestions JSON:', parseError);
      console.error('Attempted to parse:', cleanedText);
      throw new Error('Invalid JSON response from AI');
    }
    
    // Ensure we have exactly 2 suggestions
    const finalSuggestions = Array.isArray(suggestions) && suggestions.length > 0
      ? suggestions.slice(0, 2) 
      : ["Tell me more", "What else?"];

    console.log('Final suggestions:', finalSuggestions);

    return new Response(
      JSON.stringify({ suggestions: finalSuggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating suggestions:', error);
    
    // Fallback suggestions on error
    return new Response(
      JSON.stringify({ 
        suggestions: ["Tell me more about this", "What are some examples?"]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
