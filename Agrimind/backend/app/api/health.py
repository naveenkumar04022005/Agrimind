from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["System"])
@router.get("/api/health", tags=["System"])
async def health_check():
    """Service health and liveness probe."""
    return {
        "status": "healthy",
        "service": "Agrimind API",
    }
