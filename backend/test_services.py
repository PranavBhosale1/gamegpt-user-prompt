"""
Test script for GameGPT Backend - Gemini Edition
Simple test to verify the Gemini implementation works
"""

import asyncio
import json
from app.services.prompt_builder import PromptBuilder
from app.services.response_processor import ResponseProcessor
from app.models.game_schemas import GameGenerationRequest


async def test_services():
    """Test the individual services"""
    print("Testing GameGPT Backend Services (Gemini Edition)...")
    
    # Test Prompt Builder
    print("\n1. Testing Prompt Builder...")
    prompt_builder = PromptBuilder()
    
    test_request = "A quiz about recognizing and managing stress for teens"
    full_prompt = prompt_builder.build_full_prompt(test_request)
    
    print(f"✓ Prompt built successfully (length: {len(full_prompt)} chars)")
    print(f"Prompt preview: {full_prompt[:200]}...")
    
    # Test Response Processor with mock Gemini data
    print("\n2. Testing Response Processor...")
    response_processor = ResponseProcessor()
    
    # Mock Gemini response (example JSON)
    mock_gemini_response = """{
  "id": "game-20241203-1234",
  "title": "Teen Stress Management Quiz",
  "description": "Learn effective stress management techniques for teenagers",
  "type": "quiz",
  "difficulty": "medium",
  "category": "stress-reduction",
  "estimatedTime": 15,
  "config": {
    "maxAttempts": 3,
    "timeLimit": 900,
    "showProgress": true,
    "allowRetry": true,
    "shuffleOptions": true,
    "showHints": true,
    "autoNext": false
  },
  "content": {
    "questions": [
      {
        "id": "q1",
        "question": "Which of the following is a healthy way to manage stress?",
        "type": "multiple-choice",
        "options": ["Deep breathing exercises", "Avoiding all stressful situations", "Staying up late", "Skipping meals"],
        "correctAnswer": "Deep breathing exercises",
        "explanation": "Deep breathing activates the body's relaxation response and helps calm the nervous system.",
        "hint": "Think about techniques that help your body relax."
      }
    ]
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
    "animations": true,
    "sounds": false,
    "particles": true
  },
  "version": "1.0",
  "theme": "stress-management"
}"""
    
    try:
        game_schema = response_processor.process_response(mock_gemini_response)
        print(f"✓ Response processed successfully")
        print(f"Game ID: {game_schema.id}")
        print(f"Game Title: {game_schema.title}")
        print(f"Game Type: {game_schema.type}")
        print(f"Questions: {len(game_schema.content.get('questions', []))}")
    except Exception as e:
        print(f"✗ Response processing failed: {e}")
        return
    
    # Test validation
    print("\n3. Testing Request Validation...")
    try:
        request = GameGenerationRequest(prompt=test_request)
        print(f"✓ Request validation successful: {request.prompt}")
    except Exception as e:
        print(f"✗ Request validation failed: {e}")
        return
    
    print("\n✓ All tests passed! Gemini backend services are working correctly.")
    print("\nNext steps:")
    print("1. Get your Gemini API key from: https://aistudio.google.com/app/apikey")
    print("2. Set up your .env file with: GOOGLE_API_KEY=your_key_here")
    print("3. Run: python main.py")
    print("4. Visit: http://localhost:8000/docs")
    print("5. Test with: curl -X POST http://localhost:8000/generate -H 'Content-Type: application/json' -d '{\"prompt\": \"A quiz about stress management\"}'")


if __name__ == "__main__":
    asyncio.run(test_services())
