/**
 * API Configuration for FARABI.me
 * 
 * WARNING: This file contains a development API key.
 * Move this key to a server-side .env and use a proxy for production.
 * NEVER commit API keys to public repositories!
 */

const API_CONFIG = {
  baseUrl: 'https://text.pollinations.ai',
  apiKey: 'diO2AcUEcZmCDP_I', // DEV: do NOT commit to public repo
  models: {
    chat: 'openai-large',
    webSearch: 'gemini-search',
    reasoning: 'openai-reasoning'
  },
  maxContextMessages: 100000
};

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export type ModelType = 'chat' | 'webSearch' | 'reasoning';

/**
 * Build URL for API request
 */
function buildUrl(prompt: string, model: string): string {
  return `${API_CONFIG.baseUrl}/${encodeURIComponent(prompt)}?model=${model}`;
}

/**
 * Get headers for API request
 */
function getHeaders() {
  return {
    'Authorization': `Bearer ${API_CONFIG.apiKey}`,
    'Content-Type': 'application/json'
  };
}

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
 * Send request to API
 */
async function sendRequest(prompt: string, model: string, image?: File): Promise<string> {
  try {
    const url = buildUrl(prompt, model);
    
    let images: string[] | null = null;
    if (image) {
      const base64 = await imageToBase64(image);
      images = [base64];
    }

    const body = images && images.length > 0 ? {
      images: images
    } : {};

    const response = await fetch(url, {
      method: images && images.length > 0 ? 'POST' : 'GET',
      headers: getHeaders(),
      ...(images && images.length > 0 && { body: JSON.stringify(body) })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Send a chat message to the API
 */
export async function sendChat(prompt: string, image?: File): Promise<string> {
  return sendRequest(prompt, API_CONFIG.models.chat, image);
}

/**
 * Send a web search query
 */
export async function sendWebSearch(prompt: string, image?: File): Promise<string> {
  return sendRequest(prompt, API_CONFIG.models.webSearch, image);
}

/**
 * Send a reasoning query
 */
export async function sendReasoning(prompt: string, image?: File): Promise<string> {
  return sendRequest(prompt, API_CONFIG.models.reasoning, image);
}

/**
 * Update the API key at runtime
 */
export function setApiKey(newKey: string) {
  API_CONFIG.apiKey = newKey;
}

/**
 * Set maximum context messages
 */
export function setMaxContextMessages(max: number) {
  API_CONFIG.maxContextMessages = max;
}

/**
 * Get API configuration
 */
export function getApiConfig() {
  return { ...API_CONFIG };
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
      console.error('Test failed:', error);
      throw error;
    }
  };
}
