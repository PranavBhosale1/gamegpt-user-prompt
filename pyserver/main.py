from __future__ import annotations
import os
import json
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

load_dotenv()

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash-lite")
PROVIDER = os.getenv("PROVIDER", "gemini").lower()  # openrouter | gemini
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "qwen/qwen3-coder:free")


# -----------------------------------------------------------------------------
# App
# -----------------------------------------------------------------------------
app = FastAPI(title="GameGPT Python Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Schemas
# -----------------------------------------------------------------------------
class GenerateRequest(BaseModel):
    description: Optional[str] = None
    gameType: Optional[str] = None
    difficulty: Optional[str] = None
    targetAge: Optional[str] = None
    targetAudience: Optional[str] = None
    learningObjectives: Optional[str] = None
    theme: Optional[str] = None
    user_prompt: Optional[str] = None

class AnalyzerRequest(BaseModel):
    # Flexible inputs - support multiple formats
    gameContext: Optional[Any] = None  # Full game schema/content in any format
    userInputs: Optional[Any] = None   # User responses in any format
    
    # Direct field inputs (for backward compatibility)
    game_title: Optional[str] = None
    game_type: Optional[str] = None
    game_theme: Optional[str] = None
    game_description: Optional[str] = None
    
    # Performance data
    score: Optional[int] = None
    max_score: Optional[int] = None
    time_spent: Optional[int] = None  # in seconds
    accuracy: Optional[float] = None  # percentage
    
    # Legacy support for old formats
    body: Optional[Dict[str, Any]] = None
    questionAnswerPairs: Optional[Any] = None

# -----------------------------------------------------------------------------
# Utilities
# -----------------------------------------------------------------------------

def build_user_prompt(data: GenerateRequest) -> str:
    if data.user_prompt:
        return data.user_prompt
    # Build from fields like the frontend does for n8n
    prompt = data.description or "Create a simple mental wellness game"
    if data.gameType:
        prompt += f"\nPreferred game type: {data.gameType}"
    if data.difficulty:
        prompt += f"\nDifficulty level: {data.difficulty}"
    if data.targetAge or data.targetAudience:
        prompt += f"\nTarget audience: {data.targetAge or data.targetAudience}"
    if data.learningObjectives:
        prompt += f"\nLearning objectives: {data.learningObjectives}"
    if data.theme:
        prompt += f"\nBehavioral theme: {data.theme}"
    return prompt.strip()

PROMPT_INTRO = (
    "You are Dr. Evelyn Reed, the Lead Instructional Architect for the GameGPT Initiative. "
    "Your mission is to translate therapeutic concepts and educational goals into engaging, evidence-based micro-games. "
    "Our platform serves individuals seeking to improve their mental wellness, build coping skills, and learn about behavioral health in a safe, supportive, and interactive environment.\n\n"
    "Each game you design is a critical tool for a user's journey. It must be purposeful, empathetic, and effective. "
    "You are a digital therapist and educator, crafting experiences that empower users.\n\n"
    "Your primary responsibility is to take a high-level request and transform it into a perfectly structured, ready-to-render JSON object. "
    "Adherence to the specified JSON schema is non-negotiable, as our game engine depends on it for flawless execution.\n\n"
)

PROMPT_REQUIRED_JSON = (
    "## REQUIRED JSON OUTPUT STRUCTURE\n\n"
    "Return this EXACT JSON structure with NO additional formatting:\n\n"
    "{\n"
    "  \"id\": \"game-[YYYYMMDD]-[4-digit-random]\",\n"
    "  \"title\": \"[Engaging title, max 60 chars]\",\n"
    "  \"description\": \"[Clear description of what players will learn]\",\n"
    "  \"type\": \"[selected-game-type]\",\n"
    "  \"difficulty\": \"[easy|medium|hard]\",\n"
    "  \"category\": \"[Science|Mathematics|Language Arts|History|Geography|Arts|Health|Technology|Life Skills|Mindfulness]\",\n"
    "  \"estimatedTime\": [5-30],\n"
    "  \"theme\": \"[Behavioral theme/focus, e.g., Mindfulness, Emotion Regulation, Stress Management]\",\n"
    "  \"config\": {\n"
    "    \"maxAttempts\": 3,\n"
    "    \"timeLimit\": [300-1800 or null],\n"
    "    \"showProgress\": true,\n"
    "    \"allowRetry\": true,\n"
    "    \"shuffleOptions\": true,\n"
    "    \"showHints\": true,\n"
    "    \"autoNext\": false\n"
    "  },\n"
    "  \"content\": {\n"
    "    [GAME-TYPE-SPECIFIC CONTENT - see structures below]\n"
    "  },\n"
    "  \"scoring\": {\n"
    "    \"maxScore\": [50-200],\n"
    "    \"pointsPerCorrect\": [5-20],\n"
    "    \"pointsPerIncorrect\": [0 to -5],\n"
    "    \"bonusForSpeed\": [0-10],\n"
    "    \"bonusForStreak\": [0-10]\n"
    "  },\n"
    "  \"ui\": {\n"
    "    \"theme\": \"default\",\n"
    "    \"layout\": \"grid\",\n"
    "    \"animations\": true,\n"
    "    \"sounds\": false,\n"
    "    \"particles\": true\n"
    "  }\n"
    "}\n\n"
)

PROMPT_TAIL_QUALITY_INTRO = "## CONTENT QUALITY RULES\n\n"

PROMPT_USER_AND_ANALYSIS = (
    "**User Request:** {user_request}\n\n"
    "## ANALYSIS REQUIRED\n"
    "Analyze the user request to determine:\n"
    "- Primary learning objective and subject matter\n"
    "- Target age group (infer if not specified)\n"
    "- Appropriate difficulty level (easy/medium/hard)\n"
    "- Best game type for the content\n"
    "- Therapeutic benefits to emphasize\n"
    "- Behavioral theme that should guide tone and content (e.g., Mindfulness, Coping Skills, Growth Mindset)\n\n"
)

PROMPT_TAIL_THER_EDU = (
    "### THERAPEUTIC ELEMENTS:\n"
    "- Use positive, encouraging language\n"
    "- Include growth mindset messaging\n"
    "- Choose calming, confidence-building themes\n"
    "- Ensure achievable but challenging content\n"
    "- Add mindfulness elements where appropriate\n\n"
    "### EDUCATIONAL STANDARDS:\n"
    "- Age-appropriate language and concepts\n"
    "- Culturally sensitive and inclusive content\n"
    "- Scientifically accurate information\n"
    "- Clear learning outcomes\n"
    "- Real-world relevance\n\n"
)

PROMPT_TAIL_VALIDATION_OUTPUT = (
    "## CRITICAL VALIDATION:\n"
    "- ALL required JSON fields must be present\n"
    "- Content must match selected game type structure\n"
    "- JSON syntax must be perfect (quotes, commas, brackets)\n"
    "- All IDs must be unique within their scope\n"
    "- Educational content must be accurate\n"
    "- Game must be logically completable\n\n"
    "## OUTPUT REQUIREMENT:\n"
    "Return ONLY the JSON object. No markdown code blocks, no explanations, no additional text. Just pure, valid JSON that can be parsed immediately.\n"
)

# Long-form constant guidance sections (remain constant; not controlled by switch-case)
PROMPT_CONSTANT_PARTS = (
    "Part I: The Foundations of Evidence-Based Therapeutic Practice This section delves into the principles of psychotherapy, focusing on Cognitive Behavioral Therapy (CBT), \"third-wave\" therapies like Dialectical Behavior Therapy (DBT) and Acceptance and Commitment Therapy (ACT), and Mindfulness-Based Stress Reduction (MBSR). It explains core concepts such as the cognitive triangle, cognitive distortions, the thought record, behavioral interventions (behavioral activation, graded exposure, behavioral experiments), and Socratic questioning. It also details the four core skill modules of DBT (Mindfulness, Distress Tolerance, Emotion Regulation, Interpersonal Effectiveness) and the six core processes of ACT (the \"Hexaflex\": Acceptance, Cognitive Defusion, Being Present, Self-as-Context, Values, Committed Action). Core attitudes and exercises of MBSR are also discussed. This part emphasizes understanding the human element of therapy, including building a therapeutic alliance, structuring sessions, and setting SMART goals.\n"
    "Part II: Translating Therapeutic Principles into Game Mechanics This part focuses on bridging clinical concepts with game mechanics. It introduces a taxonomy of therapeutic game mechanics categorized by their function: Awareness & Identification, Skill-Building & Practice, and Exploration & Commitment. It provides a table mapping specific clinical tasks/skills from CBT, DBT, ACT, and MBSR to potential game mechanics and offers example game concepts (e.g., \"Thought Detective,\" \"Fear Ladder,\" \"Mindful Skies,\" \"Breath Garden\"). It also highlights the role of narrative as a therapeutic engine, applying concepts from Narrative Therapy and showcasing existing therapeutic games like SPARX and Mindful Fido.\n"
    "Part III: AI Model Fine-Tuning and Implementation Strategy This section provides actionable recommendations for building, training, and constraining the AI model. It emphasizes the need for structured prompt syntax (e.g., JSON format) to guide the AI, linking clinical language to specific game design actions. It outlines essential knowledge bases for the AI, such as databases of cognitive distortions, DBT skills, human values, emotion vocabulary, and therapeutic metaphors. It also details procedural generation logic for creating therapeutically sound games and discusses response evaluation and self-correction mechanisms.\n"
)

def build_game_type_selection(game_type: Optional[str]) -> str:
    if game_type:
        return (
            "## GAME TYPE SELECTION\n"
            f"The game type is FIXED to \"{game_type}\". Use this type and do not choose any other.\n\n"
        )
    return (
        "## GAME TYPE SELECTION\n"
        "Choose the most appropriate type:\n"
        "- `quiz` - Knowledge testing (multiple choice, true/false, fill-blank)\n"
        "- `drag-drop` - Interactive categorization and sorting\n"
        "- `memory-match` - Card matching for vocabulary/concepts\n"
        "- `word-puzzle` - Crossword-style educational word games\n"
        "- `sorting` - Category-based organization activities\n"
        "- `matching` - Connect related concepts (left-right)\n"
        "- `story-sequence` - Order events, processes, narratives\n"
        "- `fill-blank` - Complete sentences/paragraphs\n"
        "- `card-flip` - Flashcard learning with front/back\n"
        "- `puzzle-assembly` - Visual jigsaw puzzles\n"
        "- `anxiety-adventure` - Interactive scenarios for anxiety management and coping skills\n\n"
    )


def build_content_structure(game_type: Optional[str]) -> str:
    if game_type == 'quiz':
        content_struct = (
            "### QUIZ CONTENT:\n"
            "\"content\": {\n"
            "  \"questions\": [\n"
            "    {\n"
            "      \"id\": \"q1\",\n"
            "      \"question\": \"[Clear question text]\",\n"
            "      \"type\": \"multiple-choice\",\n"
            "      \"options\": [\"[Option A]\", \"[Option B]\", \"[Option C]\", \"[Option D]\"],\n"
            "      \"correctAnswer\": \"[Correct option text]\",\n"
            "      \"explanation\": \"[Why this answer is correct]\",\n"
            "      \"hint\": \"[Helpful hint without spoiling answer]\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "Requirements: 5-12 questions, mix of multiple-choice (70%), true-false (20%), fill-blank (10%)\n\n"
        )
    elif game_type == 'drag-drop':
        content_struct = (
            "### DRAG-DROP CONTENT:\n"
            "\"content\": {\n"
            "  \"items\": [\n"
            "    {\n"
            "      \"id\": \"item1\",\n"
            "      \"content\": \"[Item description]\",\n"
            "      \"correctZone\": \"zone1\",\n"
            "      \"explanation\": \"explanation why it belogs to the field\"\n"
            "    }\n"
            "  ],\n"
            "  \"dropZones\": [\n"
            "    {\n"
            "      \"id\": \"zone1\",\n"
            "      \"label\": \"[Zone label]\",\n"
            "      \"accepts\": [\"item1\"],\n"
            "      \"maxItems\": 5\n"
            "    }\n"
            "  ],\n"
            "  \"instructions\": \"[Clear player instructions]\"\n"
            "}\n"
            "Requirements: 8-16 items, 2 zones, clear categorization\n\n"
        )
    elif game_type == 'memory-match':
        content_struct = (
            "### MEMORY-MATCH CONTENT:\n"
            "\"content\": {\n"
            "  \"pairs\": [\n"
            "    {\n"
            "      \"id\": \"pair1\",\n"
            "      \"technique\": \"[]\",\n"
            "      \"situation\": \"[]\",\n"
            "      \"content1\": \"[First item]\",\n"
            "      \"content2\": \"[Matching item]\",\n"
            "      \"explanation\":\"[Why the situtaion and its technique are a match]\"\n"
            "    }\n"
            "  ],\n"
            "  \"gridSize\": \"4x4\"\n"
            "}\n"
            "Requirements: (easy:8-12, medium: 12-20 ,hard :20-28) pairs, meaningful relationships, appropriate grid size. The technique should be to solve the particular solution only\n\n"
        )
    elif game_type == 'sorting':
        content_struct = (
            "### SORTING CONTENT:\n"
            "\"content\": {\n"
            "  \"items\": [\n"
            "    {\n"
            "      \"id\": \"item1\",\n"
            "      \"content\": \"[Item to sort]\",\n"
            "      \"correctCategory\": \"cat1\"\n"
            "    }\n"
            "  ],\n"
            "  \"categories\": [\n"
            "    {\n"
            "      \"id\": \"cat1\",\n"
            "      \"name\": \"[Category name]\",\n"
            "      \"description\": \"[What belongs here]\",\n"
            "      \"color\": \"blue\"\n"
            "    }\n"
            "  ],\n"
            "  \"instructions\": \"[Sorting instructions]\"\n"
            "}\n\n"
        )
    elif game_type == 'matching':
        content_struct = (
            "### MATCHING CONTENT:\n"
            "\"content\": {\n"
            "  \"leftItems\": [\n"
            "    {\n"
            "      \"id\": \"left1\",\n"
            "      \"content\": \"[Left side item]\",\n"
            "      \"matchId\": \"match1\",\n"
            "      \"explanation\":\"[explain why this answer s correct in a polite was such that it would reduce stress(tone)]\"\n"
            "    }\n"
            "  ],\n"
            "  \"rightItems\": [\n"
            "    {\n"
            "      \"id\": \"right1\",\n"
            "      \"content\": \"[Right side item]\",\n"
            "      \"matchId\": \"match1\"\n"
            "    }\n"
            "  ],\n"
            "  \"instructions\": \"[Matching instructions]\"\n"
            "}\n\n"
        )
    elif game_type == 'story-sequence':
        content_struct = (
            "### STORY-SEQUENCE CONTENT:\n"
            "\"content\": {\n"
            "  \"events\": [\n"
            "    {\n"
            "      \"id\": \"event1\",\n"
            "      \"content\": \"[Event description]\",\n"
            "      \"order\": 1,\n"
            "      \"description\": \"[Additional context]\",\n"
            "      \"explanation\":\"[in detailed explanation mandatory]\"\n"
            "    }\n"
            "  ],\n"
            "  \"title\": \"[Story/Process title]\",\n"
            "  \"theme\": \"[Story theme]\"\n"
            "}\n\n"
        )
    elif game_type == 'fill-blank':
        content_struct = (
            "### FILL-BLANK CONTENT:\n"
            "\"content\": {\n"
            "  \"passages\": [\n"
            "    {\n"
            "      \"id\": \"passage1\",\n"
            "      \"text\": \"[Text with [BLANK1] placeholders]\",\n"
            "      \"blanks\": [\n"
            "        {\n"
            "          \"id\": \"blank1\",\n"
            "          \"position\": 1,\n"
            "          \"correctAnswer\": \"[correct word]\",\n"
            "          \"options\": [\"[correct]\", \"[wrong1]\", \"[wrong2]\", \"[wrong3]\"],\n"
            "          \"hint\": \"[Optional hint]\"\n"
            "        }\n"
            "      ]\n"
            "    }\n"
            "  ]\n"
            "}\n\n"
        )
    elif game_type == 'card-flip':
        content_struct = (
            "### CARD-FLIP CONTENT:\n"
            "\"content\": {\n"
            "  \"cards\": [\n"
            "    {\n"
            "      \"id\": \"card1\",\n"
            "      \"front\": \"[Front text/term]\",\n"
            "      \"back\": \"[Back text/definition]\"\n"
            "    }\n"
            "  ],\n"
            "  \"instructions\": \"[How to use flashcards]\"\n"
            "}\n\n"
        )
    elif game_type == 'word-puzzle':
        content_struct = (
            "### WORD-PUZZLE CONTENT:\n"
            "\"content\": {\n"
            "  \"words\": [\n"
            "    {\n"
            "      \"word\": \"[WORD]\",\n"
            "      \"hint\": \"[Word clue]\",\n"
            "      \"direction\": \"horizontal\",\n"
            "      \"startRow\": 1,\n"
            "      \"startCol\": 1\n"
            "    }\n"
            "  ],\n"
            "  \"gridSize\": 15,\n"
            "  \"theme\": \"[Puzzle theme]\"\n"
            "}\n\n"
        )
    elif game_type == 'puzzle-assembly':
        content_struct = (
            "### PUZZLE-ASSEMBLY CONTENT:\n"
            "\"content\": {\n"
            "  \"pieces\": [\n"
            "    {\n"
            "      \"id\": \"piece1\",\n"
            "      \"image\": \"[Piece description]\",\n"
            "      \"correctPosition\": {\"x\": 0, \"y\": 0}\n"
            "    }\n"
            "  ],\n"
            "  \"targetImage\": \"[Complete image description]\",\n"
            "  \"gridSize\": 9\n"
            "}\n\n"
        )
    elif game_type == 'anxiety-adventure':
        content_struct = (
            "### ANXIETY-ADVENTURE CONTENT:\n"
            "\"content\": {\n"
            "  \"startId\": \"scenario1\",\n"
            "  \"scenarios\": {\n"
            "    \"scenario1\": {\n"
            "      \"id\": \"scenario1\",\n"
            "      \"title\": \"[Scenario title]\",\n"
            "      \"description\": \"[Detailed scenario description that presents an anxiety-provoking situation]\",\n"
            "      \"anxietyLevel\": [1-10],\n"
            "      \"tips\": [\"[Helpful tip 1]\", \"[Helpful tip 2]\"],\n"
            "      \"choices\": [\n"
            "        {\n"
            "          \"id\": \"choice1\",\n"
            "          \"text\": \"[Choice description - coping strategy or response]\",\n"
            "          \"outcome\": \"positive|negative|neutral\",\n"
            "          \"anxietyChange\": [-3 to +3],\n"
            "          \"points\": [0-20],\n"
            "          \"explanation\": \"[Why this choice helps/hurts anxiety management]\",\n"
            "          \"nextScenario\": \"scenario2|null\"\n"
            "        }\n"
            "      ]\n"
            "    }\n"
            "  }\n"
            "}\n"
            "Requirements: 3-8 scenarios, each with 2-4 choices, focus on anxiety management, coping strategies, and gradual exposure. Include positive reinforcement and educational explanations.\n\n"
        )
    else:
        content_struct = (
            "Choose the best-suited game type from the list above and adhere strictly to that type's content schema.\n"
            "Do not include all schemas; only structure content for the chosen type.\n\n"
        )
    return content_struct


def build_difficulty_section(game_type: Optional[str]) -> str:
    if game_type == 'memory-match':
        return (
            "### DIFFICULTY SCALING:\n"
            "- **Easy**: 8-12 pairs, simple relationships, generous hints\n"
            "- **Medium**: 12-20 pairs, moderate reasoning, moderate hints\n"
            "- **Hard**: 20-28 pairs, nuanced relationships, minimal hints\n\n"
        )
    elif game_type == 'anxiety-adventure':
        return (
            "### DIFFICULTY SCALING:\n"
            "- **Easy**: 3-4 scenarios, clear coping strategies, low initial anxiety (1-3), supportive tips\n"
            "- **Medium**: 5-6 scenarios, moderate anxiety situations (3-6), balanced choices, some complex decisions\n"
            "- **Hard**: 7-8 scenarios, high-anxiety situations (6-9), nuanced coping strategies, realistic challenges\n\n"
        )
    return (
        "### DIFFICULTY SCALING:\n"
        "- **Easy**: 5-8 items, obvious answers, simple vocab, generous hints\n"
        "- **Medium**: 8-12 items, some analysis needed, grade-level vocab, moderate hints\n"
        "- **Hard**: 10-15 items, critical thinking required, advanced vocab, minimal hints\n\n"
    )

ANALYZER_PROMPT_TEMPLATE = (
    "You are Dr. Evelyn Reed, the Lead Instructional Architect for the GameGPT Initiative. "
    "Analyze the player's game performance and responses as a therapist with positive, encouraging language and mindfulness elements.\n\n"
    "**Game Context:**\n"
    "Game Title: {game_title}\n"
    "Game Type: {game_type}\n"
    "Behavioral Theme: {game_theme}\n"
    "Game Description: {game_description}\n\n"
    "**Player Performance:**\n"
    "User Inputs/Responses: {user_inputs}\n"
    "Score: {score}/{max_score}\n"
    "Time Spent: {time_spent} seconds\n"
    "Accuracy: {accuracy}%\n\n"
    "**Analysis Instructions:**\n"
    "As a therapist, provide personalized insights based on their performance and responses. Consider:\n"
    "- The specific game type and how their responses relate to its therapeutic goals\n"
    "- The behavioral theme (e.g., mindfulness, coping skills, emotional regulation)\n"
    "- Patterns in their responses that might indicate strengths or growth areas\n"
    "- Positive reinforcement and encouragement for their efforts\n"
    "- Gentle suggestions for continued growth and learning\n"
    "- How their performance reflects their engagement with the therapeutic content\n\n"
    "Focus on growth mindset, resilience, and self-compassion. Avoid clinical diagnosis.\n"
    "Keep the tone warm, supportive, and empowering.\n\n"
    "Return ONLY this JSON object (no markdown, no extra text):\n"
    "{\n  \"analysis\": \"[Therapeutic analysis based on game performance and responses, focusing on growth mindset and encouragement]\"\n}\n"
)


def strip_code_fences(text: str) -> str:
    """
    Extract JSON from AI responses that might contain extra text or markdown.
    """
    import re
    
    t = text.strip()
    
    # First, try to extract markdown code blocks
    if t.startswith("```json") and t.endswith("```"):
        return t[7:-3].strip()
    if t.startswith("```") and t.endswith("```"):
        return t[3:-3].strip()
    
    # Look for JSON objects in the text using regex
    # This will find content between { and } including nested objects
    json_pattern = r'\{(?:[^{}]*|\{[^{}]*\})*\}'
    matches = re.findall(json_pattern, t, re.DOTALL)
    
    if matches:
        # Try to find the largest/most complete JSON object
        for match in sorted(matches, key=len, reverse=True):
            try:
                # Test if it's valid JSON
                json.loads(match)
                return match
            except:
                continue
    
    # If no valid JSON found in brackets, try to find JSON starting with {
    if '{' in t:
        start_idx = t.find('{')
        # Find the end by counting braces
        brace_count = 0
        end_idx = start_idx
        for i, char in enumerate(t[start_idx:], start_idx):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i
                    break
        
        potential_json = t[start_idx:end_idx + 1]
        try:
            # Test if it's valid JSON
            json.loads(potential_json)
            return potential_json
        except:
            pass
    
    # If all else fails, return the original text
    return t


async def call_openrouter(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=body)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"OpenRouter error: {r.text[:500]}")
        data = r.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except Exception:
            raise HTTPException(status_code=502, detail=f"Unexpected OpenRouter response: {data}")
        return content


async def call_gemini(prompt: str) -> str:
    # Using Google Generative Language API v1beta REST
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}]
    }
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(url, json=payload)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Gemini error: {r.text[:500]}")
        data = r.json()
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            raise HTTPException(status_code=502, detail=f"Unexpected Gemini response: {data}")
        return text


async def call_model(prompt: str) -> str:
    if PROVIDER == "gemini":
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="Missing GOOGLE_API_KEY for Gemini provider")
        return await call_gemini(prompt)
    # default: openrouter
    if OPENROUTER_API_KEY:
        return await call_openrouter(prompt)
    # Fallback to Gemini if available
    if GEMINI_API_KEY:
        return await call_gemini(prompt)
    raise HTTPException(status_code=500, detail="Missing OPENROUTER_API_KEY and GOOGLE_API_KEY; set one or set PROVIDER=gemini")


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/api/games/generate")
async def generate_game(req: GenerateRequest):
    user_prompt = build_user_prompt(req)

    # If no gameType, include all schemas and generic selection; else, only the selected type's schema
    if not req.gameType:
        # Full original prompt: all schemas, so AI can choose
        full_prompt = (
            PROMPT_INTRO
            + PROMPT_CONSTANT_PARTS
            + PROMPT_USER_AND_ANALYSIS.format(user_request=user_prompt)
            + build_game_type_selection(None)
            + PROMPT_REQUIRED_JSON
            + "### QUIZ CONTENT:\n"
            + build_content_structure('quiz')
            + "### DRAG-DROP CONTENT:\n"
            + build_content_structure('drag-drop')
            + "### MEMORY-MATCH CONTENT:\n"
            + build_content_structure('memory-match')
            + "### SORTING CONTENT:\n"
            + build_content_structure('sorting')
            + "### MATCHING CONTENT:\n"
            + build_content_structure('matching')
            + "### STORY-SEQUENCE CONTENT:\n"
            + build_content_structure('story-sequence')
            + "### FILL-BLANK CONTENT:\n"
            + build_content_structure('fill-blank')
            + "### CARD-FLIP CONTENT:\n"
            + build_content_structure('card-flip')
            + "### WORD-PUZZLE CONTENT:\n"
            + build_content_structure('word-puzzle')
            + "### PUZZLE-ASSEMBLY CONTENT:\n"
            + build_content_structure('puzzle-assembly')
            + "### ANXIETY-ADVENTURE CONTENT:\n"
            + build_content_structure('anxiety-adventure')
            + PROMPT_TAIL_QUALITY_INTRO
            + build_difficulty_section(None)
            + PROMPT_TAIL_THER_EDU
            + PROMPT_TAIL_VALIDATION_OUTPUT
        )
    else:
        # Only the selected type's schema
        full_prompt = (
            PROMPT_INTRO
            + PROMPT_CONSTANT_PARTS
            + PROMPT_USER_AND_ANALYSIS.format(user_request=user_prompt)
            + build_game_type_selection(req.gameType)
            + PROMPT_REQUIRED_JSON
            + "## CONTENT STRUCTURES BY GAME TYPE\n"
            + build_content_structure(req.gameType)
            + PROMPT_TAIL_QUALITY_INTRO
            + build_difficulty_section(req.gameType)
            + PROMPT_TAIL_THER_EDU
            + PROMPT_TAIL_VALIDATION_OUTPUT
        )

    raw = await call_model(full_prompt)
    cleaned = strip_code_fences(raw)

    try:
        game_json = json.loads(cleaned)
    except Exception as e:
        # Enhanced error with more debugging info
        print(f"JSON Parse Error: {str(e)}")
        print(f"Raw response (first 1000 chars): {raw[:1000]}")
        print(f"Cleaned response: {cleaned[:500]}")
        
        raise HTTPException(status_code=502, detail={
            "message": "Model did not return valid JSON",
            "error": str(e),
            "raw_excerpt": raw[:500] if len(raw) > 500 else raw,
            "cleaned_excerpt": cleaned[:500] if len(cleaned) > 500 else cleaned
        })

    # Final safeguard: if a type was requested, coerce the output type
    if req.gameType and isinstance(game_json, dict):
        game_json['type'] = req.gameType

    return game_json


