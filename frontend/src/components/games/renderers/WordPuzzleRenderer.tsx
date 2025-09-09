import React, { useState, useEffect } from 'react';
import { GameSchema, GameState, GameResults, WordPuzzleContent, WordPuzzleWord } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, RotateCcw, CheckCircle2, X, Lightbulb, Sparkles } from 'lucide-react';

interface WordPuzzleRendererProps {
  gameSchema: GameSchema;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onComplete: (results: GameResults) => void;
}

export const WordPuzzleRenderer: React.FC<WordPuzzleRendererProps> = ({
  gameSchema,
  gameState,
  setGameState,
  onComplete
}) => {
  const { toast } = useToast();
  const content = gameSchema.content as WordPuzzleContent;
  const [grid, setGrid] = useState<string[][]>([]);
  const [gridSize, setGridSize] = useState<number>(12);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [foundWordCells, setFoundWordCells] = useState<Set<string>>(new Set());
  const [placedWordPositions, setPlacedWordPositions] = useState<Array<{
    word: string;
    direction: 'horizontal' | 'vertical';
    startRow: number;
    startCol: number;
    positions: Array<{row: number, col: number, letter: string}>;
  }>>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCell, setStartCell] = useState<{row: number, col: number} | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    try {
      setIsInitializing(true);
      setInitializationError(null);
      
      // Parse grid size properly - handle both number and string formats
      let size: number;
      const gridSizeValue = content.gridSize as any; // Type assertion to handle backend format variations
      
      if (typeof gridSizeValue === 'string') {
        // Handle formats like "12x12" or "12"
        const match = gridSizeValue.match(/(\d+)/);
        size = match ? parseInt(match[1], 10) : 12;
      } else if (typeof gridSizeValue === 'number') {
        size = gridSizeValue;
      } else {
        size = 12; // Default fallback
      }

      // Validate grid size
      if (size < 10 || size > 20) {
        console.warn(`Invalid grid size: ${content.gridSize}. Using default size 12.`);
        size = 12;
      }

      console.log(`Initializing grid with size: ${size}`);
      setGridSize(size);
      
      const newGrid = Array(size).fill(null).map(() => Array(size).fill(''));
      const placedWords: Array<{
        word: string;
        direction: 'horizontal' | 'vertical';
        startRow: number;
        startCol: number;
        positions: Array<{row: number, col: number, letter: string}>;
      }> = [];

      // Validate that we have words to place
      if (!content.words || content.words.length === 0) {
        throw new Error('No words provided for the word puzzle');
      }

      console.log('Words to place:', content.words);
      
      // Robust word placement algorithm
      const canPlaceWord = (word: string, direction: 'horizontal' | 'vertical', startRow: number, startCol: number): boolean => {
      // Check if word fits in grid
      if (direction === 'horizontal') {
        if (startCol + word.length > size) return false;
      } else {
        if (startRow + word.length > size) return false;
      }

      // Check each position for conflicts
      for (let i = 0; i < word.length; i++) {
        const row = direction === 'horizontal' ? startRow : startRow + i;
        const col = direction === 'horizontal' ? startCol + i : startCol;
        const currentLetter = word[i].toUpperCase();
        const gridLetter = newGrid[row][col];

        // If cell is occupied, it must be the same letter for valid overlap
        if (gridLetter !== '' && gridLetter !== currentLetter) {
          return false;
        }
      }

      return true;
    };

    const placeWord = (word: string, direction: 'horizontal' | 'vertical', startRow: number, startCol: number): void => {
      const positions: Array<{row: number, col: number, letter: string}> = [];
      
      for (let i = 0; i < word.length; i++) {
        const row = direction === 'horizontal' ? startRow : startRow + i;
        const col = direction === 'horizontal' ? startCol + i : startCol;
        const letter = word[i].toUpperCase();
        
        newGrid[row][col] = letter;
        positions.push({ row, col, letter });
      }

      placedWords.push({
        word: word.toUpperCase(),
        direction,
        startRow,
        startCol,
        positions
      });
    };

    const tryPlaceWord = (wordObj: WordPuzzleWord): boolean => {
      const word = wordObj.word;
      
      // Use AI-provided coordinates instead of random placement
      const direction = wordObj.direction;
      
      // Convert startRow and startCol to numbers if they come as strings
      const startRow = typeof wordObj.startRow === 'string' ? parseInt(wordObj.startRow, 10) : wordObj.startRow;
      const startCol = typeof wordObj.startCol === 'string' ? parseInt(wordObj.startCol, 10) : wordObj.startCol;
      
      // Validate the AI-provided coordinates
      if (isNaN(startRow) || isNaN(startCol) || startRow < 0 || startRow >= size || startCol < 0 || startCol >= size) {
        console.warn(`Invalid coordinates for word "${word}": (${startRow}, ${startCol})`);
        return false;
      }
      
      // Check if word fits with provided coordinates
      if (direction === 'horizontal' && startCol + word.length > size) {
        console.warn(`Word "${word}" doesn't fit horizontally at (${startRow}, ${startCol})`);
        return false;
      }
      
      if (direction === 'vertical' && startRow + word.length > size) {
        console.warn(`Word "${word}" doesn't fit vertically at (${startRow}, ${startCol})`);
        return false;
      }
      
      // Check for conflicts with existing words
      if (canPlaceWord(word, direction, startRow, startCol)) {
        placeWord(word, direction, startRow, startCol);
        console.log(`Placed word "${word}" at AI coordinates (${startRow}, ${startCol}) ${direction}`);
        return true;
      } else {
        console.warn(`Cannot place word "${word}" at AI coordinates (${startRow}, ${startCol}) due to conflicts`);
        return false;
      }
    };

    // Sort words by length (longer words first for better placement)
    const sortedWords = [...content.words].sort((a, b) => b.word.length - a.word.length);
    
    // Place words with robust algorithm
    const failedWords: string[] = [];
    for (const wordObj of sortedWords) {
      if (!tryPlaceWord(wordObj)) {
        failedWords.push(wordObj.word);
        console.warn(`Failed to place word: ${wordObj.word}`);
      }
    }

    // Store placed word positions for highlighting
    setPlacedWordPositions(placedWords);

    // Fill empty cells with random letters
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (newGrid[row][col] === '') {
          newGrid[row][col] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }

    // Log grid for debugging
    console.log('Generated grid:');
    newGrid.forEach((row, i) => {
      console.log(`Row ${i}:`, row.join(' '));
    });

    setGrid(newGrid);
    setIsInitializing(false);
    } catch (error) {
      console.error('Error initializing grid:', error);
      setInitializationError('Failed to initialize word puzzle. Please try again.');
      setIsInitializing(false);
    }
  };

  const calculateScore = () => {
    const foundCount = foundWords.size;
    const totalWords = placedWordPositions.length;
    return Math.floor((foundCount / totalWords) * gameSchema.scoring.maxScore);
  };

  const handleCellMouseDown = (row: number, col: number) => {
    setIsSelecting(true);
    setStartCell({ row, col });
    setSelectedCells(new Set([`${row}-${col}`]));
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting || !startCell) return;

    const cells = new Set<string>();
    cells.add(`${startCell.row}-${startCell.col}`);

    // Determine direction and add cells in between
    const rowDiff = row - startCell.row;
    const colDiff = col - startCell.col;

    // Allow horizontal, vertical, and diagonal selections
    if (Math.abs(rowDiff) === Math.abs(colDiff) || rowDiff === 0 || colDiff === 0) {
      const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
      
      if (steps > 0) {
        const rowStep = rowDiff / steps;
        const colStep = colDiff / steps;

        for (let i = 0; i <= steps; i++) {
          const currentRow = startCell.row + Math.round(i * rowStep);
          const currentCol = startCell.col + Math.round(i * colStep);
          
          // Ensure we stay within grid bounds
          if (currentRow >= 0 && currentRow < gridSize && 
              currentCol >= 0 && currentCol < gridSize) {
            cells.add(`${currentRow}-${currentCol}`);
          }
        }
      }
    }

    setSelectedCells(cells);
  };

  const handleCellMouseUp = () => {
    if (selectedCells.size > 1) {
      // Convert selected cells to sorted array to build the word correctly
      const cellArray = Array.from(selectedCells).map(cellId => {
        const [row, col] = cellId.split('-').map(Number);
        return { row, col, letter: grid[row][col] };
      });

      // Sort cells based on their position to form the word correctly
      cellArray.sort((a, b) => {
        // Check if it's horizontal (same row)
        if (a.row === b.row) {
          return a.col - b.col; // Sort by column
        }
        // Check if it's vertical (same column)
        if (a.col === b.col) {
          return a.row - b.row; // Sort by row
        }
        // For diagonal, sort by both row and column
        if (a.row !== b.row && a.col !== b.col) {
          return a.row - b.row || a.col - b.col;
        }
        return 0;
      });

      const selectedWord = cellArray.map(cell => cell.letter).join('');
      console.log('Selected word:', selectedWord); // Debug log
      checkWord(selectedWord);
    }

    setIsSelecting(false);
    setStartCell(null);
    setSelectedCells(new Set());
  };

  const checkWord = (word: string) => {
    const reverseWord = word.split('').reverse().join('');
    console.log('Checking word:', word, 'and reverse:', reverseWord); // Debug log
    
    // Find matching word in placed words (which have actual positions)
    const matchedWord = placedWordPositions.find(placedWord => 
      placedWord.word === word.toUpperCase() || placedWord.word === reverseWord.toUpperCase()
    );

    if (matchedWord && !foundWords.has(matchedWord.word)) {
      console.log('Found match for:', matchedWord.word); // Debug log
      
      const newFoundWords = new Set(foundWords);
      newFoundWords.add(matchedWord.word);
      setFoundWords(newFoundWords);
      
      // Add cells of the found word to foundWordCells using actual positions
      const wordCells = new Set(foundWordCells);
      matchedWord.positions.forEach(pos => {
        wordCells.add(`${pos.row}-${pos.col}`);
      });
      setFoundWordCells(wordCells);
      
      const newScore = Math.floor((newFoundWords.size / placedWordPositions.length) * gameSchema.scoring.maxScore);
      setScore(newScore);
      setGameState(prev => ({ ...prev, score: newScore }));

      // Show success toast with word reveal
      const originalWord = content.words.find(w => w.word.toUpperCase() === matchedWord.word);
      toast({
        title: "🎉 Word Found!",
        description: `"${matchedWord.word}" - ${originalWord?.hint || 'Great job!'}`,
        duration: 3000,
      });

      if (newFoundWords.size === placedWordPositions.length) {
        handleComplete();
      }
    } else {
      console.log('No match found for word:', word); // Debug log
    }
  };

  const handleGuessSubmit = () => {
    if (currentGuess.trim()) {
      checkWord(currentGuess.toUpperCase());
      setCurrentGuess('');
    }
  };

  const handleComplete = () => {
    setIsComplete(true);
    
    const results: GameResults = {
      score: calculateScore(),
      maxScore: gameSchema.scoring.maxScore,
      timeSpent: Math.floor((Date.now() - gameState.startTime) / 1000),
      correctAnswers: foundWords.size,
      totalQuestions: placedWordPositions.length,
      accuracy: placedWordPositions.length > 0 ? (foundWords.size / placedWordPositions.length) * 100 : 0
    };
    
    setTimeout(() => onComplete(results), 2000);
  };

  const handleReset = () => {
    setFoundWords(new Set());
    setFoundWordCells(new Set());
    setPlacedWordPositions([]);
    setCurrentGuess('');
    setSelectedCells(new Set());
    setIsSelecting(false);
    setStartCell(null);
    setShowSolution(false);
    setIsComplete(false);
    setScore(0);
    setIsInitializing(false);
    setInitializationError(null);
    setGameState(prev => ({ ...prev, score: 0 }));
    initializeGrid();
  };

  const getCellClassName = (row: number, col: number) => {
    const cellId = `${row}-${col}`;
    let className = 'w-8 h-8 border border-border text-center text-sm font-bold cursor-pointer transition-all ';
    
    // Check if this cell is part of a found word
    const isFoundWordCell = foundWordCells.has(cellId);
    
    if (selectedCells.has(cellId) && isSelecting) {
      className += 'bg-primary text-primary-foreground ';
    } else if (isFoundWordCell) {
      className += 'bg-green-500 text-white border-green-600 ';
    } else if (showSolution) {
      // Check if this cell is part of any placed word
      const isPartOfWord = placedWordPositions.some(wordData => 
        wordData.positions.some(pos => pos.row === row && pos.col === col)
      );
      if (isPartOfWord) {
        className += 'bg-blue-100 text-blue-800 border-blue-300 ';
      } else {
        className += 'bg-background hover:bg-muted ';
      }
    } else {
      className += 'bg-background hover:bg-muted ';
    }
    
    return className;
  };

  // Show loading state
  if (isInitializing) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-2">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h3 className="text-lg font-semibold">Generating Word Puzzle</h3>
              <p className="text-muted-foreground">Creating your personalized word search grid...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (initializationError) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-2 border-red-200">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-800">Game Initialization Failed</h3>
              <p className="text-red-600">{initializationError}</p>
              <Button onClick={() => {
                setInitializationError(null);
                initializeGrid();
              }} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">{gameSchema.title}</CardTitle>
          <p className="text-muted-foreground">Theme: {content.theme}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Score: {score}/{gameSchema.scoring.maxScore}
              </Badge>
              <Badge variant="outline">
                Found: {foundWords.size}/{placedWordPositions.length}
              </Badge>
              <Badge variant="outline">
                Progress: {placedWordPositions.length > 0 ? Math.round((foundWords.size / placedWordPositions.length) * 100) : 0}%
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSolution(!showSolution)}
              >
                {showSolution ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showSolution ? 'Hide' : 'Show'} Solution
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
          <Progress value={placedWordPositions.length > 0 ? (foundWords.size / placedWordPositions.length) * 100 : 0} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Word Grid */}
        <div className="lg:col-span-2">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Word Search Grid</CardTitle>
              <p className="text-sm text-muted-foreground">
                Click and drag to select words, or type them below
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div 
                  className="inline-grid gap-1 p-4 bg-muted rounded-lg"
                  style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                  onMouseLeave={() => {
                    if (isSelecting) {
                      setIsSelecting(false);
                      setStartCell(null);
                      setSelectedCells(new Set());
                    }
                  }}
                >
                  {grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={getCellClassName(rowIndex, colIndex)}
                        onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                        onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                        onMouseUp={handleCellMouseUp}
                      >
                        {cell}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Manual Input */}
              <div className="mt-6 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a word you found..."
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGuessSubmit()}
                    disabled={isComplete}
                  />
                  <Button onClick={handleGuessSubmit} disabled={!currentGuess.trim() || isComplete}>
                    Check Word
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Word Hints List */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Word Hints</CardTitle>
            <p className="text-sm text-muted-foreground">
              Find words using these clues. Words will be revealed when found!
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {placedWordPositions.map((wordData, index) => {
              const isFound = foundWords.has(wordData.word);
              // Find original word data for hint
              const originalWord = content.words.find(w => w.word.toUpperCase() === wordData.word);
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                    isFound 
                      ? 'border-green-500 bg-green-50 shadow-md transform scale-105' 
                      : 'border-border bg-background hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isFound ? (
                        // Show the word when found with celebration effect
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-green-600 animate-pulse" />
                          <span className="font-bold text-green-700 text-lg">
                            {wordData.word}
                          </span>
                        </div>
                      ) : (
                        // Show placeholder when not found
                        <span className="font-medium text-muted-foreground font-mono">
                          {wordData.word.split('').map((_, i) => '?').join(' ')}
                        </span>
                      )}
                      {isFound && <CheckCircle2 className="w-5 h-5 text-green-600 animate-bounce" />}
                    </div>
                    <div className="flex items-center gap-2">
                      {isFound && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                          {wordData.word.length} letters
                        </Badge>
                      )}
                    </div>
                  </div>
                  {originalWord && (
                    <div className={`mt-3 p-3 rounded-lg border-l-4 transition-all ${
                      isFound 
                        ? 'bg-green-100 border-green-400' 
                        : 'bg-blue-50 border-blue-300'
                    }`}>
                      <p className={`text-sm flex items-center gap-2 ${
                        isFound ? 'text-green-800' : 'text-blue-800'
                      }`}>
                        <Lightbulb className="w-4 h-4" />
                        <strong>Hint:</strong> {originalWord.hint}
                      </p>
                      {!isFound && (
                        <p className="text-xs text-blue-600 mt-2">
                          <span>{wordData.word.length} letters</span>
                        </p>
                      )}
                      {isFound && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Found! Well done!</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {placedWordPositions.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                <p>Generating word puzzle...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completion */}
      {!isComplete && foundWords.size > 0 && (
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <Button 
              onClick={handleComplete}
              className="w-full"
              disabled={foundWords.size === 0}
            >
              Complete Puzzle ({foundWords.size}/{placedWordPositions.length} found)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isComplete && (
        <Card className={`border-2 ${foundWords.size === placedWordPositions.length ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">
              {foundWords.size === placedWordPositions.length ? '✓' : '○'}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${foundWords.size === placedWordPositions.length ? 'text-green-800' : 'text-orange-800'}`}>
              {foundWords.size === placedWordPositions.length ? 'Perfect Puzzle!' : 'Good Effort!'}
            </h3>
            <p className={`mb-4 ${foundWords.size === placedWordPositions.length ? 'text-green-700' : 'text-orange-700'}`}>
              You found {foundWords.size} out of {placedWordPositions.length} words.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Score</div>
                <div className="text-2xl text-primary">{score}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Found</div>
                <div className="text-2xl">{foundWords.size}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Accuracy</div>
                <div className="text-2xl">{placedWordPositions.length > 0 ? Math.round((foundWords.size / placedWordPositions.length) * 100) : 0}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};