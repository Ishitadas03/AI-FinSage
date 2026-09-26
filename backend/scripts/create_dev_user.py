import sys
import os
import uuid

# Ensure backend folder is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User


def seed_dev_user():
    """
    Creates a development-only test account in PostgreSQL for feature verification.
    Refuses to execute if ENVIRONMENT is set to 'production'.
    """
    if str(settings.ENVIRONMENT).lower() == "production" or not settings.DEBUG:
        print("[ERROR] Refusing to seed test user in production mode!")
        sys.exit(1)

    db = SessionLocal()
    try:
        dev_email = "dev.user@finsage.local"
        dev_password = "DevPassword123!"
        dev_name = "FinSage Dev Tester"

        existing = db.query(User).filter(User.email == dev_email).first()
        if existing:
            print(f"[INFO] Development test account already exists: {dev_email}")
            print(f"       Email:    {dev_email}")
            print(f"       Password: {dev_password}")
            return

        hashed_password = get_password_hash(dev_password)
        dev_user = User(
            id=uuid.uuid4(),
            full_name=dev_name,
            email=dev_email,
            password_hash=hashed_password,
        )
        db.add(dev_user)
        db.commit()
        print(f"[SUCCESS] Development test account created successfully!")
        print(f"          Email:    {dev_email}")
        print(f"          Password: {dev_password}")
    except Exception as err:
        db.rollback()
        print(f"[ERROR] Failed to seed dev user: {err}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_dev_user()
