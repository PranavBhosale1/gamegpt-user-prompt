"""
Pydantic models for GameGPT Backend
Defines the data structures for API requests and responses
"""

from typing import List, Dict, Any, Optional, Union, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class GameGenerationRequest(BaseModel):
    """Request model for game generation - equivalent to n8n webhook input"""
    prompt: str = Field(..., description="User's game request prompt", min_length=1, max_length=2000)
    
    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "A quiz about recognizing and managing stress for teens"
            }
        }


class GameConfig(BaseModel):
    """Game configuration settings"""
    maxAttempts: Optional[int] = Field(None, ge=1, le=5)
    timeLimit: Optional[int] = Field(None, ge=300, le=1800)
    showProgress: bool = True
    allowRetry: bool = True
    shuffleOptions: bool = True
    showHints: bool = True
    autoNext: bool = False


class ScoringConfig(BaseModel):
    """Game scoring configuration"""
    maxScore: int = Field(..., ge=50, le=200)
    pointsPerCorrect: int = Field(..., ge=5, le=25)
    pointsPerIncorrect: int = Field(0, ge=-10, le=0)
    bonusForSpeed: int = Field(0, ge=0, le=15)
    bonusForStreak: int = Field(0, ge=0, le=20)


class UIConfig(BaseModel):
    """UI configuration for the game"""
    theme: Literal["default", "colorful", "minimal", "dark"] = "default"
    layout: Literal["grid", "list", "carousel", "scattered"] = "grid"
    animations: bool = True
    sounds: bool = False
    particles: bool = True


# Quiz Game Content Models
class QuizQuestion(BaseModel):
    """Quiz question model"""
    id: str
    question: str
    type: Literal["multiple-choice", "true-false", "fill-blank"]
    options: List[str]
    correctAnswer: Union[str, List[str]]
    explanation: str
    image: Optional[str] = None
    hint: Optional[str] = None


class QuizContent(BaseModel):
    """Quiz game content"""
    questions: List[QuizQuestion]


# Drag-Drop Game Content Models
class DragDropItem(BaseModel):
    """Drag-drop item model"""
    id: str
    content: str
    image: Optional[str] = None
    correctZone: str
    category: Optional[str] = None
    explanation: str


class DropZone(BaseModel):
    """Drop zone model"""
    id: str
    label: str
    accepts: List[str]
    maxItems: Optional[int] = None
    image: Optional[str] = None


class DragDropContent(BaseModel):
    """Drag-drop game content"""
    items: List[DragDropItem]
    dropZones: List[DropZone]
    instructions: str


# Memory Match Game Content Models
class MemoryPair(BaseModel):
    """Memory match pair model"""
    id: str
    content1: str
    content2: str
    technique: Optional[str] = None
    situation: Optional[str] = None
    image1: Optional[str] = None
    image2: Optional[str] = None
    category: Optional[str] = None
    explanation: str


class MemoryMatchContent(BaseModel):
    """Memory match game content"""
    pairs: List[MemoryPair]
    gridSize: Literal["4x4", "6x6", "8x8"] = "4x4"


# Sorting Game Content Models
class SortingItem(BaseModel):
    """Sorting item model"""
    id: str
    content: str
    image: Optional[str] = None
    correctCategory: str
    difficulty: Optional[int] = Field(None, ge=1, le=5)


class SortingCategory(BaseModel):
    """Sorting category model"""
    id: str
    name: str
    description: str
    color: Literal["blue", "green", "red", "purple", "orange"]


class SortingContent(BaseModel):
    """Sorting game content"""
    items: List[SortingItem]
    categories: List[SortingCategory]
    instructions: str


# Matching Game Content Models
class MatchingPair(BaseModel):
    """Matching pair model"""
    id: str
    left: str
    right: str
    explanation: str


class MatchingContent(BaseModel):
    """Matching game content"""
    pairs: List[MatchingPair]
    instructions: str


# Story Sequence Game Content Models
class StoryEvent(BaseModel):
    """Story sequence event model"""
    id: str
    content: str
    image: Optional[str] = None
    order: int
    description: str
    explanation: str


class StorySequenceContent(BaseModel):
    """Story sequence game content"""
    events: List[StoryEvent]
    title: str
    theme: str


# Fill Blank Game Content Models
class FillBlank(BaseModel):
    """Fill blank model"""
    id: str
    position: int
    correctAnswer: str
    options: List[str]
    hint: str


class FillBlankPassage(BaseModel):
    """Fill blank passage model"""
    id: str
    text: str
    blanks: List[FillBlank]


class FillBlankContent(BaseModel):
    """Fill blank game content"""
    passages: List[FillBlankPassage]


