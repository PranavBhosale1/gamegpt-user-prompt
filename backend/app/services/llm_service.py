"""
LLM Service - Gemini Only
Equivalent to the "Basic LLM Chain" node in the n8n workflow
Handles communication with Google Gemini API
"""

import logging
import json
import asyncio
from typing import Dict, Any, Optional
import httpx
from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class LLMService:
    """Service for handling Gemini API calls"""
    
    def __init__(self):
        self.settings = get_settings()
        self.logger = logger
        self.client = httpx.AsyncClient(timeout=self.settings.REQUEST_TIMEOUT)
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for Gemini service"""
        try:
            if self.settings.GOOGLE_API_KEY:
                return {"status": "healthy", "provider": "gemini", "service": "llm"}
            else:
                return {"status": "unhealthy", "provider": "gemini", "service": "llm", "error": "No Gemini API key configured"}
        except Exception as e:
            return {"status": "unhealthy", "provider": "gemini", "service": "llm", "error": str(e)}
    
    async def generate_response(self, prompt: str) -> str:
        """
        Generate response from Gemini - equivalent to Basic LLM Chain node
        """
        self.logger.info("Generating response using Gemini API")
        
        try:
            return await self._call_gemini(prompt)
                
        except Exception as e:
            self.logger.error(f"Gemini generation failed: {str(e)}")
            raise Exception(f"Gemini generation failed: {str(e)}")
    
    async def _call_gemini(self, prompt: str) -> str:
        """Call Google Gemini API"""
        if not self.settings.GOOGLE_API_KEY:
            raise ValueError("Gemini API key not configured")
        
        # Gemini API endpoint
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.settings.GOOGLE_MODEL}:generateContent"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": self.settings.TEMPERATURE,
                "maxOutputTokens": self.settings.MAX_TOKENS
            }
        }
        
        params = {"key": self.settings.GOOGLE_API_KEY}
        
        self.logger.debug(f"Calling Gemini API with model: {self.settings.GOOGLE_MODEL}")
        
        response = await self.client.post(
            url,
            headers=headers,
            json=payload,
            params=params
        )
        
        if response.status_code != 200:
            error_text = response.text
            self.logger.error(f"Gemini API error: {response.status_code} - {error_text}")
            raise Exception(f"Gemini API error: {response.status_code} - {error_text}")
            
        result = response.json()
        
        # Extract the generated text from Gemini response
        try:
            generated_text = result["candidates"][0]["content"]["parts"][0]["text"]
            self.logger.debug(f"Successfully received response from Gemini (length: {len(generated_text)} chars)")
            return generated_text
        except (KeyError, IndexError) as e:
            self.logger.error(f"Unexpected Gemini response format: {result}")
            raise Exception(f"Unexpected Gemini response format: {str(e)}")
