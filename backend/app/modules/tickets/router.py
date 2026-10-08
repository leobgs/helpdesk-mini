from fastapi import APIRouter, Depends, status, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Ticket, User, RoleEnum
from app.modules.tickets.schemas import TicketCreate, TicketOut, TicketUpdate, MessageOut, MessageCreate
from app.modules.tickets.service import TicketService
from app.api.deps import get_current_user, RoleChecker, get_ticket_query
from app.core.websocket import manager
from app.core.security import decode_token
from anyio.from_thread import run
from starlette.concurrency import run_in_threadpool

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
    ticket, status_changed = service.update_ticket(data, query, ticket_id, current_user)
    if status_changed:
        try:
            run(manager.broadcast_to_ticket, ticket.id, {
                "type": "status_changed",
                "status": ticket.status.value
            })
        except Exception:
            pass
    return ticket

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
    new_msg = service.add_message(query, ticket_id, current_user.id, data.body)
    
    try:
        run(manager.broadcast_to_ticket, ticket_id, {
            "type": "message",
            "data": {
                "id": new_msg.id,
                "body": new_msg.body,
                "created_at": new_msg.created_at.isoformat(),
                "sender": {
                    "id": current_user.id,
                    "name": current_user.name,
                    "role": current_user.role.value
                }
            }
        })
    except Exception:
        pass
        
    return new_msg

def get_ws_user(token: str, db: Session) -> User:
    try:
        payload = decode_token(token, token_type="access")
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None

@router.websocket("/ws/{ticket_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    ticket_id: int, 
    token: str, 
    db: Session = Depends(get_db)
):
    user = get_ws_user(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    def check_access():
        return get_ticket_query(db, user).filter(Ticket.id == ticket_id).first()
        
    ticket = await run_in_threadpool(check_access)
    if not ticket:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await manager.connect(websocket, ticket_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            if "body" not in data:
                await websocket.send_json({"type": "error", "message": "Missing 'body' field"})
                continue
                
            def process_msg():
                service = TicketService(db)
                return service.add_message(get_ticket_query(db, user), ticket_id, user.id, data["body"])
                
            try:
                new_msg = await run_in_threadpool(process_msg)
                
                msg_event = {
                    "type": "message",
                    "data": {
                        "id": new_msg.id,
                        "body": new_msg.body,
                        "created_at": new_msg.created_at.isoformat(),
                        "sender": {
                            "id": user.id,
                            "name": user.name,
                            "role": user.role.value
                        }
                    }
                }
                await manager.broadcast_to_ticket(ticket_id, msg_event)
                
            except HTTPException as e:
                await websocket.send_json({"type": "error", "message": e.detail})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, ticket_id)
