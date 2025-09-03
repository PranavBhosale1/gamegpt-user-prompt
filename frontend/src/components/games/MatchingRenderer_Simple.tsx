import React, { useState, useMemo } from 'react';
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
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Shuffle function to randomize array order
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Create left and right items from pairs for display with shuffling (memoized)
  const leftItems = useMemo(() => 
    shuffleArray(content.pairs.map(pair => ({
      id: `left-${pair.id}`,
      content: pair.left,
      pairId: pair.id
    }))), [content.pairs]
  );

  const rightItems = useMemo(() => 
    shuffleArray(content.pairs.map(pair => ({
      id: `right-${pair.id}`,
      content: pair.right,
      pairId: pair.id
    }))), [content.pairs]
  );

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

  const isMatchCorrect = (leftId: string): boolean => {
    const rightId = matches[leftId];
    if (!rightId) return false;
    
    const leftItem = leftItems.find(item => item.id === leftId);
    const rightItem = rightItems.find(item => item.id === rightId);
    
    return leftItem && rightItem && leftItem.pairId === rightItem.pairId;
  };

  const calculateScore = () => {
    const correctCount = checkCorrectness();
    const totalPairs = content.pairs.length;
    return Math.floor((correctCount / totalPairs) * 100);
  };

  const updateScore = (newMatches: Record<string, string>) => {
    // Only update score after submission
    if (isSubmitted) {
      let correctCount = 0;
      Object.entries(newMatches).forEach(([leftId, rightId]) => {
        const leftItem = leftItems.find(item => item.id === leftId);
        const rightItem = rightItems.find(item => item.id === rightId);
        if (leftItem && rightItem && leftItem.pairId === rightItem.pairId) {
          correctCount++;
        }
      });
      const newScore = Math.floor((correctCount / content.pairs.length) * 100);
      setScore(newScore);
      setGameState(prev => ({ ...prev, score: newScore }));
    }
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

  const handleSubmit = () => {
    setIsSubmitted(true);
    const finalScore = calculateScore();
    const correctCount = checkCorrectness();
    setScore(finalScore);
    setGameState(prev => ({ ...prev, score: finalScore }));
    setShowResults(true);
  };

  const handleComplete = () => {
    const finalScore = calculateScore();
    const correctCount = checkCorrectness();
    
    setIsComplete(true);
    
    const results: GameResults = {
      score: finalScore,
      maxScore: gameSchema.scoring?.maxScore || 100,
      timeSpent: Math.floor((Date.now() - gameState.startTime) / 1000),
      correctAnswers: correctCount,
      totalQuestions: content.pairs.length,
      accuracy: (correctCount / content.pairs.length) * 100
    };
    
    setTimeout(() => onComplete(results), 3000);
  };

  const reset = () => {
    setMatches({});
    setSelectedLeft(null);
    setSelectedRight(null);
    setScore(0);
    setIsComplete(false);
    setShowResults(false);
    setIsSubmitted(false);
    setGameState(prev => ({ ...prev, score: 0 }));
  };

  const progress = (Object.keys(matches).length / content.pairs.length) * 100;
  const correctMatches = checkCorrectness();

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">{gameSchema.title}</CardTitle>
              <p className="text-gray-600 mt-2">{gameSchema.description}</p>
            </div>
            <div className="text-right">
              {isSubmitted ? (
                <>
                  <div className="text-2xl font-bold text-blue-600">{score}/100</div>
                  <div className="text-sm text-gray-500">Score</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-400">--/100</div>
                  <div className="text-sm text-gray-500">Score</div>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Instructions */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <p className="text-center text-lg">{content.instructions}</p>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-500">
              {Object.keys(matches).length} / {content.pairs.length} matches
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardContent>
      </Card>

      {/* Matching Game */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Left Column */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Match These</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leftItems.map(item => {
              const isMatched = !!matches[item.id];
              const isCorrect = isSubmitted && isMatched && isMatchCorrect(item.id);
              const isIncorrect = isSubmitted && isMatched && !isMatchCorrect(item.id);
              
              return (
                <button
                  key={item.id}
                  onClick={() => !isSubmitted && handleLeftSelect(item.id)}
                  disabled={isSubmitted}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    isCorrect
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : isIncorrect
                      ? 'bg-red-100 border-red-300 text-red-800'
                      : isMatched && !isSubmitted
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : selectedLeft === item.id
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  } ${isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{item.content}</span>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {isIncorrect && <X className="w-5 h-5 text-red-600" />}
                    {isMatched && !isSubmitted && <Link className="w-5 h-5 text-blue-600" />}
                    {selectedLeft === item.id && !isSubmitted && <div className="w-5 h-5 border-2 border-blue-600 rounded-full" />}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Right Column */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">With These</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rightItems.map(item => {
              const matchedLeftId = Object.keys(matches).find(leftId => matches[leftId] === item.id);
              const isMatched = !!matchedLeftId;
              const isCorrect = isSubmitted && isMatched && isMatchCorrect(matchedLeftId!);
              const isIncorrect = isSubmitted && isMatched && !isMatchCorrect(matchedLeftId!);
              
              return (
                <button
                  key={item.id}
                  onClick={() => !isSubmitted && handleRightSelect(item.id)}
                  disabled={isSubmitted}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    isCorrect
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : isIncorrect
                      ? 'bg-red-100 border-red-300 text-red-800'
                      : isMatched && !isSubmitted
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : selectedRight === item.id
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  } ${isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{item.content}</span>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {isIncorrect && <X className="w-5 h-5 text-red-600" />}
                    {isMatched && !isSubmitted && <Link className="w-5 h-5 text-blue-600" />}
                    {selectedRight === item.id && !isSubmitted && <div className="w-5 h-5 border-2 border-blue-600 rounded-full" />}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Results Display */}
      {showResults && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">
                {correctMatches === content.pairs.length ? 'Perfect! 🎉' : 'Great effort! 👏'}
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{correctMatches}</div>
                  <div className="text-sm text-gray-500">Correct</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{score}%</div>
                  <div className="text-sm text-gray-500">Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">{content.pairs.length}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
              </div>
              
              {/* Show explanations for correct matches */}
              <div className="text-left space-y-2">
                <h4 className="font-bold text-lg">Why These Match:</h4>
                {content.pairs.map(pair => (
                  <div key={pair.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">{pair.left} → {pair.right}</div>
                    <div className="text-sm text-gray-600 mt-1">{pair.explanation}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={reset}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
        
        {/* Submit button - show when all matches are made but not yet submitted */}
        {Object.keys(matches).length === content.pairs.length && !isSubmitted && (
          <Button 
            onClick={handleSubmit}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Submit Answers
          </Button>
        )}

        {/* Complete button - show only after submission */}
        {isSubmitted && !isComplete && (
          <Button 
            onClick={handleComplete}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete Game
          </Button>
        )}
      </div>
    </div>
  );
};
