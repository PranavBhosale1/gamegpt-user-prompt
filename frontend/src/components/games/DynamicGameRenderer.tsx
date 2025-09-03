import React, { useState, useEffect } from 'react';
import { GameSchema, GameState, GameResults } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  Clock, 
  Star, 
  Target, 
  Play, 
  RotateCcw, 
  Home,
  CheckCircle,
  AlertCircle,
  Award
} from 'lucide-react';

// Import game renderers directly
// import QuizRenderer from './renderers/QuizRenderer';
import QuizRenderer from './renderers/QuizRenderer';
import { DragDropRenderer } from './renderers/DragDropRenderer';
import { MemoryMatchRenderer } from './renderers/MemoryMatchRenderer';
import { SortingRenderer } from './SortingRenderer';
import { MatchingRenderer } from './MatchingRenderer_Simple';
import { AnxietyAdventureRenderer } from './renderers/AnxietyAdventureRenderer';
import { WordPuzzleRenderer } from './WordPuzzleRenderer';
import { StorySequenceRenderer } from './StorySequenceRenderer';
import { FillBlankRenderer } from './FillBlankRenderer';
import { CardFlipRenderer } from './CardFlipRenderer';
import { PuzzleAssemblyRenderer } from './PuzzleAssemblyRenderer';

interface DynamicGameRendererProps {
  gameSchema: GameSchema;
  onComplete?: (results: GameResults) => void;
  onExit?: () => void;
}

