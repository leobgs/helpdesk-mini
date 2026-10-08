from fastapi import HTTPException
from app.db.models import Ticket, Message, PriorityEnum, StatusEnum, User, RoleEnum
from app.modules.tickets.schemas import TicketCreate, TicketUpdate
from app.modules.tickets.repository import TicketRepository
from sqlalchemy.orm import Query
from datetime import datetime
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

    def update_ticket(self, data: TicketUpdate, query: Query, ticket_id: int, current_user: User) -> Ticket:
        ticket = self.get_ticket(query, ticket_id)

        if ticket.status == StatusEnum.closed:
            raise HTTPException(status_code=403, detail="Ticket is closed and locked")

        # Handle Customer rules
        if current_user.role == RoleEnum.customer:
            if data.assigned_agent_id is not None:
                raise HTTPException(status_code=403, detail="Customers cannot assign agents")
            if data.status:
                if data.status != StatusEnum.open.value or ticket.status != StatusEnum.resolved:
                    raise HTTPException(status_code=403, detail="Customers can only reopen resolved tickets")
                ticket.status = StatusEnum.open

        # Handle Admin/Agent rules
        else:
            # Assignment
            if data.assigned_agent_id is not None:
                if current_user.role == RoleEnum.agent and data.assigned_agent_id != current_user.id:
                    raise HTTPException(status_code=403, detail="Agents can only assign tickets to themselves")
                
                target_user = self.repo.db.query(User).filter(
                    User.id == data.assigned_agent_id,
                    User.business_id == current_user.business_id,
                    User.role == RoleEnum.agent
                ).first()
                if not target_user:
                    raise HTTPException(status_code=422, detail="Invalid target agent")
                
                ticket.assigned_agent_id = data.assigned_agent_id
                
                # If assigned and status is open, auto-move to in_progress per spec
                if ticket.status == StatusEnum.open and not data.status:
                    ticket.status = StatusEnum.in_progress
            
            # Status Transition
            if data.status:
                new_status = StatusEnum(data.status)
                if new_status != ticket.status:
                    valid_transitions = {
                        StatusEnum.open: [StatusEnum.in_progress],
                        StatusEnum.in_progress: [StatusEnum.resolved],
                        StatusEnum.resolved: [StatusEnum.open, StatusEnum.closed],
                        StatusEnum.closed: []
                    }
                    if new_status not in valid_transitions[ticket.status]:
                        raise HTTPException(status_code=422, detail=f"Invalid transition from {ticket.status.value} to {new_status.value}")
                    ticket.status = new_status

        ticket.updated_at = datetime.utcnow()
        self.repo.save(ticket)
        # TODO: Broadcast to WebSockets (Task 10)
        return ticket
