from datetime import datetime
from pydantic import BaseModel

class BusinessOut(BaseModel):
    id: int
    name: str
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True
