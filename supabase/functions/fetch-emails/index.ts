import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailMessage {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  date: string;
  preview: string;
  body: string;
  isRead: boolean;
}

// Parse IMAP response to extract email data
function parseImapResponse(response: string): { exists: number; messages: any[] } {
  const lines = response.split('\r\n');
  let exists = 0;
  const messages: any[] = [];
  
  for (const line of lines) {
    // Check for EXISTS
    const existsMatch = line.match(/\* (\d+) EXISTS/);
    if (existsMatch) {
      exists = parseInt(existsMatch[1]);
    }
    
    // Parse FETCH responses
    const fetchMatch = line.match(/\* (\d+) FETCH/);
    if (fetchMatch) {
      const msgNum = parseInt(fetchMatch[1]);
      const envelope = parseEnvelope(line);
      const flags = parseFlags(line);
      messages.push({ num: msgNum, envelope, flags });
    }
  }
  
  return { exists, messages };
}

function parseEnvelope(line: string): any {
  // Basic envelope parsing
  const subjectMatch = line.match(/"([^"]*?)"\s*"[^"]*"\s*\(\(/);
  const dateMatch = line.match(/ENVELOPE\s*\("([^"]+)"/);
  
  return {
    subject: subjectMatch?.[1] || '(No Subject)',
    date: dateMatch?.[1] || new Date().toISOString()
  };
}

function parseFlags(line: string): string[] {
  const flagsMatch = line.match(/FLAGS\s*\(([^)]*)\)/);
  if (flagsMatch) {
    return flagsMatch[1].split(' ').filter(f => f);
  }
  return [];
}

// Connect to IMAP server using Deno's native TCP
async function connectIMAP(host: string, port: number, email: string, password: string): Promise<EmailMessage[]> {
  console.log('Creating TLS connection to', host, port);
  const conn = await Deno.connectTls({ hostname: host, port });
  console.log('TLS connection established');
  
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const readResponse = async (timeout = 5000): Promise<string> => {
    const buffer = new Uint8Array(16384);
    try {
      // Set up timeout
      const timeoutId = setTimeout(() => conn.close(), timeout);
      const n = await conn.read(buffer);
      clearTimeout(timeoutId);
      if (n === null) return '';
      const result = decoder.decode(buffer.subarray(0, n));
      return result;
    } catch (e) {
      console.error('Read error:', e);
      return '';
    }
  };
  
  const sendCommand = async (tag: string, cmd: string): Promise<string> => {
    const fullCmd = `${tag} ${cmd}`;
    console.log('Sending:', tag, cmd.substring(0, 20) + '...');
    await conn.write(encoder.encode(fullCmd + '\r\n'));
    
    // Wait for complete response (until we see the tag with OK/NO/BAD)
    let response = '';
    let attempts = 0;
    const maxAttempts = 15;
    
    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 300));
      const chunk = await readResponse(3000);
      response += chunk;
      console.log('Chunk received:', chunk.length, 'bytes');
      
      // Check if we got the tagged response
      if (response.includes(`${tag} OK`) || response.includes(`${tag} NO`) || response.includes(`${tag} BAD`)) {
        break;
      }
      
      if (!chunk) {
        attempts++;
      }
    }
    
    console.log('Full response for', tag, ':', response.substring(0, 200));
    return response;
  };
  
  try {
    // Read greeting
    const greeting = await readResponse();
    console.log('Server greeting received');
    
    // Login - escape password properly for IMAP (use literal or escape special chars)
    // IMAP requires special characters in passwords to be properly escaped
    const escapedPassword = password.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    console.log('Attempting login for:', email);
    const loginResp = await sendCommand('A001', `LOGIN "${email}" "${escapedPassword}"`);
    console.log('Login response:', loginResp.substring(0, 100));
    
    // Check for specific tagged response - A001 OK means success
    if (loginResp.includes('A001 NO') || loginResp.includes('A001 BAD')) {
      console.error('Login failed with response:', loginResp);
      throw new Error('Authentication failed');
    }
    
    if (!loginResp.includes('A001 OK')) {
      console.error('Unexpected login response:', loginResp);
      throw new Error('Authentication failed - unexpected response');
    }
    console.log('Login successful');
    
    // Select INBOX
    const selectResp = await sendCommand('A002', 'SELECT INBOX');
    const existsMatch = selectResp.match(/\* (\d+) EXISTS/);
    const exists = existsMatch ? parseInt(existsMatch[1]) : 0;
    
    const emails: EmailMessage[] = [];
    
    if (exists > 0) {
      // Fetch last 50 emails with body preview
      const start = Math.max(1, exists - 49);
      const fetchResp = await sendCommand('A003', `FETCH ${start}:* (UID FLAGS ENVELOPE BODY.PEEK[TEXT]<0.500>)`);
      
      // Parse the fetch response - split by FETCH boundaries
      const fetchBlocks = fetchResp.split(/\* \d+ FETCH/).filter(b => b.trim());
      
      for (const block of fetchBlocks) {
        // Extract UID
        const uidMatch = block.match(/UID\s+(\d+)/);
        const uid = uidMatch ? uidMatch[1] : Date.now().toString();
        
        // Extract flags
        const flagsMatch = block.match(/FLAGS\s*\(([^)]*)\)/);
        const flags = flagsMatch ? flagsMatch[1] : '';
        const isRead = flags.includes('\\Seen');
        
        // Extract body text - look for literal string format {size}\r\n...content...
        let bodyText = '';
        const bodyLiteralMatch = block.match(/BODY\[TEXT\]<0>\s*\{(\d+)\}\r?\n([\s\S]*)/);
        if (bodyLiteralMatch) {
          const size = parseInt(bodyLiteralMatch[1]);
          bodyText = bodyLiteralMatch[2].substring(0, Math.min(size, 500));
        } else {
          // Try quoted format
          const bodyQuotedMatch = block.match(/BODY\[TEXT\]<0\.500>\s*"([^"]*)"/);
          if (bodyQuotedMatch) {
            bodyText = bodyQuotedMatch[1];
          }
        }
        
        // Clean up body text - remove HTML tags and decode entities
        bodyText = bodyText
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 300);
        
        // Extract envelope data (simplified parsing)
        const envelopeMatch = block.match(/ENVELOPE\s*\((.+?)\)\s*(?:BODY|$)/s);
        if (envelopeMatch) {
          const envData = envelopeMatch[1];
          
          // Extract date - first quoted string
          const dateMatch = envData.match(/"([^"]+)"/);
          const date = dateMatch ? dateMatch[1] : new Date().toISOString();
          
          // Extract subject - second quoted string
          const allQuotes = envData.match(/"[^"]*"/g) || [];
          const subject = allQuotes[1]?.replace(/"/g, '') || '(No Subject)';
          
          // Try to extract from address
          const fromMatch = envData.match(/\(\("([^"]*)" NIL "([^"]*)" "([^"]*)"\)\)/);
          const fromName = fromMatch?.[1] || 'Unknown';
          const fromAddr = fromMatch ? `${fromMatch[2]}@${fromMatch[3]}` : 'unknown@unknown.com';
          
          emails.push({
            id: uid,
            from: fromAddr,
            fromName: fromName || fromAddr.split('@')[0],
            subject: decodeSubject(subject),
            date: date,
            preview: bodyText || 'No preview available',
            body: bodyText || 'No content available',
            isRead
          });
        }
      }
    }
    
    // Logout
    await sendCommand('A004', 'LOGOUT');
    conn.close();
    
    // Sort by date descending
    emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return emails;
    
  } catch (error) {
    conn.close();
    throw error;
  }
}

