import logging
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models.farm import Farm, SoilData
from app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse

logger = logging.getLogger("agrimind.farm_service")


def _map_model_to_response(farm: Farm) -> FarmResponse:
    """Converts a SQLAlchemy Farm model instance to a FarmResponse schema."""
    return FarmResponse(
        id=str(farm.id),
        user_id=str(farm.user_id),
        farm_name=farm.farm_name,
        state=farm.state,
        district=farm.district,
        village=farm.village,
        land_area=farm.land_area,
        soil_type=farm.soil_type,
        soil_ph=farm.soil_ph,
        nitrogen=farm.nitrogen,
        phosphorus=farm.phosphorus,
        potassium=farm.potassium,
        irrigation=farm.irrigation,
        current_crop=farm.current_crop,
        latitude=farm.latitude,
        longitude=farm.longitude,
        created_at=farm.created_at.isoformat() if farm.created_at else None,
    )


class FarmService:
    """Encapsulates all local PostgreSQL database operations for farms using SQLAlchemy."""

    def get_user_farm(self, user_id: str, db: Session) -> Optional[FarmResponse]:
        """
        Retrieves the primary farm belonging to the specified user_id.
        Returns None if no farm exists.
        """
        farm = (
            db.query(Farm)
            .filter(Farm.user_id == user_id)
            .order_by(Farm.created_at.desc())
            .first()
        )
        if not farm:
            return None
        return _map_model_to_response(farm)

    def get_farm_by_id(
        self, farm_id: str, user_id: str, db: Session
    ) -> Optional[FarmResponse]:
        """
        Retrieves a farm by ID, verifying that user_id owns the farm.
        Raises 403 Forbidden if user is not the owner (IDOR protection).
        """
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            return None

        if str(farm.user_id) != str(user_id):
            logger.warning(
                f"Unauthorized farm access: User {user_id} attempted to access farm {farm_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to access this farm.",
            )

        return _map_model_to_response(farm)

    def create_farm(
        self, farm_data: FarmCreate, user_id: str, db: Session
    ) -> FarmResponse:
        """Creates a new farm record in local PostgreSQL."""
        new_farm = Farm(
            user_id=user_id,
            farm_name=farm_data.farm_name,
            state=farm_data.state,
            district=farm_data.district,
            village=farm_data.village,
            land_area=farm_data.land_area or 1.0,
            soil_type=farm_data.soil_type or "loamy",
            soil_ph=farm_data.soil_ph or 6.5,
            nitrogen=farm_data.nitrogen or 120.0,
            phosphorus=farm_data.phosphorus or 50.0,
            potassium=farm_data.potassium or 50.0,
            irrigation=farm_data.irrigation or "Drip Irrigation",
            current_crop=farm_data.current_crop or "Wheat",
            latitude=farm_data.latitude,
            longitude=farm_data.longitude,
        )
        db.add(new_farm)
        db.flush()

        # Also create initial SoilData snapshot for history tracking
        soil = SoilData(
            farm_id=new_farm.id,
            user_id=user_id,
            nitrogen_mg_kg=new_farm.nitrogen,
            phosphorus_mg_kg=new_farm.phosphorus,
            potassium_mg_kg=new_farm.potassium,
            ph_level=new_farm.soil_ph,
        )
        db.add(soil)
        db.commit()
        db.refresh(new_farm)
        return _map_model_to_response(new_farm)

    def update_farm(
        self,
        farm_id: str,
        farm_data: FarmUpdate,
        user_id: str,
        db: Session,
    ) -> FarmResponse:
        """Updates an existing farm record after verifying ownership."""
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm record not found for update.",
            )

        if str(farm.user_id) != str(user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to update this farm.",
            )

        update_dict = farm_data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            if hasattr(farm, key) and val is not None:
                setattr(farm, key, val)

        # If soil metrics changed, update or record snapshot
        if any(k in update_dict for k in ("soil_ph", "nitrogen", "phosphorus", "potassium")):
            soil = SoilData(
                farm_id=farm.id,
                user_id=user_id,
                nitrogen_mg_kg=farm.nitrogen,
                phosphorus_mg_kg=farm.phosphorus,
                potassium_mg_kg=farm.potassium,
                ph_level=farm.soil_ph,
            )
            db.add(soil)

        db.commit()
        db.refresh(farm)
        return _map_model_to_response(farm)

    def update_my_farm(
        self,
        farm_data: FarmUpdate,
        user_id: str,
        db: Session,
    ) -> FarmResponse:
        """Updates the authenticated user's current farm or creates it if not found."""
        farm = (
            db.query(Farm)
            .filter(Farm.user_id == user_id)
            .order_by(Farm.created_at.desc())
            .first()
        )
        if not farm:
            # Create if none exists
            create_data = FarmCreate(
                farm_name=farm_data.farm_name or "My Farm",
                state=farm_data.state,
                district=farm_data.district,
                village=farm_data.village,
                land_area=farm_data.land_area or 1.0,
                soil_type=farm_data.soil_type,
                soil_ph=farm_data.soil_ph,
                nitrogen=farm_data.nitrogen,
                phosphorus=farm_data.phosphorus,
                potassium=farm_data.potassium,
                irrigation=farm_data.irrigation,
                current_crop=farm_data.current_crop,
                latitude=farm_data.latitude,
                longitude=farm_data.longitude,
            )
            return self.create_farm(create_data, user_id, db)

        return self.update_farm(farm.id, farm_data, user_id, db)

    def delete_my_farm(self, user_id: str, db: Session) -> bool:
        """Deletes the authenticated user's farm profile."""
        farm = (
            db.query(Farm)
            .filter(Farm.user_id == user_id)
            .order_by(Farm.created_at.desc())
            .first()
        )
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No farm profile found to delete.",
            )
        db.delete(farm)
        db.commit()
        return True


farm_service = FarmService()
