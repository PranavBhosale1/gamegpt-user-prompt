/**
 * API Configuration for GameGPT Frontend
 */

// Backend API Configuration
export const API_CONFIG = {
  BASE_URL:  'http://localhost:8000',
  
  ENDPOINTS: {
    GAMES: {
      GENERATE: '/games/generate',
      STATUS: '/games/status',
      STATS: '/stats'
    },
    HEALTH: '/health',
    STATS: '/stats'
  }
} as const;

// Construct full API URLs
export const API_URLS = {
  BASE: API_CONFIG.BASE_URL,
  
  HEALTH: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`,
  GAMES: {
    GENERATE: `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.GAMES.GENERATE}`,
    STATUS: (jobId: string) => `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GAMES.STATUS}/${jobId}`,
    STATS: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STATS}`
  }
} as const;

// API Request Configuration
export const API_DEFAULTS = {
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
} as const;

// Development vs Production Configuration
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
