from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime
import structlog

# Setup logging
logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Analytics Service", version="1.0.0")
    logger.info("Services initialization skipped")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Analytics Service")

# Create FastAPI app
app = FastAPI(
    title="Claude Analytics Service",
    description="Analytics and reporting service for Claude Talimat system",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root() -> dict:
    """Root endpoint returning service information."""
    return {
        "service": "Claude Analytics Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check() -> JSONResponse:
    """Health check endpoint for service monitoring."""
    try:
        health_status = {
            "status": "healthy",
            "service": "analytics-service",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {
                "database": "not_implemented",
                "analytics": "healthy"
            }
        }
        
        return JSONResponse(content=health_status, status_code=200)
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return JSONResponse(
            content={
                "status": "unhealthy",
                "service": "analytics-service",
                "error": str(e)
            },
            status_code=503
        )

@app.get("/analytics/dashboard")
async def get_dashboard() -> dict:
    """Get dashboard analytics - Simplified mock data."""
    return {
        "total_documents": 156,
        "total_users": 24,
        "total_downloads": 1247,
        "total_views": 3421,
        "popular_categories": [
            {"name": "Güvenlik", "count": 45},
            {"name": "Prosedür", "count": 32},
            {"name": "Eğitim", "count": 28}
        ]
    }

@app.get("/analytics/reports")
async def get_reports():
    """Get analytics reports - Simplified"""
    return {
        "reports": [
            {
                "id": "1",
                "name": "Aylık Kullanım Raporu",
                "type": "monthly",
                "status": "completed"
            }
        ]
    }

# Server startup
if __name__ == "__main__":
    import uvicorn
    print("🚀 Analytics Service starting on port 8003")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8003,
        reload=True,
        log_level="info"
    )
