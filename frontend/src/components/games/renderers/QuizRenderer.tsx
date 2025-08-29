import React, { useState } from 'react';
import { GameSchema, GameState, GameResults, QuizContent, QuizQuestion } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Lightbulb, ArrowRight, ArrowLeft } from 'lucide-react';

interface QuizRendererProps {
  gameSchema: GameSchema;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onComplete: (results: GameResults) => void;
}

const QuizRenderer: React.FC<QuizRendererProps> = ({
  gameSchema,
  gameState,
  setGameState,
  onComplete
}) => {
  const content = gameSchema.content as QuizContent;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<{ question: string; selected: string; correct: string; isCorrect: boolean }[]>([]);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = content.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === content.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / content.questions.length) * 100;
  const canGoBack = currentQuestionIndex > 0;

  const handleAnswerSubmit = () => {
    if (!selectedAnswer) return;

    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowExplanation(true);

    const newAnswer = {
      question: currentQuestion.question,
      selected: selectedAnswer,
      correct: currentQuestion.correctAnswer,
      isCorrect: correct
    };

    setAnswers(prev => [...prev, newAnswer]);

    // Update score
    if (correct) {
      const pointsPerQuestion = Math.floor(gameSchema.scoring.maxScore / content.questions.length);
      setGameState(prev => ({
        ...prev,
        score: prev.score + pointsPerQuestion,
        currentStep: currentQuestionIndex + 1
      }));
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate final results
      const correctCount = answers.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
      const totalQuestions = content.questions.length;
      const accuracy = (correctCount / totalQuestions) * 100;
      const finalScore = gameState.score + (isCorrect ? Math.floor(gameSchema.scoring.maxScore / content.questions.length) : 0);

      const results: GameResults = {
        score: finalScore,
        maxScore: gameSchema.scoring.maxScore,
        timeSpent: Math.floor((Date.now() - gameState.startTime) / 1000),
        correctAnswers: correctCount,
        totalQuestions,
        accuracy
      };

      onComplete(results);
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
      setShowExplanation(false);
      setIsCorrect(null);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (canGoBack) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer('');
      setShowExplanation(false);
      setIsCorrect(null);
      setShowHint(false);
    }
  };

  const renderAnswerOptions = () => {
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <RadioGroup 
            value={selectedAnswer} 
            onValueChange={setSelectedAnswer}
            disabled={showExplanation}
          >
            {currentQuestion.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label 
                  htmlFor={`option-${index}`} 
                  className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    showExplanation 
                      ? option === currentQuestion.correctAnswer
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : option === selectedAnswer && option !== currentQuestion.correctAnswer
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : 'bg-muted border-border'
                      : selectedAnswer === option
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {showExplanation && option === currentQuestion.correctAnswer && (
                      <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                    )}
                    {showExplanation && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
                      <XCircle className="w-5 h-5 text-red-600 ml-2" />
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true-false':
        return (
          <RadioGroup 
            value={selectedAnswer} 
            onValueChange={setSelectedAnswer}
            disabled={showExplanation}
          >
            {['True', 'False'].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label 
                  htmlFor={option} 
                  className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    showExplanation 
                      ? option === currentQuestion.correctAnswer
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : option === selectedAnswer && option !== currentQuestion.correctAnswer
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : 'bg-muted border-border'
                      : selectedAnswer === option
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {showExplanation && option === currentQuestion.correctAnswer && (
                      <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                    )}
                    {showExplanation && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
                      <XCircle className="w-5 h-5 text-red-600 ml-2" />
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'fill-blank':
        return (
          <div className="space-y-3">
            <Input
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder="Type your answer here..."
              disabled={showExplanation}
              className={`text-lg border-2 ${
                showExplanation 
                  ? isCorrect 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-500 bg-red-50'
                  : 'border-border'
              }`}
            />
            {showExplanation && (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                <strong>Correct answer:</strong> {currentQuestion.correctAnswer}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {content.questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Question Card */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{currentQuestion.question}</CardTitle>
          {currentQuestion.hint && !showExplanation && !showHint && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHint(true)}
              className="self-start"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Show Hint
            </Button>
          )}
          {showHint && currentQuestion.hint && (
            <div className="flex items-start gap-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Hint:</p>
                <p className="text-sm text-blue-700">{currentQuestion.hint}</p>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Answer Options */}
          {renderAnswerOptions()}

          {/* Explanation */}
          {showExplanation && currentQuestion.explanation && (
            <div className={`p-4 rounded-lg border-2 ${
              isCorrect 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium mb-1 ${
                    isCorrect ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {isCorrect ? '🎉 Correct!' : '💪 Not quite right.'}
                  </p>
                  <p className={`text-sm ${
                    isCorrect ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {canGoBack && !showExplanation && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            
            {!showExplanation ? (
              <Button 
                onClick={handleAnswerSubmit}
                disabled={!selectedAnswer}
                className="flex-1"
              >
                Submit Answer
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                className="flex-1"
              >
                {isLastQuestion ? 'Finish Quiz 🏁' : 'Next Question'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizRenderer;
