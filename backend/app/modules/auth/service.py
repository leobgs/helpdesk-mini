from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.modules.auth.schemas import RegisterBusinessInput, LoginInput, RefreshTokenInput, TokenResponse
from app.modules.auth.repository import AuthRepository
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token

class AuthService:
    def __init__(self, db: Session):
        self.repo = AuthRepository(db)

    def register_business(self, data: RegisterBusinessInput) -> TokenResponse:
        if self.repo.get_user_by_email(data.admin_email):
            raise HTTPException(status_code=400, detail="Email already registered")
            
        if self.repo.get_business_by_slug(data.business_slug):
            raise HTTPException(status_code=400, detail="Business slug already taken")
            
        password_hash = get_password_hash(data.admin_password)
        
        try:
            business, admin_user = self.repo.create_business_and_admin(
                business_name=data.business_name,
                business_slug=data.business_slug,
                admin_name=data.admin_name,
                admin_email=data.admin_email,
                password_hash=password_hash
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
            
        access_token = create_access_token(admin_user.id, role=admin_user.role, business_id=business.id)
        refresh_token = create_refresh_token(admin_user.id, role=admin_user.role, business_id=business.id)
        
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    def login(self, data: LoginInput) -> TokenResponse:
        user = self.repo.get_user_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
            
        access_token = create_access_token(user.id, role=user.role, business_id=user.business_id)
        refresh_token = create_refresh_token(user.id, role=user.role, business_id=user.business_id)
        
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    def refresh(self, data: RefreshTokenInput) -> TokenResponse:
        try:
            payload = decode_token(data.refresh_token, token_type="refresh")
            user_id = payload.get("sub")
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
            
        user = self.repo.get_user_by_id(int(user_id))
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
            
        access_token = create_access_token(user.id, role=user.role, business_id=user.business_id)
        new_refresh_token = create_refresh_token(user.id, role=user.role, business_id=user.business_id)
        
        return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)
