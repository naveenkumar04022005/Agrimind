import logging
from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models.user import User
from app.db.models.farm import Farm
from app.db.models.crop import CropCycle
from app.schemas.crop_cycle import (
    CropCycleCreate,
    CropCycleUpdate,
    CropCycleResponse,
)
from app.services.farm_service import farm_service

logger = logging.getLogger("agrimind.api.crop_cycles")

router = APIRouter(prefix="/api/crops/cycles", tags=["Crop Lifecycle"])


def _map_cycle_to_response(cycle: CropCycle) -> CropCycleResponse:
    today = date.today()
    current_day = max(1, (today - cycle.sowing_date).days + 1)
    return CropCycleResponse(
        id=cycle.id,
        farm_id=cycle.farm_id,
        user_id=cycle.user_id,
        cycle_name=cycle.cycle_name,
        area_planted_acres=cycle.area_planted_acres,
        sowing_date=cycle.sowing_date.isoformat(),
        expected_duration_days=cycle.expected_duration_days,
        current_day=current_day,
        current_stage=cycle.current_stage,
        expected_harvest_date=cycle.expected_harvest_date.isoformat()
        if cycle.expected_harvest_date
        else None,
        actual_harvest_date=cycle.actual_harvest_date.isoformat()
        if cycle.actual_harvest_date
        else None,
        status=cycle.status,
        actual_yield_kg=cycle.actual_yield_kg,
        notes=cycle.notes,
        created_at=cycle.created_at.isoformat() if cycle.created_at else "",
    )


@router.post(
    "",
    response_model=CropCycleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new crop lifecycle record in PostgreSQL",
)
def create_crop_cycle(
    payload: CropCycleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CropCycleResponse:
    """
    Registers a new crop cycle for the farmer's registered farm.
    Calculates expected harvest date based on duration.
    """
    farm_id = payload.farm_id
    if not farm_id:
        farm = farm_service.get_user_farm(current_user.id, db)
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm profile not found. Please create a farm profile first.",
            )
        farm_id = farm.id
    else:
        farm_service.get_farm_by_id(farm_id, current_user.id, db)

    expected_harvest = payload.sowing_date + timedelta(days=payload.expected_duration_days)

    cycle = CropCycle(
        farm_id=farm_id,
        user_id=current_user.id,
        cycle_name=payload.cycle_name,
        area_planted_acres=payload.area_planted_acres,
        sowing_date=payload.sowing_date,
        expected_duration_days=payload.expected_duration_days,
        current_stage="sown",
        status="sown",
        expected_harvest_date=expected_harvest,
        notes=payload.notes,
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return _map_cycle_to_response(cycle)


@router.get(
    "/current",
    response_model=Optional[CropCycleResponse],
    summary="Get active crop cycle and current day count for authenticated user",
)
def get_current_crop_cycle(
    farm_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Optional[CropCycleResponse]:
    """
    Returns the currently active crop cycle.
    Computes elapsed crop days since sowing date.
    """
    query = (
        db.query(CropCycle)
        .filter(
            CropCycle.user_id == current_user.id,
            CropCycle.status.in_(["sown", "growing", "flowering", "harvesting"]),
        )
        .order_by(CropCycle.created_at.desc())
    )
    if farm_id:
        query = query.filter(CropCycle.farm_id == farm_id)

    cycle = query.first()
    if not cycle:
        return None

    return _map_cycle_to_response(cycle)


@router.put(
    "/{cycle_id}",
    response_model=CropCycleResponse,
    summary="Update crop lifecycle stage or harvest details",
)
def update_crop_cycle(
    cycle_id: str,
    payload: CropCycleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CropCycleResponse:
    """
    Updates crop cycle stage or status with ownership check.
    """
    cycle = db.query(CropCycle).filter(CropCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop cycle record not found.",
        )

    if str(cycle.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not own this crop cycle.",
        )

    if payload.current_stage is not None:
        cycle.current_stage = payload.current_stage
    if payload.status is not None:
        cycle.status = payload.status
    if payload.actual_harvest_date is not None:
        cycle.actual_harvest_date = payload.actual_harvest_date
    if payload.actual_yield_kg is not None:
        cycle.actual_yield_kg = payload.actual_yield_kg
    if payload.notes is not None:
        cycle.notes = payload.notes

    db.commit()
    db.refresh(cycle)
    return _map_cycle_to_response(cycle)


@router.get(
    "",
    response_model=List[CropCycleResponse],
    summary="List all crop cycles for authenticated user",
)
def list_crop_cycles(
    farm_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[CropCycleResponse]:
    """
    Lists all historical and current crop cycles for authenticated user.
    """
    query = (
        db.query(CropCycle)
        .filter(CropCycle.user_id == current_user.id)
        .order_by(CropCycle.created_at.desc())
    )
    if farm_id:
        query = query.filter(CropCycle.farm_id == farm_id)

    return [_map_cycle_to_response(c) for c in query.all()]
