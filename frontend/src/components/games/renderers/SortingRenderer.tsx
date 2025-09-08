import React, { useState } from 'react';
import { GameSchema, GameState, GameResults, SortingContent, SortingItem } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, RotateCcw, CheckCircle2, X } from 'lucide-react';

interface SortingRendererProps {
  gameSchema: GameSchema;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onComplete: (results: GameResults) => void;
}

export const SortingRenderer: React.FC<SortingRendererProps> = ({
  gameSchema,
  gameState,
  setGameState,
  onComplete
}) => {
  const content = gameSchema.content as SortingContent;
  const [itemPlacements, setItemPlacements] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const checkCorrectness = () => {
    let correctCount = 0;
    content.items.forEach(item => {
      if (itemPlacements[item.id] === item.correctCategory) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const calculateScore = () => {
    const correctCount = checkCorrectness();
    const totalItems = content.items.length;
    return Math.floor((correctCount / totalItems) * gameSchema.scoring.maxScore);
  };

  const handleItemPlace = (itemId: string, categoryId: string) => {
    const newPlacements = { ...itemPlacements, [itemId]: categoryId };
    setItemPlacements(newPlacements);
    
    const newScore = calculateScore();
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
      totalQuestions: content.items.length,
      accuracy: (correctCount / content.items.length) * 100
    };
    
    setTimeout(() => onComplete(results), 3000);
  };

  const handleReset = () => {
    setItemPlacements({});
    setIsComplete(false);
    setScore(0);
    setShowResults(false);
    setGameState(prev => ({ ...prev, score: 0 }));
  };

  const getUnplacedItems = () => {
    return content.items.filter(item => !itemPlacements[item.id]);
  };

  const getItemsInCategory = (categoryId: string) => {
    return content.items.filter(item => itemPlacements[item.id] === categoryId);
  };

  const isItemCorrect = (item: SortingItem) => {
    return itemPlacements[item.id] === item.correctCategory;
  };

  const allItemsPlaced = () => {
    return content.items.every(item => itemPlacements[item.id]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">�️ {gameSchema.title}</CardTitle>
          <p className="text-muted-foreground">{content.instructions}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Score: {score}/{gameSchema.scoring.maxScore}
              </Badge>
              <Badge variant="outline">
                Placed: {Object.keys(itemPlacements).length}/{content.items.length}
              </Badge>
              <Badge variant="outline">
                Correct: {checkCorrectness()}/{content.items.length}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
          <Progress value={(Object.keys(itemPlacements).length / content.items.length) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items to Sort */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Items to Sort</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {getUnplacedItems().length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                All items have been sorted!
              </p>
            ) : (
              getUnplacedItems().map(item => (
                <div
                  key={item.id}
                  className="p-3 border-2 border-dashed border-border rounded-lg bg-muted/50"
                >
                  <p className="font-medium">{item.content}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.categories.map(category => (
            <Card key={category.id} className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">{category.name}</CardTitle>
                {category.description && (
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3 min-h-[200px]">
                  {getItemsInCategory(category.id).map(item => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        showResults
                          ? isItemCorrect(item)
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                          : 'border-border bg-background'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{item.content}</p>
                        <div className="flex items-center gap-2">
                          {showResults && (
                            <>
                              {isItemCorrect(item) ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <X className="w-5 h-5 text-red-600" />
                              )}
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleItemPlace(item.id, '')}
                            disabled={isComplete}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      {showResults && !isItemCorrect(item) && item.explanation && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          💡 {item.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  {/* Drop zone for unplaced items */}
                  {!isComplete && getUnplacedItems().length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Drag items here:
                      </p>
                      {getUnplacedItems().map(item => (
                        <Button
                          key={item.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleItemPlace(item.id, category.id)}
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          {item.content}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Completion Button */}
      {!isComplete && allItemsPlaced() && (
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <Button 
              onClick={handleComplete}
              className="w-full"
            >
              Complete Sorting
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Check your answers and see results
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && (
        <Card className={`border-2 ${checkCorrectness() === content.items.length ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">
              {checkCorrectness() === content.items.length ? '🎉' : '🎯'}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${checkCorrectness() === content.items.length ? 'text-green-800' : 'text-orange-800'}`}>
              {checkCorrectness() === content.items.length ? 'Perfect Sorting!' : 'Good Effort!'}
            </h3>
            <p className={`mb-4 ${checkCorrectness() === content.items.length ? 'text-green-700' : 'text-orange-700'}`}>
              You correctly sorted {checkCorrectness()} out of {content.items.length} items.
            </p>
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
                <div className="text-2xl">{Math.round((checkCorrectness() / content.items.length) * 100)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SortingRenderer;