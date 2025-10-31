import { apiClient } from './apiClient';

export interface SuggestionCard {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  user_type_specific: boolean;
}

export interface SuggestionsResponse {
  suggestions: SuggestionCard[];
  user_mood_summary: {
    average_mood: number;
    trend: string;
    entry_count: number;
    recent_scores: number[];
  };
  message: string;
}

export const suggestionsService = {
  /**
   * Get personalized suggestions based on user type and mood history
   */
  async getSuggestions(
    timeRange: string = 'week',
    startDate?: string,
    endDate?: string
  ): Promise<SuggestionsResponse> {
    const params: any = { time_range: timeRange };
    if (timeRange === 'custom' && startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    }
    const response = await apiClient.get<SuggestionsResponse>('/suggestions', { params });
    return response.data;
  },

  /**
   * Generate AI-powered personalized suggestions
   */
  async generateAISuggestions(
    timeRange: string = 'week',
    startDate?: string,
    endDate?: string
  ): Promise<SuggestionsResponse> {
    const params: any = { time_range: timeRange };
    if (timeRange === 'custom' && startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    }
    const response = await apiClient.post<SuggestionsResponse>('/suggestions/generate-ai', null, { params });
    return response.data;
  },

  /**
   * Mark a suggestion as completed
   */
  async completeSuggestion(suggestionId: string): Promise<void> {
    await apiClient.post(`/suggestions/complete/${suggestionId}`);
  },

  /**
   * Skip a suggestion
   */
  async skipSuggestion(suggestionId: string): Promise<void> {
    await apiClient.post(`/suggestions/skip/${suggestionId}`);
  },
};
