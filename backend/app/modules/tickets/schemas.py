from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.modules.users.schemas import UserOut

class TicketCreate(BaseModel):
    subject: str
    category: str
    priority: str
    message: str

class TicketOut(BaseModel):
    id: int
    business_id: int
    customer_id: int
    assigned_agent_id: Optional[int]
    subject: str
    category: str
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime

    customer: Optional[UserOut] = None
    assigned_agent: Optional[UserOut] = None

    class Config:
        from_attributes = True
