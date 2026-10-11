from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, RoleEnum
from app.modules.users.schemas import UserOut, UserCreate, PaginatedUsersOut
from app.modules.users.service import UserService
from app.api.deps import RoleChecker

router = APIRouter(prefix="/users", tags=["users"])

admin_only = RoleChecker([RoleEnum.admin])

def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)

@router.get("", response_model=PaginatedUsersOut)
def list_users(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by role (admin, agent, customer)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items limit per page"),
    page_size: Optional[int] = Query(None, description="Alias for limit"),
    current_user: User = Depends(admin_only),
    service: UserService = Depends(get_user_service)
):
    effective_limit = page_size if page_size is not None else limit
    return service.list_tenant_users(
        business_id=current_user.business_id,
        search=search,
        role=role,
        page=page,
        limit=effective_limit
    )

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    current_user: User = Depends(admin_only),
    service: UserService = Depends(get_user_service)
):
    return service.create_user(data, current_user.business_id)
