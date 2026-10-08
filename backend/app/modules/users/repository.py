from sqlalchemy.orm import Session
from app.db.models import User

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User:
        return self.db.query(User).filter(User.email == email).first()

    def get_tenant_users(self, business_id: int):
        return self.db.query(User).filter(User.business_id == business_id).all()

    def create(self, business_id: int, name: str, email: str, password_hash: str, role: str) -> User:
        new_user = User(
            business_id=business_id,
            name=name,
            email=email,
            password_hash=password_hash,
            role=role
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user
