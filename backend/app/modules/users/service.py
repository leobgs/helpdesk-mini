from typing import Optional
from sqlalchemy import or_
from fastapi import HTTPException
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate
from app.db.models import User, RoleEnum
from app.core.security import get_password_hash
from app.core.pagination import paginate

class UserService:
    def __init__(self, db):
        self.repo = UserRepository(db)

    def list_tenant_users(
        self,
        business_id: int,
        search: Optional[str] = None,
        role: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ):
        query = self.repo.get_tenant_users_query(business_id)

        if role and role != "all":
            query = query.filter(User.role == role)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.name.ilike(term),
                    User.email.ilike(term)
                )
            )

        return paginate(query.order_by(User.created_at.desc()), page=page, limit=limit)

    def create_user(self, data: UserCreate, business_id: int):
        if data.role not in [RoleEnum.agent.value, RoleEnum.customer.value]:
            raise HTTPException(status_code=422, detail="Role must be either 'agent' or 'customer'")
            
        if self.repo.get_by_email(data.email):
            raise HTTPException(status_code=400, detail="Email already registered")
            
        password_hash = get_password_hash(data.password)
        return self.repo.create(
            business_id=business_id,
            name=data.name,
            email=data.email,
            password_hash=password_hash,
            role=data.role
        )
