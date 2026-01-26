"""
Face Recognition Service
Handles face detection, alignment, and embedding generation using InsightFace buffalo_sc model.
"""

import base64
import json
import io
from typing import Optional, Tuple, List
from loguru import logger

from app.config import settings

# Try importing heavy dependencies - they're optional
try:
    import numpy as np
    from PIL import Image
    import cv2
    DEPENDENCIES_AVAILABLE = True
except ImportError:
    DEPENDENCIES_AVAILABLE = False
    logger.warning("Face recognition dependencies not available. Install insightface, opencv-python-headless, and numpy to enable.")

# Lazy load InsightFace to avoid import errors during testing
_face_analyzer = None


def get_face_analyzer():
    """
    Get or initialize the InsightFace analyzer with buffalo_sc model.
    Uses lazy loading for efficiency.
    Returns None if face recognition is disabled or unavailable.
    """
    global _face_analyzer
    
    # Check if face recognition is enabled
    if not getattr(settings, 'FACE_RECOGNITION_ENABLED', True):
        logger.info("Face recognition is disabled via FACE_RECOGNITION_ENABLED=False")
        return None
    
    if _face_analyzer is None:
        try:
            from insightface.app import FaceAnalysis
            import os
            
            logger.info(f"Initializing InsightFace with model: {settings.FACE_MODEL_NAME}")
            
            # Check if model already exists to avoid re-downloading
            model_path = f"/root/.insightface/models/{settings.FACE_MODEL_NAME}"
            model_exists = os.path.exists(model_path) and os.path.isdir(model_path)
            
            if model_exists:
                # Check if all required ONNX files exist and have reasonable size (>1MB)
                required_files = ['w600k_r50.onnx', 'det_10g.onnx', '1k3d68.onnx', '2d106det.onnx', 'genderage.onnx']
                all_files_valid = True
                for f in required_files:
                    file_path = os.path.join(model_path, f)
                    if not os.path.exists(file_path):
                        all_files_valid = False
                        break
                    # Check file size (should be > 1MB for ONNX files)
                    if os.path.getsize(file_path) < 1024 * 1024:
                        logger.warning(f"Model file {f} seems corrupted (too small), will re-download")
                        all_files_valid = False
                        break
                
                if all_files_valid:
                    logger.info(f"Using existing model at {model_path} (all files verified)")
                else:
                    logger.warning(f"Model files incomplete or corrupted, will re-download")
                    # Remove corrupted model directory
                    import shutil
                    try:
                        shutil.rmtree(model_path)
                        logger.info(f"Removed corrupted model directory: {model_path}")
                    except Exception as e:
                        logger.warning(f"Could not remove corrupted model: {e}")
            
            # Initialize FaceAnalysis
            # If model doesn't exist, it will download automatically
            # The root parameter ensures it uses the correct location
            _face_analyzer = FaceAnalysis(
                name=settings.FACE_MODEL_NAME,
                root="/root/.insightface",
                providers=['CPUExecutionProvider']  # Use CPU, add CUDAExecutionProvider for GPU
            )
            
            # Prepare for image size (standard detection size)
            _face_analyzer.prepare(ctx_id=0, det_size=(640, 640))
            
            logger.info("InsightFace model loaded successfully")
            
        except ImportError as e:
            logger.warning(f"InsightFace not available: {e}")
            logger.warning("Face recognition will be disabled. Install insightface to enable.")
            return None
        except Exception as e:
            logger.error(f"Failed to initialize InsightFace: {e}")
            logger.warning("Face recognition will be disabled due to initialization error.")
            return None
    
    return _face_analyzer


