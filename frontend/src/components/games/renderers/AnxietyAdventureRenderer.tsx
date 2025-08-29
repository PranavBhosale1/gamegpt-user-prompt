import React, { useState } from 'react';
import { GameSchema, GameState, GameResults, AnxietyAdventureContent } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, Brain, Lightbulb, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';

interface AnxietyAdventureRendererProps {
  gameSchema: GameSchema;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onComplete: (results: GameResults) => void;
}

export const AnxietyAdventureRenderer: React.FC<AnxietyAdventureRendererProps> = ({
  gameSchema,
  gameState,
  setGameState,
  onComplete
}) => {
  const content = gameSchema.content as AnxietyAdventureContent;
  const [currentScenarioId, setCurrentScenarioId] = useState(content.startId);
  const [anxietyLevel, setAnxietyLevel] = useState(5); // Start at medium anxiety
  const [totalPoints, setTotalPoints] = useState(0);
  const [visitedScenarios, setVisitedScenarios] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);
  const [journeyComplete, setJourneyComplete] = useState(false);

  const currentScenario = content.scenarios.find(s => s.id === currentScenarioId);

  if (!currentScenario) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Scenario not found. Please restart the adventure.</p>
        </CardContent>
      </Card>
    );
  }

  const handleChoiceSelect = (choiceId: string) => {
    setSelectedChoice(choiceId);
    setShowOutcome(false);
  };

  const handleChoiceSubmit = () => {
    if (!selectedChoice) return;

    const choice = currentScenario.choices.find(c => c.id === selectedChoice);
    if (!choice) return;

    setShowOutcome(true);

    // Update anxiety level and points
    const newAnxietyLevel = Math.max(1, Math.min(10, anxietyLevel + choice.anxietyChange));
    const newTotalPoints = totalPoints + choice.points;
    
    setAnxietyLevel(newAnxietyLevel);
    setTotalPoints(newTotalPoints);
    setVisitedScenarios(prev => [...prev, currentScenarioId]);

    // Update game state score
    const newScore = Math.floor((newTotalPoints / (visitedScenarios.length + 1)) * 10); // Rough scoring
    setGameState(prev => ({ ...prev, score: newScore }));

    // Handle next scenario or completion
    setTimeout(() => {
      if (choice.nextScenario && content.scenarios.find(s => s.id === choice.nextScenario)) {
        setCurrentScenarioId(choice.nextScenario);
        setSelectedChoice(null);
        setShowOutcome(false);
      } else {
        // Adventure complete
        setJourneyComplete(true);
        setTimeout(() => {
          const results: GameResults = {
            score: Math.min(gameSchema.scoring.maxScore, Math.floor(newTotalPoints * 2)),
            maxScore: gameSchema.scoring.maxScore,
            timeSpent: Math.floor((Date.now() - gameState.startTime) / 1000),
            correctAnswers: Math.floor(newTotalPoints / 10), // Rough calculation
            totalQuestions: visitedScenarios.length + 1,
            accuracy: Math.min(100, (newTotalPoints / ((visitedScenarios.length + 1) * 20)) * 100)
          };
          onComplete(results);
        }, 3000);
      }
    }, 3000);
  };

  const handleRestart = () => {
    setCurrentScenarioId(content.startId);
    setAnxietyLevel(5);
    setTotalPoints(0);
    setVisitedScenarios([]);
    setSelectedChoice(null);
    setShowOutcome(false);
    setJourneyComplete(false);
    setGameState(prev => ({ ...prev, score: 0 }));
  };

  const getAnxietyColor = (level: number) => {
    if (level <= 3) return 'text-green-600 bg-green-100';
    if (level <= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAnxietyEmoji = (level: number) => {
    if (level <= 2) return '😌';
    if (level <= 4) return '🙂';
    if (level <= 6) return '😐';
    if (level <= 8) return '😰';
    return '😱';
  };

  const choice = selectedChoice ? currentScenario.choices.find(c => c.id === selectedChoice) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Stats Dashboard */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge className={`text-sm ${getAnxietyColor(anxietyLevel)}`}>
                <Heart className="w-4 h-4 mr-1" />
                Anxiety: {anxietyLevel}/10 {getAnxietyEmoji(anxietyLevel)}
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Brain className="w-4 h-4 mr-1" />
                Points: {totalPoints}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Scenarios: {visitedScenarios.length + 1}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleRestart}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart Adventure
            </Button>
          </div>
          <Progress value={(anxietyLevel / 10) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Current Scenario */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            🌟 {currentScenario.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Anxiety Level: {currentScenario.anxietyLevel}/10
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scenario Description */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-foreground leading-relaxed">
              {currentScenario.description}
            </p>
          </div>

          {/* Tips (if available) */}
          {currentScenario.tips && currentScenario.tips.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Helpful Tips:
              </h4>
              <ul className="space-y-1 text-sm text-blue-700">
                {currentScenario.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Choices */}
          {!showOutcome && (
            <div className="space-y-3">
              <h4 className="font-semibold">What would you like to do?</h4>
              <div className="space-y-3">
                {currentScenario.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceSelect(choice.id)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedChoice === choice.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-medium">{choice.text}</span>
                      <div className="flex items-center gap-2 ml-4">
                        {choice.anxietyChange > 0 && (
                          <Badge variant="outline" className="text-red-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +{choice.anxietyChange}
                          </Badge>
                        )}
                        {choice.anxietyChange < 0 && (
                          <Badge variant="outline" className="text-green-600">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {choice.anxietyChange}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-blue-600">
                          +{choice.points}pts
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Outcome */}
          {showOutcome && choice && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 border-2 border-primary/20 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">Your Choice:</h4>
                <p className="text-sm mb-3">{choice.text}</p>
                <p className="text-foreground">{choice.outcome}</p>
                {choice.explanation && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    💡 {choice.explanation}
                  </p>
                )}
              </div>

              <div className="flex justify-center gap-4">
                <Badge className={`${choice.anxietyChange > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  Anxiety {choice.anxietyChange > 0 ? 'increased' : 'decreased'} by {Math.abs(choice.anxietyChange)}
                </Badge>
                <Badge variant="outline">
                  +{choice.points} points earned
                </Badge>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!showOutcome ? (
            <Button 
              onClick={handleChoiceSubmit}
              disabled={!selectedChoice}
              className="w-full"
            >
              Make This Choice
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">
                {choice?.nextScenario ? 'Moving to next scenario...' : 'Adventure complete!'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Journey Complete */}
      {journeyComplete && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              Journey Complete!
            </h3>
            <p className="text-green-700 mb-4">
              You've navigated through your anxiety adventure and earned {totalPoints} points!
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm">
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Final Anxiety Level</div>
                <div className="text-2xl">{anxietyLevel}/10 {getAnxietyEmoji(anxietyLevel)}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Total Points</div>
                <div className="text-2xl text-blue-600">{totalPoints}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnxietyAdventureRenderer;
