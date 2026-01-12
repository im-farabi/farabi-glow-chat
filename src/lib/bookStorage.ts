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

// Storage keys
const BOOK_PROFILE_KEY = 'readme_user_profile';
const BOOK_HISTORY_KEY = 'readme_book_history';

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

// Clear all book data (for reset)
export const clearBookData = (): void => {
  localStorage.removeItem(BOOK_PROFILE_KEY);
  localStorage.removeItem(BOOK_HISTORY_KEY);
};
