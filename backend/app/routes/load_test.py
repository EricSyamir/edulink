"""
Load test endpoints - for testing DB and face detection under concurrency.
No auth required. Use only for load testing.
"""
from fastapi import APIRouter
from sqlalchemy import text
from pydantic import BaseModel

from app.database import SessionLocal
from app.services.face_recognition import face_recognition_service

router = APIRouter(prefix="/api/load-test", tags=["Load Test"])

# Minimal valid 1x1 JPEG (no face - exercises detection pipeline)
_MINIMAL_JPEG_B64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEAAAwAEAAP/2Q=="


class FaceTestRequest(BaseModel):
    face_image: str | None = None


@router.get("/db")
def load_test_db():
    """Run a DB query - for load testing connection pool."""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db.commit()
        return {"ok": True, "query": "SELECT 1"}
    finally:
        db.close()


@router.post("/face")
def load_test_face(body: FaceTestRequest):
    """Run face detection - for load testing. Uses built-in image if none provided."""
    image_b64 = body.face_image or _MINIMAL_JPEG_B64
    success, embedding, msg = face_recognition_service.detect_and_extract_embedding(image_b64)
    return {"ok": success, "message": msg, "has_embedding": embedding is not None}
