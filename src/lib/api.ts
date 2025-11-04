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

const SYSTEM_INSTRUCTIONS = {
  chat: `You are FARABI, an AI chatbot made by Ariyan Farabi.
You are professional, friendly, and respectful. Always reply clearly.
IMPORTANT: Always prioritize the latest user prompt first before considering conversation memory.
Rules:
- Friendly and child-safe
- No personal info sharing
- Short, clear, but detailed when needed
- No impersonation
- Avoid confusion between topic context and AI behavior`,
  
  webSearch: `You are FARABI with web search capabilities.
Provide accurate, up-to-date information based on web search results.
Always cite sources when possible.
Prioritize the latest user query over conversation history.`,
  
  reasoning: `You are FARABI with advanced reasoning capabilities.
Think step-by-step, show your reasoning process.
Break down complex problems logically.
Prioritize the latest user query over conversation history.`
};

const MEMORY_LIMIT = 3; // last 3 exchanges (6 messages)

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export type ModelType = 'chat' | 'webSearch' | 'reasoning' | 'imageGen';

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
 * Build conversation history from recent messages
 */
function buildConversationHistory(messages: Message[]): string {
  // Get last 6 messages (3 exchanges), filter out loading/error states
  const recentMessages = messages
    .filter(msg => msg.content.trim() && msg.role)
    .slice(-MEMORY_LIMIT * 2);
  
  return recentMessages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');
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
async function sendRequest(
  prompt: string, 
  model: string, 
  instruction: string,
  messages: Message[] = [],
  image?: File
): Promise<string> {
  try {
    // Build conversation history
    const history = buildConversationHistory(messages);
    
    // Build full prompt with instruction + history + current message
    const fullPrompt = history 
      ? `${instruction}\n${history}\nUser: ${prompt}\nAssistant:`
      : `${instruction}\nUser: ${prompt}\nAssistant:`;
    
    const url = buildUrl(fullPrompt, model);
    
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
export async function sendChat(prompt: string, messages: Message[] = [], image?: File): Promise<string> {
  return sendRequest(prompt, API_CONFIG.models.chat, SYSTEM_INSTRUCTIONS.chat, messages, image);
}

/**
 * Send a web search query
 */
export async function sendWebSearch(prompt: string, messages: Message[] = [], image?: File): Promise<string> {
  return sendRequest(prompt, API_CONFIG.models.webSearch, SYSTEM_INSTRUCTIONS.webSearch, messages, image);
}

/**
 * Send a reasoning query
 */
export async function sendReasoning(prompt: string, messages: Message[] = [], image?: File): Promise<string> {
  return sendRequest(prompt, API_CONFIG.models.reasoning, SYSTEM_INSTRUCTIONS.reasoning, messages, image);
}

/**
 * Generate an image with enhanced prompt
 */
export async function generateImage(
  userPrompt: string, 
  onStatusUpdate?: (status: string) => void
): Promise<{ imageUrl: string; imageBlob: Blob }> {
  try {
    // First, enhance the prompt using the AI
    onStatusUpdate?.('Enhancing Prompt...');
    
    const enhancementInstruction = `You are a prompt enhancement expert. Transform the following simple image description into a detailed, cinematic prompt with rich visual details. Include:
- Specific physical descriptions (eyes, hair, clothing, etc.)
- Setting and atmosphere details
- Lighting and time of day
- Camera angle/perspective
- Artistic style (hyper-realistic, cinematic, etc.)
- Emotional tone and mood

User's simple prompt: "${userPrompt}"

Return ONLY the enhanced prompt, nothing else. Make it 2-3 sentences maximum.`;

    const enhancedPrompt = await sendRequest(enhancementInstruction, API_CONFIG.models.chat, '', []);
    
    // Build the image URL with the enhanced prompt
    onStatusUpdate?.('Generating Image...');
    
    const encodedPrompt = encodeURIComponent(enhancedPrompt.trim());
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1344&height=768&model=flux&enhance=true&seed=${Math.floor(Math.random() * 1000)}&nologo=true`;
    
    // Fetch the image and convert to blob
    const imageResponse = await fetch(pollinationsUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to generate image: ${imageResponse.status}`);
    }
    
    const imageBlob = await imageResponse.blob();
    const imageUrl = URL.createObjectURL(imageBlob);
    
    return { imageUrl, imageBlob };
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
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
