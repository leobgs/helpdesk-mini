from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import User, RoleEnum
from app.schemas.user import UserOut, UserCreate
from app.core.security import get_password_hash
from app.api.deps import RoleChecker, get_tenant_query

router = APIRouter(prefix="/users", tags=["users"])

admin_only = RoleChecker([RoleEnum.admin])

@router.get("", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    users = get_tenant_query(db, User, current_user).all()
    return users

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    if data.role not in [RoleEnum.agent.value, RoleEnum.customer.value]:
        raise HTTPException(
            status_code=422,
            detail="Role must be either 'agent' or 'customer'"
        )
        
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        business_id=current_user.business_id,
        name=data.name,
        email=data.email,
        password_hash=get_password_hash(data.password),
        role=data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
