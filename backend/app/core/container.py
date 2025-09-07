"""
Dependency Injection Container for GameGPT Backend
Manages service dependencies and provides clean dependency injection
"""

from typing import Dict, Any, Optional
from functools import lru_cache
import logging

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.services.prompt_builder import PromptBuilder
from app.services.llm_service import LLMService
from app.services.response_processor import ResponseProcessor

logger = get_logger(__name__)


class ServiceContainer:
    """Dependency injection container for services"""
    
    def __init__(self):
        self.settings = get_settings()
        self.logger = logger
        self._services: Dict[str, Any] = {}
        self._initialized = False
    
    def initialize(self) -> None:
        """Initialize all services"""
        if self._initialized:
            return
            
        self.logger.info("Initializing service container...")
        
        # Initialize services in dependency order
        self._services['prompt_builder'] = PromptBuilder()
        self._services['llm_service'] = LLMService()
        self._services['response_processor'] = ResponseProcessor()
        
        self._initialized = True
        self.logger.info("Service container initialized successfully")
    
    def get_prompt_builder(self) -> PromptBuilder:
        """Get PromptBuilder service"""
        if not self._initialized:
            self.initialize()
        return self._services['prompt_builder']
    
    def get_llm_service(self) -> LLMService:
        """Get LLMService"""
        if not self._initialized:
            self.initialize()
        return self._services['llm_service']
    
    def get_response_processor(self) -> ResponseProcessor:
        """Get ResponseProcessor service"""
        if not self._initialized:
            self.initialize()
        return self._services['response_processor']
    
    async def health_check_all(self) -> Dict[str, Any]:
        """Perform health check on all services"""
        if not self._initialized:
            return {"status": "unhealthy", "error": "Services not initialized"}
        
        health_status = {
            "status": "healthy",
            "timestamp": None,
            "services": {}
        }
        
        try:
            # Check each service
            health_status["services"]["prompt_builder"] = self.get_prompt_builder().health_check()
            health_status["services"]["llm_service"] = await self.get_llm_service().health_check()
            health_status["services"]["response_processor"] = self.get_response_processor().health_check()
            
            # Check if any service is unhealthy
            for service_name, service_health in health_status["services"].items():
                if service_health.get("status") != "healthy":
                    health_status["status"] = "degraded"
                    
        except Exception as e:
            self.logger.error(f"Health check failed: {str(e)}")
            health_status["status"] = "unhealthy"
            health_status["error"] = str(e)
        
        return health_status
    
    def shutdown(self) -> None:
        """Shutdown all services"""
        self.logger.info("Shutting down service container...")
        
        # Close any async resources
        if 'llm_service' in self._services:
            llm_service = self._services['llm_service']
            if hasattr(llm_service, 'client'):
                # Note: This would need to be handled properly in async context
                pass
        
        self._services.clear()
        self._initialized = False
        self.logger.info("Service container shutdown complete")


# Global service container instance
@lru_cache()
def get_service_container() -> ServiceContainer:
    """Get the global service container instance"""
    return ServiceContainer()
