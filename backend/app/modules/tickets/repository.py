from sqlalchemy.orm import Session
from app.db.models import Ticket, Message
from app.core.pagination import paginate

class TicketRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_ticket_and_message(self, ticket: Ticket, message: Message) -> Ticket:
        self.db.add(ticket)
        self.db.flush()
        
        message.ticket_id = ticket.id
        self.db.add(message)
        
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def save(self, ticket: Ticket) -> Ticket:
        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def get_ticket_messages(self, ticket_id: int):
        return self.db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.created_at.asc()).all()

    def get_ticket_messages_paginated(self, ticket_id: int, page: int = 1, limit: int = 50):
        query = self.db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.created_at.asc())
        return paginate(query, page=page, limit=limit)

    def add_message(self, message: Message, ticket: Ticket) -> Message:
        self.db.add(message)
        self.db.add(ticket) # ticket updated_at will be updated by sqlalchemy
        self.db.commit()
        self.db.refresh(message)
        return message
