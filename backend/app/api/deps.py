from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import decode_token
from app.db.models import User, Ticket, Message, RoleEnum

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = decode_token(token, token_type="access")
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return user

def get_tenant_query(db: Session, model, user: User):
    """
    Returns a query for the given model filtered by the user's business_id.
    """
    return db.query(model).filter(model.business_id == user.business_id)

def get_ticket_query(db: Session, user: User):
    """
    Returns a ticket query filtered by business_id and optionally customer_id.
    """
    query = get_tenant_query(db, Ticket, user)
    if user.role == RoleEnum.customer:
        query = query.filter(Ticket.customer_id == user.id)
    return query

def get_message_query(db: Session, user: User):
    """
    Messages don't have business_id directly, they belong to a ticket.
    We join with Ticket and apply the ticket scoping.
    """
    query = db.query(Message).join(Ticket, Message.ticket_id == Ticket.id)
    query = query.filter(Ticket.business_id == user.business_id)
    if user.role == RoleEnum.customer:
        query = query.filter(Ticket.customer_id == user.id)
    return query