# Card Flip Game Content Models
class FlipCard(BaseModel):
    """Card flip model"""
    id: str
    front: str
    back: str
    frontImage: Optional[str] = None
    backImage: Optional[str] = None
    category: Optional[str] = None


class CardFlipContent(BaseModel):
    """Card flip game content"""
    cards: List[FlipCard]
    instructions: str


# Word Puzzle Game Content Models
class WordPuzzleWord(BaseModel):
    """Word puzzle word model"""
    word: str
    hint: str
    direction: Literal["horizontal", "vertical"]
    startRow: int = Field(..., ge=0, le=14)
    startCol: int = Field(..., ge=0, le=14)


class WordPuzzleContent(BaseModel):
    """Word puzzle game content"""
    words: List[WordPuzzleWord]
    gridSize: int = Field(..., ge=10, le=20)
    theme: str


# Puzzle Assembly Game Content Models
class PuzzlePiece(BaseModel):
    """Puzzle piece model"""
    id: str
    image: str
    correctPosition: Dict[str, int]  # {"x": 0, "y": 0}


class PuzzleAssemblyContent(BaseModel):
    """Puzzle assembly game content"""
    pieces: List[PuzzlePiece]
    targetImage: str
    gridSize: int = Field(..., ge=4, le=16)


# Anxiety Adventure Game Content Models
class AnxietyChoice(BaseModel):
    """Anxiety adventure choice model"""
    id: str
    text: str
    outcome: Literal["positive", "negative", "neutral"]
    anxietyChange: int = Field(..., ge=-5, le=3)
    points: int = Field(..., ge=0, le=25)
    explanation: str
    nextScenario: Optional[str] = None


class AnxietyScenario(BaseModel):
    """Anxiety adventure scenario model"""
    id: str
    title: str
    description: str
    anxietyLevel: int = Field(..., ge=1, le=10)
    choices: List[AnxietyChoice]
    tips: List[str]


class AnxietyAdventureContent(BaseModel):
    """Anxiety adventure game content"""
    startId: str
    scenarios: Dict[str, AnxietyScenario]


# Union type for all game content types
GameContent = Union[
    QuizContent,
    DragDropContent,
    MemoryMatchContent,
    SortingContent,
    MatchingContent,
    StorySequenceContent,
    FillBlankContent,
    CardFlipContent,
    WordPuzzleContent,
    PuzzleAssemblyContent,
    AnxietyAdventureContent
]


class GameSchema(BaseModel):
    """Main game schema model - equivalent to n8n workflow output"""
    id: str = Field(..., pattern=r"^game-\d{8}-\d{4}$")
    title: str = Field(..., max_length=60)
    description: str
    type: Literal[
        "quiz",
        "drag-drop", 
        "memory-match",
        "word-puzzle",
        "sorting",
        "matching",
        "story-sequence",
        "fill-blank",
        "card-flip",
        "puzzle-assembly",
        "anxiety-adventure"
    ]
    difficulty: Literal["easy", "medium", "hard"]
    category: Literal[
        "mental-wellness",
        "coping-skills",
        "emotional-intelligence",
        "mindfulness",
        "anxiety-management", 
        "depression-support",
        "stress-reduction",
        "self-care",
        "cognitive-behavioral",
        "interpersonal-skills"
    ]
    estimatedTime: int = Field(..., ge=5, le=30)
    config: GameConfig
    content: Dict[str, Any]  # Will be validated based on game type
    scoring: ScoringConfig
    ui: UIConfig
    generatedAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    version: str = "1.0"
    theme: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "game-20241203-1234",
                "title": "Stress Management Quiz for Teens",
                "description": "Learn effective stress management techniques",
                "type": "quiz",
                "difficulty": "medium",
                "category": "stress-reduction",
                "estimatedTime": 15,
                "config": {
                    "maxAttempts": 3,
                    "timeLimit": 900,
                    "showProgress": True,
                    "allowRetry": True,
                    "shuffleOptions": True,
                    "showHints": True,
                    "autoNext": False
                },
                "content": {
                    "questions": []
                },
                "scoring": {
                    "maxScore": 100,
                    "pointsPerCorrect": 10,
                    "pointsPerIncorrect": -2,
                    "bonusForSpeed": 5,
                    "bonusForStreak": 10
                },
                "ui": {
                    "theme": "default",
                    "layout": "grid", 
                    "animations": True,
                    "sounds": False,
                    "particles": True
                },
                "generatedAt": "2024-12-03T10:30:00Z",
                "version": "1.0",
                "theme": "stress-management"
            }
        }
