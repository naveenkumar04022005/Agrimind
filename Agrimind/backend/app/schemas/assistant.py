from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    farm_id: Optional[str] = None


class MessageItem(BaseModel):
    id: str
    role: str
    content: str
    created_at: str

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[MessageItem] = []

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    conversation_id: str
    response: str
    role: str = "assistant"
    context_used: Dict[str, Any] = {}
    created_at: str
