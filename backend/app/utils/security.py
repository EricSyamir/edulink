"""
Security Utilities
Password hashing and session management.
"""

from passlib.context import CryptContext

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hash.
    
    Args:
        plain_password: The password to verify
        hashed_password: The bcrypt hash to compare against
    
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Generate bcrypt hash for a password.
    
    Args:
        password: Plain text password to hash
    
    Returns:
        Bcrypt hash string
    """
    return pwd_context.hash(password)
