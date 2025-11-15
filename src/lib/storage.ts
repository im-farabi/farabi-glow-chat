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
    
    // Invalidate cache when chat is saved
    cachedUsageStats = null;
    lastChatHash = '';
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
    
    // Invalidate cache when chat is deleted
    cachedUsageStats = null;
    lastChatHash = '';
  } catch (error) {
    console.error('Error deleting chat:', error);
  }
}

/**
 * Rename a chat session
 */
export function renameChat(id: string, newTitle: string): void {
  try {
    const chats = getAllChats();
    const chat = chats.find(c => c.id === id);
    if (chat) {
      chat.title = newTitle;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    }
  } catch (error) {
    console.error('Error renaming chat:', error);
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
const INPUT_COST_PER_CHAR = 0.0000075;  // $0.0000075 per character
const OUTPUT_COST_PER_CHAR = 0.000015;  // $0.000015 per character

// Cache for usage stats to avoid recalculating every time
let cachedUsageStats: UsageStats | null = null;
let lastChatHash: string = '';

/**
 * Generate a simple hash of chat data to detect changes
 */
function getChatHash(): string {
  const chats = getAllChats();
  return `${chats.length}-${chats.reduce((sum, c) => sum + c.messages.length, 0)}`;
}

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
 * Get current usage stats - with caching for performance
 */
export function getUsageStats(): UsageStats {
  try {
    const currentHash = getChatHash();
    
    // Only recalculate if chat data has changed
    if (!cachedUsageStats || currentHash !== lastChatHash) {
      cachedUsageStats = calculateUsageFromAllChats();
      lastChatHash = currentHash;
    }
    
    return cachedUsageStats;
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
 * Calculate total cost in dollars
 */
export function calculateTotalCost(): { rounded: number; full: number } {
  const stats = getUsageStats();
  const inputCost = stats.totalInputChars * INPUT_COST_PER_CHAR;
  const outputCost = stats.totalOutputChars * OUTPUT_COST_PER_CHAR;
  const totalCost = inputCost + outputCost;
  
  return {
    rounded: Math.round(totalCost * 100) / 100,  // 2 decimal places
    full: totalCost  // Full precision
  };
}

/**
 * Monthly balance management
 */

interface MonthlyBalance {
  balance: number;
  lastReset: string;
  totalUsed: number;
}

const MONTHLY_ALLOWANCE = 3.00;
const COST_IMAGE_GEN = 0.05;
const COST_REGEN = 0.03;
const COST_ENHANCE_PROMPT = 0.02;
const COST_ADVANCED_READER = 0.05;
const COST_PER_MINUTE = 0.00046;
const AD_REWARD = 0.10;

export const getMonthlyBalance = (): MonthlyBalance => {
  const stored = localStorage.getItem('monthlyBalance');
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
  
  if (!stored) {
    const initial = {
      balance: MONTHLY_ALLOWANCE,
      lastReset: currentMonth,
      totalUsed: 0
    };
    localStorage.setItem('monthlyBalance', JSON.stringify(initial));
    return initial;
  }
  
  const balance: MonthlyBalance = JSON.parse(stored);
  
  // Check if we need to reset for new month
  if (balance.lastReset !== currentMonth) {
    const newBalance = {
      balance: MONTHLY_ALLOWANCE + Math.max(0, balance.balance), // Rollover unused
      lastReset: currentMonth,
      totalUsed: 0
    };
    localStorage.setItem('monthlyBalance', JSON.stringify(newBalance));
    return newBalance;
  }
  
  return balance;
};

export const deductBalance = (amount: number): boolean => {
  const balance = getMonthlyBalance();
  if (balance.balance < amount) return false;
  
  balance.balance -= amount;
  balance.totalUsed += amount;
  localStorage.setItem('monthlyBalance', JSON.stringify(balance));
  return true;
};

export const addBalance = (amount: number): void => {
  const balance = getMonthlyBalance();
  balance.balance += amount;
  localStorage.setItem('monthlyBalance', JSON.stringify(balance));
};

export const deductImageGenCost = () => deductBalance(COST_IMAGE_GEN);
export const deductRegenCost = () => deductBalance(COST_REGEN);
export const deductEnhancePromptCost = () => deductBalance(COST_ENHANCE_PROMPT);
export const deductAdvancedReaderCost = () => deductBalance(COST_ADVANCED_READER);
export const deductTimeBasedCost = () => deductBalance(COST_PER_MINUTE);
export const addAdReward = () => addBalance(AD_REWARD);

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

/**
 * User Preferences for AI personalization
 */

const PREFERENCES_STORAGE_KEY = 'farabi_user_preferences';

export interface UserPreferences {
  name: string;
  occupation: string;
  interests: string[];
  cursorType?: 'default' | 'professional';
}

/**
 * Get user preferences
 */
export function getUserPreferences(): UserPreferences {
  try {
    const data = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    return data ? JSON.parse(data) : { name: '', occupation: '', interests: [] };
  } catch (error) {
    console.error('Error loading preferences:', error);
    return { name: '', occupation: '', interests: [] };
  }
}

/**
 * Save user preferences
 */
export function saveUserPreferences(preferences: UserPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

/**
 * Get cursor preference
 */
export function getCursorPreference(): 'default' | 'professional' | 'cartoony' {
  const prefs = getUserPreferences();
  return prefs.cursorType || 'default';
}

/**
 * Save cursor preference
 */
export function saveCursorPreference(cursorType: 'default' | 'professional'): void {
  const prefs = getUserPreferences();
  saveUserPreferences({ ...prefs, cursorType });
}

/**
 * Build user details string for AI instructions
 */
export function buildUserDetailsString(): string {
  const prefs = getUserPreferences();
  const lines: string[] = [];

  if (prefs.name.trim()) {
    lines.push(`You should call him ${prefs.name.trim()}`);
  }
  
  if (prefs.occupation.trim()) {
    lines.push(`He is a ${prefs.occupation.trim()}`);
  }
  
  if (prefs.interests.length > 0) {
    lines.push(`He is most into ${prefs.interests.join(', ')}`);
  }

  if (lines.length === 0) {
    return '';
  }

  return `\n\nThe user details:\n${lines.join('\n')}`;
}

/**
 * Feature History Management
 */

// Image Generation History
const IMAGE_HISTORY_KEY = 'farabi_image_history';

export interface ImageHistoryItem {
  id: string;
  prompt: string;
  url: string;
  width: number;
  height: number;
  seed: number;
  timestamp: number;
}

export function getImageHistory(): ImageHistoryItem[] {
  try {
    const data = localStorage.getItem(IMAGE_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading image history:', error);
    return [];
  }
}

export function saveImageToHistory(item: Omit<ImageHistoryItem, 'id' | 'timestamp'>): void {
  try {
    const history = getImageHistory();
    const newItem: ImageHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    history.unshift(newItem);
    // Keep only last 20 items
    if (history.length > 20) history.pop();
    localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving image history:', error);
  }
}

export function deleteImageFromHistory(id: string): void {
  try {
    const history = getImageHistory().filter(item => item.id !== id);
    localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error deleting image from history:', error);
  }
}

// MCQ History
const MCQ_HISTORY_KEY = 'farabi_mcq_history';

export interface MCQHistoryItem {
  id: string;
  topic: string;
  numQuestions: number;
  level: string;
  score: number;
  totalQuestions: number;
  timestamp: number;
}

export function getMCQHistory(): MCQHistoryItem[] {
  try {
    const data = localStorage.getItem(MCQ_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading MCQ history:', error);
    return [];
  }
}

export function saveMCQToHistory(item: Omit<MCQHistoryItem, 'id' | 'timestamp'>): void {
  try {
    const history = getMCQHistory();
    const newItem: MCQHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    history.unshift(newItem);
    // Keep only last 20 items
    if (history.length > 20) history.pop();
    localStorage.setItem(MCQ_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving MCQ history:', error);
  }
}

export function deleteMCQFromHistory(id: string): void {
  try {
    const history = getMCQHistory().filter(item => item.id !== id);
    localStorage.setItem(MCQ_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error deleting MCQ from history:', error);
  }
}

// Flashcard History
const FLASHCARD_HISTORY_KEY = 'farabi_flashcard_history';

export interface FlashcardHistoryItem {
  id: string;
  topic: string;
  numCards: number;
  level: string;
  timestamp: number;
}

export function getFlashcardHistory(): FlashcardHistoryItem[] {
  try {
    const data = localStorage.getItem(FLASHCARD_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading flashcard history:', error);
    return [];
  }
}

export function saveFlashcardToHistory(item: Omit<FlashcardHistoryItem, 'id' | 'timestamp'>): void {
  try {
    const history = getFlashcardHistory();
    const newItem: FlashcardHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    history.unshift(newItem);
    // Keep only last 20 items
    if (history.length > 20) history.pop();
    localStorage.setItem(FLASHCARD_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving flashcard history:', error);
  }
}

export function deleteFlashcardFromHistory(id: string): void {
  try {
    const history = getFlashcardHistory().filter(item => item.id !== id);
    localStorage.setItem(FLASHCARD_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error deleting flashcard from history:', error);
  }
}

// Voice Explanation History
const VOICE_HISTORY_KEY = 'farabi_voice_history';

export interface VoiceHistoryItem {
  id: string;
  prompt: string;
  voice: string;
  explanationLevel: string;
  duration: string;
  timestamp: number;
}

export function getVoiceHistory(): VoiceHistoryItem[] {
  try {
    const data = localStorage.getItem(VOICE_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading voice history:', error);
    return [];
  }
}

export function saveVoiceToHistory(item: Omit<VoiceHistoryItem, 'id' | 'timestamp'>): void {
  try {
    const history = getVoiceHistory();
    const newItem: VoiceHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    history.unshift(newItem);
    // Keep only last 20 items
    if (history.length > 20) history.pop();
    localStorage.setItem(VOICE_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving voice history:', error);
  }
}

export function deleteVoiceFromHistory(id: string): void {
  try {
    const history = getVoiceHistory().filter(item => item.id !== id);
    localStorage.setItem(VOICE_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error deleting voice from history:', error);
  }
}

/**
 * Anonymous User Tracking for Owner Dashboard
 */

const ANON_USER_KEY = 'farabi_anonymous_user_id';
const SESSION_KEY = 'farabi_session_id';

/**
 * Get or create anonymous user ID
 */
export function getOrCreateAnonymousUserId(): string {
  let userId = localStorage.getItem(ANON_USER_KEY);
  
  if (!userId) {
    userId = `user${Math.floor(Math.random() * 100000000)}`;
    localStorage.setItem(ANON_USER_KEY, userId);
  }
  
  return userId;
}

/**
 * Get or create session ID (resets on browser close)
 */
export function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    sessionId = `session${Date.now()}${Math.floor(Math.random() * 10000)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}
