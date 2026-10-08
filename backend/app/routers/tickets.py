from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Ticket, Message, RoleEnum, StatusEnum, PriorityEnum, User
from app.schemas.ticket import TicketCreate, TicketOut
from app.api.deps import get_current_user, RoleChecker, get_ticket_query

router = APIRouter(prefix="/tickets", tags=["tickets"])

customer_only = RoleChecker([RoleEnum.customer])

@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(customer_only)
):
    if data.priority not in [p.value for p in PriorityEnum]:
        raise HTTPException(status_code=422, detail="Invalid priority")

    ticket = Ticket(
        business_id=current_user.business_id,
        customer_id=current_user.id,
        subject=data.subject,
        category=data.category,
        priority=PriorityEnum(data.priority),
        status=StatusEnum.open,
    )
    db.add(ticket)
    db.flush() # get ticket.id
    
    first_message = Message(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        body=data.message
    )
    db.add(first_message)
    
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("", response_model=List[TicketOut])
def list_tickets(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = get_ticket_query(db, current_user)
    
    if status_filter:
        if status_filter not in [s.value for s in StatusEnum]:
            raise HTTPException(status_code=422, detail="Invalid status filter")
        query = query.filter(Ticket.status == StatusEnum(status_filter))
        
    query = query.order_by(Ticket.updated_at.desc())
    return query.all()

@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = get_ticket_query(db, current_user).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket
