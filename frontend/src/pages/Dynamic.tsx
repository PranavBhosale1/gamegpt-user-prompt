import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import { DynamicGameRenderer } from '@/components/games/DynamicGameRenderer';
import { GameSchema } from '@/types/game-schema';
import { useGameGeneration } from '@/hooks/useGameGeneration';
import { GameRequest } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Wand2, 
  Clock, 
  Target, 
  Users, 
  BookOpen,
  Gamepad2,
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  Brain,
  Heart,
  Settings,
  Sparkles
} from 'lucide-react';

export default function Dynamic() {
  const { toast } = useToast();
  
  const [gameRequest, setGameRequest] = useState<GameRequest>({
    description: '',
    difficulty: 'medium',
    targetAge: '',
    estimatedTime: 10,
    learningObjectives: '',
    theme: '',
    customRequirements: ''
  });

  const {
    generateGame,
    generatedGame,
    isGenerating,
    error,
    generationStep,
    clearError,
    reset
  } = useGameGeneration();

  const gameTypes = [
    { value: 'quiz', label: 'Quiz', description: 'Multiple choice and knowledge testing', icon: '🧠' },
    { value: 'drag-drop', label: 'Drag & Drop', description: 'Interactive sorting and categorization', icon: '🎯' },
    { value: 'memory-match', label: 'Memory Match', description: 'Memory and matching challenges', icon: '🧩' },
    { value: 'word-puzzle', label: 'Word Puzzle', description: 'Crosswords and word games', icon: '📝' },
    { value: 'sorting', label: 'Sorting', description: 'Categorize and organize items', icon: '📊' },
    { value: 'matching', label: 'Matching', description: 'Connect related concepts', icon: '🔗' },
    { value: 'story-sequence', label: 'Story Sequence', description: 'Order events and narratives', icon: '📚' },
    { value: 'fill-blank', label: 'Fill Blanks', description: 'Complete sentences and paragraphs', icon: '✏️' },
    { value: 'card-flip', label: 'Card Flip', description: 'Flip cards to learn concepts', icon: '🃏' },
    { value: 'puzzle-assembly', label: 'Puzzle', description: 'Assemble pieces to complete images', icon: '🧩' },
    { value: 'anxiety-adventure', label: 'Anxiety Adventure', description: 'Branching choices through anxiety scenarios', icon: '🌟' }
  ];

  const suggestions = [
    "A quiz about recognizing and managing stress for teens",
    "A memory matching game for positive affirmations and coping skills",
    "A drag and drop game about identifying emotions and healthy responses",
    "A word puzzle featuring mindfulness and self-care vocabulary",
    "A sorting game for distinguishing helpful and unhelpful thoughts",
    "A story sequence game about steps in a calming breathing exercise",
    "A matching game for common triggers and healthy coping strategies",
    "An anxiety adventure with branching choices teaching coping skills",
    "A memory matching game for time management for ADHD people"
  ];

  const handleGenerate = async () => {
    if (!gameRequest.description.trim()) {
      return;
    }
    
    await generateGame(gameRequest);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setGameRequest(prev => ({ ...prev, description: suggestion }));
  };

  const handleDownload = () => {
    if (generatedGame) {
      const blob = new Blob([JSON.stringify(generatedGame, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedGame.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Game Downloaded! 📁",
        description: "Your game has been saved to your device."
      });
    }
  };

  const handleShare = async () => {
    if (generatedGame && navigator.share) {
      try {
        await navigator.share({
          title: generatedGame.title,
          text: generatedGame.description,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    }
  };

  const handleRegenerate = () => {
    reset();
  };

  if (generatedGame) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Header with actions */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <Button
              variant="outline"
              onClick={reset}
              className="border-2 hover:bg-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Generator
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="border-2 hover:bg-secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              {navigator.share && (
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="border-2 hover:bg-secondary"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleRegenerate}
                className="border-2 hover:bg-secondary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>

          {/* Game Renderer */}
          <DynamicGameRenderer 
            gameSchema={generatedGame}
            onComplete={(results) => {
              console.log('Game completed:', results);
              toast({
                title: "Game Completed! 🏆",
                description: `You scored ${results.score}/${results.maxScore} points!`
              });
            }}
            onExit={() => setGeneratedGame(null)}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 max-w-5xl">
        {/* Compact Hero Section with Animations */}
        <div className="text-center mb-8 relative">
          <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-xl mb-4 shadow-lg transform hover:scale-110 hover:rotate-6 transition-all duration-300 group animate-bounce">
            <Gamepad2 className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/50 to-pink-400/50 rounded-xl blur-lg scale-125"></div>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent leading-tight">
            AI Game Creator
          </h1>
          
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto animate-fade-in-up">
            Create personalized wellness games for <span className="text-purple-600 font-semibold">self-discovery</span>, 
            <span className="text-pink-600 font-semibold"> mindfulness</span>, and 
            <span className="text-blue-600 font-semibold"> coping skills</span>.
          </p>

          {/* Animated Inline Stats */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200 hover:scale-105 hover:shadow-md transition-all duration-300 animate-slide-in-left">
              <Sparkles className="w-4 h-4 text-purple-500 animate-spin" style={{animationDuration: '3s'}} />
              <span className="text-sm font-medium text-purple-600">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200 hover:scale-105 hover:shadow-md transition-all duration-300 animate-slide-in-up delay-150">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">Personalized</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-lg border border-pink-200 hover:scale-105 hover:shadow-md transition-all duration-300 animate-slide-in-right delay-300">
              <Heart className="w-4 h-4 text-pink-500 animate-bounce" />
              <span className="text-sm font-medium text-pink-600">Wellness-Focused</span>
            </div>
          </div>
        </div>

        {/* Compact Main Content in Two Columns */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Main Form with Animations */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50/30 hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-500 animate-fade-in-up">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md hover:rotate-12 hover:scale-110 transition-all duration-300 ">
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                  Create Your Game
                </CardTitle>
              </CardHeader>
          
              <CardContent className="space-y-6">
                {/* Main Description */}
                <div>
                  <Label htmlFor="description" className="text-base font-semibold flex items-center gap-2 text-gray-700 mb-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    Describe your game idea *
                  </Label>
                  <Textarea
                    id="description"
                    value={gameRequest.description}
                    onChange={(e) => setGameRequest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., 'A matching game for positive affirmations and coping skills'"
                    className="border-2 border-gray-200 focus:border-purple-400 text-base min-h-[100px] resize-none rounded-lg bg-white"
                    rows={4}
                  />
                </div>

                {/* Compact Game Type Selection with Animations */}
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2 text-gray-700 mb-2">
                    <Gamepad2 className="w-4 h-4 text-purple-500 animate-bounce" />
                    Game Type (optional)
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {gameTypes.map((type, index) => (
                      <button
                        key={type.value}
                        onClick={() => setGameRequest(prev => ({ 
                          ...prev, 
                          gameType: prev.gameType === type.value ? undefined : type.value as GameSchema['type']
                        }))}
                        className={`p-3 rounded-lg border-2 text-center transition-all duration-300 hover:scale-110 hover:rotate-1 animate-fade-in-up ${
                          gameRequest.gameType === type.value
                            ? 'border-purple-400 bg-purple-50 shadow-lg scale-105 animate-bounce'
                            : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="text-2xl mb-1 hover:scale-125 transition-transform duration-300">{type.icon}</div>
                        <div className={`text-xs font-medium transition-colors duration-300 ${
                          gameRequest.gameType === type.value ? 'text-purple-700' : 'text-gray-600'
                        }`}>
                          {type.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Settings in Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2 text-gray-700 mb-2">
                      <Target className="w-4 h-4 text-purple-500" />
                      Difficulty
                    </Label>
                    <Select 
                      value={gameRequest.difficulty} 
                      onValueChange={(value: any) => setGameRequest(prev => ({ ...prev, difficulty: value }))}
                    >
                      <SelectTrigger className="h-10 border-2 border-gray-200 focus:border-purple-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">🟢 Easy</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="hard">🔴 Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2 text-gray-700 mb-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      Target Age
                    </Label>
                    <Input
                      value={gameRequest.targetAge}
                      onChange={(e) => setGameRequest(prev => ({ ...prev, targetAge: e.target.value }))}
                      placeholder="e.g., 8-12, Adults"
                      className="h-10 border-2 border-gray-200 focus:border-purple-400"
                    />
                  </div>
                </div>

                {/* Bouncing Animated Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !gameRequest.description.trim()}
                  className="group w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-2xl transition-all duration-500 border-0 relative overflow-hidden animate-bounce hover:animate-pulse"
                >
                  {/* Animated background wave effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  
                  {/* Floating sparkles around button */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '1.5s' }}></div>
                  
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {isGenerating ? (
                      <>
                        <div className="relative">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <div className="absolute inset-0 w-5 h-5 border-2 border-white/30 rounded-full"></div>
                        </div>
                        <span className="animate-pulse">Creating Game...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 group-hover:scale-125 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="group-hover:scale-105 transition-transform duration-300">Generate Game</span>
                        
                      </>
                    )}
                  </div>
                </Button>

                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
                    <div className="font-semibold">Generation Failed</div>
                    <div className="text-sm">{error}</div>
                  </div>
                )}

                {/* Generation Status */}
                {isGenerating && (
                  <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg text-center">
                    <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-purple-500" />
                    <div className="font-semibold text-purple-700">{generationStep}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tips & Info with Animations */}
          <div className="space-y-4">
            {/* Quick Tips with Staggered Animation */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50 hover:shadow-xl hover:scale-105 transition-all duration-500 animate-slide-in-right">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-blue-700 flex items-center gap-2">
                  <span className="text-xl animate-bounce">💡</span>
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <div
                    key={index}
                    className="cursor-pointer p-3 rounded-lg bg-white border border-blue-200 hover:border-blue-300 hover:shadow-md hover:scale-105 transition-all duration-300 text-sm animate-fade-in-up"
                    style={{ animationDelay: `${(index + 1) * 200}ms` }}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Benefits with Bounce Animation */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50 hover:shadow-xl hover:scale-105 transition-all duration-500 animate-slide-in-right delay-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-green-700 flex items-center gap-2">
                  <span className="text-xl animate-spin" style={{ animationDuration: '3s' }}>🎯</span>
                  Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600 hover:scale-105 transition-transform duration-300 animate-slide-in-left">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Personalized to your needs
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 hover:scale-105 transition-transform duration-300 animate-slide-in-left delay-150">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></span>
                  Created in seconds
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 hover:scale-105 transition-transform duration-300 animate-slide-in-left delay-300">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></span>
                  Science-backed wellness focus
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
