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

  // Create left and right items from pairs for display
  const leftItems = content.pairs.map(pair => ({
    id: `left-${pair.id}`,
    content: pair.left,
    pairId: pair.id
  }));

  const rightItems = content.pairs.map(pair => ({
    id: `right-${pair.id}`,
    content: pair.right,
    pairId: pair.id
  }));

  const checkCorrectness = () => {
    let correctCount = 0;
    Object.entries(matches).forEach(([leftId, rightId]) => {
      const leftItem = leftItems.find(item => item.id === leftId);
      const rightItem = rightItems.find(item => item.id === rightId);
      if (leftItem && rightItem && leftItem.pairId === rightItem.pairId) {
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

  const handleLeftSelect = (leftId: string) => {
    if (matches[leftId]) {
      // Already matched, remove match
      const newMatches = { ...matches };
      delete newMatches[leftId];
      setMatches(newMatches);
      setSelectedLeft(null);
      updateScore(newMatches);
    } else {
      setSelectedLeft(leftId);
      if (selectedRight) {
        // Create match
        const newMatches = { ...matches, [leftId]: selectedRight };
        setMatches(newMatches);
        setSelectedLeft(null);
        setSelectedRight(null);
        updateScore(newMatches);
      }
    }
  };

  const handleRightSelect = (rightId: string) => {
    // Check if already matched
    const alreadyMatchedLeft = Object.keys(matches).find(key => matches[key] === rightId);
    if (alreadyMatchedLeft) {
      // Remove existing match
      const newMatches = { ...matches };
      delete newMatches[alreadyMatchedLeft];
      setMatches(newMatches);
      setSelectedRight(null);
      updateScore(newMatches);
    } else {
      setSelectedRight(rightId);
      if (selectedLeft) {
        // Create match
        const newMatches = { ...matches, [selectedLeft]: rightId };
        setMatches(newMatches);
        setSelectedLeft(null);
        setSelectedRight(null);
        updateScore(newMatches);
      }
    }
  };
    } else {
      setSelectedRight(rightId);
      if (selectedLeft) {
        // Create match
        const newMatches = { ...matches, [selectedLeft]: rightId };
        setMatches(newMatches);
        setSelectedLeft(null);
        setSelectedRight(null);
        updateScore(newMatches);
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
    const newScore = Math.floor((correctCount / content.leftItems.length) * 100); // Use 100 as default max score
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
      maxScore: gameSchema.scoring.maxScore,
      timeSpent: Math.floor((Date.now() - gameState.startTime) / 1000),
      correctAnswers: correctCount,
      totalQuestions: content.pairs.length,
      accuracy: (correctCount / content.pairs.length) * 100
    };
    
    setTimeout(() => onComplete(results), 3000);
  };

  const handleReset = () => {
    setMatches({});
    setSelectedLeft(null);
    setSelectedRight(null);
    setIsComplete(false);
    setScore(0);
    setShowResults(false);
    setGameState(prev => ({ ...prev, score: 0 }));
  };

  const getMatchForRight = (rightId: string) => {
    return Object.keys(matches).find(leftId => matches[leftId] === rightId);
  };

  const isMatchCorrect = (leftId: string, rightId: string) => {
    return content.pairs.some(pair => pair.left === leftId && pair.right === rightId);
  };

  const getCorrectMatchForLeft = (leftId: string) => {
    return content.pairs.find(pair => pair.left === leftId)?.right;
  };

  const allPairsMatched = () => {
    return content.pairs.every(pair => matches[pair.left]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">🔗 {gameSchema.title}</CardTitle>
          <p className="text-muted-foreground">{content.instructions}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Score: {score}/{gameSchema.scoring.maxScore}
              </Badge>
              <Badge variant="outline">
                Matched: {Object.keys(matches).length}/{content.pairs.length}
              </Badge>
              <Badge variant="outline">
                Correct: {checkCorrectness()}/{content.pairs.length}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
          <Progress value={(Object.keys(matches).length / content.pairs.length) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Matching Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Left Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {content.pairs.map(pair => (
              <button
                key={pair.left}
                onClick={() => handleLeftSelect(pair.left)}
                disabled={isComplete}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedLeft === pair.left
                    ? 'border-primary bg-primary/10'
                    : matches[pair.left]
                    ? showResults
                      ? isMatchCorrect(pair.left, matches[pair.left])
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                    : 'border-border hover:border-primary/50 hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{pair.left}</span>
                  <div className="flex items-center gap-2">
                    {matches[pair.left] && (
                      <Link className="w-4 h-4" />
                    )}
                    {showResults && matches[pair.left] && (
                      <>
                        {isMatchCorrect(pair.left, matches[pair.left]) ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                      </>
                    )}
                  </div>
                </div>
                {matches[pair.left] && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Matched with: {matches[pair.left]}
                  </p>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Connection Visualization */}
        <div className="flex items-center justify-center">
          <Card className="border-2 border-dashed p-4">
            <div className="text-center space-y-2">
              <Link className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {selectedLeft && selectedRight ? 'Click to connect!' : 
                 selectedLeft ? 'Select right item' :
                 selectedRight ? 'Select left item' :
                 'Select items to match'}
              </p>
              {selectedLeft && (
                <Badge variant="outline" className="text-xs">
                  Selected: {selectedLeft}
                </Badge>
              )}
              {selectedRight && (
                <Badge variant="outline" className="text-xs">
                  Selected: {selectedRight}
                </Badge>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Right Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {content.pairs.map(pair => {
              const matchedLeft = getMatchForRight(pair.right);
              return (
                <button
                  key={pair.right}
                  onClick={() => handleRightSelect(pair.right)}
                  disabled={isComplete}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedRight === pair.right
                      ? 'border-primary bg-primary/10'
                      : matchedLeft
                      ? showResults
                        ? isMatchCorrect(matchedLeft, pair.right)
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-blue-500 bg-blue-50'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{pair.right}</span>
                    <div className="flex items-center gap-2">
                      {matchedLeft && (
                        <Link className="w-4 h-4" />
                      )}
                      {showResults && matchedLeft && (
                        <>
                          {isMatchCorrect(matchedLeft, pair.right) ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <X className="w-5 h-5 text-red-600" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {matchedLeft && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Matched with: {matchedLeft}
                    </p>
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Completion Button */}
      {!isComplete && allPairsMatched() && (
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <Button 
              onClick={handleComplete}
              className="w-full"
            >
              Complete Matching
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Check your matches and see results
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && (
        <Card className={`border-2 ${checkCorrectness() === content.pairs.length ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">
              {checkCorrectness() === content.pairs.length ? '🎉' : '🎯'}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${checkCorrectness() === content.pairs.length ? 'text-green-800' : 'text-orange-800'}`}>
              {checkCorrectness() === content.pairs.length ? 'Perfect Matching!' : 'Good Effort!'}
            </h3>
            <p className={`mb-4 ${checkCorrectness() === content.pairs.length ? 'text-green-700' : 'text-orange-700'}`}>
              You correctly matched {checkCorrectness()} out of {content.pairs.length} pairs.
            </p>
            
            {/* Show incorrect matches with explanations */}
            {showResults && checkCorrectness() < content.pairs.length && (
              <div className="mb-6 space-y-2 text-left max-w-2xl mx-auto">
                <h4 className="font-semibold text-center">Correct Answers:</h4>
                {content.pairs.map(pair => {
                  const isCorrect = matches[pair.left] === pair.right;
                  return (
                    <div key={`${pair.left}-${pair.right}`} className={`p-3 rounded-lg border ${
                      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{pair.left} ↔ {pair.right}</span>
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      {pair.explanation && (
                        <p className="text-sm text-muted-foreground mt-1">
                          💡 {pair.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Score</div>
                <div className="text-2xl text-primary">{score}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Correct</div>
                <div className="text-2xl">{checkCorrectness()}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Accuracy</div>
                <div className="text-2xl">{Math.round((checkCorrectness() / content.pairs.length) * 100)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchingRenderer;
