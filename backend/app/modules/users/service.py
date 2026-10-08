from fastapi import HTTPException
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate
from app.db.models import RoleEnum
from app.core.security import get_password_hash

class UserService:
    def __init__(self, db):
        self.repo = UserRepository(db)

    def list_tenant_users(self, business_id: int):
        return self.repo.get_tenant_users(business_id)

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
