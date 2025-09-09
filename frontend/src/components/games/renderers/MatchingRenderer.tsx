import React, { useState, useEffect } from 'react';
import { GameSchema, GameState, GameResults, MatchingContent } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link, RotateCcw, CheckCircle2, X } from 'lucide-react';

interface MatchingRendererProps {
  gameSchema: GameSchema;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onComplete: (results: GameResults) => void;
}

export const MatchingRenderer: React.FC<MatchingRendererProps> = ({
  gameSchema,
  gameState,
  setGameState,
  onComplete
}) => {
  const { toast } = useToast();
  const content = gameSchema.content as MatchingContent;
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [shuffledRightOptions, setShuffledRightOptions] = useState<string[]>([]);
  const [shuffledLeftPairs, setShuffledLeftPairs] = useState<typeof content.pairs>([]);

  // Shuffle function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize shuffled arrays on component mount
  useEffect(() => {
    const rightOptions = content.pairs.map(pair => pair.right);
    setShuffledRightOptions(shuffleArray(rightOptions));
    setShuffledLeftPairs(shuffleArray(content.pairs));
  }, [content.pairs]);

  const checkCorrectness = () => {
    let correctCount = 0;
    content.pairs.forEach(pair => {
      const matchedRight = matches[pair.id];
      if (matchedRight === pair.right) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const calculateScore = () => {
    const correctCount = checkCorrectness();
    const totalPairs = content.pairs.length;
    return Math.floor((correctCount / totalPairs) * 100);
  };

  const handleLeftSelect = (pairId: string) => {
    if (matches[pairId]) {
      const newMatches = { ...matches };
      delete newMatches[pairId];
      setMatches(newMatches);
      updateScore(newMatches);
      setSelectedLeft(null);
    } else {
      setSelectedLeft(pairId);
      if (selectedRight) {
        const newMatches = { ...matches, [pairId]: selectedRight };
        setMatches(newMatches);
        updateScore(newMatches);
        
        // Check if the match is incorrect and show explanation
        const pair = content.pairs.find(p => p.id === pairId);
        if (pair && selectedRight !== pair.right) {
          toast({
            title: "❌ Incorrect Match",
            description: `${pair.explanation}`,
            duration: 4000,
            variant: "destructive"
          });
        } else if (pair && selectedRight === pair.right) {
          toast({
            title: "✅ Correct Match!",
            description: `Great job! ${pair.explanation}`,
            duration: 3000,
          });
        }
        
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    }
  };

  const handleRightSelect = (rightContent: string) => {
    const alreadyMatchedPairId = Object.keys(matches).find(pairId => matches[pairId] === rightContent);
    
    if (alreadyMatchedPairId) {
      const newMatches = { ...matches };
      delete newMatches[alreadyMatchedPairId];
      setMatches(newMatches);
      updateScore(newMatches);
      setSelectedRight(null);
    } else {
      setSelectedRight(rightContent);
      if (selectedLeft) {
        const newMatches = { ...matches, [selectedLeft]: rightContent };
        setMatches(newMatches);
        updateScore(newMatches);
        
        // Check if the match is incorrect and show explanation
        const pair = content.pairs.find(p => p.id === selectedLeft);
        if (pair && rightContent !== pair.right) {
          toast({
            title: "❌ Incorrect Match",
            description: `${pair.explanation}`,
            duration: 4000,
            variant: "destructive"
          });
        } else if (pair && rightContent === pair.right) {
          toast({
            title: "✅ Correct Match!",
            description: `Great job! ${pair.explanation}`,
            duration: 3000,
          });
        }
        
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    }
  };

  const updateScore = (newMatches: Record<string, string>) => {
    let correctCount = 0;
    content.pairs.forEach(pair => {
      const matchedRight = newMatches[pair.id];
      if (matchedRight === pair.right) {
        correctCount++;
      }
    });
    const newScore = Math.floor((correctCount / content.pairs.length) * 100);
    setScore(newScore);
    setGameState(prev => ({ ...prev, score: newScore }));
  };

  const handleComplete = () => {
    const finalScore = calculateScore();
    const correctCount = checkCorrectness();
    
    setIsComplete(true);
    setShowResults(true);
    
    const results: GameResults = {
      score: finalScore,
      maxScore: 100,
      timeSpent: Math.floor((Date.now() - gameState.startTime) / 1000),
      correctAnswers: correctCount,
      totalQuestions: content.pairs.length,
      accuracy: (correctCount / content.pairs.length) * 100
    };
    
    setGameState(prev => ({
      ...prev,
      isCompleted: true,
      score: finalScore
    }));
    
    onComplete(results);
  };

  const handleReset = () => {
    setMatches({});
    setSelectedLeft(null);
    setSelectedRight(null);
    setScore(0);
    setIsComplete(false);
    setShowResults(false);
    setGameState(prev => ({ ...prev, score: 0, isCompleted: false }));
    
    // Re-shuffle the options when resetting
    const rightOptions = content.pairs.map(pair => pair.right);
    setShuffledRightOptions(shuffleArray(rightOptions));
    setShuffledLeftPairs(shuffleArray(content.pairs));
  };

  const isAllMatched = () => {
    return content.pairs.every(pair => matches[pair.id]);
  };

  // Get all unique right values for display
  const getRightOptions = () => {
    return shuffledRightOptions;
  };

  if (isComplete) {
    return (
      <div className="space-y-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Link className="w-6 h-6" />
              Matching Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-muted-foreground space-x-4">
                <span>
                  Matched: {Object.keys(matches).length}/{content.pairs.length}
                </span>
                <span>
                  Correct: {checkCorrectness()}/{content.pairs.length}
                </span>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {score} points
              </Badge>
            </div>
            
            <Progress value={(Object.keys(matches).length / content.pairs.length) * 100} className="h-3" />
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleReset} variant="outline" className="border-2">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {showResults && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>📚 Learning Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {content.pairs.map(pair => {
                  const matchedRight = matches[pair.id];
                  const isCorrect = matchedRight === pair.right;
                  
                  return (
                    <div key={pair.id} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div>
                              <strong className="text-sm font-medium">Left:</strong>
                              <p className="text-sm">{pair.left}</p>
                            </div>
                            <div className="text-center">
                              <div className="inline-flex items-center">
                                <div className="w-4 h-0.5 bg-gray-300"></div>
                                <div className="mx-2 text-xs text-gray-500">matches</div>
                                <div className="w-4 h-0.5 bg-gray-300"></div>
                              </div>
                            </div>
                            <div>
                              <strong className="text-sm font-medium">Right:</strong>
                              <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                {matchedRight || 'No match'}
                              </p>
                              {!isCorrect && (
                                <p className="text-xs text-green-600 mt-1">
                                  Correct: {pair.right}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Matching Game
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{content.instructions}</p>
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground space-x-4">
              <span>
                Matched: {Object.keys(matches).length}/{content.pairs.length}
              </span>
              <span>
                Correct: {checkCorrectness()}/{content.pairs.length}
              </span>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {score} points
            </Badge>
          </div>
          
          <Progress value={(Object.keys(matches).length / content.pairs.length) * 100} className="h-3 mt-4" />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Connect These</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shuffledLeftPairs.map((pair) => {
                const isMatched = !!matches[pair.id];
                const isSelected = selectedLeft === pair.id;
                const matchedRight = matches[pair.id];
                const isCorrect = matchedRight === pair.right;
                
                return (
                  <div
                    key={pair.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all min-h-[60px] flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : isMatched
                        ? isCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                    }`}
                    onClick={() => handleLeftSelect(pair.id)}
                  >
                    <span className="font-medium">{pair.left}</span>
                    <div className="flex items-center gap-2">
                      {isMatched && matchedRight && (
                        <span className="text-xs text-muted-foreground">
                          → {matchedRight}
                        </span>
                      )}
                      {isMatched && (
                        <div className="flex items-center gap-1">
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">With These</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getRightOptions().map((rightOption, index) => {
                const matchedPairId = Object.keys(matches).find(pairId => matches[pairId] === rightOption);
                const isMatched = !!matchedPairId;
                const isSelected = selectedRight === rightOption;
                let isCorrect = false;
                
                if (matchedPairId) {
                  const pair = content.pairs.find(p => p.id === matchedPairId);
                  isCorrect = pair && pair.right === rightOption;
                }
                
                return (
                  <div
                    key={`right-${index}`}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all min-h-[60px] flex items-center justify-between ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : isMatched
                        ? isCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                    }`}
                    onClick={() => handleRightSelect(rightOption)}
                  >
                    <span className="font-medium">{rightOption}</span>
                    {isMatched && (
                      <div className="flex items-center gap-1">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {isAllMatched() && (
        <Card className={`border-2 ${checkCorrectness() === content.pairs.length ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-2">
              {checkCorrectness() === content.pairs.length ? '🎉' : '🎯'}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${checkCorrectness() === content.pairs.length ? 'text-green-800' : 'text-orange-800'}`}>
              {checkCorrectness() === content.pairs.length ? 'Perfect Matching!' : 'Good Effort!'}
            </h3>
            <p className={`mb-4 ${checkCorrectness() === content.pairs.length ? 'text-green-700' : 'text-orange-700'}`}>
              {checkCorrectness() === content.pairs.length 
                ? 'Excellent work! You matched everything correctly!' 
                : `You got ${checkCorrectness()} out of ${content.pairs.length} correct. Keep trying!`}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleComplete} className="bg-blue-600 hover:bg-blue-700">
                Complete Game
              </Button>
              <Button onClick={handleReset} variant="outline" className="border-2">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchingRenderer;