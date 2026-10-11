import math
from typing import Generic, List, TypeVar
from pydantic import BaseModel
from sqlalchemy.orm import Query

T = TypeVar("T")

class PaginationMeta(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    meta: PaginationMeta

def paginate(query: Query, page: int = 1, limit: int = 10) -> dict:
    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 0
    items = (
        query.offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {
        "data": items,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        },
    }
