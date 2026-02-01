const STUDY_USER_KEY = 'farabi_study_user';
const STUDY_HISTORY_KEY = 'farabi_study_history';

export interface StudyUserData {
  age: number;
  setupComplete: boolean;
  lastVisit: number;
}

export interface StudyHistoryItem {
  id: string;
  subject: string;
  chapter: string;
  score: number;
  totalQuestions: number;
  timestamp: number;
  timeSpent: number;
}

export function getStudyUserData(): StudyUserData | null {
  try {
    const data = localStorage.getItem(STUDY_USER_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveStudyUserData(data: StudyUserData): void {
  try {
    localStorage.setItem(STUDY_USER_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save study user data:', error);
  }
}

export function getStudyHistory(): StudyHistoryItem[] {
  try {
    const data = localStorage.getItem(STUDY_HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveStudyAttempt(item: StudyHistoryItem): void {
  try {
    const history = getStudyHistory();
    history.unshift(item);
    // Keep only last 50 attempts
    const trimmed = history.slice(0, 50);
    localStorage.setItem(STUDY_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save study attempt:', error);
  }
}

export function deleteStudyHistoryItem(id: string): void {
  try {
    const history = getStudyHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(STUDY_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete study history item:', error);
  }
}

export function clearStudyHistory(): void {
  try {
    localStorage.removeItem(STUDY_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear study history:', error);
  }
}

export function resetStudyUser(): void {
  try {
    localStorage.removeItem(STUDY_USER_KEY);
  } catch (error) {
    console.error('Failed to reset study user:', error);
  }
}
