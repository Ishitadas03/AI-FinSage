"""
Grounded AI Copilot Endpoints (Phase 4).

Routes:
- POST   /api/v1/copilot/chat
- GET    /api/v1/copilot/history
- DELETE /api/v1/copilot/history
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.copilot import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatHistoryResponse,
)
from app.schemas.auth import MessageResponse
from app.services.copilot_service import copilot_service

router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatMessageResponse,
    summary="Ask a question to FinSage Grounded AI Copilot",
    status_code=status.HTTP_200_OK,
)
async def chat_with_copilot(
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Processes user financial question, retrieves user-scoped facts,
    and returns a structured, grounded answer.
    """
    try:
        response = await copilot_service.chat(
            db=db,
            user=current_user,
            message=payload.message,
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate copilot response: {str(e)}",
        )


@router.get(
    "/history",
    response_model=ChatHistoryResponse,
    summary="Get user copilot conversation history",
)
def get_copilot_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns user-scoped chat messages in chronological order.
    """
    return copilot_service.get_history(db=db, user_id=current_user.id, limit=limit)


@router.delete(
    "/history",
    response_model=MessageResponse,
    summary="Clear user copilot conversation history",
)
def clear_copilot_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Clears all stored conversation history for the authenticated user.
    """
    copilot_service.clear_history(db=db, user_id=current_user.id)
    return MessageResponse(message="Conversation history cleared successfully.")
