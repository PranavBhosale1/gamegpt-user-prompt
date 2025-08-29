import React, { useState } from 'react';
import { GameSchema, GameState, GameResults, CardFlipContent, FlipCard } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Eye, RefreshCw, Layers } from 'lucide-react';

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
    setFlippedCards(new Set());
    setViewedCards(new Set());
    setIsComplete(false);
    setScore(0);
    setCurrentFilter('all');
    setGameState(prev => ({ ...prev, score: 0 }));
  };

  const flipAllCards = () => {
    if (flippedCards.size === content.cards.length) {
      // Flip all to front
      setFlippedCards(new Set());
    } else {
      // Flip all to back
      const allCardIds = content.cards.map(card => card.id);
      setFlippedCards(new Set(allCardIds));
      setViewedCards(new Set(allCardIds));
      
      const newScore = Math.floor((allCardIds.length / content.cards.length) * gameSchema.scoring.maxScore);
      setScore(newScore);
      setGameState(prev => ({ ...prev, score: newScore }));
    }
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
                Viewed: {viewedCards.size}/{content.cards.length}
              </Badge>
              <Badge variant="outline">
                Flipped: {flippedCards.size}/{content.cards.length}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={flipAllCards}
                disabled={isComplete}
              >
                <Layers className="w-4 h-4 mr-2" />
                {flippedCards.size === content.cards.length ? 'Flip All Front' : 'Flip All Back'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
          <Progress value={(viewedCards.size / content.cards.length) * 100} className="h-3" />
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

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {getFilteredCards().map((card) => {
          const isFlipped = flippedCards.has(card.id);
          const isViewed = viewedCards.has(card.id);
          
          return (
            <div key={card.id} className="relative h-64">
              <div 
                className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d cursor-pointer ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
                onClick={() => handleCardFlip(card.id)}
              >
                {/* Front of Card */}
                <Card className={`absolute inset-0 border-2 backface-hidden ${
                  isViewed ? 'border-blue-500' : 'border-border'
                } hover:border-primary/50 transition-colors`}>
                  <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4">🎴</div>
                    <p className="text-sm text-muted-foreground">Click to flip</p>
                    {card.category && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {card.category}
                      </Badge>
                    )}
                    {isViewed && (
                      <Badge className="mt-2 text-xs bg-blue-500">
                        <Eye className="w-3 h-3 mr-1" />
                        Viewed
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Back of Card */}
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
                  <CardContent className="p-4 pt-0 h-full flex flex-col">
                    {/* Front Content */}
                    <div className="mb-4 flex-1">
                      <h4 className="font-semibold text-sm mb-2">Front:</h4>
                      {card.frontImage ? (
                        <div className="w-full h-16 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">🖼️ {card.frontImage}</span>
                        </div>
                      ) : (
                        <p className="text-sm bg-muted p-2 rounded">{card.front}</p>
                      )}
                    </div>

                    {/* Back Content */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-2">Back:</h4>
                      {card.backImage ? (
                        <div className="w-full h-16 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">🖼️ {card.backImage}</span>
                        </div>
                      ) : (
                        <p className="text-sm bg-primary/10 p-2 rounded border-2 border-primary/20">
                          {card.back}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
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

      <style jsx>{`
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
