import React, { useState, useEffect } from 'react';
import { GameSchema, GameState, GameResults, MemoryMatchContent } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Timer, Target, Brain } from 'lucide-react';

interface MemoryCard {
  id: string;
  pairId: string;
  content: string;
  type: 'content1' | 'content2';
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchRendererProps {
  gameSchema: GameSchema;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onComplete: (results: GameResults) => void;
}

export const MemoryMatchRenderer: React.FC<MemoryMatchRendererProps> = ({
  gameSchema,
  gameState,
  setGameState,
  onComplete
}) => {
  const content = gameSchema.content as MemoryMatchContent;
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [showExplanation, setShowExplanation] = useState<{pairId: string, explanation: string} | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Create cards from pairs data
    const gameCards: MemoryCard[] = [];
    
    content.pairs.forEach((pair) => {
      // Add first card
      gameCards.push({
        id: `${pair.id}-1`,
        pairId: pair.id,
        content: pair.content1,
        type: 'content1',
        isFlipped: false,
        isMatched: false
      });
      
      // Add second card
      gameCards.push({
        id: `${pair.id}-2`,
        pairId: pair.id,
        content: pair.content2,
        type: 'content2',
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle cards
    const shuffled = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, [content.pairs]);

  const handleCardClick = (cardId: string) => {
    if (selectedCards.length >= 2) return;
    if (selectedCards.includes(cardId)) return;
    if (cards.find(c => c.id === cardId)?.isMatched) return;

    const newSelectedCards = [...selectedCards, cardId];
    setSelectedCards(newSelectedCards);

    // Flip the card
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    ));

    // Check for match if two cards selected
    if (newSelectedCards.length === 2) {
      setMoves(prev => prev + 1);
      const card1 = cards.find(c => c.id === newSelectedCards[0]);
      const card2 = cards.find(c => c.id === newSelectedCards[1]);

      if (card1 && card2 && card1.pairId === card2.pairId) {
        // Match found!
        const newMatchedPairs = [...matchedPairs, card1.pairId];
        setMatchedPairs(newMatchedPairs);
        
        // Mark cards as matched
        setCards(prev => prev.map(card => 
          card.pairId === card1.pairId ? { ...card, isMatched: true } : card
        ));

        // Show explanation if available
        const pair = content.pairs.find(p => p.id === card1.pairId);
        if (pair?.explanation) {
          setShowExplanation({
            pairId: card1.pairId,
            explanation: pair.explanation
          });
          setTimeout(() => setShowExplanation(null), 3000);
        }

        // Calculate score
        const newScore = Math.floor((newMatchedPairs.length / content.pairs.length) * gameSchema.scoring.maxScore);
        setGameState(prev => ({ ...prev, score: newScore }));

        // Check if game is complete
        if (newMatchedPairs.length === content.pairs.length) {
          setIsComplete(true);
          setTimeout(() => {
            const results: GameResults = {
              score: newScore,
              maxScore: gameSchema.scoring.maxScore,
              timeSpent: Math.floor((Date.now() - gameState.startTime) / 1000),
              correctAnswers: newMatchedPairs.length,
              totalQuestions: content.pairs.length,
              accuracy: 100 // Memory match is always 100% when completed
            };
            onComplete(results);
          }, 2000);
        }

        // Clear selection immediately for matched pairs
        setTimeout(() => setSelectedCards([]), 500);
      } else {
        // No match - flip cards back after delay
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            newSelectedCards.includes(card.id) 
              ? { ...card, isFlipped: false } 
              : card
          ));
          setSelectedCards([]);
        }, 1500);
      }
    }
  };

  const handleReset = () => {
    // Reset all cards
    setCards(prev => prev.map(card => ({ 
      ...card, 
      isFlipped: false, 
      isMatched: false 
    })));
    setSelectedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setShowExplanation(null);
    setIsComplete(false);
    setGameState(prev => ({ ...prev, score: 0 }));
    
    // Re-shuffle cards
    setTimeout(() => {
      setCards(prev => [...prev].sort(() => Math.random() - 0.5));
    }, 100);
  };

  const progress = (matchedPairs.length / content.pairs.length) * 100;
  // Calculate grid dimensions from gridSize string (e.g., '4x4' -> 4)
  const getGridDimensions = (gridSize: string) => {
    const dimensions = gridSize.split('x');
    return parseInt(dimensions[0]) || Math.ceil(Math.sqrt(cards.length));
  };
  
  const gridCols = getGridDimensions(content.gridSize);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats and Progress */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                <Target className="w-4 h-4 mr-1" />
                {matchedPairs.length}/{content.pairs.length} Pairs
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Brain className="w-4 h-4 mr-1" />
                {moves} Moves
              </Badge>
              <span className="text-sm text-muted-foreground">
                Score: {gameState.score}/{gameSchema.scoring.maxScore}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">{gameSchema.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Click on cards to flip them over. Find matching pairs by remembering their positions. 
            When you find a match, both cards will stay face up!
          </p>
        </CardContent>
      </Card>

      {/* Game Board */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div 
            className="grid gap-4 justify-center max-w-fit mx-auto"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
            }}
          >
            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`
                  relative h-32 w-32 cursor-pointer transition-all duration-200
                  ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}
                  ${selectedCards.includes(card.id) ? 'ring-2 ring-primary' : ''}
                `}
              >
                {/* Card Back */}
                <div className={`
                  absolute inset-0 w-full h-full rounded-lg border-2 flex items-center justify-center
                  transition-opacity duration-300 bg-primary text-primary-foreground
                  ${card.isFlipped || card.isMatched ? 'opacity-0' : 'opacity-100'}
                `}>
                  <div className="text-center">
                    <div className="text-2xl mb-1">?</div>
                    <div className="text-xs font-medium">Memory</div>
                  </div>
                </div>

                {/* Card Front */}
                <div className={`
                  absolute inset-0 w-full h-full rounded-lg border-2 flex items-center justify-center p-3
                  transition-opacity duration-300 text-center
                  ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'}
                  ${card.isMatched 
                    ? 'bg-green-50 border-green-500 text-green-800' 
                    : 'bg-card border-border'
                  }
                `}>
                  <div className="text-sm font-medium leading-tight">
                    {card.content}
                  </div>
                </div>

                {/* Matched indicator */}
                {card.isMatched && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Explanation Modal */}
      {showExplanation && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-medium text-green-800 mb-1">Great match!</p>
                <p className="text-sm text-green-700">{showExplanation.explanation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {isComplete && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4 font-bold text-green-600">SUCCESS</div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              Fantastic Memory Work!
            </h3>
            <p className="text-green-700 mb-2">
              You found all {matchedPairs.length} pairs in just {moves} moves!
            </p>
            <div className="flex justify-center gap-4 text-sm text-green-600">
              <span>Time: {Math.floor((Date.now() - gameState.startTime) / 1000)}s</span>
              <span>Perfect Score!</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MemoryMatchRenderer;
