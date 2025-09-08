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

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv
import os

# Import custom modules
from app.models.game_schemas import GameGenerationRequest, GameSchema
from app.core.container import get_service_container, ServiceContainer
from app.core.config import get_settings
from app.core.logging_config import setup_logging
from app.core.exceptions import (
    handle_service_error, 
    handle_validation_error, 
    handle_external_service_error,
    create_error_response,
    ErrorCode
)

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

# Dependency injection for services
def get_services() -> ServiceContainer:
    """Dependency injection for service container"""
    return get_service_container()


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting GameGPT Backend API...")
    container = get_service_container()
    container.initialize()
    logger.info("Service container initialized successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down GameGPT Backend API...")
    container = get_service_container()
    container.shutdown()
    logger.info("Shutdown complete")


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
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
async def health_check(services: ServiceContainer = Depends(get_services)):
    """Detailed health check with dependency injection"""
    try:
        health_status = await services.health_check_all()
        return health_status
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }


@app.post("/generate", response_model=GameSchema)
async def generate_game(
    request: GameGenerationRequest,
    services: ServiceContainer = Depends(get_services)
):
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
        try:
            full_prompt = services.get_prompt_builder().build_full_prompt(request.prompt)
        except Exception as e:
            raise handle_service_error(e, "prompt_builder", "build_full_prompt")
        
        # Step 2: Process through LLM (equivalent to Basic LLM Chain node)
        logger.info("Processing through LLM...")
        try:
            raw_response = await services.get_llm_service().generate_response(full_prompt)
        except Exception as e:
            raise handle_external_service_error(e, "gemini", getattr(e, 'status_code', None))
        
        # Step 3: Clean and parse response (equivalent to Code node)
        logger.info("Processing LLM response...")
        try:
            game_schema = services.get_response_processor().process_response(raw_response)
        except Exception as e:
            raise handle_service_error(e, "response_processor", "process_response")
        
        logger.info(f"Successfully generated game: {game_schema.id}")
        return game_schema
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error generating game: {str(e)}")
        raise create_error_response(
            error_code=ErrorCode.INTERNAL_ERROR,
            message="Internal server error during game generation",
            details={"error": str(e)},
            status_code=500
        )


@app.post("/generate/debug")
async def generate_game_debug(
    request: GameGenerationRequest,
    services: ServiceContainer = Depends(get_services)
):
    """
    Debug endpoint that returns intermediate steps
    """
    try:
        logger.info(f"Debug generation request: {request.prompt[:100]}...")
        
        # Step 1: Build prompt
        try:
            full_prompt = services.get_prompt_builder().build_full_prompt(request.prompt)
        except Exception as e:
            raise handle_service_error(e, "prompt_builder", "build_full_prompt")
        
        # Step 2: Get LLM response
        try:
            raw_response = await services.get_llm_service().generate_response(full_prompt)
        except Exception as e:
            raise handle_external_service_error(e, "gemini", getattr(e, 'status_code', None))
        
        # Step 3: Process response
        try:
            game_schema = services.get_response_processor().process_response(raw_response)
        except Exception as e:
            raise handle_service_error(e, "response_processor", "process_response")
        
        return {
            "request": request.dict(),
            "full_prompt": full_prompt[:500] + "..." if len(full_prompt) > 500 else full_prompt,
            "raw_response": raw_response[:500] + "..." if len(raw_response) > 500 else raw_response,
            "final_game": game_schema.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Debug generation error: {str(e)}")
        raise create_error_response(
            error_code=ErrorCode.INTERNAL_ERROR,
            message="Debug generation failed",
            details={"error": str(e)},
            status_code=500
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
