import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models.user import User
from app.db.models.assistant import AIConversation, AIMessage
from app.schemas.assistant import (
    ChatMessageRequest,
    ChatResponse,
    ConversationResponse,
    MessageItem,
)
from app.services.assistant_service import assistant_context_service

logger = logging.getLogger("agrimind.api.assistant")

router = APIRouter(prefix="/api/assistant", tags=["AI Agronomy Assistant"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Interact with AI assistant using ground-truth local farm context",
)
def chat_with_assistant(
    payload: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """
    Submits a user query to the AI agronomist.
    Pulls local farm, soil, weather, and crop health context dynamically from PostgreSQL.
    Appends both user message and AI response to the conversation history.
    """
    conv = None
    if payload.conversation_id:
        conv = (
            db.query(AIConversation)
            .filter(
                AIConversation.id == payload.conversation_id,
                AIConversation.user_id == current_user.id,
            )
            .first()
        )
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found.",
            )
    else:
        # Create a new conversation
        first_words = " ".join(payload.message.split()[:5])
        title = f"Query: {first_words}..." if len(first_words) > 0 else "Agronomy Consultation"
        conv = AIConversation(
            user_id=current_user.id,
            farm_id=payload.farm_id,
            title=title,
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 1. Retrieve dynamic context from local PostgreSQL
    context = assistant_context_service.retrieve_context(
        user=current_user, farm_id=payload.farm_id, db=db
    )

    # 2. Retrieve last 10 messages for conversation thread
    prev_messages = (
        db.query(AIMessage)
        .filter(AIMessage.conversation_id == conv.id)
        .order_by(AIMessage.created_at.asc())
        .limit(10)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in prev_messages]

    # 3. Save User message
    user_msg = AIMessage(
        conversation_id=conv.id,
        role="user",
        content=payload.message,
    )
    db.add(user_msg)

    # 4. Generate grounded response
    assistant_text = assistant_context_service.generate_response(
        message=payload.message,
        context=context,
        history=history,
    )

    # 5. Save Assistant message
    assistant_msg = AIMessage(
        conversation_id=conv.id,
        role="assistant",
        content=assistant_text,
    )
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(
        conversation_id=conv.id,
        response=assistant_text,
        role="assistant",
        context_used=context,
        created_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get(
    "/conversations",
    response_model=List[ConversationResponse],
    summary="List all AI conversations for authenticated user",
)
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[ConversationResponse]:
    """
    Returns all conversation sessions owned by the authenticated user.
    """
    conversations = (
        db.query(AIConversation)
        .filter(AIConversation.user_id == current_user.id)
        .order_by(AIConversation.updated_at.desc())
        .all()
    )

    result = []
    for c in conversations:
        messages = [
            MessageItem(
                id=m.id,
                role=m.role,
                content=m.content,
                created_at=m.created_at.isoformat() if m.created_at else "",
            )
            for m in c.messages
        ]
        result.append(
            ConversationResponse(
                id=c.id,
                title=c.title,
                created_at=c.created_at.isoformat() if c.created_at else "",
                updated_at=c.updated_at.isoformat() if c.updated_at else "",
                messages=messages,
            )
        )
    return result


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new conversation thread",
)
def create_conversation(
    title: Optional[str] = "Agronomy Consultation",
    farm_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationResponse:
    """
    Creates a new conversation session.
    """
    conv = AIConversation(
        user_id=current_user.id,
        farm_id=farm_id,
        title=title or "Agronomy Consultation",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at.isoformat() if conv.created_at else "",
        updated_at=conv.updated_at.isoformat() if conv.updated_at else "",
        messages=[],
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    summary="Get conversation history by ID",
)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationResponse:
    """
    Retrieves a conversation thread with ownership validation.
    """
    conv = (
        db.query(AIConversation)
        .filter(
            AIConversation.id == conversation_id,
            AIConversation.user_id == current_user.id,
        )
        .first()
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    messages = [
        MessageItem(
            id=m.id,
            role=m.role,
            content=m.content,
            created_at=m.created_at.isoformat() if m.created_at else "",
        )
        for m in conv.messages
    ]

    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at.isoformat() if conv.created_at else "",
        updated_at=conv.updated_at.isoformat() if conv.updated_at else "",
        messages=messages,
    )


@router.delete(
    "/conversations/{conversation_id}",
    summary="Delete conversation session",
)
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes a conversation session and all its messages.
    """
    conv = (
        db.query(AIConversation)
        .filter(
            AIConversation.id == conversation_id,
            AIConversation.user_id == current_user.id,
        )
        .first()
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    db.delete(conv)
    db.commit()
    return {"status": "success", "message": "Conversation deleted successfully."}
