import React, { useState } from 'react';
import { GameSchema, GameState, GameResults, FillBlankContent, FillBlank } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2, X, Lightbulb, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface FillBlankRendererProps {
  gameSchema: GameSchema;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onComplete: (results: GameResults) => void;
}

export const FillBlankRenderer: React.FC<FillBlankRendererProps> = ({
  gameSchema,
  gameState,
  setGameState,
  onComplete
}) => {
  const content = gameSchema.content as FillBlankContent;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const calculateScore = () => {
    let correctCount = 0;
    let totalBlanks = 0;
    
    content.passages.forEach(passage => {
      passage.blanks.forEach(blank => {
        totalBlanks++;
        if (answers[blank.id]?.toLowerCase().trim() === blank.correctAnswer.toLowerCase().trim()) {
          correctCount++;
        }
      });
    });
    
    return Math.floor((correctCount / totalBlanks) * gameSchema.scoring.maxScore);
  };

  const getTotalBlanks = () => {
    return content.passages.reduce((total, passage) => total + passage.blanks.length, 0);
  };

  const getCorrectAnswers = () => {
    let correctCount = 0;
    content.passages.forEach(passage => {
      passage.blanks.forEach(blank => {
        if (answers[blank.id]?.toLowerCase().trim() === blank.correctAnswer.toLowerCase().trim()) {
          correctCount++;
        }
      });
    });
    return correctCount;
  };

  const handleAnswerChange = (blankId: string, value: string) => {
    const newAnswers = { ...answers, [blankId]: value };
    setAnswers(newAnswers);
    
    const newScore = calculateScore();
    setScore(newScore);
    setGameState(prev => ({ ...prev, score: newScore }));
  };

  const toggleHint = (blankId: string) => {
    setShowHints(prev => ({ ...prev, [blankId]: !prev[blankId] }));
  };

  const handleComplete = () => {
    const finalScore = calculateScore();
    const correctCount = getCorrectAnswers();
    const totalBlanks = getTotalBlanks();
    
    setIsComplete(true);
    setShowResults(true);
    
    const results: GameResults = {
      score: finalScore,
      maxScore: gameSchema.scoring.maxScore,
      timeSpent: Math.floor((Date.now() - gameState.startTime) / 1000),
      correctAnswers: correctCount,
      totalQuestions: totalBlanks,
      accuracy: (correctCount / totalBlanks) * 100
    };
    
    setTimeout(() => onComplete(results), 3000);
  };

  const handleReset = () => {
    setAnswers({});
    setShowHints({});
    setIsComplete(false);
    setScore(0);
    setShowResults(false);
    setGameState(prev => ({ ...prev, score: 0 }));
  };

  const isBlankCorrect = (blank: FillBlank) => {
    return answers[blank.id]?.toLowerCase().trim() === blank.correctAnswer.toLowerCase().trim();
  };

  const allBlanksAnswered = () => {
    const totalBlanks = getTotalBlanks();
    const answeredBlanks = Object.keys(answers).filter(key => answers[key]?.trim()).length;
    return answeredBlanks === totalBlanks;
  };

  const renderPassageWithBlanks = (passage: any) => {
    let text = passage.text;
    const blanks = [...passage.blanks].sort((a, b) => b.position - a.position); // Sort descending to avoid position shifts
    
    blanks.forEach(blank => {
      const isCorrect = isBlankCorrect(blank);
      const inputClassName = showResults 
        ? isCorrect 
          ? 'border-green-500 bg-green-50' 
          : 'border-red-500 bg-red-50'
        : 'border-border';

      const input = `<span class="inline-block relative">
        <input 
          type="text" 
          data-blank-id="${blank.id}"
          value="${answers[blank.id] || ''}"
          class="w-24 px-2 py-1 text-center border-2 rounded ${inputClassName} ${isComplete ? 'cursor-not-allowed' : ''}"
          ${isComplete ? 'disabled' : ''}
          placeholder="____"
        />
        ${showResults && !isCorrect ? `<span class="absolute -bottom-6 left-0 text-xs text-red-600 whitespace-nowrap">Answer: ${blank.correctAnswer}</span>` : ''}
      </span>`;
      
      text = text.substring(0, blank.position) + input + text.substring(blank.position);
    });
    
    return text;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">📝 {gameSchema.title}</CardTitle>
          <p className="text-muted-foreground">{content.instructions}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Score: {score}/{gameSchema.scoring.maxScore}
              </Badge>
              <Badge variant="outline">
                Answered: {Object.keys(answers).filter(key => answers[key]?.trim()).length}/{getTotalBlanks()}
              </Badge>
              <Badge variant="outline">
                Correct: {getCorrectAnswers()}/{getTotalBlanks()}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
          <Progress value={(Object.keys(answers).filter(key => answers[key]?.trim()).length / getTotalBlanks()) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Passages */}
      {content.passages.map((passage, passageIndex) => (
        <Card key={passage.id} className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Passage {passageIndex + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Passage Text with Blanks */}
            <div 
              className="leading-relaxed text-foreground p-4 bg-muted rounded-lg relative"
              dangerouslySetInnerHTML={{ __html: renderPassageWithBlanks(passage) }}
            />

            {/* Add event listeners for inputs */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  setTimeout(() => {
                    document.querySelectorAll('[data-blank-id]').forEach(input => {
                      input.addEventListener('input', (e) => {
                        const blankId = e.target.getAttribute('data-blank-id');
                        window.handleAnswerChange?.(blankId, e.target.value);
                      });
                    });
                  }, 100);
                `
              }}
            />

            {/* Blanks List */}
            <div className="space-y-4">
              <h4 className="font-semibold">Fill in the blanks:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {passage.blanks.map((blank, blankIndex) => {
                  const isCorrect = isBlankCorrect(blank);
                  return (
                    <div
                      key={blank.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        showResults
                          ? isCorrect 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-red-500 bg-red-50'
                          : 'border-border bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Blank #{blankIndex + 1}
                        </Badge>
                        {showResults && (
                          <>
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-red-600" />
                            )}
                          </>
                        )}
                      </div>

                      <div className="space-y-3">
                        {blank.options ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Choose the correct answer:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {blank.options.map((option, optionIndex) => (
                                <button
                                  key={optionIndex}
                                  onClick={() => handleAnswerChange(blank.id, option)}
                                  disabled={isComplete}
                                  className={`p-2 text-sm rounded border-2 transition-all ${
                                    answers[blank.id] === option
                                      ? 'border-primary bg-primary/10'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Type your answer:</p>
                            <Input
                              value={answers[blank.id] || ''}
                              onChange={(e) => handleAnswerChange(blank.id, e.target.value)}
                              disabled={isComplete}
                              placeholder="Enter your answer..."
                              className={showResults 
                                ? isCorrect 
                                  ? 'border-green-500 bg-green-50' 
                                  : 'border-red-500 bg-red-50'
                                : ''
                              }
                            />
                          </div>
                        )}

                        {/* Hint */}
                        {blank.hint && (
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleHint(blank.id)}
                              className="text-xs"
                            >
                              {showHints[blank.id] ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                              {showHints[blank.id] ? 'Hide' : 'Show'} Hint
                            </Button>
                            {showHints[blank.id] && (
                              <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                <p className="text-blue-800 text-sm flex items-center gap-1">
                                  <Lightbulb className="w-4 h-4" />
                                  {blank.hint}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Show correct answer if wrong */}
                        {showResults && !isCorrect && (
                          <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">
                              <strong>Correct answer:</strong> {blank.correctAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Completion Button */}
      {!isComplete && allBlanksAnswered() && (
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <Button 
              onClick={handleComplete}
              className="w-full"
            >
              Complete Fill in the Blanks
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Check your answers and see results
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && (
        <Card className={`border-2 ${getCorrectAnswers() === getTotalBlanks() ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">
              {getCorrectAnswers() === getTotalBlanks() ? '🎉' : '📚'}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${getCorrectAnswers() === getTotalBlanks() ? 'text-green-800' : 'text-orange-800'}`}>
              {getCorrectAnswers() === getTotalBlanks() ? 'Perfect Completion!' : 'Good Work!'}
            </h3>
            <p className={`mb-4 ${getCorrectAnswers() === getTotalBlanks() ? 'text-green-700' : 'text-orange-700'}`}>
              You got {getCorrectAnswers()} out of {getTotalBlanks()} blanks correct.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Score</div>
                <div className="text-2xl text-primary">{score}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Correct</div>
                <div className="text-2xl">{getCorrectAnswers()}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Accuracy</div>
                <div className="text-2xl">{Math.round((getCorrectAnswers() / getTotalBlanks()) * 100)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FillBlankRenderer;
