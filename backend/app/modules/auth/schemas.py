from pydantic import BaseModel, EmailStr

class RegisterBusinessInput(BaseModel):
    business_name: str
    business_slug: str
    admin_name: str
    admin_email: EmailStr
    admin_password: str

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenInput(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
