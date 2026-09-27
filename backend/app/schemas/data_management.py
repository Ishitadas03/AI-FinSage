import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict


class DataExportMetadata(BaseModel):
    export_version: str = "1.0"
    exported_at: datetime
    user_id: uuid.UUID
    email: str
    total_records: int
    data_sections: List[str]


class UserDataExportResponse(BaseModel):
    """Complete JSON export payload containing all user-scoped financial records."""
    metadata: DataExportMetadata
    profile: Dict[str, Any]
    accounts: List[Dict[str, Any]]
    transactions: List[Dict[str, Any]]
    budgets: List[Dict[str, Any]]
    goals: List[Dict[str, Any]]
    loans: List[Dict[str, Any]]
    recurring_bills: List[Dict[str, Any]]
    notifications: List[Dict[str, Any]]


class AccountDeletionResponse(BaseModel):
    status: str = "deleted"
    message: str
    deleted_at: datetime
    deleted_user_id: uuid.UUID
