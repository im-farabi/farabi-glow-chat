/**
 * Local storage management for chat history
 */

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    image?: string;
  }>;
}

const STORAGE_KEY = 'farabi_chat_history';
const MAX_TITLE_LENGTH = 30;

/**
 * Get all chat sessions from localStorage
 */
export function getAllChats(): ChatSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading chats:', error);
    return [];
  }
}

/**
 * Save a chat session
 */
export function saveChat(chat: ChatSession): void {
  try {
    const chats = getAllChats();
    const existingIndex = chats.findIndex(c => c.id === chat.id);
    
    if (existingIndex >= 0) {
      chats[existingIndex] = chat;
    } else {
      chats.unshift(chat);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error('Error saving chat:', error);
  }
}

/**
 * Get a specific chat by ID
 */
export function getChat(id: string): ChatSession | null {
  const chats = getAllChats();
  return chats.find(c => c.id === id) || null;
}

/**
 * Delete a chat session
 */
export function deleteChat(id: string): void {
  try {
    const chats = getAllChats().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error('Error deleting chat:', error);
  }
}

/**
 * Create a new chat session
 */
export function createNewChat(): ChatSession {
  return {
    id: Date.now().toString(),
    title: 'New Chat',
    timestamp: Date.now(),
    messages: []
  };
}

/**
 * Truncate title to max length with ellipsis
 */
export function truncateTitle(title: string): string {
  if (title.length <= MAX_TITLE_LENGTH) {
    return title;
  }
  return title.substring(0, MAX_TITLE_LENGTH) + '...';
}

/**
 * Generate title from first message using AI
 */
export async function generateTitle(firstMessage: string): Promise<string> {
  const cleaned = firstMessage.trim();
  if (!cleaned) return 'New Chat';
  
  try {
    const prompt = encodeURIComponent(cleaned);
    const response = await fetch(`https://text.pollinations.ai/Generate a prompt minimum will be 3 and max will be 30 character long. If the prompt is like "hi" ur prompt will be like Greetings if "code me javascript about website" ur prompt will be "Javascript Coding About Website". If anything inappropiate say "Filtered chat". One shot answer no extra stuff like sure heres the prompt avoid those only prompt. Heres the prompt: ${prompt}`);
    
    if (!response.ok) {
      return truncateTitle(cleaned);
    }
    
    const title = await response.text();
    return truncateTitle(title.trim());
  } catch (error) {
    console.error('Error generating title:', error);
    return truncateTitle(cleaned);
  }
}
