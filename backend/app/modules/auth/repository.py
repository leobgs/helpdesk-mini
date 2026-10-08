from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.models import Business, User, RoleEnum

class AuthRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> User:
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, user_id: int) -> User:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_business_by_slug(self, slug: str) -> Business:
        return self.db.query(Business).filter(Business.slug == slug).first()

    def create_business_and_admin(self, business_name: str, business_slug: str, admin_name: str, admin_email: str, password_hash: str) -> tuple[Business, User]:
        business = Business(name=business_name, slug=business_slug)
        self.db.add(business)
        self.db.flush()

        admin_user = User(
            business_id=business.id,
            name=admin_name,
            email=admin_email,
            password_hash=password_hash,
            role=RoleEnum.admin
        )
        self.db.add(admin_user)
        try:
            self.db.commit()
            self.db.refresh(admin_user)
            self.db.refresh(business)
            return business, admin_user
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Registration failed due to database constraint")
