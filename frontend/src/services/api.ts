/**
 * Centralized API Service for GameGPT Frontend
 * Handles all backend communication
 */

import { GameSchema } from '@/types/game-schema';

export interface GameRequest {
  description: string;
  gameType?: GameSchema['type'];
  difficulty: 'easy' | 'medium' | 'hard';
  targetAge: string;
  estimatedTime: number;
  learningObjectives: string;
  theme: string;
  customRequirements: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://backend.GLOBIANS.IN'; 
  }

  /**
   * Generate a therapeutic game from user request
   */
  async generateGame(request: GameRequest): Promise<GameSchema> {
    try {
      // Convert complex GameRequest to simple prompt string that backend expects
      let prompt = `Create a ${request.gameType || 'therapeutic'} game: ${request.description}`;
      
      // Add additional context to the prompt
      if (request.difficulty) {
        prompt += ` (Difficulty: ${request.difficulty})`;
      }
      if (request.targetAge) {
        prompt += ` (Target age: ${request.targetAge})`;
      }
      if (request.estimatedTime) {
        prompt += ` (Estimated time: ${request.estimatedTime} minutes)`;
      }
      if (request.theme) {
        prompt += ` (Theme: ${request.theme})`;
      }
      if (request.learningObjectives) {
        prompt += ` (Learning objectives: ${request.learningObjectives})`;
      }
      if (request.customRequirements) {
        prompt += ` (Special requirements: ${request.customRequirements})`;
      }
      
      const requestBody = { prompt };
      
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const gameSchema: GameSchema = await response.json();
      return gameSchema;
    } catch (error) {
      console.error('API call failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate game: ${errorMessage}`);
    }
  }

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Failed to check API health');
    }
  }

  /**
   * Get API statistics
   */
  async getStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Stats fetch failed:', error);
      throw new Error('Failed to fetch API stats');
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
