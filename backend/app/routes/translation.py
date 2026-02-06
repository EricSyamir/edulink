from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from deep_translator import GoogleTranslator
from loguru import logger

router = APIRouter(tags=["translation"])


class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "auto"
    target_lang: str


class TranslationResponse(BaseModel):
    translated_text: str
    original_text: str
    src_lang: str
    tgt_lang: str


# Language code mapping (kept compatible with the standalone Translation backend)
LANG_MAP = {
    "malay": "ms",
    "ms": "ms",
    "english": "en",
    "en": "en",
    "mandarin": "zh-CN",
    "zh": "zh-CN",
    "tamil": "ta",
    "ta": "ta",
}


@router.post("/translation/", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """
    Translate text via GoogleTranslator.

    Frontend expects this exact endpoint: POST /translation/
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    try:
        source = LANG_MAP.get(request.source_lang.lower(), request.source_lang)
        target = LANG_MAP.get(request.target_lang.lower(), request.target_lang)

        logger.info(f"Translating ({source} -> {target}): {request.text[:40]!r}")

        translator = GoogleTranslator(source=source, target=target)
        translated = translator.translate(request.text)

        return TranslationResponse(
            translated_text=translated,
            original_text=request.text,
            src_lang=source,
            tgt_lang=target,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Translation error")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

