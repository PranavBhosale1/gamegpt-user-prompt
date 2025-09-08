import React, { useState } from 'react';
import { GameSchema, GameState, GameResults, CardFlipContent, FlipCard } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Eye, RefreshCw, Layers, ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';

interface CardFlipRendererProps {
  gameSchema: GameSchema;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onComplete: (results: GameResults) => void;
}

export const CardFlipRenderer: React.FC<CardFlipRendererProps> = ({
  gameSchema,
  gameState,
  setGameState,
  onComplete
}) => {
  const content = gameSchema.content as CardFlipContent;
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [viewedCards, setViewedCards] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [currentFilter, setCurrentFilter] = useState<string>('all');

  const calculateScore = () => {
    const viewedCount = viewedCards.size;
    const totalCards = content.cards.length;
    return Math.floor((viewedCount / totalCards) * gameSchema.scoring.maxScore);
  };

  const handleCardFlip = (cardId: string) => {
    if (isComplete) return;

    const newFlippedCards = new Set(flippedCards);
    const newViewedCards = new Set(viewedCards);

    if (flippedCards.has(cardId)) {
      newFlippedCards.delete(cardId);
    } else {
      newFlippedCards.add(cardId);
      newViewedCards.add(cardId);
    }

    setFlippedCards(newFlippedCards);
    setViewedCards(newViewedCards);

    const newScore = Math.floor((newViewedCards.size / content.cards.length) * gameSchema.scoring.maxScore);
    setScore(newScore);
    setGameState(prev => ({ ...prev, score: newScore }));
  };

  const handleComplete = () => {
    setIsComplete(true);
    
    const results: GameResults = {
      score: calculateScore(),
      maxScore: gameSchema.scoring.maxScore,
      timeSpent: Math.floor((Date.now() - gameState.startTime) / 1000),
      correctAnswers: viewedCards.size,
      totalQuestions: content.cards.length,
      accuracy: (viewedCards.size / content.cards.length) * 100
    };
    
    setTimeout(() => onComplete(results), 2000);
  };

  const handleReset = () => {
    setCurrentCardIndex(0);
    setFlippedCards(new Set());
    setViewedCards(new Set());
    setIsComplete(false);
    setScore(0);
    setCurrentFilter('all');
    setGameState(prev => ({ ...prev, score: 0 }));
  };

  const goToNextCard = () => {
    const filteredCards = getFilteredCards();
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const goToPreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const goToFirstCard = () => {
    setCurrentCardIndex(0);
  };

  const goToLastCard = () => {
    const filteredCards = getFilteredCards();
    setCurrentCardIndex(filteredCards.length - 1);
  };

  const getUniqueCategories = () => {
    const categories = content.cards
      .map(card => card.category)
      .filter(Boolean)
      .filter((category, index, arr) => arr.indexOf(category) === index);
    return categories;
  };

  const getFilteredCards = () => {
    if (currentFilter === 'all') {
      return content.cards;
    }
    return content.cards.filter(card => card.category === currentFilter);
  };

  const getCurrentCard = () => {
    const filteredCards = getFilteredCards();
    return filteredCards[currentCardIndex];
  };

  const allCardsViewed = () => {
    return viewedCards.size === content.cards.length;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">🎴 {gameSchema.title}</CardTitle>
          <p className="text-muted-foreground">{content.instructions}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Score: {score}/{gameSchema.scoring.maxScore}
              </Badge>
              <Badge variant="outline">
                Card: {currentCardIndex + 1}/{getFilteredCards().length}
              </Badge>
              <Badge variant="outline">
                Viewed: {viewedCards.size}/{content.cards.length}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
          <Progress value={(currentCardIndex + 1) / getFilteredCards().length * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Category Filter */}
      {getUniqueCategories().length > 0 && (
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Filter by category:</span>
              <Button
                variant={currentFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentFilter('all')}
              >
                All ({content.cards.length})
              </Button>
              {getUniqueCategories().map(category => (
                <Button
                  key={category}
                  variant={currentFilter === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentFilter(category)}
                >
                  {category} ({content.cards.filter(c => c.category === category).length})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Card View with Navigation */}
      <div className="max-w-2xl mx-auto">
        {getFilteredCards().length > 0 ? (
          <>
            {/* Navigation Controls */}
            <Card className="border-2 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToFirstCard}
                      disabled={currentCardIndex === 0}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousCard}
                      disabled={currentCardIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <Badge variant="secondary" className="text-sm">
                      {currentCardIndex + 1} of {getFilteredCards().length}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextCard}
                      disabled={currentCardIndex === getFilteredCards().length - 1}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToLastCard}
                      disabled={currentCardIndex === getFilteredCards().length - 1}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Card */}
            {(() => {
              const card = getCurrentCard();
              if (!card) return null;
              
              const isFlipped = flippedCards.has(card.id);
              const isViewed = viewedCards.has(card.id);
              
              return (
                <div className="relative h-80 mb-6">
                  <div 
                    className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d cursor-pointer ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                    onClick={() => handleCardFlip(card.id)}
                  >
                    {/* Front of Card - Show actual front content */}
                    <Card className={`absolute inset-0 border-2 backface-hidden ${
                      isViewed ? 'border-blue-500' : 'border-border'
                    } hover:border-primary/50 transition-colors`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="text-2xl">🎴</div>
                          {card.category && (
                            <Badge variant="outline" className="text-xs">
                              {card.category}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 h-full flex flex-col justify-center">
                        <div className="text-center flex-1 flex flex-col justify-center">
                          <p className="text-xl font-medium mb-4 leading-relaxed">
                            {card.front}
                          </p>
                          <p className="text-sm text-muted-foreground">Click to see answer</p>
                        </div>
                        {isViewed && (
                          <Badge className="mt-2 text-xs bg-blue-500 self-center">
                            <Eye className="w-3 h-3 mr-1" />
                            Viewed
                          </Badge>
                        )}
                      </CardContent>
                    </Card>

                    {/* Back of Card - Show back content */}
                    <Card className={`absolute inset-0 border-2 backface-hidden rotate-y-180 ${
                      isViewed ? 'border-green-500 bg-green-50' : 'border-border'
                    }`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <RefreshCw className="w-4 h-4 text-muted-foreground" />
                          {card.category && (
                            <Badge variant="outline" className="text-xs">
                              {card.category}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 h-full flex flex-col justify-center">
                        <div className="text-center flex-1 flex flex-col justify-center">
                          <h4 className="font-semibold text-sm mb-4 text-muted-foreground">Answer:</h4>
                          <p className="text-xl font-medium bg-primary/10 p-4 rounded-lg border-2 border-primary/20 leading-relaxed">
                            {card.back}
                          </p>
                          <p className="text-sm text-muted-foreground mt-4">Click to flip back</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          <Card className="border-2">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No cards available for the selected filter.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completion Button */}
      {!isComplete && (
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <Button 
              onClick={handleComplete}
              className="w-full"
              disabled={viewedCards.size === 0}
            >
              Complete Card Review ({viewedCards.size}/{content.cards.length} viewed)
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              {allCardsViewed() 
                ? 'You\'ve viewed all cards! Click to complete.'
                : 'View more cards or complete when ready'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isComplete && (
        <Card className={`border-2 ${allCardsViewed() ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}`}>
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">
              {allCardsViewed() ? '🎉' : '🎴'}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${allCardsViewed() ? 'text-green-800' : 'text-blue-800'}`}>
              {allCardsViewed() ? 'All Cards Viewed!' : 'Card Review Complete!'}
            </h3>
            <p className={`mb-4 ${allCardsViewed() ? 'text-green-700' : 'text-blue-700'}`}>
              You viewed {viewedCards.size} out of {content.cards.length} cards.
              {!allCardsViewed() && ' You can always come back to view the rest!'}
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Score</div>
                <div className="text-2xl text-primary">{score}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Viewed</div>
                <div className="text-2xl">{viewedCards.size}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Completion</div>
                <div className="text-2xl">{Math.round((viewedCards.size / content.cards.length) * 100)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <style>{`
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default CardFlipRenderer;