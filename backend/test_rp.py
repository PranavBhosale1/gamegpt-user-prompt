#!/usr/bin/env python3
"""
Simple test script to debug response processor issues
"""

import json
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_response_processor():
    try:
        print("Testing response processor...")
        
        # Test import
        from app.services.response_processor import ResponseProcessor
        print("✓ Response processor imported successfully")
        
        # Test simple JSON
        test_json = {
            'id': 'game-20241203-1234',
            'title': 'Test Game',
            'description': 'A test game',
            'type': 'quiz',
            'difficulty': 'easy',
            'category': 'mental-wellness',
            'estimatedTime': 10,
            'config': {
                'maxAttempts': 3,
                'showProgress': True,
                'allowRetry': True,
                'shuffleOptions': True,
                'showHints': True,
                'autoNext': False
            },
            'content': {
                'questions': [
                    {
                        'id': 'q1',
                        'question': 'Test question?',
                        'type': 'multiple-choice',
                        'options': ['A', 'B', 'C', 'D'],
                        'correctAnswer': 'A',
                        'explanation': 'Test explanation'
                    }
                ]
            },
            'scoring': {
                'maxScore': 100,
                'pointsPerCorrect': 10,
                'pointsPerIncorrect': 0,
                'bonusForSpeed': 0,
                'bonusForStreak': 0
            },
            'ui': {
                'theme': 'default',
                'layout': 'grid',
                'animations': True,
                'sounds': False,
                'particles': True
            },
            'theme': 'test-theme'
        }
        
        print("✓ Test JSON created")
        
        # Test response processor
        rp = ResponseProcessor()
        print("✓ Response processor instantiated")
        
        result = rp.process_response(json.dumps(test_json))
        print(f"✓ SUCCESS: Response processor works! Game ID: {result.id}")
        
        return True
        
    except Exception as e:
        print(f"✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_response_processor()
    sys.exit(0 if success else 1)
