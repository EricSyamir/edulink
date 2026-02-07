"""
Routes Package
API route definitions for all endpoints.
"""

from app.routes.auth import router as auth_router
from app.routes.students import router as students_router
from app.routes.teachers import router as teachers_router
from app.routes.discipline import router as discipline_router
from app.routes.setup import router as setup_router
from app.routes.translation import router as translation_router
from app.routes.load_test import router as load_test_router

__all__ = [
    "auth_router",
    "students_router",
    "teachers_router",
    "discipline_router",
    "setup_router",
    "translation_router",
    "load_test_router",
]
