// News storage utilities for localStorage management

export interface NewsUserProfile {
  name: string;
  age: number;
  isSetupComplete: boolean;
  createdAt: number;
}

export interface NewsArticle {
  id: string;
  headline: string;
  context: string;
  body: string;
  generatedAt: number;
}

export interface SavedNews {
  category: string;
  timeFilter: string;
  articles: NewsArticle[];
  generatedAt: number;
}

const NEWS_USER_PROFILE_KEY = 'news_user_profile';
const NEWS_SAVED_ARTICLES_KEY = 'news_saved_articles';

// User Profile Functions
export const getNewsUserProfile = (): NewsUserProfile | null => {
  try {
    const stored = localStorage.getItem(NEWS_USER_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveNewsUserProfile = (profile: NewsUserProfile): void => {
  try {
    localStorage.setItem(NEWS_USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save news user profile:', error);
  }
};

export const isNewsSetupComplete = (): boolean => {
  const profile = getNewsUserProfile();
  return profile?.isSetupComplete ?? false;
};

// News Cache Functions
export const getAllSavedNews = (): SavedNews[] => {
  try {
    const stored = localStorage.getItem(NEWS_SAVED_ARTICLES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getSavedNews = (category: string, timeFilter: string): SavedNews | null => {
  const allNews = getAllSavedNews();
  return allNews.find(n => n.category === category && n.timeFilter === timeFilter) || null;
};

export const saveNews = (category: string, timeFilter: string, articles: NewsArticle[]): void => {
  try {
    const allNews = getAllSavedNews();
    const existingIndex = allNews.findIndex(n => n.category === category && n.timeFilter === timeFilter);
    
    const newEntry: SavedNews = {
      category,
      timeFilter,
      articles,
      generatedAt: Date.now()
    };

    if (existingIndex >= 0) {
      allNews[existingIndex] = newEntry;
    } else {
      allNews.push(newEntry);
    }

    localStorage.setItem(NEWS_SAVED_ARTICLES_KEY, JSON.stringify(allNews));
  } catch (error) {
    console.error('Failed to save news:', error);
  }
};

export const isNewsCacheValid = (savedNews: SavedNews, timeFilter: string): boolean => {
  const now = Date.now();
  const age = now - savedNews.generatedAt;
  
  // Cache durations
  const ONE_HOUR = 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
  
  switch (timeFilter) {
    case 'latest':
      return age < ONE_HOUR;
    case 'week':
      return age < TWENTY_FOUR_HOURS;
    case 'month':
      return age < FORTY_EIGHT_HOURS;
    default:
      return false;
  }
};

export const clearNewsData = (): void => {
  try {
    localStorage.removeItem(NEWS_USER_PROFILE_KEY);
    localStorage.removeItem(NEWS_SAVED_ARTICLES_KEY);
  } catch (error) {
    console.error('Failed to clear news data:', error);
  }
};

// Category display helpers
export const getCategoryDisplayName = (categoryId: string): string => {
  const names: Record<string, string> = {
    'philippines': 'Philippines News',
    'united-states': 'United States News',
    'bangladesh': 'Bangladesh News',
    'all-asian': 'All-Asian News',
    'football': 'Football News',
    'basketball': 'Basketball News',
    'series': 'Series News'
  };
  return names[categoryId] || categoryId;
};

export const getCategoryEmoji = (categoryId: string): string => {
  const emojis: Record<string, string> = {
    'philippines': '🇵🇭',
    'united-states': '🇺🇸',
    'bangladesh': '🇧🇩',
    'all-asian': '🌏',
    'football': '⚽',
    'basketball': '🏀',
    'series': '📺'
  };
  return emojis[categoryId] || '📰';
};

export const getTimeFilterDisplayName = (timeFilter: string): string => {
  const names: Record<string, string> = {
    'latest': 'Latest News',
    'week': 'This Week News',
    'month': 'This Month News'
  };
  return names[timeFilter] || timeFilter;
};
