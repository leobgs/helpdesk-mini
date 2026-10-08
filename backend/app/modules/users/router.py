from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, RoleEnum
from app.modules.users.schemas import UserOut, UserCreate
from app.modules.users.service import UserService
from app.api.deps import RoleChecker

router = APIRouter(prefix="/users", tags=["users"])

admin_only = RoleChecker([RoleEnum.admin])

def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)

@router.get("", response_model=List[UserOut])
def list_users(
    current_user: User = Depends(admin_only),
    service: UserService = Depends(get_user_service)
):
    return service.list_tenant_users(current_user.business_id)

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    current_user: User = Depends(admin_only),
    service: UserService = Depends(get_user_service)
):
    return service.create_user(data, current_user.business_id)
