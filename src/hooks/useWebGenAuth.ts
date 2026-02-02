import { useAuth } from '@/contexts/AuthContext';

// Model costs in dollars
export const MODEL_COSTS = {
  claude: 1.00,
  gpt: 1.50,
  qwen: 0.50
} as const;

export type ModelType = keyof typeof MODEL_COSTS;

export const useWebGenAuth = () => {
  const { user, session, credits, loading, signInWithGitHub, signOut, refreshCredits } = useAuth();

  // Check if user has enough credits for a specific model
  const hasEnoughCredits = (model: ModelType) => {
    return credits >= MODEL_COSTS[model];
  };

  // Check if user has enough credits for multi-model mode (all 3)
  const hasEnoughCreditsForMultiModel = () => {
    const totalCost = MODEL_COSTS.claude + MODEL_COSTS.gpt + MODEL_COSTS.qwen;
    return credits >= totalCost;
  };

  // Get cost for a model or multi-model
  const getCost = (model: ModelType | 'multi') => {
    if (model === 'multi') {
      return MODEL_COSTS.claude + MODEL_COSTS.gpt + MODEL_COSTS.qwen;
    }
    return MODEL_COSTS[model];
  };

  // Get formatted cost string
  const getFormattedCost = (model: ModelType | 'multi') => {
    return `$${getCost(model).toFixed(2)}`;
  };

  return {
    user,
    session,
    credits,
    loading,
    signInWithGitHub,
    signOut,
    refreshCredits,
    hasEnoughCredits,
    hasEnoughCreditsForMultiModel,
    getCost,
    getFormattedCost,
    isAuthenticated: !!user
  };
};
