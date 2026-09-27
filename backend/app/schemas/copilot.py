"""
Pydantic Schemas for Grounded AI Copilot (Phase 4).
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid
from pydantic import BaseModel, ConfigDict, Field


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User's question or message to FinSage AI Copilot")


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    intent: Optional[str] = None
    metrics_snapshot: Optional[Dict[str, Any]] = None
    suggested_queries: List[str] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatHistoryResponse(BaseModel):
    items: List[ChatMessageResponse]
    total: int
