from fastapi import HTTPException
from app.db.models import Ticket, Message, PriorityEnum, StatusEnum, User
from app.modules.tickets.schemas import TicketCreate
from app.modules.tickets.repository import TicketRepository
from sqlalchemy.orm import Query

class TicketService:
    def __init__(self, db):
        self.repo = TicketRepository(db)

    def create_ticket(self, data: TicketCreate, user: User) -> Ticket:
        if data.priority not in [p.value for p in PriorityEnum]:
            raise HTTPException(status_code=422, detail="Invalid priority")

        ticket = Ticket(
            business_id=user.business_id,
            customer_id=user.id,
            subject=data.subject,
            category=data.category,
            priority=PriorityEnum(data.priority),
            status=StatusEnum.open,
        )
        message = Message(
            sender_id=user.id,
            body=data.message
        )
        return self.repo.create_ticket_and_message(ticket, message)

    def list_tickets(self, query: Query, status_filter: str = None):
        if status_filter:
            if status_filter not in [s.value for s in StatusEnum]:
                raise HTTPException(status_code=422, detail="Invalid status filter")
            query = query.filter(Ticket.status == StatusEnum(status_filter))
            
        return query.order_by(Ticket.updated_at.desc()).all()

    def get_ticket(self, query: Query, ticket_id: int):
        ticket = query.filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return ticket
