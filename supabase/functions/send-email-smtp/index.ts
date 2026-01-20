import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple SMTP client using native Deno TCP
async function sendViaSMTP(
  host: string, 
  port: number, 
  email: string, 
  password: string,
  to: string,
  subject: string,
  body: string
): Promise<string> {
  const conn = await Deno.connectTls({ hostname: host, port });
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const readResponse = async (): Promise<string> => {
    const buffer = new Uint8Array(4096);
    const n = await conn.read(buffer);
    if (n === null) return '';
    return decoder.decode(buffer.subarray(0, n));
  };
  
  const sendCommand = async (cmd: string, expectCode?: number): Promise<string> => {
    await conn.write(encoder.encode(cmd + '\r\n'));
    await new Promise(r => setTimeout(r, 100));
    const response = await readResponse();
    console.log('SMTP:', cmd.substring(0, 30), '->', response.substring(0, 50));
    if (expectCode && !response.startsWith(expectCode.toString())) {
      throw new Error(`SMTP error: ${response}`);
    }
    return response;
  };
  
  try {
    // Read greeting
    const greeting = await readResponse();
    console.log('SMTP Greeting:', greeting.substring(0, 50));
    
    // EHLO
    await sendCommand(`EHLO ${host}`, 250);
    
    // AUTH LOGIN
    await sendCommand('AUTH LOGIN', 334);
    
    // Send base64 encoded username
    await sendCommand(btoa(email), 334);
    
    // Send base64 encoded password
    await sendCommand(btoa(password), 235);
    
    // MAIL FROM
    await sendCommand(`MAIL FROM:<${email}>`, 250);
    
    // RCPT TO
    await sendCommand(`RCPT TO:<${to}>`, 250);
    
    // DATA
    await sendCommand('DATA', 354);
    
    // Build email content
    const date = new Date().toUTCString();
    const messageId = `<${Date.now()}@${email.split('@')[1]}>`;
    
    const emailContent = [
      `From: ${email}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Date: ${date}`,
      `Message-ID: ${messageId}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      body,
      `.`
    ].join('\r\n');
    
    await conn.write(encoder.encode(emailContent + '\r\n'));
    await new Promise(r => setTimeout(r, 200));
    const dataResp = await readResponse();
    console.log('DATA response:', dataResp.substring(0, 50));
    
    if (!dataResp.includes('250')) {
      throw new Error(`Failed to send: ${dataResp}`);
    }
    
    // QUIT
    await sendCommand('QUIT');
    
    conn.close();
    
    return messageId;
    
  } catch (error) {
    conn.close();
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { account, to, subject, body } = await req.json();
    console.log('Sending email from:', account, 'to:', to);

    // Validate input
    if (!to || !subject || !body) {
      throw new Error('Missing required fields: to, subject, or body');
    }

    // Basic email validation
    if (!to.includes('@') || !to.includes('.')) {
      throw new Error('Invalid recipient email address');
    }

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

    console.log('Sending from:', email);
    
    const messageId = await sendViaSMTP(
      'smtp.hostinger.com',
      465,
      email,
      password,
      to,
      subject,
      body
    );

    console.log('Email sent successfully:', messageId);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId,
      message: 'Email sent successfully!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    
    let errorMessage = 'Failed to send email. Please try again.';
    let errorCode = 'SEND_ERROR';

    if (error.message?.includes('auth') || error.message?.includes('AUTH') || error.message?.includes('credentials') || error.message?.includes('535')) {
      errorMessage = 'Unable to authenticate. Please check email settings.';
      errorCode = 'AUTH_ERROR';
    } else if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
      errorMessage = 'Connection timed out. Please try again.';
      errorCode = 'TIMEOUT_ERROR';
    } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ENOTFOUND') || error.message?.includes('connection')) {
      errorMessage = 'Mail server is temporarily unavailable.';
      errorCode = 'SERVER_ERROR';
    } else if (error.message?.includes('Invalid recipient') || error.message?.includes('550') || error.message?.includes('553')) {
      errorMessage = 'Invalid recipient email address.';
      errorCode = 'RECIPIENT_ERROR';
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
