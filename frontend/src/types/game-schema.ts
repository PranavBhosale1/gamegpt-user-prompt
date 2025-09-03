export interface GameSchema {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'drag-drop' | 'memory-match' | 'word-puzzle' | 'sorting' | 'matching' | 'story-sequence' | 'fill-blank' | 'card-flip' | 'puzzle-assembly' | 'anxiety-adventure';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  estimatedTime: number; // in minutes
  config: GameConfig;
  content: GameContent;
  scoring: ScoringConfig;
  ui: UIConfig;
  generatedAt?: string;
  version?: string;
  theme: string;
}

export interface GameState {
  isStarted: boolean;
  isCompleted: boolean;
  currentStep: number;
  score: number;
  timeSpent: number;
  startTime: number;
  answers: any[];
}

export interface GameResults {
  score: number;
  maxScore: number;
  timeSpent: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
}

export interface GameConfig {
  maxAttempts?: number;
  timeLimit?: number; // in seconds
  showProgress: boolean;
  allowRetry: boolean;
  shuffleOptions: boolean;
  showHints: boolean;
  autoNext: boolean;
}

export interface ScoringConfig {
  maxScore: number;
  pointsPerCorrect: number;
  pointsPerIncorrect: number;
  bonusForSpeed?: number;
  bonusForStreak?: number;
}

export interface UIConfig {
  theme: 'default' | 'colorful' | 'minimal' | 'dark';
  layout: 'grid' | 'list' | 'carousel' | 'scattered';
  animations: boolean;
  sounds: boolean;
  particles: boolean;
}

// Game-specific content types
export type GameContent = 
  | QuizContent 
  | DragDropContent 
  | MemoryMatchContent 
  | WordPuzzleContent 
  | SortingContent 
  | MatchingContent 
  | StorySequenceContent 
  | FillBlankContent 
  | CardFlipContent 
  | PuzzleAssemblyContent
  | AnxietyAdventureContent;

// Content interfaces for different game types
export interface QuizContent {
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  hint?: string;
}

export interface DragDropContent {
  items: DragDropItem[];
  dropZones: DropZone[];
  instructions: string;
}

export interface DragDropItem {
  id: string;
  content: string;
  image?: string;
  correctZone: string;
  category?: string;
  explanation?: string;  // Explanation for why this item belongs in the correct zone
}

export interface DropZone {
  id: string;
  label: string;
  accepts: string[];
  maxItems?: number;
  image?: string;
}

export interface MemoryMatchContent {
  pairs: MemoryPair[];
  gridSize: '4x4' | '6x6' | '8x8';
}

export interface MemoryPair {
  id: string;
  content1: string;
  content2: string;
  technique?: string;  // For mindfulness technique
  situation?: string;  // For situation description
  image1?: string;
  image2?: string;
  category?: string;
  explanation?: string;  // Explanation for why this is a correct match
}

export interface WordPuzzleContent {
  words: WordPuzzleWord[];
  gridSize: number;
  theme: string;
}

export interface WordPuzzleWord {
  word: string;
  hint: string;
  direction: 'horizontal' | 'vertical';
  startRow: number;
  startCol: number;
}

export interface SortingContent {
  items: SortingItem[];
  categories: SortingCategory[];
  instructions: string;
}

export interface SortingItem {
  id: string;
  content: string;
  image?: string;
  correctCategory: string;
  difficulty?: number;
}

export interface SortingCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface MatchingContent {
  pairs: MatchingPair[];
  instructions: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
  explanation: string; // Explanation for why these items match
}

export interface StorySequenceContent {
  events: StoryEvent[];
  title: string;
  theme: string;
}

export interface StoryEvent {
  id: string;
  content: string;
  image?: string;
  order: number;
  description?: string;
  explanation?: string; // Explanation for why this event comes at this position
}

export interface FillBlankContent {
  passages: FillBlankPassage[];
}

export interface FillBlankPassage {
  id: string;
  text: string;
  blanks: BlankItem[];
}

export interface BlankItem {
  id: string;
  position: number;
  correctAnswer: string;
  options?: string[];
  hint?: string;
}

export interface CardFlipContent {
  cards: FlipCard[];
  instructions: string;
}

export interface FlipCard {
  id: string;
  front: string;
  back: string;
  frontImage?: string;
  backImage?: string;
  category?: string;
}

export interface PuzzleAssemblyContent {
  pieces: PuzzlePiece[];
  targetImage: string;
  gridSize: number;
}

export interface PuzzlePiece {
  id: string;
  image: string;
  correctPosition: { x: number; y: number };
}

export interface AnxietyAdventureContent {
  startId: string;
  scenarios: Record<string, AnxietyScenario>;
}

export interface AnxietyScenario {
  id: string;
  title: string;
  description: string;
  anxietyLevel: number; // 1-10
  choices: AnxietyChoice[];
  tips?: string[];
}

export interface AnxietyChoice {
  id: string;
  text: string;
  outcome: 'positive' | 'negative' | 'neutral';
  anxietyChange: number; // +/-
  points: number;
  explanation: string;
  nextScenario?: string; // if omitted => end
}