export const DynamicGameRenderer: React.FC<DynamicGameRendererProps> = ({
  gameSchema,
  onComplete,
  onExit
}) => {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>({
    isStarted: false,
    isCompleted: false,
    currentStep: 0,
    score: 0,
    timeSpent: 0,
    startTime: 0,
    answers: []
  });

  const [results, setResults] = useState<GameResults | null>(null);

  useEffect(() => {
    if (gameState.isStarted && !gameState.startTime) {
      setGameState(prev => ({ ...prev, startTime: Date.now() }));
    }
  }, [gameState.isStarted]);

  const handleGameStart = () => {
    setGameState(prev => ({ 
      ...prev, 
      isStarted: true, 
      startTime: Date.now() 
    }));
    
    toast({
      title: "Game Started! 🎮",
      description: "Good luck and have fun learning!"
    });
  };

  const handleGameComplete = (gameResults: Partial<GameResults>) => {
    const timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000);
    
    const finalResults: GameResults = {
      score: gameResults.score || gameState.score,
      maxScore: gameSchema.scoring.maxScore,
      timeSpent,
      correctAnswers: gameResults.correctAnswers || 0,
      totalQuestions: gameResults.totalQuestions || 0,
      accuracy: gameResults.accuracy || 0,
      ...gameResults
    };

    setResults(finalResults);
    setGameState(prev => ({ 
      ...prev, 
      isCompleted: true, 
      timeSpent 
    }));
    
    onComplete?.(finalResults);
  };

  const handleRestart = () => {
    setGameState({
      isStarted: false,
      isCompleted: false,
      currentStep: 0,
      score: 0,
      timeSpent: 0,
      startTime: 0,
      answers: []
    });
    setResults(null);
    
    toast({
      title: "Game Reset! 🔄",
      description: "Ready to play again!"
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return { text: 'Excellent!', variant: 'default' as const, color: 'bg-green-100 text-green-800' };
    if (percentage >= 70) return { text: 'Good Job!', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Keep Trying!', variant: 'outline' as const, color: 'bg-red-100 text-red-800' };
  };

  const renderGame = () => {
    const commonProps = {
      gameSchema,
      gameState,
      setGameState,
      onComplete: handleGameComplete
    };

    // Fallback renderer for unsupported game types
    const UnsupportedRenderer = ({ gameType }: { gameType: string }) => (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-xl font-semibold mb-2">Game Type Not Supported</h3>
          <p className="text-muted-foreground mb-4">
            The "{gameType}" game type is not yet implemented in this demo.
          </p>
          <div className="space-y-2 text-sm text-left bg-muted p-4 rounded-lg">
            <p><strong>Game:</strong> {gameSchema.title}</p>
            <p><strong>Description:</strong> {gameSchema.description}</p>
            <p><strong>Type:</strong> {gameSchema.type}</p>
            <p><strong>Difficulty:</strong> {gameSchema.difficulty}</p>
          </div>
          <div className="mt-6 space-y-3">
            <Button 
              onClick={() => {
                // Simulate game completion for demo
                const results: GameResults = {
                  score: Math.floor(gameSchema.scoring.maxScore * 0.8),
                  maxScore: gameSchema.scoring.maxScore,
                  timeSpent: 120,
                  correctAnswers: 4,
                  totalQuestions: 5,
                  accuracy: 80
                };
                handleGameComplete(results);
              }}
              className="w-full"
            >
              Simulate Game Completion (Demo)
            </Button>
            <Button onClick={onExit} variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Generator
            </Button>
          </div>
        </CardContent>
      </Card>
    );

    try {
      switch (gameSchema.type) {
        case 'quiz':
          return <QuizRenderer {...commonProps} />;
        case 'drag-drop':
          return <DragDropRenderer {...commonProps} />;
        case 'memory-match':
          return <MemoryMatchRenderer {...commonProps} />;
        case 'sorting':
          return <SortingRenderer {...commonProps} />;
        case 'matching':
          return <MatchingRenderer {...commonProps} />;
        case 'anxiety-adventure':
          return <AnxietyAdventureRenderer {...commonProps} />;
        case 'word-puzzle':
          return <WordPuzzleRenderer {...commonProps} />;
        case 'story-sequence':
          return <StorySequenceRenderer {...commonProps} />;
        case 'fill-blank':
          return <FillBlankRenderer {...commonProps} />;
        case 'card-flip':
          return <CardFlipRenderer {...commonProps} />;
        case 'puzzle-assembly':
          return <PuzzleAssemblyRenderer {...commonProps} />;
        default:
          return <UnsupportedRenderer gameType={gameSchema.type} />;
      }
    } catch (error) {
      console.error('Error rendering game:', error);
      return <UnsupportedRenderer gameType={gameSchema.type} />;
    }
  };

  // Game completion screen
  if (gameState.isCompleted && results) {
    const scoreBadge = getScoreBadge(results.score, results.maxScore);
    const passed = results.score >= gameSchema.scoring.passingScore;
    
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-full mb-4 mx-auto">
              {passed ? (
                <Trophy className="w-10 h-10 text-white" />
              ) : (
                <Target className="w-10 h-10 text-white" />
              )}
            </div>
            <CardTitle className="text-3xl font-bold">
              {passed ? '🎉 Congratulations!' : '💪 Good Effort!'}
            </CardTitle>
            <p className="text-muted-foreground">
              {passed 
                ? 'You completed the game successfully!' 
                : 'Keep practicing to improve your score!'
              }
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {results.score}/{results.maxScore}
              </div>
              <Badge className={scoreBadge.color}>
                {scoreBadge.text}
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="font-semibold">Time</div>
                <div className="text-2xl font-bold">{formatTime(results.timeSpent)}</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="font-semibold">Accuracy</div>
                <div className="text-2xl font-bold">{Math.round(results.accuracy)}%</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round((results.score / results.maxScore) * 100)}%</span>
              </div>
              <Progress 
                value={(results.score / results.maxScore) * 100} 
                className="h-3"
              />
            </div>

            {/* Wellness Message */}
            <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-primary mb-1">Wellness Reflection</h4>
                  <p className="text-sm text-muted-foreground">
                    Great job engaging with this wellness activity! Remember, building mental health skills 
                    is a journey. Each game you play helps strengthen your emotional intelligence and coping strategies.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleRestart}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              
              <Button 
                onClick={onExit}
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Create New Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game start screen
  if (!gameState.isStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full mb-4 mx-auto">
              <Play className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">{gameSchema.title}</CardTitle>
            <p className="text-muted-foreground">{gameSchema.description}</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Game Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Target className="w-6 h-6 mx-auto mb-1 text-primary" />
                <div className="text-sm font-medium">Difficulty</div>
                <div className="capitalize font-semibold">{gameSchema.difficulty}</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <Clock className="w-6 h-6 mx-auto mb-1 text-primary" />
                <div className="text-sm font-medium">Est. Time</div>
                <div className="font-semibold">{gameSchema.estimatedTime} min</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                How to Play
              </h4>
              <p className="text-sm">{gameSchema.instructions}</p>
            </div>

            {/* Target Age */}
            {gameSchema.targetAge && (
              <div className="text-center">
                <Badge variant="outline" className="text-sm">
                  Target Age: {gameSchema.targetAge}
                </Badge>
              </div>
            )}

            {/* Start Button */}
            <Button 
              onClick={handleGameStart}
              className="w-full py-6 text-lg bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all duration-300"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the actual game
  return (
    <div className="space-y-6">
      {/* Game Header with Progress */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{gameSchema.title}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>Score: {gameState.score}/{gameSchema.scoring.maxScore}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {gameState.startTime 
                    ? formatTime(Math.floor((Date.now() - gameState.startTime) / 1000))
                    : '0:00'
                  }
                </span>
              </div>
            </div>
          </div>
          
          <Progress 
            value={(gameState.score / gameSchema.scoring.maxScore) * 100} 
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Game Content */}
      {renderGame()}
    </div>
  );
};

export default DynamicGameRenderer;
