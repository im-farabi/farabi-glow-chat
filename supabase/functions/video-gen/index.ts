import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to parse nested error messages from Pollinations
function parseErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error);
      return parsed.message || parsed.error || error;
    } catch {
      return error;
    }
  }
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (err.message) {
      return parseErrorMessage(err.message);
    }
    if (err.error) {
      return parseErrorMessage(err.error);
    }
  }
  return 'Unknown error occurred';
}

// Check for content moderation errors
function isContentModerationError(message: string): boolean {
  const moderationKeywords = [
    'content policy',
    'safety',
    'blocked',
    'violates',
    'guidelines',
    'moderation',
    'inappropriate',
    'not allowed',
  ];
  const lowerMessage = message.toLowerCase();
  return moderationKeywords.some(keyword => lowerMessage.includes(keyword));
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, model = 'veo', duration = 6, aspectRatio = '16:9', audio = false, images, seed } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('NEW_POLLINATIONS_APIKEY_1');
    if (!apiKey) {
      console.error('Missing NEW_POLLINATIONS_APIKEY_1 secret');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client for storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let imageUrls: string[] = [];
    const uploadedFilePaths: string[] = [];

    // Process images - upload base64 to storage and get public URLs
    if (images && Array.isArray(images) && images.length > 0) {
      console.log(`Processing ${images.length} image(s) for upload...`);
      
      for (let i = 0; i < images.length; i++) {
        const imageData = images[i];
        
        // Check if it's already a URL (http/https)
        if (typeof imageData === 'string' && imageData.startsWith('http')) {
          imageUrls.push(imageData);
          continue;
        }
        
        // Handle base64 data URL
        if (typeof imageData === 'string' && imageData.startsWith('data:')) {
          try {
            // Extract mime type and base64 data
            const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
              console.error(`Invalid base64 format for image ${i}`);
              continue;
            }
            
            const mimeType = matches[1];
            const base64Data = matches[2];
            const extension = mimeType.split('/')[1] || 'png';
            
            // Convert base64 to Uint8Array
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              bytes[j] = binaryString.charCodeAt(j);
            }
            
            // Generate unique filename
            const filename = `video-ref-${Date.now()}-${i}.${extension}`;
            
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('video-temp-images')
              .upload(filename, bytes, {
                contentType: mimeType,
                upsert: false
              });
            
            if (uploadError) {
              console.error(`Failed to upload image ${i}:`, uploadError);
              continue;
            }
            
            uploadedFilePaths.push(filename);
            
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('video-temp-images')
              .getPublicUrl(filename);
            
            if (urlData?.publicUrl) {
              imageUrls.push(urlData.publicUrl);
              console.log(`Image ${i} uploaded successfully: ${urlData.publicUrl}`);
            }
          } catch (err) {
            console.error(`Error processing image ${i}:`, err);
          }
        }
      }
    }

    // Build the Pollinations API URL
    const encodedPrompt = encodeURIComponent(prompt);
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?model=${model}&key=${apiKey}&nologo=true`;
    
    // Add duration
    url += `&duration=${duration}`;
    
    // Add aspect ratio
    url += `&aspectRatio=${aspectRatio}`;
    
    // Add audio for Veo model
    if (audio && model === 'veo') {
      url += `&audio=true`;
    }
    
    // Add image URLs if we have them
    if (imageUrls.length > 0) {
      url += `&image=${encodeURIComponent(imageUrls.join(','))}`;
      console.log(`Added ${imageUrls.length} image URL(s) to request`);
    }
    
    // Add seed if provided
    if (seed) {
      url += `&seed=${seed}`;
    }

    console.log(`Generating video with model: ${model}, duration: ${duration}s, aspect: ${aspectRatio}`);
    console.log(`Request URL (without key): ${url.replace(apiKey, '***')}`);

    // Fetch video from Pollinations
    const response = await fetch(url);
    
    if (!response.ok) {
      let errorMessage = `Video generation failed (${response.status})`;
      
      try {
        const errorData = await response.json();
        errorMessage = parseErrorMessage(errorData);
        
        // Check for content moderation
        if (isContentModerationError(errorMessage)) {
          errorMessage = 'Your prompt was blocked by content moderation. Please try a different prompt without references to specific people, brands, or potentially inappropriate content.';
        }
      } catch {
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = parseErrorMessage(errorText);
          }
        } catch {
          // Keep default error message
        }
      }
      
      console.error('Pollinations API error:', errorMessage);
      
      // Cleanup uploaded images on error
      if (uploadedFilePaths.length > 0) {
        console.log('Cleaning up uploaded images after error...');
        await supabase.storage.from('video-temp-images').remove(uploadedFilePaths);
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get video as blob and convert to base64
    const videoBlob = await response.blob();
    const arrayBuffer = await videoBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);
    
    const videoUrl = `data:video/mp4;base64,${base64}`;
    
    console.log(`Video generated successfully! Size: ${(bytes.length / 1024 / 1024).toFixed(2)}MB`);
    
    // Cleanup uploaded images after successful generation
    if (uploadedFilePaths.length > 0) {
      console.log('Cleaning up temporary images...');
      const { error: deleteError } = await supabase.storage.from('video-temp-images').remove(uploadedFilePaths);
      if (deleteError) {
        console.warn('Failed to cleanup temp images:', deleteError);
      }
    }

    return new Response(
      JSON.stringify({ videoUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Video generation error:', error);
    const errorMessage = parseErrorMessage(error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