// Decode MIME encoded subjects
function decodeSubject(subject: string): string {
  // Handle =?UTF-8?B?...?= or =?UTF-8?Q?...?= encoding
  try {
    if (subject.includes('=?')) {
      const match = subject.match(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/i);
      if (match) {
        const [, charset, encoding, data] = match;
        if (encoding.toUpperCase() === 'B') {
          // Base64
          return atob(data);
        } else if (encoding.toUpperCase() === 'Q') {
          // Quoted-printable
          return data.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (_, hex) => 
            String.fromCharCode(parseInt(hex, 16))
          );
        }
      }
    }
    return subject;
  } catch {
    return subject;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { account } = await req.json();
    console.log('Fetching emails for account:', account);

    // Get credentials based on account selection
    let email: string;
    let password: string;

    if (account === 'support@notez.fun') {
      email = Deno.env.get('HOSTINGER_EMAIL_1') || '';
      password = Deno.env.get('HOSTINGER_EMAIL_1_PASSWORD') || '';
    } else if (account === 'jones.smith@notez.fun') {
      email = Deno.env.get('HOSTINGER_EMAIL_2') || '';
      password = Deno.env.get('HOSTINGER_EMAIL_2_PASSWORD') || '';
    } else {
      throw new Error('Invalid account selected');
    }

    if (!email || !password) {
      throw new Error('Email credentials not configured');
    }

    console.log('Connecting to IMAP for:', email);
    
    const emails = await connectIMAP('imap.hostinger.com', 993, email, password);
    
    console.log('Fetched', emails.length, 'emails');

    return new Response(JSON.stringify({ 
      success: true, 
      emails,
      total: emails.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error fetching emails:', error);
    
    let errorMessage = 'Failed to fetch emails';
    let errorCode = 'FETCH_ERROR';

    if (error.message?.includes('auth') || error.message?.includes('Auth') || error.message?.includes('credentials') || error.message?.includes('Login')) {
      errorMessage = 'Unable to authenticate. Please check email settings.';
      errorCode = 'AUTH_ERROR';
    } else if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
      errorMessage = 'Connection timed out. Please try again.';
      errorCode = 'TIMEOUT_ERROR';
    } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ENOTFOUND') || error.message?.includes('connection')) {
      errorMessage = 'Mail server is temporarily unavailable.';
      errorCode = 'SERVER_ERROR';
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      errorCode,
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
