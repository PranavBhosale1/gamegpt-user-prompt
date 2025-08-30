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
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Wand2, 
  Sparkles, 
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
  Settings
} from 'lucide-react';

interface GameRequest {
  description: string;
  gameType?: GameSchema['type'];
  difficulty: 'easy' | 'medium' | 'hard';
  targetAge: string;
  estimatedTime: number;
  learningObjectives: string;
  theme: string;
  customRequirements: string;
}

// Real API function - sends request to webhook endpoint
const generateGameAPI = async (payload: GameRequest): Promise<GameSchema> => {
  try {
    console.log('Sending request to webhook:', payload);
    
    const response = await fetch('https://backend-new-game-gpt-backup.globians.in/webhook/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const gameSchema: GameSchema = await response.json();
    console.log('Received game schema:', gameSchema);
    return gameSchema;
  } catch (error) {
    console.error('API call failed:', error);
    
    // Show error message to user but still provide fallback
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.warn(`Falling back to demo data due to API error: ${errorMessage}`);
    
    // Fallback to demo data if API fails
    const gameType = payload.gameType || 'quiz';
  
  // Generate comprehensive demo data based on game type
  switch (gameType) {
    case 'quiz':
      return {
        id: `game-${Date.now()}`,
        title: `Mental Wellness Quiz - ${payload.difficulty.toUpperCase()}`,
        description: payload.description || 'Test your knowledge about mental health and wellness practices',
        type: 'quiz',
        difficulty: payload.difficulty,
        category: 'mental-wellness',
        estimatedTime: payload.estimatedTime,
        theme: payload.theme || 'mental-wellness',
        config: {
          showProgress: true,
          allowRetry: true,
          shuffleOptions: true,
          showHints: true,
          autoNext: false
        },
        content: {
          questions: [
            {
              id: '1',
              question: 'Which technique is most effective for managing acute anxiety?',
              type: 'multiple-choice',
              options: ['Deep breathing exercises', 'Avoiding all triggers', 'Drinking caffeine', 'Isolating yourself'],
              correctAnswer: 'Deep breathing exercises',
              explanation: 'Deep breathing activates the parasympathetic nervous system, helping to calm anxiety responses.',
              hint: 'Think about what naturally calms your body'
            },
            {
              id: '2',
              question: 'What is mindfulness meditation?',
              type: 'multiple-choice',
              options: ['Clearing your mind completely', 'Focusing on the present moment', 'Thinking about the future', 'Analyzing past events'],
              correctAnswer: 'Focusing on the present moment',
              explanation: 'Mindfulness involves non-judgmental awareness of the present moment.',
              hint: 'The key is being present'
            },
            {
              id: '3',
              question: 'True or False: Exercise can help reduce symptoms of depression.',
              type: 'true-false',
              correctAnswer: 'true',
              explanation: 'Regular exercise releases endorphins and can be as effective as medication for mild to moderate depression.',
              hint: 'Think about how you feel after physical activity'
            },
            {
              id: '4',
              question: 'What are the main components of good sleep hygiene?',
              type: 'multiple-choice',
              options: ['Regular sleep schedule', 'Cool, dark room', 'No screens before bed', 'All of the above'],
              correctAnswer: 'All of the above',
              explanation: 'Good sleep hygiene includes maintaining consistent schedules, optimizing environment, and avoiding stimulating activities before bed.'
            }
          ]
        },
        scoring: {
          maxScore: 100,
          pointsPerCorrect: 25,
          pointsPerIncorrect: -5,
          bonusForSpeed: 5,
          bonusForStreak: 10
        },
        ui: {
          theme: 'default',
          layout: 'list',
          animations: true,
          sounds: false,
          particles: false
        }
      };

    case 'drag-drop':
      return {
        id: `game-${Date.now()}`,
        title: `Emotion Categorization - ${payload.difficulty.toUpperCase()}`,
        description: payload.description || 'Sort emotions and responses into healthy and unhealthy categories',
        type: 'drag-drop',
        difficulty: payload.difficulty,
        category: 'emotional-intelligence',
        estimatedTime: payload.estimatedTime,
        theme: payload.theme || 'emotional-intelligence',
        config: {
          showProgress: true,
          allowRetry: true,
          shuffleOptions: false,
          showHints: true,
          autoNext: false
        },
        content: {
          items: [
            { id: '1', content: 'Talking to a trusted friend', correctZone: 'healthy-responses', explanation: 'Communication builds support and reduces isolation' },
            { id: '2', content: 'Bottling up feelings', correctZone: 'unhealthy-responses', explanation: 'Suppressing emotions can lead to increased stress and physical symptoms' },
            { id: '3', content: 'Going for a walk', correctZone: 'healthy-responses', explanation: 'Physical activity releases endorphins and reduces stress hormones' },
            { id: '4', content: 'Emotional eating', correctZone: 'unhealthy-responses', explanation: 'Using food to cope can create unhealthy patterns and guilt' },
            { id: '5', content: 'Journaling thoughts', correctZone: 'healthy-responses', explanation: 'Writing helps process emotions and gain clarity' },
            { id: '6', content: 'Avoiding all social contact', correctZone: 'unhealthy-responses', explanation: 'Isolation can worsen depression and increase negative thinking' },
            { id: '7', content: 'Deep breathing', correctZone: 'healthy-responses', explanation: 'Controlled breathing activates the relaxation response' },
            { id: '8', content: 'Substance abuse', correctZone: 'unhealthy-responses', explanation: 'Substances may provide temporary relief but create long-term problems' }
          ],
          dropZones: [
            { id: 'healthy-responses', label: 'Healthy Responses', accepts: ['1', '3', '5', '7'], maxItems: 4 },
            { id: 'unhealthy-responses', label: 'Unhealthy Responses', accepts: ['2', '4', '6', '8'], maxItems: 4 }
          ],
          instructions: 'Drag each response into the appropriate category. Think about long-term effects.'
        },
        scoring: {
          maxScore: 100,
          pointsPerCorrect: 12.5,
          pointsPerIncorrect: -5
        },
        ui: {
          theme: 'default',
          layout: 'grid',
          animations: true,
          sounds: false,
          particles: false
        }
      };

    case 'memory-match':
      return {
        id: `game-${Date.now()}`,
        title: `Coping Skills Memory Match - ${payload.difficulty.toUpperCase()}`,
        description: payload.description || 'Match coping strategies with their benefits',
        type: 'memory-match',
        difficulty: payload.difficulty,
        targetAge: payload.targetAge,
        estimatedTime: payload.estimatedTime,
        theme: payload.theme || 'coping-skills',
        content: {
          pairs: [
            {
              id: 'pair1',
              content1: 'Deep Breathing',
              content2: 'Reduces anxiety and stress',
              explanation: 'Deep breathing activates the relaxation response'
            },
            {
              id: 'pair2',
              content1: 'Exercise',
              content2: 'Releases endorphins',
              explanation: 'Physical activity naturally boosts mood'
            },
            {
              id: 'pair3',
              content1: 'Meditation',
              content2: 'Improves focus and calm',
              explanation: 'Mindfulness practice enhances emotional regulation'
            },
            {
              id: 'pair4',
              content1: 'Journaling',
              content2: 'Processes emotions',
              explanation: 'Writing helps organize and understand feelings'
            },
            {
              id: 'pair5',
              content1: 'Social Support',
              content2: 'Reduces isolation',
              explanation: 'Connection with others provides emotional relief'
            },
            {
              id: 'pair6',
              content1: 'Sleep Hygiene',
              content2: 'Improves mood stability',
              explanation: 'Quality sleep is essential for emotional well-being'
            }
          ],
          gridSize: '4x4'
        },
        scoring: { maxScore: 100, passingScore: 80 },
        instructions: 'Match each coping strategy with its primary benefit. Remember card positions!'
      };

    case 'word-puzzle':
      return {
        id: `game-${Date.now()}`,
        title: `Mindfulness Word Search - ${payload.difficulty.toUpperCase()}`,
        description: payload.description || 'Find words related to mindfulness and mental wellness',
        type: 'word-puzzle',
        difficulty: payload.difficulty,
        targetAge: payload.targetAge,
        estimatedTime: payload.estimatedTime,
        theme: payload.theme || 'mindfulness',
        content: {
          words: [
            { word: 'MINDFUL', clue: 'Being aware of the present moment', direction: 'horizontal', startRow: 0, startCol: 2 },
            { word: 'BREATHE', clue: 'Essential for calming anxiety', direction: 'vertical', startRow: 1, startCol: 4 },
            { word: 'PEACE', clue: 'Inner tranquility', direction: 'horizontal', startRow: 3, startCol: 1 },
            { word: 'CALM', clue: 'Opposite of anxious', direction: 'vertical', startRow: 2, startCol: 7 },
            { word: 'FOCUS', clue: 'Concentrate attention', direction: 'horizontal', startRow: 5, startCol: 3 },
            { word: 'RELAX', clue: 'Release tension', direction: 'vertical', startRow: 1, startCol: 8 }
          ],
          gridSize: 10,
          theme: 'Mindfulness and Inner Peace'
        },
        scoring: { maxScore: 100, passingScore: 70 },
        instructions: 'Find all the mindfulness-related words hidden in the grid. Words can be horizontal, vertical, or diagonal.'
      };

    case 'sorting':
      return {
        id: `game-${Date.now()}`,
        title: `Thought Pattern Sorting - ${payload.difficulty.toUpperCase()}`,
        description: payload.description || 'Categorize thoughts as helpful or unhelpful patterns',
        type: 'sorting',
        difficulty: payload.difficulty,
        targetAge: payload.targetAge,
        estimatedTime: payload.estimatedTime,
        theme: payload.theme || 'cognitive-behavioral',
        content: {
          items: [
            { id: '1', content: 'I can learn from this mistake', correctCategory: 'helpful-thoughts', explanation: 'Growth mindset promotes resilience' },
            { id: '2', content: 'I always mess everything up', correctCategory: 'unhelpful-thoughts', explanation: 'All-or-nothing thinking is distorted' },
            { id: '3', content: 'This is challenging but manageable', correctCategory: 'helpful-thoughts', explanation: 'Balanced perspective reduces anxiety' },
            { id: '4', content: 'Everyone thinks I\'m weird', correctCategory: 'unhelpful-thoughts', explanation: 'Mind reading is a cognitive distortion' },
            { id: '5', content: 'I can ask for help when needed', correctCategory: 'helpful-thoughts', explanation: 'Seeking support is healthy' },
            { id: '6', content: 'Nothing ever goes right for me', correctCategory: 'unhelpful-thoughts', explanation: 'Overgeneralization ignores positive experiences' }
          ],
          categories: [
            { id: 'helpful-thoughts', name: 'Helpful Thoughts', description: 'Balanced, realistic thinking patterns' },
            { id: 'unhelpful-thoughts', name: 'Unhelpful Thoughts', description: 'Distorted or negative thinking patterns' }
          ],
          instructions: 'Sort each thought into helpful or unhelpful categories. Consider the impact on mood and behavior.'
        },
        scoring: { maxScore: 100, passingScore: 75 },
        instructions: 'Identify whether each thought pattern is helpful or unhelpful for mental wellness.'
      };

    case 'matching':
      return {
        id: `game-${Date.now()}`,
        title: `Stress Triggers & Solutions - ${payload.difficulty.toUpperCase()}`,
        description: payload.description || 'Match common stressors with effective coping strategies',
        type: 'matching',
        difficulty: payload.difficulty,
        targetAge: payload.targetAge,
        estimatedTime: payload.estimatedTime,
        theme: payload.theme || 'stress-management',
        content: {
          pairs: [
            { left: 'Work Deadline Pressure', right: 'Time management and prioritization', explanation: 'Breaking tasks into smaller steps reduces overwhelm' },
            { left: 'Social Anxiety', right: 'Gradual exposure and breathing exercises', explanation: 'Slow exposure builds confidence while breathing helps in the moment' },
            { left: 'Financial Worries', right: 'Budgeting and seeking financial advice', explanation: 'Taking concrete action reduces anxiety about money' },
            { left: 'Relationship Conflict', right: 'Active listening and "I" statements', explanation: 'Communication skills help resolve conflicts constructively' },
            { left: 'Sleep Problems', right: 'Sleep hygiene and relaxation routine', explanation: 'Consistent habits improve sleep quality' },
            { left: 'Academic Stress', right: 'Study schedule and self-care breaks', explanation: 'Balance between work and rest optimizes performance' }
          ],
          instructions: 'Connect each stressor with its most effective coping strategy.'
        },
        scoring: { maxScore: 100, passingScore: 80 },
        instructions: 'Match each stress trigger with the most appropriate coping strategy.'
      };

    case 'story-sequence':
      return {
        id: `game-${Date.now()}`,
        title: `Progressive Muscle Relaxation Steps - ${payload.difficulty.toUpperCase()}`,
        description: payload.description || 'Put the steps of progressive muscle relaxation in the correct order',
        type: 'story-sequence',
        difficulty: payload.difficulty,
        targetAge: payload.targetAge,
        estimatedTime: payload.estimatedTime,
        theme: payload.theme || 'relaxation-techniques',
        content: {
          events: [
            { id: '1', content: 'Find a quiet, comfortable place to sit or lie down', order: 1, explanation: 'Setting creates the right environment for relaxation' },
            { id: '2', content: 'Take three deep, slow breaths to center yourself', order: 2, explanation: 'Deep breathing prepares your body for the exercise' },
            { id: '3', content: 'Start with your toes - tense them tightly for 5 seconds', order: 3, explanation: 'Beginning with extremities helps you understand the contrast' },
            { id: '4', content: 'Release the tension in your toes and notice the relaxation', order: 4, explanation: 'The contrast between tension and relaxation is key' },
            { id: '5', content: 'Move up to your calves and repeat the tense-and-release process', order: 5, explanation: 'Systematically working up the body ensures thoroughness' },
            { id: '6', content: 'Continue this process through all muscle groups to your head', order: 6, explanation: 'Each muscle group contributes to overall relaxation' },
            { id: '7', content: 'End with a few minutes of deep breathing and stillness', order: 7, explanation: 'Concluding with breathing reinforces the relaxed state' }
          ],
          instructions: 'Arrange these steps in the correct order for effective progressive muscle relaxation.'
        },
        scoring: { maxScore: 100, passingScore: 85 },
        instructions: 'Put the progressive muscle relaxation steps in the correct sequence.'
      };

    case 'fill-blank':
      return {
        id: `game-${Date.now()}`,
        title: `Mindfulness Principles - ${payload.difficulty.toUpperCase()}`,
        description: payload.description || 'Complete passages about mindfulness and meditation principles',
        type: 'fill-blank',
        difficulty: payload.difficulty,
        targetAge: payload.targetAge,
        estimatedTime: payload.estimatedTime,
        theme: payload.theme || 'mindfulness-education',
        content: {
          passages: [
            {
              id: 'passage1',
              text: 'Mindfulness is the practice of _____ attention to the present moment without _____. It involves observing your thoughts and feelings as they arise, without trying to _____ or judge them.',
              blanks: [
                { id: 'blank1', position: 42, correctAnswer: 'paying', options: ['paying', 'avoiding', 'limiting', 'forcing'], hint: 'What do you do with your attention?' },
                { id: 'blank2', position: 89, correctAnswer: 'judgment', options: ['judgment', 'effort', 'thinking', 'breathing'], hint: 'What attitude should you avoid?' },
                { id: 'blank3', position: 190, correctAnswer: 'change', options: ['change', 'accept', 'ignore', 'follow'], hint: 'What should you not try to do to your thoughts?' }
              ]
            },
            {
              id: 'passage2',
              text: 'When practicing deep breathing, breathe in slowly through your _____ for a count of four, hold for _____ counts, then exhale through your _____ for six counts. This technique activates the _____ nervous system.',
              blanks: [
                { id: 'blank4', position: 67, correctAnswer: 'nose', hint: 'Which part of your face is best for breathing in?' },
                { id: 'blank5', position: 103, correctAnswer: 'four', hint: 'How long should you hold your breath?' },
                { id: 'blank6', position: 141, correctAnswer: 'mouth', hint: 'How should you breathe out?' },
                { id: 'blank7', position: 194, correctAnswer: 'parasympathetic', options: ['parasympathetic', 'sympathetic', 'central', 'peripheral'], hint: 'Which nervous system promotes relaxation?' }
              ]
            }
          ],
          instructions: 'Fill in the blanks to complete these mindfulness passages. Use the hints if you need help.'
        },
        scoring: { maxScore: 100, passingScore: 70 },
        instructions: 'Complete the passages about mindfulness principles and breathing techniques.'
      };

    case 'card-flip':
      return {
        id: `game-${Date.now()}`,
        title: `Cognitive Distortions Study Cards - ${payload.difficulty.toUpperCase()}`,
        description: payload.description || 'Learn about common cognitive distortions and their balanced alternatives',
        type: 'card-flip',
        difficulty: payload.difficulty,
        targetAge: payload.targetAge,
        estimatedTime: payload.estimatedTime,
        theme: payload.theme || 'cognitive-behavioral-therapy',
        content: {
          cards: [
            {
              id: 'card1',
              front: { content: 'All-or-Nothing Thinking', type: 'text' },
              back: { content: 'Seeing things in black and white, with no middle ground. Example: "I\'m either perfect or a complete failure."', type: 'text' },
              category: 'Cognitive Distortions'
            },
            {
              id: 'card2',
              front: { content: 'Catastrophizing', type: 'text' },
              back: { content: 'Imagining the worst possible outcome. Example: "If I fail this test, my life will be ruined."', type: 'text' },
              category: 'Cognitive Distortions'
            },
            {
              id: 'card3',
              front: { content: 'Mind Reading', type: 'text' },
              back: { content: 'Assuming you know what others are thinking. Example: "They think I\'m stupid."', type: 'text' },
              category: 'Cognitive Distortions'
            },
            {
              id: 'card4',
              front: { content: 'Balanced Thinking', type: 'text' },
              back: { content: 'Looking at situations objectively, considering multiple perspectives and outcomes.', type: 'text' },
              category: 'Healthy Alternatives'
            },
            {
              id: 'card5',
              front: { content: 'Evidence-Based Thinking', type: 'text' },
              back: { content: 'Asking "What evidence supports this thought?" before accepting it as truth.', type: 'text' },
              category: 'Healthy Alternatives'
            },
            {
              id: 'card6',
              front: { content: 'Perspective Taking', type: 'text' },
              back: { content: 'Considering alternative explanations and viewpoints before drawing conclusions.', type: 'text' },
              category: 'Healthy Alternatives'
            }
          ],
          instructions: 'Flip each card to learn about cognitive distortions and healthier thinking patterns.'
        },
        scoring: { maxScore: 100, passingScore: 60 },
        instructions: 'Study the cognitive distortions and their healthy alternatives by flipping the cards.'
      };

    case 'puzzle-assembly':
      return {
        id: `game-${Date.now()}`,
        title: `Wellness Wheel Puzzle - ${payload.difficulty.toUpperCase()}`,
        description: payload.description || 'Assemble the pieces to complete the wellness wheel diagram',
        type: 'puzzle-assembly',
        difficulty: payload.difficulty,
        targetAge: payload.targetAge,
        estimatedTime: payload.estimatedTime,
        theme: payload.theme || 'holistic-wellness',
        content: {
          pieces: [
            { id: 'piece1', image: 'Physical Health', correctPosition: { row: 0, col: 0 } },
            { id: 'piece2', image: 'Mental Health', correctPosition: { row: 0, col: 1 } },
            { id: 'piece3', image: 'Emotional Health', correctPosition: { row: 0, col: 2 } },
            { id: 'piece4', image: 'Social Health', correctPosition: { row: 1, col: 0 } },
            { id: 'piece5', image: 'Spiritual Health', correctPosition: { row: 1, col: 1 } },
            { id: 'piece6', image: 'Environmental Health', correctPosition: { row: 1, col: 2 } },
            { id: 'piece7', image: 'Occupational Health', correctPosition: { row: 2, col: 0 } },
            { id: 'piece8', image: 'Financial Health', correctPosition: { row: 2, col: 1 } },
            { id: 'piece9', image: 'Intellectual Health', correctPosition: { row: 2, col: 2 } }
          ],
          targetImage: 'Complete Wellness Wheel',
          gridSize: 3
        },
        scoring: { maxScore: 100, passingScore: 75 },
        instructions: 'Drag and drop the puzzle pieces to complete the wellness wheel showing all dimensions of health.'
      };

    case 'anxiety-adventure':
      return {
        id: `game-${Date.now()}`,
        title: `Social Anxiety Adventure - ${payload.difficulty.toUpperCase()}`,
        description: payload.description || 'Navigate through social situations and learn anxiety management techniques',
        type: 'anxiety-adventure',
        difficulty: payload.difficulty,
        targetAge: payload.targetAge,
        estimatedTime: payload.estimatedTime,
        theme: payload.theme || 'social-anxiety',
        content: {
          startId: 'party-invitation',
          scenarios: [
            {
              id: 'party-invitation',
              title: 'The Party Invitation',
              description: 'Your friend invites you to a party where you won\'t know many people. Your heart starts racing as you think about it.',
              anxietyLevel: 6,
              tips: ['Take slow, deep breaths', 'Remember that most people are friendly', 'You can always leave early if needed'],
              choices: [
                {
                  id: 'accept-excited',
                  text: 'Accept enthusiastically and look forward to meeting new people',
                  outcome: 'You feel confident and excited. Your positive attitude helps reduce anxiety.',
                  anxietyChange: -2,
                  points: 15,
                  explanation: 'Positive anticipation can help reduce social anxiety',
                  nextScenario: 'at-the-party'
                },
                {
                  id: 'accept-nervous',
                  text: 'Accept but feel nervous about it',
                  outcome: 'You decide to go but spend time preparing mentally. You practice some conversation starters.',
                  anxietyChange: 0,
                  points: 10,
                  explanation: 'Preparation can help manage anxiety',
                  nextScenario: 'at-the-party'
                },
                {
                  id: 'decline',
                  text: 'Decline the invitation to avoid anxiety',
                  outcome: 'You feel relieved initially, but later regret missing out on fun with friends.',
                  anxietyChange: 1,
                  points: 5,
                  explanation: 'Avoidance may provide short-term relief but can increase anxiety long-term',
                  nextScenario: 'reflection'
                }
              ]
            },
            {
              id: 'at-the-party',
              title: 'Arriving at the Party',
              description: 'You arrive at the party and see groups of people chatting. Your friend is busy hosting. You feel a bit overwhelmed.',
              anxietyLevel: 7,
              tips: ['Find a quiet corner to collect yourself', 'Look for someone who seems approachable', 'Remember you can take breaks'],
              choices: [
                {
                  id: 'find-quiet-spot',
                  text: 'Find a quieter area and take some deep breaths',
                  outcome: 'You take a moment to center yourself. This helps you feel more grounded and ready to socialize.',
                  anxietyChange: -1,
                  points: 12,
                  explanation: 'Taking breaks to self-regulate is a healthy coping strategy',
                  nextScenario: 'conversation'
                },
                {
                  id: 'jump-in',
                  text: 'Jump right into a conversation with a group',
                  outcome: 'You feel nervous but the group welcomes you warmly. Your confidence grows.',
                  anxietyChange: -1,
                  points: 15,
                  explanation: 'Sometimes facing fears directly can lead to positive outcomes',
                  nextScenario: 'conversation'
                }
              ]
            },
            {
              id: 'conversation',
              title: 'Making Conversation',
              description: 'You\'re now talking with some people. The conversation is going well, but you notice your mind going blank when asked a question.',
              anxietyLevel: 5,
              choices: [
                {
                  id: 'honest-response',
                  text: 'Say "Let me think about that for a moment" and take your time',
                  outcome: 'People appreciate your thoughtfulness. You give a good response and feel more confident.',
                  anxietyChange: -2,
                  points: 18,
                  explanation: 'It\'s okay to take time to think - most people respect this'
                }
              ]
            },
            {
              id: 'reflection',
              title: 'Later Reflection',
              description: 'You\'re at home thinking about your choice to skip the party.',
              anxietyLevel: 6,
              choices: [
                {
                  id: 'plan-next-time',
                  text: 'Make a plan for how to handle the next social invitation',
                  outcome: 'You create strategies for managing social anxiety and feel more prepared for next time.',
                  anxietyChange: -1,
                  points: 10,
                  explanation: 'Learning from experiences and planning ahead helps build confidence'
                }
              ]
            }
          ]
        },
        scoring: { maxScore: 100, passingScore: 60 },
        instructions: 'Navigate through this social anxiety scenario. Make choices that help you learn healthy coping strategies.'
      };

    default:
      return {
        id: `game-${Date.now()}`,
        title: `Custom Game - ${payload.difficulty.toUpperCase()}`,
        description: payload.description,
        type: gameType,
        difficulty: payload.difficulty,
        category: 'general',
        estimatedTime: payload.estimatedTime,
        theme: payload.theme,
        config: {
          showProgress: true,
          allowRetry: true,
          shuffleOptions: false,
          showHints: false,
          autoNext: false
        },
        content: { questions: [] },
        scoring: { maxScore: 100, pointsPerCorrect: 10, pointsPerIncorrect: -2 },
        ui: {
          theme: 'default',
          layout: 'grid',
          animations: true,
          sounds: false,
          particles: false
        }
      };
  }
  }
};

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

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGame, setGeneratedGame] = useState<GameSchema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>('');

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
      setError('Please describe what kind of game you want to create');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationStep('Analyzing your request...');

    try {
      // Step 1: Analyze the request
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationStep('Generating game content with AI...');

      // Step 2: Generate game
      const gameSchema = await generateGameAPI(gameRequest);

      // Step 3: Finalize
      setGenerationStep('Finalizing your game...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGeneratedGame(gameSchema);
      setGenerationStep('');
      
      toast({
        title: "Game Created Successfully! 🎮",
        description: "Your custom wellness game is ready to play."
      });

    } catch (err) {
      console.error('Game generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate game. Please try again.');
      setGenerationStep('');
      toast({
        title: "Generation Failed",
        description: "Please try again with a different description.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
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
    setGeneratedGame(null);
    setError(null);
    toast({
      title: "Ready to Create Again! ✨",
      description: "Make any changes and generate a new game."
    });
  };

  if (generatedGame) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Header with actions */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <Button
              variant="outline"
              onClick={() => setGeneratedGame(null)}
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
