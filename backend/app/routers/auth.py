from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.database import get_db
from app.db.models import Business, User, RoleEnum
from app.schemas.auth import RegisterBusinessInput, LoginInput, TokenResponse, RefreshTokenInput
from app.schemas.user import UserWithBusinessOut
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.api import deps

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/registerbusiness", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_business(data: RegisterBusinessInput, db: Session = Depends(get_db)):
    # Enforce globally unique email
    existing_user = db.query(User).filter(User.email == data.admin_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Enforce unique business slug
    existing_biz = db.query(Business).filter(Business.slug == data.business_slug).first()
    if existing_biz:
        raise HTTPException(status_code=400, detail="Business slug already taken")
    
    business = Business(
        name=data.business_name,
        slug=data.business_slug
    )
    db.add(business)
    db.flush() # get business.id
    
    admin_user = User(
        business_id=business.id,
        name=data.admin_name,
        email=data.admin_email,
        password_hash=get_password_hash(data.admin_password),
        role=RoleEnum.admin
    )
    db.add(admin_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Registration failed due to database constraint")
        
    db.refresh(admin_user)
    
    access_token = create_access_token(admin_user.id, role=admin_user.role, business_id=business.id)
    refresh_token = create_refresh_token(admin_user.id, role=admin_user.role, business_id=business.id)
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/login", response_model=TokenResponse)
def login(data: LoginInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = create_access_token(user.id, role=user.role, business_id=user.business_id)
    refresh_token = create_refresh_token(user.id, role=user.role, business_id=user.business_id)
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshTokenInput, db: Session = Depends(get_db)):
    try:
        payload = decode_token(data.refresh_token, token_type="refresh")
        user_id = payload.get("sub")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    access_token = create_access_token(user.id, role=user.role, business_id=user.business_id)
    new_refresh_token = create_refresh_token(user.id, role=user.role, business_id=user.business_id)
    
    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

@router.get("/me", response_model=UserWithBusinessOut)
def get_me(current_user: User = Depends(deps.get_current_user)):
    return current_user
