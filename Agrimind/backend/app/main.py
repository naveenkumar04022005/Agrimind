import os
import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.farms import router as farms_router
from app.api.weather import router as weather_router
from app.api.crops import router as crops_router
from app.api.fertilizer import router as fertilizer_router
from app.api.crop_health import router as crop_health_router
from app.api.crop_cycles import router as crop_cycles_router
from app.api.assistant import router as assistant_router

# Configure structured application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("agrimind.main")

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Agrimind AI Backend API for Precision Agriculture & Microclimate Analytics (Local Architecture)",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# Ensure uploads directory exists and mount static route for locally stored crop health photos
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# Global Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Clean validation error response without internal stack trace."""
    errors = exc.errors()
    msg = errors[0].get("msg") if errors else "Invalid request data"
    logger.warning(f"Request validation error on {request.url.path}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": msg},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Sanitizes unexpected internal errors to prevent leaking server details or secrets."""
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# Register API Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(farms_router)
app.include_router(weather_router)
app.include_router(crops_router)
app.include_router(fertilizer_router)
app.include_router(crop_health_router)
app.include_router(crop_cycles_router)
app.include_router(assistant_router)


@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} on Local PostgreSQL Architecture")
    logger.info(f"Allowed CORS origins: {settings.cors_origins}")
    logger.info(f"Local file uploads directory: {settings.UPLOAD_DIR}")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.PROJECT_NAME}")