@app.post("/api/analyze/game")
async def analyze_game_performance(request: Request):
    """
    Analyze player performance in any game type with therapeutic insights.
    Handles multiple input formats for flexibility.
    """
    
    # Parse the request body
    body_json: Any = await request.json()
    
    # Handle different input formats
    if isinstance(body_json, list) and body_json:
        # Array format: [{ body: ... }] or [data]
        data = body_json[0].get("body") if isinstance(body_json[0], dict) and "body" in body_json[0] else body_json[0]
    elif isinstance(body_json, dict):
        # Direct object or { body: ... } format
        data = body_json.get("body", body_json)
    else:
        data = {}
    
    # Extract game context from multiple possible sources
    game_context = None
    if "gameContext" in data:
        game_context = data["gameContext"]
    elif "game" in data:
        game_context = data["game"]
    elif "gameSchema" in data:
        game_context = data["gameSchema"]
    
    # Extract user inputs from multiple possible sources
    user_inputs = None
    if "userInputs" in data:
        user_inputs = data["userInputs"]
    elif "user_inputs" in data:
        user_inputs = data["user_inputs"]
    elif "responses" in data:
        user_inputs = data["responses"]
    elif "answers" in data:
        user_inputs = data["answers"]
    elif "questionAnswerPairs" in data:
        user_inputs = data["questionAnswerPairs"]
    
    # Extract game details from context or direct fields
    game_title = data.get("game_title", "")
    game_type = data.get("game_type", "")
    game_theme = data.get("game_theme", "")
    game_description = data.get("game_description", "")
    
    # If we have game context, extract details from it
    if game_context and isinstance(game_context, dict):
        game_title = game_title or game_context.get("title", "Unknown Game")
        game_type = game_type or game_context.get("type", "unknown")
        game_theme = game_theme or game_context.get("theme", "General Wellness")
        game_description = game_description or game_context.get("description", "A therapeutic game experience")
    
    # Extract performance metrics
    score = data.get("score", 0)
    max_score = data.get("max_score", data.get("maxScore", 100))
    time_spent = data.get("time_spent", data.get("timeSpent", 0))
    accuracy = data.get("accuracy", 0.0)
    
    # Build the analysis prompt with extracted data
    prompt = ANALYZER_PROMPT_TEMPLATE.format(
        game_title=game_title,
        game_type=game_type,
        game_theme=game_theme,
        game_description=game_description,
        user_inputs=json.dumps(user_inputs, indent=2) if user_inputs else "No specific responses recorded",
        score=score,
        max_score=max_score,
        time_spent=time_spent,
        accuracy=accuracy
    )

    raw = await call_model(prompt)
    cleaned = strip_code_fences(raw)

    try:
        analysis_json = json.loads(cleaned)
    except Exception as e:
        raise HTTPException(status_code=502, detail={
            "message": "Model did not return valid JSON",
            "error": str(e),
            "raw_excerpt": cleaned[:500]
        })

    return analysis_json