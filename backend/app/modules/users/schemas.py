from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.schemas.business import BusinessOut

class UserOut(BaseModel):
    id: int
    business_id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserWithBusinessOut(UserOut):
    business: BusinessOut

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
