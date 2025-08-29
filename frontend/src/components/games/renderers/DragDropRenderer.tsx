import React, { useState, useEffect } from 'react';
import { GameSchema, GameState, GameResults, DragDropContent } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, Target } from 'lucide-react';

interface DragDropRendererProps {
  gameSchema: GameSchema;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onComplete: (results: GameResults) => void;
}

export const DragDropRenderer: React.FC<DragDropRendererProps> = ({
  gameSchema,
  gameState,
  setGameState,
  onComplete
}) => {
  const content = gameSchema.content as DragDropContent;
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [droppedItems, setDroppedItems] = useState<Record<string, string[]>>({});
  const [itemStates, setItemStates] = useState<Record<string, 'correct' | 'incorrect' | 'neutral'>>({});
  const [showExplanation, setShowExplanation] = useState<{itemId: string, explanation: string} | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Initialize empty drop zones
    const initialDropped: Record<string, string[]> = {};
    content.dropZones.forEach(zone => {
      initialDropped[zone.id] = [];
    });
    setDroppedItems(initialDropped);
    
    // Initialize item states
    const initialStates: Record<string, 'correct' | 'incorrect' | 'neutral'> = {};
    content.items.forEach(item => {
      initialStates[item.id] = 'neutral';
    });
    setItemStates(initialStates);
  }, [content.dropZones, content.items]);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const item = content.items.find(item => item.id === draggedItem);
    if (!item) return;

    // Remove item from its current zone
    const newDroppedItems = { ...droppedItems };
    Object.keys(newDroppedItems).forEach(zoneKey => {
      newDroppedItems[zoneKey] = newDroppedItems[zoneKey].filter(id => id !== draggedItem);
    });

    // Add item to new zone
    newDroppedItems[zoneId].push(draggedItem);
    
    // Check if this is the correct zone and update item state
    const newItemStates = { ...itemStates };
    if (zoneId === item.correctZone) {
      newItemStates[draggedItem] = 'correct';
    } else {
      newItemStates[draggedItem] = 'incorrect';
      // Show explanation for incorrect answer
      if (item.explanation) {
        setShowExplanation({
          itemId: draggedItem,
          explanation: item.explanation
        });
        setTimeout(() => setShowExplanation(null), 3000);
      }
    }
    setItemStates(newItemStates);
    
    // Update score and check completion
    updateScore(newDroppedItems, newItemStates);
    setDroppedItems(newDroppedItems);
    setDraggedItem(null);
  };

  const updateScore = (currentDroppedItems: Record<string, string[]>, currentItemStates: Record<string, 'correct' | 'incorrect' | 'neutral'>) => {
    let correctCount = 0;
    content.items.forEach(item => {
      if (currentItemStates[item.id] === 'correct') {
        correctCount++;
      }
    });

    const newScore = Math.floor((correctCount / content.items.length) * gameSchema.scoring.maxScore);
    setGameState(prev => ({ ...prev, score: newScore }));

    // Check if all items are placed
    const allItemsPlaced = content.items.every(item => 
      Object.values(currentDroppedItems).some(zoneItems => zoneItems.includes(item.id))
    );

    if (allItemsPlaced && !isComplete) {
      setIsComplete(true);
      setTimeout(() => {
        const results: GameResults = {
          score: newScore,
          maxScore: gameSchema.scoring.maxScore,
          timeSpent: Math.floor((Date.now() - gameState.startTime) / 1000),
          correctAnswers: correctCount,
          totalQuestions: content.items.length,
          accuracy: (correctCount / content.items.length) * 100
        };
        onComplete(results);
      }, 1500);
    }
  };

  const handleReset = () => {
    const initialDropped: Record<string, string[]> = {};
    content.dropZones.forEach(zone => {
      initialDropped[zone.id] = [];
    });
    setDroppedItems(initialDropped);
    
    const initialStates: Record<string, 'correct' | 'incorrect' | 'neutral'> = {};
    content.items.forEach(item => {
      initialStates[item.id] = 'neutral';
    });
    setItemStates(initialStates);
    setGameState(prev => ({ ...prev, score: 0 }));
    setIsComplete(false);
    setShowExplanation(null);
  };

  const getItemsInZone = (zoneId: string) => {
    return droppedItems[zoneId] || [];
  };

  const getAvailableItems = () => {
    const placedItems = Object.values(droppedItems).flat();
    return content.items.filter(item => !placedItems.includes(item.id));
  };

  const correctCount = Object.values(itemStates).filter(state => state === 'correct').length;
  const progress = (correctCount / content.items.length) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Progress and Score */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                <Target className="w-4 h-4 mr-1" />
                {correctCount}/{content.items.length} Correct
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
                    <CardTitle className="text-xl">🎯 {gameSchema.title}</CardTitle>
          <p className="text-muted-foreground">{content.instructions}</p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Drag items from the available pool into the correct categories. 
            Items will turn green when placed correctly and red when incorrect.
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Available Items */}
        <div className="lg:col-span-1">
          <Card className="border-2 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">📦 Available Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getAvailableItems().map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    className={`p-3 rounded-lg border-2 cursor-move transition-all hover:shadow-md ${
                      itemStates[item.id] === 'neutral'
                        ? 'border-border bg-card hover:border-primary/50'
                        : itemStates[item.id] === 'correct'
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-red-500 bg-red-50 text-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.content}</span>
                      {itemStates[item.id] === 'correct' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {itemStates[item.id] === 'incorrect' && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drop Zones */}
        <div className="lg:col-span-2">
          <div className="grid gap-4">
            {content.dropZones.map((zone) => (
              <Card
                key={zone.id}
                className="border-2 border-dashed transition-all"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, zone.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📋 {zone.label}
                    <Badge variant="secondary">{getItemsInZone(zone.id).length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[120px] space-y-2">
                    {getItemsInZone(zone.id).map((itemId) => {
                      const item = content.items.find(i => i.id === itemId);
                      if (!item) return null;
                      
                      return (
                        <div
                          key={itemId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, itemId)}
                          className={`p-3 rounded-lg border-2 cursor-move transition-all ${
                            itemStates[itemId] === 'correct'
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : itemStates[itemId] === 'incorrect'
                              ? 'border-red-500 bg-red-50 text-red-800'
                              : 'border-border bg-card'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.content}</span>
                            {itemStates[itemId] === 'correct' && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                            {itemStates[itemId] === 'incorrect' && (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {getItemsInZone(zone.id).length === 0 && (
                      <div className="flex items-center justify-center h-[100px] text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                        Drop items here
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Explanation Modal */}
      {showExplanation && (
        <Card className="border-2 border-red-500 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 mb-1">Not quite right!</p>
                <p className="text-sm text-red-700">{showExplanation.explanation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {isComplete && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-bold text-green-800 mb-2">
              🎉 Excellent Work!
            </h3>
            <p className="text-green-700">
              You correctly categorized {correctCount} out of {content.items.length} items!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DragDropRenderer;
