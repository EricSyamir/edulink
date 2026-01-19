"""
Routes Package
API route definitions for all endpoints.
"""

from app.routes.auth import router as auth_router
from app.routes.students import router as students_router
from app.routes.teachers import router as teachers_router
from app.routes.discipline import router as discipline_router

__all__ = ["auth_router", "students_router", "teachers_router", "discipline_router"]