class FaceRecognitionService:
    """
    Service for face detection, embedding generation, and matching.
    Uses InsightFace with the buffalo_sc model (smaller, memory-efficient).
    """
    
    def __init__(self):
        """Initialize the face recognition service."""
        self.threshold = settings.FACE_SIMILARITY_THRESHOLD
    
    @staticmethod
    def decode_base64_image(base64_string: str):
        """
        Decode a base64 encoded image to numpy array (BGR format for OpenCV).
        
        Args:
            base64_string: Base64 encoded image string (with or without data URL prefix)
        
        Returns:
            numpy array in BGR format
        
        Raises:
            ValueError: If image decoding fails or dependencies not available
        """
        if not DEPENDENCIES_AVAILABLE:
            raise ValueError("Face recognition dependencies not installed. Install insightface, opencv-python-headless, and numpy.")
        
        try:
            # Remove data URL prefix if present
            if "," in base64_string:
                base64_string = base64_string.split(",")[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(base64_string)
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Convert to numpy array (RGB)
            img_array = np.array(image)
            
            # Convert RGB to BGR for OpenCV/InsightFace
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            return img_bgr
            
        except Exception as e:
            logger.error(f"Failed to decode image: {e}")
            raise ValueError(f"Invalid image data: {e}")
    
    def detect_and_extract_embedding(
        self, 
        image_data: str
    ) -> Tuple[bool, Optional[np.ndarray], str]:
        """
        Detect face in image and extract embedding.
        
        Args:
            image_data: Base64 encoded image string
        
        Returns:
            Tuple of (success, embedding, message)
            - success: True if exactly one face was detected and embedded
            - embedding: 512-dimensional face embedding array, or None
            - message: Status message
        """
        try:
            # Get face analyzer (check if available)
            analyzer = get_face_analyzer()
            if analyzer is None:
                return False, None, "Face recognition is not available. Please enable it in configuration or install required dependencies."
            
            # Decode image
            img = self.decode_base64_image(image_data)
            
            # Detect faces
            faces = analyzer.get(img)
            
            logger.info(f"Detected {len(faces)} face(s) in image")
            
            if len(faces) == 0:
                return False, None, "No face detected in the image"
            
            if len(faces) > 1:
                return False, None, f"Multiple faces detected ({len(faces)}). Please provide an image with only one face."
            
            # Extract embedding from the single detected face
            face = faces[0]
            embedding = face.embedding  # 512-dimensional vector
            
            if embedding is None:
                return False, None, "Failed to extract face embedding"
            
            # Normalize embedding (L2 normalization for cosine similarity)
            embedding = embedding / np.linalg.norm(embedding)
            
            return True, embedding, "Face embedding extracted successfully"
            
        except ValueError as e:
            return False, None, str(e)
        except Exception as e:
            logger.error(f"Face detection error: {e}")
            return False, None, f"Face detection failed: {e}"
    
    @staticmethod
    def embedding_to_json(embedding: np.ndarray) -> str:
        """
        Convert numpy embedding array to JSON string for database storage.
        
        Args:
            embedding: 512-dimensional numpy array
        
        Returns:
            JSON string representation
        """
        return json.dumps(embedding.tolist())
    
    @staticmethod
    def json_to_embedding(json_string: str) -> np.ndarray:
        """
        Convert JSON string from database to numpy embedding array.
        
        Args:
            json_string: JSON string of embedding values
        
        Returns:
            512-dimensional numpy array
        """
        return np.array(json.loads(json_string), dtype=np.float32)
    
    def compute_similarity(
        self, 
        embedding1: np.ndarray, 
        embedding2: np.ndarray
    ) -> float:
        """
        Compute cosine similarity between two face embeddings.
        
        Args:
            embedding1: First face embedding (512-dim)
            embedding2: Second face embedding (512-dim)
        
        Returns:
            Cosine similarity score (0 to 1, higher is more similar)
        """
        # Ensure embeddings are normalized
        e1 = embedding1 / np.linalg.norm(embedding1)
        e2 = embedding2 / np.linalg.norm(embedding2)
        
        # Compute cosine similarity
        similarity = np.dot(e1, e2)
        
        # Clamp to [0, 1] range (can be slightly negative due to floating point)
        return float(max(0, min(1, similarity)))
    
    def find_best_match(
        self, 
        query_embedding: np.ndarray, 
        stored_embeddings: List[Tuple[int, str]]
    ) -> Tuple[Optional[int], float]:
        """
        Find the best matching student from stored embeddings.
        
        Args:
            query_embedding: Face embedding to match (512-dim numpy array)
            stored_embeddings: List of (student_id, embedding_json) tuples
        
        Returns:
            Tuple of (best_match_student_id, similarity_score)
            Returns (None, 0.0) if no match above threshold
        """
        best_match_id = None
        best_similarity = 0.0
        
        for student_id, embedding_json in stored_embeddings:
            if embedding_json is None:
                continue
            
            try:
                stored_embedding = self.json_to_embedding(embedding_json)
                similarity = self.compute_similarity(query_embedding, stored_embedding)
                
                logger.debug(f"Student {student_id}: similarity = {similarity:.4f}")
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match_id = student_id
                    
            except Exception as e:
                logger.warning(f"Error comparing with student {student_id}: {e}")
                continue
        
        # Check if best match meets threshold
        if best_similarity >= self.threshold:
            logger.info(f"Best match: student_id={best_match_id}, similarity={best_similarity:.4f}")
            return best_match_id, best_similarity
        else:
            logger.info(f"No match above threshold ({self.threshold}). Best was {best_similarity:.4f}")
            return None, best_similarity


# Global service instance
face_recognition_service = FaceRecognitionService()
