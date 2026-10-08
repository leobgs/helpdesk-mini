from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.modules.auth.schemas import RegisterBusinessInput, LoginInput, TokenResponse, RefreshTokenInput
from app.modules.auth.service import AuthService
from app.modules.users.schemas import UserWithBusinessOut
from app.api import deps
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/auth", tags=["auth"])

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)

@router.post("/registerbusiness", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_business(data: RegisterBusinessInput, service: AuthService = Depends(get_auth_service)):
    return service.register_business(data)

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), service: AuthService = Depends(get_auth_service)):
    data = LoginInput(email=form_data.username, password=form_data.password)
    return service.login(data)

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshTokenInput, service: AuthService = Depends(get_auth_service)):
    return service.refresh(data)

@router.get("/me", response_model=UserWithBusinessOut)
def get_me(current_user: User = Depends(deps.get_current_user)):
    return current_user
