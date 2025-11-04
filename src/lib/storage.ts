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

/**
 * Usage tracking for cost calculation
 */

const USAGE_STORAGE_KEY = 'farabi_usage_stats';

export interface UsageStats {
  totalInputChars: number;
  totalOutputChars: number;
  lastUpdated: number;
}

// Cost per character (based on token pricing)
const INPUT_COST_PER_CHAR = 0.0000000075;  // $30 per 1M tokens
const OUTPUT_COST_PER_CHAR = 0.000000015;  // $60 per 1M tokens

/**
 * Calculate usage from all existing chats
 */
export function calculateUsageFromAllChats(): UsageStats {
  const chats = getAllChats();
  let totalInputChars = 0;
  let totalOutputChars = 0;

  chats.forEach(chat => {
    chat.messages.forEach(msg => {
      const charCount = msg.content.length;
      if (msg.role === 'user') {
        totalInputChars += charCount;
      } else if (msg.role === 'assistant') {
        totalOutputChars += charCount;
      }
    });
  });

  return {
    totalInputChars,
    totalOutputChars,
    lastUpdated: Date.now()
  };
}

/**
 * Get current usage stats
 */
export function getUsageStats(): UsageStats {
  try {
    const data = localStorage.getItem(USAGE_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    
    // First time: calculate from all existing chats
    const stats = calculateUsageFromAllChats();
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(stats));
    return stats;
  } catch (error) {
    console.error('Error loading usage stats:', error);
    return {
      totalInputChars: 0,
      totalOutputChars: 0,
      lastUpdated: Date.now()
    };
  }
}

/**
 * Update usage stats with new message
 */
export function updateUsageStats(inputChars: number, outputChars: number): void {
  try {
    const stats = getUsageStats();
    stats.totalInputChars += inputChars;
    stats.totalOutputChars += outputChars;
    stats.lastUpdated = Date.now();
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error updating usage stats:', error);
  }
}

/**
 * Calculate total cost in dollars
 */
export function calculateTotalCost(): number {
  const stats = getUsageStats();
  const inputCost = stats.totalInputChars * INPUT_COST_PER_CHAR;
  const outputCost = stats.totalOutputChars * OUTPUT_COST_PER_CHAR;
  const totalCost = inputCost + outputCost;
  
  // Return with 2 decimal places
  return Math.round(totalCost * 100) / 100;
}

/**
 * Reset usage stats
 */
export function resetUsageStats(): void {
  try {
    const emptyStats: UsageStats = {
      totalInputChars: 0,
      totalOutputChars: 0,
      lastUpdated: Date.now()
    };
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(emptyStats));
  } catch (error) {
    console.error('Error resetting usage stats:', error);
  }
}
