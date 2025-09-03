"""
Response Processor Service
Equivalent to the "Code" node in the n8n workflow
Processes and validates LLM responses into game schemas
"""

import json
import re
import logging
from typing import Dict, Any
from datetime import datetime
from app.models.game_schemas import GameSchema
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class ResponseProcessor:
    """Processes LLM responses into validated game schemas"""
    
    def __init__(self):
        self.logger = logger
    
    def health_check(self) -> Dict[str, Any]:
        """Health check for response processor service"""
        return {"status": "healthy", "service": "response_processor"}
    
    def process_response(self, raw_response: str) -> GameSchema:
        """
        Process LLM response into GameSchema - equivalent to Code node
        This replicates the exact logic from the n8n Code node
        """
        self.logger.info("Processing LLM response...")
        
        try:
            # Clean up potential markdown code fences (exact logic from n8n Code node)
            cleaned_text = self._clean_markdown_fences(raw_response)
            
            # Parse the cleaned text into a real JSON object
            json_data = self._parse_json(cleaned_text)
            
            # Validate and convert to GameSchema
            game_schema = self._validate_game_schema(json_data)
            
            self.logger.info(f"Successfully processed response into game: {game_schema.id}")
            return game_schema
            
        except Exception as e:
            self.logger.error(f"Failed to process response: {str(e)}")
            raise Exception(f"Failed to process LLM response: {str(e)}")
    
    def _clean_markdown_fences(self, raw_text: str) -> str:
        """
        Clean up potential markdown code fences
        Exact logic from n8n Code node
        """
        self.logger.debug("Cleaning markdown fences from response...")
        
        # Remove leading/trailing whitespace
        raw_text = raw_text.strip()
        
        # Handle ```json and ``` fences (exact logic from n8n)
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()  # Remove ```json from start and ``` from end
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()   # Remove ``` from start and end
        
        # Additional cleaning for other common LLM artifacts
        raw_text = self._remove_additional_artifacts(raw_text)
        
        return raw_text
    
    def _remove_additional_artifacts(self, text: str) -> str:
        """Remove additional LLM response artifacts"""
        # Remove common prefixes
        prefixes_to_remove = [
            "Here's the JSON:",
            "Here is the JSON:",
            "JSON:",
            "Response:",
            "Game:",
            "```json",
            "```"
        ]
        
        for prefix in prefixes_to_remove:
            if text.startswith(prefix):
                text = text[len(prefix):].strip()
        
        # Remove common suffixes
        suffixes_to_remove = [
            "```",
            "End of JSON",
            "That's it!",
            "Hope this helps!"
        ]
        
        for suffix in suffixes_to_remove:
            if text.endswith(suffix):
                text = text[:-len(suffix)].strip()
        
        # Remove any remaining markdown artifacts
        text = re.sub(r'^```[a-zA-Z]*\n?', '', text)  # Remove opening code blocks
        text = re.sub(r'\n?```$', '', text)           # Remove closing code blocks
        
        return text
    
    def _parse_json(self, cleaned_text: str) -> Dict[str, Any]:
        """Parse cleaned text into JSON object"""
        self.logger.debug("Parsing cleaned text as JSON...")
        
        try:
            json_data = json.loads(cleaned_text)
            return json_data
        except json.JSONDecodeError as e:
            self.logger.error(f"JSON parsing failed: {str(e)}")
            self.logger.debug(f"Problematic text (first 500 chars): {cleaned_text[:500]}")
            
            # Attempt to fix common JSON issues
            fixed_text = self._attempt_json_fix(cleaned_text)
            try:
                return json.loads(fixed_text)
            except json.JSONDecodeError:
                raise Exception(f"Invalid JSON in LLM response: {str(e)}")
    
    def _attempt_json_fix(self, text: str) -> str:
        """Attempt to fix common JSON formatting issues"""
        self.logger.debug("Attempting to fix JSON formatting issues...")
        
        # Common fixes
        fixes = [
            # Fix missing quotes around keys
            (r'(\w+):', r'"\1":'),
            # Fix single quotes to double quotes
            (r"'([^']*)'", r'"\1"'),
            # Fix trailing commas
            (r',(\s*[}\]])', r'\1'),
            # Fix missing commas between objects
            (r'}(\s*){', r'},\1{'),
        ]
        
        for pattern, replacement in fixes:
            text = re.sub(pattern, replacement, text)
        
        return text
    
    def _validate_game_schema(self, json_data: Dict[str, Any]) -> GameSchema:
        """Validate JSON data against GameSchema"""
        self.logger.debug("Validating game schema...")
        
        try:
            # Ensure required fields are present
            required_fields = [
                'id', 'title', 'description', 'type', 'difficulty', 
                'category', 'estimatedTime', 'config', 'content', 
                'scoring', 'ui', 'theme'
            ]
            
            for field in required_fields:
                if field not in json_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Ensure generatedAt is present and properly formatted
            if 'generatedAt' not in json_data:
                json_data['generatedAt'] = datetime.now().isoformat()
            
            # Ensure version is present
            if 'version' not in json_data:
                json_data['version'] = "1.0"
            
            # Validate and create GameSchema
            game_schema = GameSchema(**json_data)
            
            # Additional validation
            self._validate_content_structure(game_schema)
            
            return game_schema
            
        except Exception as e:
            self.logger.error(f"Schema validation failed: {str(e)}")
            raise Exception(f"Invalid game schema: {str(e)}")
    
    def _validate_content_structure(self, game_schema: GameSchema) -> None:
        """Validate game content structure based on game type"""
        self.logger.debug(f"Validating content structure for game type: {game_schema.type}")
        
        content = game_schema.content
        game_type = game_schema.type
        
        # Validate content structure based on game type
        validation_rules = {
            'quiz': self._validate_quiz_content,
            'drag-drop': self._validate_drag_drop_content,
            'memory-match': self._validate_memory_match_content,
            'sorting': self._validate_sorting_content,
            'matching': self._validate_matching_content,
            'story-sequence': self._validate_story_sequence_content,
            'fill-blank': self._validate_fill_blank_content,
            'card-flip': self._validate_card_flip_content,
            'word-puzzle': self._validate_word_puzzle_content,
            'puzzle-assembly': self._validate_puzzle_assembly_content,
            'anxiety-adventure': self._validate_anxiety_adventure_content
        }
        
        if game_type in validation_rules:
            validation_rules[game_type](content)
        else:
            self.logger.warning(f"No validation rule for game type: {game_type}")
    
    def _validate_quiz_content(self, content: Dict[str, Any]) -> None:
        """Validate quiz game content"""
        if 'questions' not in content:
            raise ValueError("Quiz content must have 'questions' field")
        
        questions = content['questions']
        if not isinstance(questions, list) or len(questions) == 0:
            raise ValueError("Quiz must have at least one question")
        
        for question in questions:
            required_fields = ['id', 'question', 'type', 'options', 'correctAnswer', 'explanation']
            for field in required_fields:
                if field not in question:
                    raise ValueError(f"Quiz question missing field: {field}")
    
    def _validate_drag_drop_content(self, content: Dict[str, Any]) -> None:
        """Validate drag-drop game content"""
        required_fields = ['items', 'dropZones', 'instructions']
        for field in required_fields:
            if field not in content:
                raise ValueError(f"Drag-drop content missing field: {field}")
    
    def _validate_memory_match_content(self, content: Dict[str, Any]) -> None:
        """Validate memory match game content"""
        if 'pairs' not in content:
            raise ValueError("Memory match content must have 'pairs' field")
        
        pairs = content['pairs']
        if not isinstance(pairs, list) or len(pairs) == 0:
            raise ValueError("Memory match must have at least one pair")
    
    def _validate_sorting_content(self, content: Dict[str, Any]) -> None:
        """Validate sorting game content"""
        required_fields = ['items', 'categories', 'instructions']
        for field in required_fields:
            if field not in content:
                raise ValueError(f"Sorting content missing field: {field}")
    
    def _validate_matching_content(self, content: Dict[str, Any]) -> None:
        """Validate matching game content"""
        required_fields = ['leftItems', 'rightItems', 'instructions']
        for field in required_fields:
            if field not in content:
                raise ValueError(f"Matching content missing field: {field}")
    
    def _validate_story_sequence_content(self, content: Dict[str, Any]) -> None:
        """Validate story sequence game content"""
        required_fields = ['events', 'title', 'theme']
        for field in required_fields:
            if field not in content:
                raise ValueError(f"Story sequence content missing field: {field}")
    
    def _validate_fill_blank_content(self, content: Dict[str, Any]) -> None:
        """Validate fill blank game content"""
        if 'passages' not in content:
            raise ValueError("Fill blank content must have 'passages' field")
    
    def _validate_card_flip_content(self, content: Dict[str, Any]) -> None:
        """Validate card flip game content"""
        required_fields = ['cards', 'instructions']
        for field in required_fields:
            if field not in content:
                raise ValueError(f"Card flip content missing field: {field}")
    
    def _validate_word_puzzle_content(self, content: Dict[str, Any]) -> None:
        """Validate word puzzle game content"""
        required_fields = ['words', 'gridSize', 'theme']
        for field in required_fields:
            if field not in content:
                raise ValueError(f"Word puzzle content missing field: {field}")
    
    def _validate_puzzle_assembly_content(self, content: Dict[str, Any]) -> None:
        """Validate puzzle assembly game content"""
        required_fields = ['pieces', 'targetImage', 'gridSize']
        for field in required_fields:
            if field not in content:
                raise ValueError(f"Puzzle assembly content missing field: {field}")
    
    def _validate_anxiety_adventure_content(self, content: Dict[str, Any]) -> None:
        """Validate anxiety adventure game content"""
        required_fields = ['startId', 'scenarios']
        for field in required_fields:
            if field not in content:
                raise ValueError(f"Anxiety adventure content missing field: {field}")
