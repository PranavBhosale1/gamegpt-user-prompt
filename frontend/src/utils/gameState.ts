/**
 * Game State Management Utilities
 * Centralized logic for game state, scoring, and progress tracking
 */

import { GameSchema, GameState, GameResults } from '@/types/game-schema';

export interface GameStateManager {
  startGame: () => GameState;
  updateScore: (currentState: GameState, points: number) => GameState;
  completeGame: (currentState: GameState, gameSchema: GameSchema) => GameResults;
  resetGame: () => GameState;
}

export class GameStateService implements GameStateManager {
  startGame(): GameState {
    return {
      isStarted: true,
      isCompleted: false,
      currentStep: 0,
      score: 0,
      timeSpent: 0,
      startTime: Date.now(),
      answers: []
    };
  }

  updateScore(currentState: GameState, points: number): GameState {
    return {
      ...currentState,
      score: Math.max(0, currentState.score + points)
    };
  }

  completeGame(currentState: GameState, gameSchema: GameSchema): GameResults {
    const timeSpent = Math.floor((Date.now() - currentState.startTime) / 1000);
    const accuracy = currentState.answers.length > 0 
      ? (currentState.answers.filter((answer: any) => answer.isCorrect).length / currentState.answers.length) * 100
      : 0;

    return {
      score: currentState.score,
      maxScore: gameSchema.scoring.maxScore,
      timeSpent,
      correctAnswers: currentState.answers.filter((answer: any) => answer.isCorrect).length,
      totalQuestions: currentState.answers.length,
      accuracy
    };
  }

  resetGame(): GameState {
    return {
      isStarted: false,
      isCompleted: false,
      currentStep: 0,
      score: 0,
      timeSpent: 0,
      startTime: 0,
      answers: []
    };
  }

  /**
   * Calculate progress percentage based on current step and total steps
   */
  calculateProgress(currentStep: number, totalSteps: number): number {
    if (totalSteps === 0) return 0;
    return Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));
  }

  /**
   * Get score badge styling based on score percentage
   */
  getScoreBadgeStyle(score: number, maxScore: number): string {
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  /**
   * Format time duration in a readable format
   */
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }
}

// Export singleton instance
export const gameStateService = new GameStateService();
