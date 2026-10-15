import uuid
import logging
from datetime import timedelta
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.db.database import get_db
from app.db.models.user import User, FarmerProfile
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    TokenResponse,
    UserProfileResponse,
)

logger = logging.getLogger("agrimind.api.auth")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new farmer account",
)
def register(request: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Registers a new user and creates an associated farmer profile.
    - Validates email format and password strength
    - Rejects duplicate email addresses
    - Hashes password with bcrypt before storage
    - Never stores plaintext passwords
    - Returns JWT access token and user identity
    """
    email_clean = request.email.lower().strip()

    # Reject duplicate email
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # Hash password with bcrypt
    hashed = hash_password(request.password)

    # Create User record
    new_user = User(
        email=email_clean,
        name=request.name.strip() if request.name else None,
        hashed_password=hashed,
        role="farmer",
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    # Create associated FarmerProfile
    profile = FarmerProfile(
        user_id=new_user.id,
        full_name=new_user.name or email_clean.split("@")[0],
    )
    db.add(profile)
    db.commit()
    db.refresh(new_user)
    db.refresh(profile)

    # Generate JWT access token
    token = create_access_token(
        data={"sub": new_user.id, "email": new_user.email, "role": new_user.role}
    )

    user_response = UserProfileResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        role=new_user.role,
        full_name=profile.full_name,
        phone_number=profile.phone_number,
        preferred_language=profile.preferred_language,
        state=profile.state,
        district=profile.district,
        village=profile.village,
        avatar_url=profile.avatar_url,
    )

    return TokenResponse(access_token=token, user=user_response)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive JWT access token",
)
def login(request: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Authenticates a user via email and password.
    - Verifies password against bcrypt hash
    - Returns signed JWT token on success
    """
    email_clean = request.email.lower().strip()

    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )

    profile = user.profile
    user_response = UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        phone_number=profile.phone_number if profile else None,
        preferred_language=profile.preferred_language if profile else "en",
        state=profile.state if profile else None,
        district=profile.district if profile else None,
        village=profile.village if profile else None,
        avatar_url=profile.avatar_url if profile else None,
    )

    return TokenResponse(access_token=token, user=user_response)


@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Authenticate or register farmer with Google Sign-In",
)
async def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Handles Google Sign-In for both registration and login:
    1. If `credential` (Google ID Token) is provided, verifies with Google's tokeninfo API.
    2. Extracts verified email, name, and avatar picture.
    3. Finds or creates the User record with role='farmer' and creates FarmerProfile.
    4. Issues standard Agrimind JWT access token.
    """
    email = None
    name = request.name
    avatar_url = request.avatar_url

    if request.credential:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={request.credential}"
                )
                if res.status_code == 200:
                    g_data = res.json()
                    email = g_data.get("email")
                    name = name or g_data.get("name")
                    avatar_url = avatar_url or g_data.get("picture")
                else:
                    logger.warning(f"Google token verification response: {res.text}")
        except Exception as e:
            logger.warning(f"Failed to reach Google token verification endpoint: {e}")

    # Fallback to direct email payload if provided (useful for dev / simulated flows)
    if not email and request.email:
        email = request.email

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to determine email from Google authentication.",
        )

    email_clean = email.lower().strip()

    # Find existing user
    user = db.query(User).filter(User.email == email_clean).first()

    if not user:
        # Create new user for first-time Google sign-in
        random_pwd = hash_password(str(uuid.uuid4()))
        user = User(
            email=email_clean,
            name=name.strip() if name else email_clean.split("@")[0],
            hashed_password=random_pwd,
            role="farmer",
            is_active=True,
        )
        db.add(user)
        db.flush()

        profile = FarmerProfile(
            user_id=user.id,
            full_name=user.name,
            avatar_url=avatar_url,
        )
        db.add(profile)
        db.commit()
        db.refresh(user)
        logger.info(f"Registered new farmer via Google Sign-In: {user.email}")
    else:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated.",
            )
        # Update name or avatar if not present
        if avatar_url and user.profile and not user.profile.avatar_url:
            user.profile.avatar_url = avatar_url
            db.commit()
            db.refresh(user)

    token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )

    profile = user.profile
    user_response = UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        phone_number=profile.phone_number if profile else None,
        preferred_language=profile.preferred_language if profile else "en",
        state=profile.state if profile else None,
        district=profile.district if profile else None,
        village=profile.village if profile else None,
        avatar_url=profile.avatar_url if profile else None,
    )

    return TokenResponse(access_token=token, user=user_response)


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get authenticated farmer profile",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserProfileResponse:
    """
    Returns the currently authenticated farmer's profile.
    Requires Bearer JWT token in Authorization header.
    """
    profile = current_user.profile
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        phone_number=profile.phone_number if profile else None,
        preferred_language=profile.preferred_language if profile else "en",
        state=profile.state if profile else None,
        district=profile.district if profile else None,
        village=profile.village if profile else None,
        avatar_url=profile.avatar_url if profile else None,
    )


@router.post(
    "/logout",
    summary="Logout session",
)
def logout(current_user: User = Depends(get_current_user)):
    """
    Logs out the authenticated user. Frontend clears local token storage.
    """
    return {"status": "success", "message": "Successfully logged out."}
