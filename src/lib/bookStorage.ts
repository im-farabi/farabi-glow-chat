// Book User Profile interface
export interface BookUserProfile {
  name: string;
  age: number;
  selectedBooks: string[];
  interests: string[];
  isSetupComplete: boolean;
  createdAt: number;
}

// Read Book interface
export interface ReadBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  readAt: number;
}

// Book Recommendation interface
export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  reason?: string;
}

// Saved Book Summary interface (for offline reading)
export interface SavedBookSummary {
  title: string;
  author: string;
  year: string;
  about: string;
  summary: string;
  keyPoints: string[];
  moral: string;
  coverUrl: string;
  savedAt: number;
}

// Storage keys
const BOOK_PROFILE_KEY = 'readme_user_profile';
const BOOK_HISTORY_KEY = 'readme_book_history';
const PREVIOUS_RECOMMENDATIONS_KEY = 'readme_previous_recommendations';
const SAVED_SUMMARIES_KEY = 'readme_saved_summaries';

// Get user profile from localStorage
export const getBookUserProfile = (): BookUserProfile | null => {
  try {
    const stored = localStorage.getItem(BOOK_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Save user profile to localStorage
export const saveBookUserProfile = (profile: BookUserProfile): void => {
  localStorage.setItem(BOOK_PROFILE_KEY, JSON.stringify(profile));
};

// Check if setup is complete
export const isBookSetupComplete = (): boolean => {
  const profile = getBookUserProfile();
  return profile?.isSetupComplete ?? false;
};

// Get all books read
export const getBooksRead = (): ReadBook[] => {
  try {
    const stored = localStorage.getItem(BOOK_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Add a book to read list
export const addBookToRead = (book: Omit<ReadBook, 'readAt'>): void => {
  const books = getBooksRead();
  const exists = books.some(b => b.id === book.id || b.title.toLowerCase() === book.title.toLowerCase());
  
  if (!exists) {
    books.unshift({
      ...book,
      readAt: Date.now()
    });
    localStorage.setItem(BOOK_HISTORY_KEY, JSON.stringify(books));
  }
};

// Remove a book from read list
export const removeBookFromRead = (bookId: string): void => {
  const books = getBooksRead();
  const filtered = books.filter(b => b.id !== bookId);
  localStorage.setItem(BOOK_HISTORY_KEY, JSON.stringify(filtered));
};

// Get recent books (last N)
export const getRecentBooks = (limit: number = 2): ReadBook[] => {
  const books = getBooksRead();
  return books.slice(0, limit);
};

// Get previous recommendations
export const getPreviousRecommendations = (): string[] => {
  try {
    const stored = localStorage.getItem(PREVIOUS_RECOMMENDATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Add a recommendation to history (keep last 10)
export const addPreviousRecommendation = (title: string): void => {
  const previous = getPreviousRecommendations();
  const updated = [title, ...previous.filter(t => t !== title)].slice(0, 10);
  localStorage.setItem(PREVIOUS_RECOMMENDATIONS_KEY, JSON.stringify(updated));
};

// Clear previous recommendations
export const clearPreviousRecommendations = (): void => {
  localStorage.removeItem(PREVIOUS_RECOMMENDATIONS_KEY);
};

// Save a book summary for offline reading
export const saveBookSummary = (summary: SavedBookSummary): void => {
  const summaries = getSavedSummaries();
  const key = summary.title.toLowerCase();
  summaries[key] = { ...summary, savedAt: Date.now() };
  localStorage.setItem(SAVED_SUMMARIES_KEY, JSON.stringify(summaries));
};

// Get all saved summaries
export const getSavedSummaries = (): Record<string, SavedBookSummary> => {
  try {
    const stored = localStorage.getItem(SAVED_SUMMARIES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Get a specific saved summary by title
export const getSavedSummary = (title: string): SavedBookSummary | null => {
  const summaries = getSavedSummaries();
  return summaries[title.toLowerCase()] || null;
};

// Clear all book data (for reset)
export const clearBookData = (): void => {
  localStorage.removeItem(BOOK_PROFILE_KEY);
  localStorage.removeItem(BOOK_HISTORY_KEY);
  localStorage.removeItem(PREVIOUS_RECOMMENDATIONS_KEY);
  localStorage.removeItem(SAVED_SUMMARIES_KEY);
  localStorage.removeItem(SAVED_RECOMMENDATIONS_KEY);
};

// Storage key for AI recommendations
const SAVED_RECOMMENDATIONS_KEY = 'readme_saved_recommendations';

// Save AI recommendations (keep last 10)
export const saveRecommendations = (recommendations: BookRecommendation[]): void => {
  const data = {
    recommendations: recommendations.slice(0, 10),
    lastUpdated: Date.now()
  };
  localStorage.setItem(SAVED_RECOMMENDATIONS_KEY, JSON.stringify(data));
};

// Get saved AI recommendations
export const getSavedRecommendations = (): BookRecommendation[] => {
  try {
    const stored = localStorage.getItem(SAVED_RECOMMENDATIONS_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return data.recommendations || [];
    }
    return [];
  } catch {
    return [];
  }
};
