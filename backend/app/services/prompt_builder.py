"""
Prompt Builder Service
Equivalent to the "Edit Fields" node in the n8n workflow
Builds the comprehensive therapeutic prompt for AI game generation
"""

import logging
from typing import Dict, Any
from app.core.logging_config import get_logger
from app.services.prompt_templates import PromptBuilder as ModularPromptBuilder

logger = get_logger(__name__)


class PromptBuilder:
    """Builds comprehensive therapeutic prompts for game generation"""
    
    def __init__(self):
        self.logger = logger
        self.modular_builder = ModularPromptBuilder()
        
    def health_check(self) -> Dict[str, Any]:
        """Health check for prompt builder service"""
        return {"status": "healthy", "service": "prompt_builder"}
    
    def build_full_prompt(self, user_prompt: str) -> str:
        """
        Build the full therapeutic prompt - equivalent to Edit Fields node
        Uses modular templates for better maintainability
        """
        self.logger.info(f"Building full prompt for user request: {user_prompt[:100]}...")
        
        try:
            full_prompt = self.modular_builder.build_full_prompt(user_prompt)
            self.logger.debug(f"Generated full prompt of length: {len(full_prompt)}")
            return full_prompt
        except Exception as e:
            self.logger.error(f"Failed to build prompt: {str(e)}")
            raise Exception(f"Prompt building failed: {str(e)}")