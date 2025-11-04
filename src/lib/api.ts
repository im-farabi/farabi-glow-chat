/**
 * API Configuration for FARABI.me
 * 
 * WARNING: This file contains a development API key.
 * Move this key to a server-side .env and use a proxy for production.
 */

const API_CONFIG = {
  baseUrl: 'https://text.pollinations.ai',
  apiKey: 'diO2AcUEcZmCDP_I', // DEV: do NOT commit to public repo
  models: {
    chat: 'openai-large',
    webSearch: 'gemini-search',
    reasoning: 'openai-reasoning'
  }
};

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export type ModelType = 'chat' | 'webSearch' | 'reasoning';

/**
 * Convert image file to base64
 */
async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Send a chat message to the API
 */
export async function sendChat(prompt: string, image?: File): Promise<string> {
  const body: any = {
    messages: [{ role: 'user', content: prompt }]
  };

  if (image) {
    const base64 = await imageToBase64(image);
    body.images = [base64];
  }

  const response = await fetch(
    `${API_CONFIG.baseUrl}/prompt/${encodeURIComponent(prompt)}?model=${API_CONFIG.models.chat}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', response.status, errorText);
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return await response.text();
}

/**
 * Send a web search query
 */
export async function sendWebSearch(prompt: string, image?: File): Promise<string> {
  const body: any = {
    messages: [{ role: 'user', content: prompt }]
  };

  if (image) {
    const base64 = await imageToBase64(image);
    body.images = [base64];
  }

  const response = await fetch(
    `${API_CONFIG.baseUrl}/prompt/${encodeURIComponent(prompt)}?model=${API_CONFIG.models.webSearch}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', response.status, errorText);
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return await response.text();
}

/**
 * Send a reasoning query
 */
export async function sendReasoning(prompt: string, image?: File): Promise<string> {
  const body: any = {
    messages: [{ role: 'user', content: prompt }]
  };

  if (image) {
    const base64 = await imageToBase64(image);
    body.images = [base64];
  }

  const response = await fetch(
    `${API_CONFIG.baseUrl}/prompt/${encodeURIComponent(prompt)}?model=${API_CONFIG.models.reasoning}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', response.status, errorText);
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return await response.text();
}

/**
 * Update the API key at runtime
 */
export function setApiKey(newKey: string) {
  API_CONFIG.apiKey = newKey;
}

/**
 * Debug helper for testing
 */
if (typeof window !== 'undefined') {
  (window as any).__testSendChat = async (text: string) => {
    console.log('Testing sendChat with:', text);
    try {
      const result = await sendChat(text);
      console.log('Result:', result);
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };
}
