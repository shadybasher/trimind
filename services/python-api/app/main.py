"""Main FastAPI application with lifespan manager for singleton model loading."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models import LLMLinguaModel
from app.routers import intent_router, compression_router, jobs_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager to load models on startup and clean up on shutdown."""
    # Startup: Load LLMLingua-2 model as singleton
    print(f"Loading LLMLingua-2 model: {settings.llmlingua_model_name}")
    LLMLinguaModel.get_instance()
    print("Model loaded successfully")

    yield

    # Shutdown: Cleanup if needed
    print("Shutting down Python API service")


# Create FastAPI application
app = FastAPI(
    title=settings.service_name,
    description="Python microservice for AI processing (LLMLingua-2 + Intent Router)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for Next.js communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": settings.service_name,
        "status": "healthy",
        "model_loaded": LLMLinguaModel.is_loaded(),
    }


@app.get("/health")
async def health():
    """Detailed health check with model status."""
    return {
        "status": "healthy",
        "models": {
            "llmlingua": LLMLinguaModel.is_loaded(),
        },
    }


# Include routers
app.include_router(intent_router.router, prefix=settings.api_v1_prefix, tags=["intent"])
app.include_router(compression_router.router, prefix=settings.api_v1_prefix, tags=["compression"])
app.include_router(jobs_router.router, prefix=settings.api_v1_prefix, tags=["jobs"])
