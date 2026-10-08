from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import User, RoleEnum
from app.modules.tickets.schemas import TicketCreate, TicketOut, TicketUpdate, MessageOut, MessageCreate
from app.modules.tickets.service import TicketService
from app.api.deps import get_current_user, RoleChecker, get_ticket_query

router = APIRouter(prefix="/tickets", tags=["tickets"])

customer_only = RoleChecker([RoleEnum.customer])

def get_ticket_service(db: Session = Depends(get_db)) -> TicketService:
    return TicketService(db)

@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    data: TicketCreate,
    current_user: User = Depends(customer_only),
    service: TicketService = Depends(get_ticket_service)
):
    return service.create_ticket(data, current_user)

@router.get("", response_model=List[TicketOut])
def list_tickets(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: TicketService = Depends(get_ticket_service)
):
    query = get_ticket_query(db, current_user)
    return service.list_tickets(query, status_filter)

@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: TicketService = Depends(get_ticket_service)
):
    query = get_ticket_query(db, current_user)
    return service.get_ticket(query, ticket_id)

@router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: TicketService = Depends(get_ticket_service)
):
    query = get_ticket_query(db, current_user)
    return service.update_ticket(data, query, ticket_id, current_user)

@router.get("/{ticket_id}/messages", response_model=List[MessageOut])
def list_ticket_messages(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: TicketService = Depends(get_ticket_service)
):
    query = get_ticket_query(db, current_user)
    return service.get_ticket_messages(query, ticket_id)

@router.post("/{ticket_id}/messages", response_model=MessageOut)
def add_ticket_message(
    ticket_id: int,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: TicketService = Depends(get_ticket_service)
):
    query = get_ticket_query(db, current_user)
    return service.add_message(query, ticket_id, current_user.id, data.body)
