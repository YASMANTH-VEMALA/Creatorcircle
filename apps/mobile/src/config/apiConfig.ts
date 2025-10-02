// API Configuration for AI Services
export const API_CONFIG = {
  // OpenAI API Configuration
  OPENAI_API_KEY: '',
  OPENAI_BASE_URL: 'https://api.openai.com/v1',

  // Google Gemini API
  GEMINI_API_KEY: 'AIzaSyDHUpl8clvo8LSaSfAMjyVjP0S2xZf0Vdk',
  GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',

  // Perplexity AI API
  PERPLEXITY_API_KEY: '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',
  PERPLEXITY_BASE_URL: 'https://api.perplexity.ai',

  // API Settings
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  TIMEOUT: 30000, // 30 seconds
};

// API Provider Types
export type APIProvider = 'openai' | 'gemini' | 'perplexity' | 'firebase';

// Current active provider
export const ACTIVE_PROVIDER: APIProvider = 'gemini';
