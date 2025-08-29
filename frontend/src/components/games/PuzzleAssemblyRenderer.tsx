import React, { useState, useRef } from 'react';
import { GameSchema, GameState, GameResults, PuzzleAssemblyContent, PuzzlePiece } from '@/types/game-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, CheckCircle2, Grid3X3, Shuffle, Eye, EyeOff } from 'lucide-react';

interface PuzzleAssemblyRendererProps {
  gameSchema: GameSchema;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onComplete: (results: GameResults) => void;
}

export const PuzzleAssemblyRenderer: React.FC<PuzzleAssemblyRendererProps> = ({
  gameSchema,
  gameState,
  setGameState,
  onComplete
}) => {
  const content = gameSchema.content as PuzzleAssemblyContent;
  const [puzzleGrid, setPuzzleGrid] = useState<(PuzzlePiece | null)[][]>(
    Array(content.gridSize).fill(null).map(() => Array(content.gridSize).fill(null))
  );
  const [availablePieces, setAvailablePieces] = useState<PuzzlePiece[]>([...content.pieces].sort(() => Math.random() - 0.5));
  const [draggedPiece, setDraggedPiece] = useState<PuzzlePiece | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const dragOverCell = useRef<{row: number, col: number} | null>(null);

  const calculateScore = () => {
    let correctCount = 0;
    puzzleGrid.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        if (piece && piece.correctPosition.row === rowIndex && piece.correctPosition.col === colIndex) {
          correctCount++;
        }
      });
    });
    return Math.floor((correctCount / content.pieces.length) * gameSchema.scoring.maxScore);
  };

  const getCorrectlyPlaced = () => {
    let correctCount = 0;
    puzzleGrid.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        if (piece && piece.correctPosition.row === rowIndex && piece.correctPosition.col === colIndex) {
          correctCount++;
        }
      });
    });
    return correctCount;
  };

  const getPlacedPieces = () => {
    let placedCount = 0;
    puzzleGrid.forEach(row => {
      row.forEach(piece => {
        if (piece) placedCount++;
      });
    });
    return placedCount;
  };

  const handleDragStart = (piece: PuzzlePiece) => {
    setDraggedPiece(piece);
  };

  const handleDragOver = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    dragOverCell.current = { row, col };
  };

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    
    if (!draggedPiece) return;

    const newGrid = [...puzzleGrid];
    const newAvailablePieces = [...availablePieces];

    // If there's already a piece in this cell, move it back to available pieces
    if (newGrid[row][col]) {
      newAvailablePieces.push(newGrid[row][col]!);
    }

    // Place the dragged piece
    newGrid[row][col] = draggedPiece;
    
    // Remove from available pieces
    const pieceIndex = newAvailablePieces.findIndex(p => p.id === draggedPiece.id);
    if (pieceIndex !== -1) {
      newAvailablePieces.splice(pieceIndex, 1);
    }

    setPuzzleGrid(newGrid);
    setAvailablePieces(newAvailablePieces);
    setDraggedPiece(null);
    dragOverCell.current = null;

    // Update score
    const newScore = calculateScore();
    setScore(newScore);
    setGameState(prev => ({ ...prev, score: newScore }));
  };

  const handleCellClick = (row: number, col: number) => {
    if (puzzleGrid[row][col]) {
      // Remove piece from grid and return to available pieces
      const piece = puzzleGrid[row][col]!;
      const newGrid = [...puzzleGrid];
      newGrid[row][col] = null;
      setPuzzleGrid(newGrid);
      setAvailablePieces(prev => [...prev, piece]);

      const newScore = calculateScore();
      setScore(newScore);
      setGameState(prev => ({ ...prev, score: newScore }));
    }
  };

  const handleComplete = () => {
    setIsComplete(true);
    setShowResults(true);
    
    const correctCount = getCorrectlyPlaced();
    const results: GameResults = {
      score: calculateScore(),
      maxScore: gameSchema.scoring.maxScore,
      timeSpent: Math.floor((Date.now() - gameState.startTime) / 1000),
      correctAnswers: correctCount,
      totalQuestions: content.pieces.length,
      accuracy: (correctCount / content.pieces.length) * 100
    };
    
    setTimeout(() => onComplete(results), 3000);
  };

  const handleReset = () => {
    setPuzzleGrid(Array(content.gridSize).fill(null).map(() => Array(content.gridSize).fill(null)));
    setAvailablePieces([...content.pieces].sort(() => Math.random() - 0.5));
    setIsComplete(false);
    setScore(0);
    setShowPreview(false);
    setShowResults(false);
    setGameState(prev => ({ ...prev, score: 0 }));
  };

  const shufflePieces = () => {
    setAvailablePieces(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const isPieceCorrect = (piece: PuzzlePiece | null, row: number, col: number) => {
    return piece && piece.correctPosition.row === row && piece.correctPosition.col === col;
  };

  const isPuzzleComplete = () => {
    return availablePieces.length === 0 && getPlacedPieces() === content.pieces.length;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">🧩 {gameSchema.title}</CardTitle>
          <p className="text-muted-foreground">Drag and drop pieces to assemble the puzzle</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Score: {score}/{gameSchema.scoring.maxScore}
              </Badge>
              <Badge variant="outline">
                Placed: {getPlacedPieces()}/{content.pieces.length}
              </Badge>
              <Badge variant="outline">
                Correct: {getCorrectlyPlaced()}/{content.pieces.length}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={shufflePieces}
                disabled={isComplete}
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Shuffle
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
          <Progress value={(getPlacedPieces() / content.pieces.length) * 100} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Puzzle Grid */}
        <div className="lg:col-span-2">
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Grid3X3 className="w-5 h-5" />
                Puzzle Grid ({content.gridSize}x{content.gridSize})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="inline-grid gap-2 p-4 bg-muted rounded-lg mx-auto"
                style={{ gridTemplateColumns: `repeat(${content.gridSize}, minmax(0, 1fr))` }}
              >
                {puzzleGrid.map((row, rowIndex) =>
                  row.map((piece, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        piece 
                          ? showResults
                            ? isPieceCorrect(piece, rowIndex, colIndex)
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onDragOver={(e) => handleDragOver(e, rowIndex, colIndex)}
                      onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {piece ? (
                        <div className="w-full h-full bg-primary/20 rounded flex items-center justify-center relative">
                          <span className="text-xs font-bold">#{piece.id}</span>
                          {showResults && (
                            <div className="absolute -top-1 -right-1">
                              {isPieceCorrect(piece, rowIndex, colIndex) ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <div className="w-4 h-4 bg-red-500 rounded-full" />
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {rowIndex + 1},{colIndex + 1}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Target Preview */}
              {showPreview && (
                <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Target Image Preview:
                  </h4>
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-sm text-blue-800 font-medium">🖼️ {content.targetImage}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Available Pieces */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Available Pieces</CardTitle>
            <p className="text-sm text-muted-foreground">
              Drag pieces to the grid
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {availablePieces.map((piece) => (
                <div
                  key={piece.id}
                  draggable
                  onDragStart={() => handleDragStart(piece)}
                  className="w-full h-20 bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-primary/30 rounded-lg flex items-center justify-center cursor-move hover:border-primary transition-colors"
                >
                  <div className="text-center">
                    <div className="text-xs font-bold">#{piece.id}</div>
                    <div className="text-xs text-muted-foreground">
                      ({piece.correctPosition.row + 1},{piece.correctPosition.col + 1})
                    </div>
                  </div>
                </div>
              ))}
              
              {availablePieces.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  <Grid3X3 className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">All pieces placed!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Button */}
      {!isComplete && isPuzzleComplete() && (
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <Button 
              onClick={handleComplete}
              className="w-full"
            >
              Complete Puzzle Assembly
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Check your puzzle solution
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && (
        <Card className={`border-2 ${getCorrectlyPlaced() === content.pieces.length ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">
              {getCorrectlyPlaced() === content.pieces.length ? '🎉' : '🧩'}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${getCorrectlyPlaced() === content.pieces.length ? 'text-green-800' : 'text-orange-800'}`}>
              {getCorrectlyPlaced() === content.pieces.length ? 'Perfect Puzzle!' : 'Good Assembly!'}
            </h3>
            <p className={`mb-4 ${getCorrectlyPlaced() === content.pieces.length ? 'text-green-700' : 'text-orange-700'}`}>
              You placed {getCorrectlyPlaced()} out of {content.pieces.length} pieces correctly.
            </p>

            {/* Show correct positions for incorrectly placed pieces */}
            {getCorrectlyPlaced() < content.pieces.length && (
              <div className="mb-6 p-4 bg-white rounded-lg border">
                <h4 className="font-semibold mb-3">Correct Positions:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {content.pieces.map(piece => {
                    const currentPosition = puzzleGrid.findIndex(row => 
                      row.findIndex(p => p?.id === piece.id) !== -1
                    );
                    const currentCol = currentPosition !== -1 
                      ? puzzleGrid[currentPosition].findIndex(p => p?.id === piece.id)
                      : -1;
                    const isCorrect = currentPosition === piece.correctPosition.row && 
                                     currentCol === piece.correctPosition.col;
                    
                    return (
                      <div 
                        key={piece.id}
                        className={`p-2 rounded border ${isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}
                      >
                        <div className="font-medium">#{piece.id}</div>
                        <div className="text-xs">
                          Should be: ({piece.correctPosition.row + 1},{piece.correctPosition.col + 1})
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Score</div>
                <div className="text-2xl text-primary">{score}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Correct</div>
                <div className="text-2xl">{getCorrectlyPlaced()}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold">Accuracy</div>
                <div className="text-2xl">{Math.round((getCorrectlyPlaced() / content.pieces.length) * 100)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PuzzleAssemblyRenderer;
