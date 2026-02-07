from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deep_translator import GoogleTranslator
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AITranslator")

app = FastAPI(title="AI Translator API")

# Configure CORS for frontend access - allow translation frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for standalone translation service
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Translation Logic ---

class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "auto"
    target_lang: str

class TranslationResponse(BaseModel):
    translated_text: str
    original_text: str
    src_lang: str
    tgt_lang: str

# Language code mapping
LANG_MAP = {
    'malay': 'ms', 'ms': 'ms',
    'english': 'en', 'en': 'en',
    'mandarin': 'zh-CN', 'zh': 'zh-CN',
    'tamil': 'ta', 'ta': 'ta'
}

@app.post("/translation/", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    try:
        # Normalize language codes
        source = LANG_MAP.get(request.source_lang.lower(), request.source_lang)
        target = LANG_MAP.get(request.target_lang.lower(), request.target_lang)

        logger.info(f"Translating: {request.text[:20]}... ({source} -> {target})")

        translator = GoogleTranslator(source=source, target=target)
        translated = translator.translate(request.text)
        
        return TranslationResponse(
            translated_text=translated,
            original_text=request.text,
            src_lang=source,
            tgt_lang=target
        )
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

# --- Run Server ---
if __name__ == "__main__":
    print("Starting AI Translator Backend on http://localhost:8000")
    print("Docs available at http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
