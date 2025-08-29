import React, { useState } from 'react';
import { GameSchema, GameState, GameResults, StorySequenceContent, StoryEvent } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, RotateCcw, CheckCircle2, X, ArrowRight } from 'lucide-react';

interface StorySequenceRendererProps {
  gameSchema: GameSchema;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onComplete: (results: GameResults) => void;
}

export const StorySequenceRenderer: React.FC<StorySequenceRendererProps> = ({
  gameSchema,
  gameState,
  setGameState,
  onComplete
}) => {
  const content = gameSchema.content as StorySequenceContent;
  const [sequencedEvents, setSequencedEvents] = useState<StoryEvent[]>([...content.events].sort(() => Math.random() - 0.5));
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const calculateScore = () => {
    let correctCount = 0;
    sequencedEvents.forEach((event, index) => {
      if (event.order === index + 1) {
        correctCount++;
      }
    });
    return Math.floor((correctCount / content.events.length) * gameSchema.scoring.maxScore);
  };

  const moveEvent = (index: number, direction: 'up' | 'down') => {
    const newEvents = [...sequencedEvents];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newEvents.length) {
      [newEvents[index], newEvents[targetIndex]] = [newEvents[targetIndex], newEvents[index]];
      setSequencedEvents(newEvents);
      
      const newScore = calculateScore();
      setScore(newScore);
      setGameState(prev => ({ ...prev, score: newScore }));
    }
  };

  const handleComplete = () => {
    const finalScore = calculateScore();
    let correctCount = 0;
    sequencedEvents.forEach((event, index) => {
      if (event.order === index + 1) {
        correctCount++;
      }
    });
    
    setIsComplete(true);
    setShowResults(true);
    
    const results: GameResults = {
      score: finalScore,
      maxScore: gameSchema.scoring.maxScore,
      timeSpent: Math.floor((Date.now() - gameState.startTime) / 1000),
      correctAnswers: correctCount,
      totalQuestions: content.events.length,
      accuracy: (correctCount / content.events.length) * 100
    };
    
    setTimeout(() => onComplete(results), 3000);
  };

  const handleReset = () => {
    setSequencedEvents([...content.events].sort(() => Math.random() - 0.5));
    setIsComplete(false);
    setScore(0);
    setShowResults(false);
    setGameState(prev => ({ ...prev, score: 0 }));
  };

  const isCorrectPosition = (event: StoryEvent, index: number) => {
    return event.order === index + 1;
  };

  const isSequenceCorrect = () => {
    return sequencedEvents.every((event, index) => event.order === index + 1);
  };

  const getCorrectSequence = () => {
    return [...content.events].sort((a, b) => a.order - b.order);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">📖 {gameSchema.title}</CardTitle>
          <p className="text-muted-foreground">{content.instructions}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Score: {score}/{gameSchema.scoring.maxScore}
              </Badge>
              <Badge variant="outline">
                Correct: {sequencedEvents.filter((event, index) => event.order === index + 1).length}/{content.events.length}
              </Badge>
              <Badge variant="outline">
                Progress: {Math.round((sequencedEvents.filter((event, index) => event.order === index + 1).length / content.events.length) * 100)}%
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Shuffle Again
            </Button>
          </div>
          <Progress value={(sequencedEvents.filter((event, index) => event.order === index + 1).length / content.events.length) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Story Sequence Area */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Arrange the Events in Correct Order</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use the arrow buttons to move events up or down to create the correct sequence
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {sequencedEvents.map((event, index) => {
            const isCorrect = isCorrectPosition(event, index);
            return (
              <div
                key={event.id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                  showResults
                    ? isCorrect 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50'
                    : isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                {/* Move Controls */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveEvent(index, 'up')}
                    disabled={index === 0 || isComplete}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveEvent(index, 'down')}
                    disabled={index === sequencedEvents.length - 1 || isComplete}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>

                {/* Position Number */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                  showResults
                    ? isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    : isCorrect ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>

                {/* Event Content */}
                <div className="flex-1">
                  <p className="font-medium text-foreground leading-relaxed">
                    {event.content}
                  </p>
                  {showResults && isCorrect && (
                    <div className="flex items-center gap-1 text-green-600 text-sm mt-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Correct position!
                    </div>
                  )}
                  {showResults && !isCorrect && event.explanation && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      💡 {event.explanation}
                    </p>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex items-center">
                  {showResults ? (
                    isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )
                  ) : isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Should be #{event.order}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Completion Button */}
      {!isComplete && (
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <Button 
              onClick={handleComplete}
              className="w-full"
            >
              Complete Story Sequence
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Check your sequence and see the results
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && (
        <Card className={`border-2 ${isSequenceCorrect() ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">
                {isSequenceCorrect() ? '🎉' : '📚'}
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isSequenceCorrect() ? 'text-green-800' : 'text-orange-800'}`}>
                {isSequenceCorrect() ? 'Perfect Sequence!' : 'Good Effort!'}
              </h3>
              <p className={`mb-4 ${isSequenceCorrect() ? 'text-green-700' : 'text-orange-700'}`}>
                You got {sequencedEvents.filter((event, index) => event.order === index + 1).length} out of {content.events.length} events in the correct order.
              </p>
            </div>

            {/* Show correct sequence if not perfect */}
            {!isSequenceCorrect() && (
              <div className="mb-6">
                <h4 className="font-semibold text-center mb-4">Correct Sequence:</h4>
                <div className="space-y-3">
                  {getCorrectSequence().map((event, index) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <p className="flex-1 text-sm">{event.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="font-semibold">Score</div>
                <div className="text-2xl text-primary">{score}</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="font-semibold">Correct</div>
                <div className="text-2xl">{sequencedEvents.filter((event, index) => event.order === index + 1).length}</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="font-semibold">Accuracy</div>
                <div className="text-2xl">{Math.round((sequencedEvents.filter((event, index) => event.order === index + 1).length / content.events.length) * 100)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StorySequenceRenderer;
