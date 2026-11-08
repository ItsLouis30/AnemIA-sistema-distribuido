from fastapi import APIRouter
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

from backend.app.services.chat_service import ask_chat

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    report: Optional[Dict[str, Any]] = None
@router.post("")

def chat(req: ChatRequest):
    return ask_chat(req.message, req.report)
