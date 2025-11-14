const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DANGEROUS_PATTERNS = [
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /setTimeout\s*\(\s*["'`]/gi,
  /setInterval\s*\(\s*["'`]/gi,
  /<script[^>]*src\s*=/gi, // External scripts
  /onclick\s*=/gi,
  /onerror\s*=/gi,
  /onload\s*=/gi,
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html, css, js } = await req.json();
    
    console.log('Validating website code');

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate HTML
    if (!html || html.trim().length === 0) {
      errors.push('HTML content is required');
    } else {
      // Check for basic HTML structure
      if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
        warnings.push('Missing DOCTYPE or HTML tag - will be added automatically');
      }

      // Check for dangerous patterns in HTML
      DANGEROUS_PATTERNS.forEach(pattern => {
        if (pattern.test(html)) {
          errors.push('Potentially dangerous code detected in HTML');
        }
      });

      // Check file size (100KB limit)
      if (html.length > 100 * 1024) {
        errors.push('HTML content exceeds 100KB limit');
      }
    }

    // Validate CSS (optional)
    if (css && css.trim().length > 0) {
      // Basic CSS validation
      const braceCount = (css.match(/{/g) || []).length - (css.match(/}/g) || []).length;
      if (braceCount !== 0) {
        warnings.push('CSS may have mismatched braces');
      }

      // Check file size (50KB limit)
      if (css.length > 50 * 1024) {
        errors.push('CSS content exceeds 50KB limit');
      }
    }

    // Validate JavaScript (optional)
    if (js && js.trim().length > 0) {
      // Check for dangerous patterns
      DANGEROUS_PATTERNS.forEach(pattern => {
        if (pattern.test(js)) {
          errors.push('Potentially dangerous code detected in JavaScript');
        }
      });

      // Check file size (50KB limit)
      if (js.length > 50 * 1024) {
        errors.push('JavaScript content exceeds 50KB limit');
      }

      // Check for basic syntax issues
      const braceCount = (js.match(/{/g) || []).length - (js.match(/}/g) || []).length;
      if (braceCount !== 0) {
        warnings.push('JavaScript may have mismatched braces');
      }
    }

    const valid = errors.length === 0;

    return new Response(
      JSON.stringify({ valid, errors, warnings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-website:', error);
    return new Response(
      JSON.stringify({ valid: false, errors: ['Error validating website code'], warnings: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
