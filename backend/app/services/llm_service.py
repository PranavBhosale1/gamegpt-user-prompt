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
from app.core.exceptions import ExternalServiceException, ErrorCode

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
            if not self.settings.GOOGLE_API_KEY:
                return {
                    "status": "unhealthy", 
                    "provider": "gemini", 
                    "service": "llm", 
                    "error": "No Gemini API key configured"
                }
            
            # Test API connectivity with a minimal request
            test_payload = {
                "contents": [{"parts": [{"text": "test"}]}],
                "generationConfig": {"maxOutputTokens": 10}
            }
            
            response = await self.client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{self.settings.GOOGLE_MODEL}:generateContent",
                headers={"Content-Type": "application/json"},
                json=test_payload,
                params={"key": self.settings.GOOGLE_API_KEY}
            )
            
            if response.status_code == 200:
                return {"status": "healthy", "provider": "gemini", "service": "llm"}
            else:
                return {
                    "status": "unhealthy", 
                    "provider": "gemini", 
                    "service": "llm", 
                    "error": f"API test failed with status {response.status_code}"
                }
                
        except Exception as e:
            return {
                "status": "unhealthy", 
                "provider": "gemini", 
                "service": "llm", 
                "error": str(e)
            }
    
    async def generate_response(self, prompt: str) -> str:
        """
        Generate response from Gemini - equivalent to Basic LLM Chain node
        """
        self.logger.info("Generating response using Gemini API")
        
        try:
            return await self._call_gemini(prompt)
                
        except ExternalServiceException:
            # Re-raise external service exceptions as-is
            raise
        except Exception as e:
            self.logger.error(f"Gemini generation failed: {str(e)}")
            raise ExternalServiceException(
                message=f"Gemini generation failed: {str(e)}",
                error_code=ErrorCode.GEMINI_API_ERROR.value,
                service_name="gemini",
                details={"operation": "generate_response"}
            )
    
    async def _call_gemini(self, prompt: str) -> str:
        """Call Google Gemini API with proper error handling"""
        if not self.settings.GOOGLE_API_KEY:
            raise ExternalServiceException(
                message="Gemini API key not configured",
                error_code=ErrorCode.CONFIGURATION_ERROR.value,
                service_name="gemini",
                details={"operation": "generate_response"}
            )
        
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
        
        try:
            response = await self.client.post(
                url,
                headers=headers,
                json=payload,
                params=params
            )
            
            if response.status_code != 200:
                error_text = response.text
                self.logger.error(f"Gemini API error: {response.status_code} - {error_text}")
                
                # Map specific error codes
                if response.status_code == 429:
                    raise ExternalServiceException(
                        message="Rate limit exceeded for Gemini API",
                        error_code=ErrorCode.GEMINI_RATE_LIMIT.value,
                        service_name="gemini",
                        status_code=response.status_code,
                        details={"retry_after": "60s"}
                    )
                elif response.status_code == 403:
                    raise ExternalServiceException(
                        message="API quota exceeded for Gemini",
                        error_code=ErrorCode.GEMINI_QUOTA_EXCEEDED.value,
                        service_name="gemini",
                        status_code=response.status_code
                    )
                else:
                    raise ExternalServiceException(
                        message=f"Gemini API error: {response.status_code}",
                        error_code=ErrorCode.GEMINI_API_ERROR.value,
                        service_name="gemini",
                        status_code=response.status_code,
                        details={"error_text": error_text}
                    )
                
            result = response.json()
            
            # Extract the generated text from Gemini response
            try:
                generated_text = result["candidates"][0]["content"]["parts"][0]["text"]
                self.logger.debug(f"Successfully received response from Gemini (length: {len(generated_text)} chars)")
                return generated_text
            except (KeyError, IndexError) as e:
                self.logger.error(f"Unexpected Gemini response format: {result}")
                raise ExternalServiceException(
                    message=f"Unexpected Gemini response format: {str(e)}",
                    error_code=ErrorCode.GEMINI_API_ERROR.value,
                    service_name="gemini",
                    details={"response_structure": str(result)}
                )
                
        except httpx.TimeoutException:
            raise ExternalServiceException(
                message="Gemini API request timed out",
                error_code=ErrorCode.TIMEOUT_ERROR.value,
                service_name="gemini",
                details={"timeout": self.settings.REQUEST_TIMEOUT}
            )
        except httpx.ConnectError:
            raise ExternalServiceException(
                message="Failed to connect to Gemini API",
                error_code=ErrorCode.GEMINI_API_ERROR.value,
                service_name="gemini",
                details={"operation": "connection"}
            )
