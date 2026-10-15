from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = Field(None, description="Google ID Token from Google Identity Services")
    email: Optional[EmailStr] = Field(None, description="Google user email")
    name: Optional[str] = Field(None, description="Google user display name")
    avatar_url: Optional[str] = Field(None, description="Google profile picture URL")


class UserProfileResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str = "farmer"
    phone_number: Optional[str] = None
    preferred_language: str = "en"
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
