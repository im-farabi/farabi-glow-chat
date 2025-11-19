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
    
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        messages: [
          {
            role: 'system',
            content: `You are a smart suggestion generator. Based on the AI's response, generate exactly 2 relevant follow-up questions that a curious student might ask next.

Rules:
- Generate EXACTLY 2 questions
- Each question must be 5-10 words maximum
- Questions should dig deeper into the topic or explore related concepts
- Questions should be natural and conversational
- Return ONLY a JSON array of 2 strings, nothing else
- Example format: ["What are the main features?", "How does it compare to alternatives?"]`
          },
          {
            role: 'user',
            content: `AI Response: "${aiResponse}"\n\nGenerate 2 follow-up questions:`
          }
        ],
        temperature: 0.8,
        max_tokens: 100
      }),
    });

    const data = await response.json();
    const suggestionsText = data.choices[0].message.content.trim();
    
    // Parse JSON from response
    const suggestions = JSON.parse(suggestionsText);
    
    // Ensure we have exactly 2 suggestions
    const finalSuggestions = Array.isArray(suggestions) 
      ? suggestions.slice(0, 2) 
      : ["Tell me more", "What else?"];

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
