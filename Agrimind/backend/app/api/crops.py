import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models.user import User
from app.db.models.crop import CropRecommendation
from app.schemas.crop import CropRecommendRequest, AgrimindEngineResponse
from app.services.farm_service import farm_service
from app.services.weather_service import weather_service
from app.services.crop_service import crop_service

logger = logging.getLogger("agrimind.api.crops")

router = APIRouter(prefix="/api/crops", tags=["Crop & Fertilizer Engine"])


class SaveCropRecommendationRequest(BaseModel):
    farm_id: str
    recommended_crop_name: str
    confidence_score: float
    alternatives: List[Dict[str, Any]]
    rationale: Optional[str] = None


@router.post(
    "/recommend",
    response_model=AgrimindEngineResponse,
    summary="Generate ML crop recommendations and precision fertilizer plan",
)
async def get_crop_recommendations(
    request: CropRecommendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AgrimindEngineResponse:
    """
    Synthesizes soil chemistry, real-time farm weather telemetry, and agronomic models
    to deliver high-confidence crop suggestions and NPK fertilizer dosages.
    Stores recommendation record into local PostgreSQL.
    """
    farm_data = None
    weather_data = None
    resolved_farm_id = request.farm_id

    if request.auto_fetch_farm_data:
        farm = None
        if request.farm_id:
            farm = farm_service.get_farm_by_id(
                farm_id=request.farm_id, user_id=current_user.id, db=db
            )
        else:
            farm = farm_service.get_user_farm(user_id=current_user.id, db=db)

        if farm:
            resolved_farm_id = farm.id
            farm_data = farm.model_dump()

            if farm.latitude and farm.longitude:
                try:
                    weather = await weather_service.get_weather(
                        latitude=farm.latitude,
                        longitude=farm.longitude,
                        farm_id=farm.id,
                        farm_name=farm.farm_name,
                    )
                    weather_data = {
                        "temperature": weather.current.temperature,
                        "humidity": weather.current.humidity,
                        "precipitation": weather.current.precipitation,
                    }
                except Exception as e:
                    logger.warning(f"Could not load live weather for crop engine: {e}")

    result = await crop_service.execute_engine(
        request=request,
        farm_data=farm_data,
        weather_data=weather_data,
    )

    # Persist the primary recommendation to local PostgreSQL
    if resolved_farm_id and result.recommended_crops:
        top_crop = result.recommended_crops[0]
        alternatives_data = [
            crop.model_dump() for crop in result.recommended_crops[1:]
        ]
        rec_entry = CropRecommendation(
            farm_id=resolved_farm_id,
            user_id=current_user.id,
            recommended_crop_name=top_crop.crop_name,
            confidence_score=round(top_crop.confidence_pct / 100.0, 4),
            alternatives=alternatives_data,
            input_values=request.model_dump(),
            rationale=top_crop.description,
            model_version="v1.0.0",
        )
        db.add(rec_entry)
        db.commit()

    return result


@router.post(
    "/save",
    summary="Save recommendation to farmer's history in PostgreSQL",
)
def save_recommendation(
    payload: SaveCropRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Persists a crop recommendation event to the crop_recommendations table.
    """
    rec_entry = CropRecommendation(
        farm_id=payload.farm_id,
        user_id=current_user.id,
        recommended_crop_name=payload.recommended_crop_name,
        confidence_score=round(min(1.0, max(0.0, payload.confidence_score)), 4),
        alternatives=payload.alternatives,
        rationale=payload.rationale
        or "Recommended based on soil NPK, pH, and local weather telemetry.",
        model_version="v1.0.0",
    )
    db.add(rec_entry)
    db.commit()
    db.refresh(rec_entry)

    return {"status": "success", "id": rec_entry.id}


@router.get(
    "/history",
    summary="Get history of crop recommendations for authenticated farmer",
)
def get_recommendation_history(
    farm_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves previous crop recommendation runs for this user from PostgreSQL.
    """
    query = (
        db.query(CropRecommendation)
        .filter(CropRecommendation.user_id == current_user.id)
        .order_by(CropRecommendation.created_at.desc())
    )
    if farm_id:
        query = query.filter(CropRecommendation.farm_id == farm_id)

    recs = query.limit(20).all()

    return [
        {
            "id": r.id,
            "farm_id": r.farm_id,
            "recommended_crop_name": r.recommended_crop_name,
            "confidence_score": r.confidence_score,
            "alternatives": r.alternatives,
            "rationale": r.rationale,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recs
    ]
