import React, { useState } from 'react';
import { GameSchema, GameState, GameResults, MatchingContent } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  const content = gameSchema.content as MatchingContent;
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const checkCorrectness = () => {
    let correctCount = 0;
    content.leftItems.forEach(leftItem => {
      const matchedRightId = matches[leftItem.id];
      if (matchedRightId) {
        const rightItem = content.rightItems.find(r => r.id === matchedRightId);
        if (rightItem && rightItem.matchId === leftItem.matchId) {
          correctCount++;
        }
      }
    });
    return correctCount;
  };

  const calculateScore = () => {
    const correctCount = checkCorrectness();
    const totalPairs = content.leftItems.length;
    return Math.floor((correctCount / totalPairs) * 100);
  };

  const handleLeftSelect = (leftId: string) => {
    if (matches[leftId]) {
      const newMatches = { ...matches };
      delete newMatches[leftId];
      setMatches(newMatches);
      updateScore(newMatches);
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftId);
      if (selectedRight) {
        const newMatches = { ...matches, [leftId]: selectedRight };
        setMatches(newMatches);
        updateScore(newMatches);
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    }
  };

  const handleRightSelect = (rightId: string) => {
    const alreadyMatchedLeftId = Object.keys(matches).find(leftId => matches[leftId] === rightId);
    
    if (alreadyMatchedLeftId) {
      const newMatches = { ...matches };
      delete newMatches[alreadyMatchedLeftId];
      setMatches(newMatches);
      updateScore(newMatches);
      setSelectedRight(null);
    } else {
      setSelectedRight(rightId);
      if (selectedLeft) {
        const newMatches = { ...matches, [selectedLeft]: rightId };
        setMatches(newMatches);
        updateScore(newMatches);
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    }
  };

  const updateScore = (newMatches: Record<string, string>) => {
    let correctCount = 0;
    content.leftItems.forEach(leftItem => {
      const matchedRightId = newMatches[leftItem.id];
      if (matchedRightId) {
        const rightItem = content.rightItems.find(r => r.id === matchedRightId);
        if (rightItem && rightItem.matchId === leftItem.matchId) {
          correctCount++;
        }
      }
    });
    const newScore = Math.floor((correctCount / content.leftItems.length) * 100);
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
      totalQuestions: content.leftItems.length,
      accuracy: (correctCount / content.leftItems.length) * 100
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
  };

  const isAllMatched = () => {
    return content.leftItems.every(leftItem => matches[leftItem.id]);
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
                  Matched: {Object.keys(matches).length}/{content.leftItems.length}
                </span>
                <span>
                  Correct: {checkCorrectness()}/{content.leftItems.length}
                </span>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {score} points
              </Badge>
            </div>
            
            <Progress value={(Object.keys(matches).length / content.leftItems.length) * 100} className="h-3" />
            
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
                {content.leftItems.map(leftItem => {
                  const matchedRightId = matches[leftItem.id];
                  const matchedRightItem = content.rightItems.find(r => r.id === matchedRightId);
                  const correctRightItem = content.rightItems.find(r => r.matchId === leftItem.matchId);
                  const isCorrect = matchedRightItem && matchedRightItem.matchId === leftItem.matchId;
                  
                  return (
                    <div key={leftItem.id} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium mb-2">
                            <span className="text-blue-700">{leftItem.content}</span>
                            <span className="mx-2">↔</span>
                            <span className="text-purple-700">{correctRightItem?.content}</span>
                          </div>
                          {(leftItem.explanation || correctRightItem?.explanation) && (
                            <p className="text-sm text-muted-foreground">
                              {leftItem.explanation || correctRightItem?.explanation}
                            </p>
                          )}
                          {!isCorrect && matchedRightItem && (
                            <p className="text-sm text-red-600 mt-1">
                              You matched with: {matchedRightItem.content}
                            </p>
                          )}
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
                Matched: {Object.keys(matches).length}/{content.leftItems.length}
              </span>
              <span>
                Correct: {checkCorrectness()}/{content.leftItems.length}
              </span>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {score} points
            </Badge>
          </div>
          
          <Progress value={(Object.keys(matches).length / content.leftItems.length) * 100} className="h-3 mt-4" />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Connect These</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              {content.leftItems.map((leftItem) => {
                const isMatched = !!matches[leftItem.id];
                const isSelected = selectedLeft === leftItem.id;
                const matchedRightId = matches[leftItem.id];
                let matchedRightItem = null;
                let isCorrect = false;
                
                if (matchedRightId) {
                  matchedRightItem = content.rightItems.find(r => r.id === matchedRightId);
                  isCorrect = matchedRightItem && matchedRightItem.matchId === leftItem.matchId;
                }
                
                return (
                  <div
                    key={leftItem.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all min-h-[80px] flex flex-col justify-center ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : isMatched
                        ? isCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                    }`}
                    onClick={() => handleLeftSelect(leftItem.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{leftItem.content}</span>
                      {isMatched && (
                        <div className="flex items-center gap-1 ml-2">
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                      )}
                    </div>
                    {isMatched && matchedRightItem && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        → {matchedRightItem.content}
                      </div>
                    )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              {content.rightItems.map((rightItem) => {
                const matchedLeftId = Object.keys(matches).find(leftId => matches[leftId] === rightItem.id);
                const isMatched = !!matchedLeftId;
                const isSelected = selectedRight === rightItem.id;
                let isCorrect = false;
                
                if (matchedLeftId) {
                  const matchedLeftItem = content.leftItems.find(l => l.id === matchedLeftId);
                  isCorrect = matchedLeftItem && matchedLeftItem.matchId === rightItem.matchId;
                }
                
                return (
                  <div
                    key={rightItem.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all min-h-[80px] flex flex-col justify-center ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : isMatched
                        ? isCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                    }`}
                    onClick={() => handleRightSelect(rightItem.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{rightItem.content}</span>
                      {isMatched && (
                        <div className="flex items-center gap-1 ml-2">
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
      </div>

      {isAllMatched() && (
        <Card className={`border-2 ${checkCorrectness() === content.leftItems.length ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">
              {checkCorrectness() === content.leftItems.length ? '🎉' : '🎯'}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${checkCorrectness() === content.leftItems.length ? 'text-green-800' : 'text-orange-800'}`}>
              {checkCorrectness() === content.leftItems.length ? 'Perfect Matching!' : 'Good Effort!'}
            </h3>
            <p className={`mb-4 ${checkCorrectness() === content.leftItems.length ? 'text-green-700' : 'text-orange-700'}`}>
              You correctly matched {checkCorrectness()} out of {content.leftItems.length} pairs.
            </p>
            
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleComplete}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                size="lg"
              >
                {showResults ? 'Continue' : 'Complete Game'}
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="border-2"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
            
            <div className="mt-4 p-4 bg-white rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Accuracy</div>
              <div className="text-2xl font-bold">
                {Math.round((checkCorrectness() / content.leftItems.length) * 100)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchingRenderer;