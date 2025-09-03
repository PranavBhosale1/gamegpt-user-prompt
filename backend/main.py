"""
GameGPT Backend - FastAPI Implementation (Gemini Only)
Converts n8n workflow logic into modular Python FastAPI application
Uses Google Gemini as the only LLM provider
"""

import json
import re
from datetime import datetime
from typing import Optional, Dict, Any
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv
import os

# Import custom modules
from app.models.game_schemas import GameGenerationRequest, GameSchema
from app.services.prompt_builder import PromptBuilder
from app.services.llm_service import LLMService
from app.services.response_processor import ResponseProcessor
from app.core.config import get_settings
from app.core.logging_config import setup_logging

# Load environment variables
load_dotenv()

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="GameGPT Backend API",
    description="AI-powered therapeutic game generation service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Get application settings
settings = get_settings()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
prompt_builder = PromptBuilder()
llm_service = LLMService()
response_processor = ResponseProcessor()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "GameGPT Backend API",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "llm": await llm_service.health_check(),
            "prompt_builder": prompt_builder.health_check(),
            "response_processor": response_processor.health_check()
        }
    }


@app.post("/generate", response_model=GameSchema)
async def generate_game(request: GameGenerationRequest):
    """
    Main game generation endpoint - equivalent to n8n workflow
    
    This endpoint replicates the n8n workflow:
    1. Webhook receives request (this endpoint)
    2. Edit Fields builds the full prompt
    3. LLM Chain processes the prompt
    4. Code cleans and parses the response
    """
    try:
        logger.info(f"Received game generation request: {request.prompt[:100]}...")
        
        # Step 1: Build the full therapeutic prompt (equivalent to Edit Fields node)
        logger.info("Building therapeutic prompt...")
        full_prompt = prompt_builder.build_full_prompt(request.prompt)
        
        # Step 2: Process through LLM (equivalent to Basic LLM Chain node)
        logger.info("Processing through LLM...")
        raw_response = await llm_service.generate_response(full_prompt)
        
        # Step 3: Clean and parse response (equivalent to Code node)
        logger.info("Processing LLM response...")
        game_schema = response_processor.process_response(raw_response)
        
        logger.info(f"Successfully generated game: {game_schema.id}")
        return game_schema
        
    except Exception as e:
        logger.error(f"Error generating game: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate game: {str(e)}"
        )


@app.post("/generate/debug")
async def generate_game_debug(request: GameGenerationRequest):
    """
    Debug endpoint that returns intermediate steps
    """
    try:
        logger.info(f"Debug generation request: {request.prompt[:100]}...")
        
        # Step 1: Build prompt
        full_prompt = prompt_builder.build_full_prompt(request.prompt)
        
        # Step 2: Get LLM response
        raw_response = await llm_service.generate_response(full_prompt)
        
        # Step 3: Process response
        game_schema = response_processor.process_response(raw_response)
        
        return {
            "request": request.dict(),
            "full_prompt": full_prompt[:500] + "..." if len(full_prompt) > 500 else full_prompt,
            "raw_response": raw_response[:500] + "..." if len(raw_response) > 500 else raw_response,
            "final_game": game_schema.dict()
        }
        
    except Exception as e:
        logger.error(f"Debug generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Debug generation failed: {str(e)}"
        )


@app.get("/stats")
async def get_stats():
    """Get API usage statistics"""
    return {
        "total_requests": "Not implemented",
        "successful_generations": "Not implemented", 
        "error_rate": "Not implemented",
        "avg_response_time": "Not implemented"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
