"""Main FastAPI application with lifespan manager - SQLModel Edition.

RC#15 Fix: Async Model Loading Architecture
- Models load in background (non-blocking)
- Health endpoint reports readiness status
- Graceful startup with 503 -> 200 transition
"""

from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models import LLMLinguaModel
from app.routers import intent_router, compression_router, jobs_router
from app.database import init_db, close_db
import logging

logger = logging.getLogger(__name__)


async def load_models_background(app: FastAPI):
    """
    Background task to load heavy ML models asynchronously.

    This function runs in the background and does NOT block server startup.
    The health endpoint will report 503 until this completes.

    RC#15 Fix: Prevents health check timeouts by decoupling model loading
    from server initialization.
    """
    try:
        logger.info(
            f"[Background] Loading LLMLingua-2 model: {settings.llmlingua_model_name}"
        )
        LLMLinguaModel.get_instance()
        logger.info("✓ Model loaded successfully")

        # Set readiness flag
        app.state.models_ready = True
        logger.info("=" * 60)
        logger.info("Trimind Python API Service READY")
        logger.info("=" * 60)
    except Exception as e:
        logger.error(f"✗ Failed to load models: {str(e)}", exc_info=True)
        app.state.models_ready = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan manager for startup and shutdown tasks.

    RC#15 Fix: Database init is synchronous (fast), model loading is async (slow).
    Server becomes healthy immediately, models load in background.
    """
    # Startup Tasks
    logger.info("=" * 60)
    logger.info("Starting Trimind Python API Service")
    logger.info("=" * 60)

    # Initialize readiness flag (models NOT ready yet)
    app.state.models_ready = False

    # 1. Initialize Database (SQLModel - create tables if not exist) - FAST
    logger.info("[1/2] Initializing database (SQLModel)...")
    await init_db()
    logger.info("✓ Database initialized successfully")

    # 2. Load LLMLingua-2 model in BACKGROUND (non-blocking) - SLOW
    logger.info("[2/2] Starting model loading in background...")
    asyncio.create_task(load_models_background(app))
    logger.info("✓ Model loading task started (runs in background)")

    logger.info("=" * 60)
    logger.info("Server ready (models loading in background)")
    logger.info("=" * 60)

    yield

    # Shutdown Tasks
    logger.info("Shutting down Python API service...")
    await close_db()
    logger.info("✓ Database connections closed")


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
async def health(response: Response):
    """
    Smart health check endpoint with readiness detection.

    RC#15 Fix: Returns 503 while models are loading, 200 when ready.
    Docker health checks will wait for true readiness, not just server up.

    Returns:
        200 OK: Service fully ready (models loaded)
        503 Service Unavailable: Service starting (models loading)
    """
    # Check if models are ready
    models_ready = getattr(app.state, "models_ready", False)

    if not models_ready:
        # Models still loading - return 503
        response.status_code = 503
        return {
            "status": "loading_models",
            "message": "Service is starting, ML models loading in background",
            "models": {
                "llmlingua": False,
            },
        }

    # Models ready - return 200 OK
    return {
        "status": "healthy",
        "message": "Service fully operational",
        "models": {
            "llmlingua": LLMLinguaModel.is_loaded(),
        },
    }


# Include routers
app.include_router(intent_router.router, prefix=settings.api_v1_prefix, tags=["intent"])
app.include_router(
    compression_router.router, prefix=settings.api_v1_prefix, tags=["compression"]
)
app.include_router(jobs_router.router, prefix=settings.api_v1_prefix, tags=["jobs"])
