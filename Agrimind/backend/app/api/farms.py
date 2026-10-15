import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.farm import FarmResponse, FarmCreate, FarmUpdate
from app.services.farm_service import farm_service

logger = logging.getLogger("agrimind.api.farms")

router = APIRouter(prefix="/api/farms", tags=["Farms"])


@router.get(
    "/me",
    response_model=FarmResponse,
    summary="Get authenticated farmer's registered farm",
)
def get_my_farm(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FarmResponse:
    """
    Returns the farm profile belonging to the currently authenticated user.
    """
    farm = farm_service.get_user_farm(user_id=current_user.id, db=db)
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No farm profile found for this farmer.",
        )
    return farm


@router.post(
    "",
    response_model=FarmResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new farm record for authenticated user",
)
def create_farm(
    farm_data: FarmCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FarmResponse:
    """
    Creates a new farm record linked to the authenticated user.
    """
    return farm_service.create_farm(farm_data=farm_data, user_id=current_user.id, db=db)


@router.put(
    "/me",
    response_model=FarmResponse,
    summary="Update authenticated farmer's farm",
)
def update_my_farm(
    farm_data: FarmUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FarmResponse:
    """
    Updates the authenticated farmer's existing farm or creates it if not yet registered.
    """
    return farm_service.update_my_farm(
        farm_data=farm_data, user_id=current_user.id, db=db
    )


@router.delete(
    "/me",
    summary="Delete authenticated farmer's farm",
)
def delete_my_farm(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes the farm profile belonging to the authenticated user.
    """
    farm_service.delete_my_farm(user_id=current_user.id, db=db)
    return {"status": "success", "message": "Farm profile deleted successfully."}


@router.get(
    "/{farm_id}",
    response_model=FarmResponse,
    summary="Get farm by ID with ownership verification",
)
def get_farm_by_id(
    farm_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FarmResponse:
    """
    Retrieves farm by ID, strictly verifying ownership.
    Users cannot access farms owned by other farmers.
    """
    farm = farm_service.get_farm_by_id(farm_id=farm_id, user_id=current_user.id, db=db)
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with ID {farm_id} not found.",
        )
    return farm


@router.put(
    "/{farm_id}",
    response_model=FarmResponse,
    summary="Update an existing farm record with ownership verification",
)
def update_farm(
    farm_id: str,
    farm_data: FarmUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FarmResponse:
    """
    Updates farm details after verifying the caller is the owner.
    """
    return farm_service.update_farm(
        farm_id=farm_id,
        farm_data=farm_data,
        user_id=current_user.id,
        db=db,
    )
