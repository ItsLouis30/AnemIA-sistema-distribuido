from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.services.chat_service import ask_chat

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

class ChatRequest(BaseModel):

    message: str
@router.post("")

def chat(req: ChatRequest):
    return ask_chat(req.message)