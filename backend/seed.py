import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, Base, engine
from app.db.models import Business, User, RoleEnum, Ticket, PriorityEnum, StatusEnum, Message
from app.core.security import get_password_hash

def seed_data():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        if db.query(Business).filter(Business.slug == "tech-corp").first():
            print("Seed data already exists. Skipping.")
            return

        print("Seeding database...")
        password = get_password_hash("password123")

        # Business 1
        b1 = Business(name="Tech Corp", slug="tech-corp")
        db.add(b1)
        db.flush()

        b1_admin = User(business_id=b1.id, name="Tech Admin", email="admin@techcorp.com", password_hash=password, role=RoleEnum.admin)
        b1_agent = User(business_id=b1.id, name="Tech Agent", email="agent@techcorp.com", password_hash=password, role=RoleEnum.agent)
        b1_cust1 = User(business_id=b1.id, name="Tech Customer 1", email="customer1@techcorp.com", password_hash=password, role=RoleEnum.customer)
        b1_cust2 = User(business_id=b1.id, name="Tech Customer 2", email="customer2@techcorp.com", password_hash=password, role=RoleEnum.customer)

        db.add_all([b1_admin, b1_agent, b1_cust1, b1_cust2])
        db.flush()

        # Business 2
        b2 = Business(name="Bio Labs", slug="bio-labs")
        db.add(b2)
        db.flush()

        b2_admin = User(business_id=b2.id, name="Bio Admin", email="admin@biolabs.com", password_hash=password, role=RoleEnum.admin)
        b2_agent = User(business_id=b2.id, name="Bio Agent", email="agent@biolabs.com", password_hash=password, role=RoleEnum.agent)
        b2_cust1 = User(business_id=b2.id, name="Bio Customer 1", email="customer1@biolabs.com", password_hash=password, role=RoleEnum.customer)
        b2_cust2 = User(business_id=b2.id, name="Bio Customer 2", email="customer2@biolabs.com", password_hash=password, role=RoleEnum.customer)

        db.add_all([b2_admin, b2_agent, b2_cust1, b2_cust2])
        db.flush()

        # Tickets for Business 1
        t1 = Ticket(business_id=b1.id, customer_id=b1_cust1.id, subject="Login Issue", category="Support", priority=PriorityEnum.high, status=StatusEnum.open)
        db.add(t1)
        db.flush()
        db.add(Message(ticket_id=t1.id, sender_id=b1_cust1.id, body="I can't login to my account."))

        t2 = Ticket(business_id=b1.id, customer_id=b1_cust2.id, assigned_agent_id=b1_agent.id, subject="Billing Question", category="Billing", priority=PriorityEnum.medium, status=StatusEnum.in_progress)
        db.add(t2)
        db.flush()
        db.add(Message(ticket_id=t2.id, sender_id=b1_cust2.id, body="Why was I charged twice?"))
        db.add(Message(ticket_id=t2.id, sender_id=b1_agent.id, body="Let me check your account."))

        db.commit()
        print("Database seeded successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
