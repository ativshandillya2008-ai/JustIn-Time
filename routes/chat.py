"""
routes/chat.py — AI Chatbot router for JustIn-Time Concierge.
POST /chat — Send user message and get grounded AI response.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.chat import ChatRequest, ChatResponse
from services.chat_service import generate_chat_reply

router = APIRouter(prefix="/chat", tags=["AI Chatbot"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
def chat_with_concierge(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Conversational endpoint for the JustIn-Time AI Concierge.
    Grounded in current events, nearby restaurants, discovery scenes, and active booking orchestrations.
    """
    history_dicts = [{"role": h.role, "content": h.content} for h in (payload.history or [])]
    
    result = generate_chat_reply(
        message=payload.message,
        db=db,
        city=payload.city,
        user_lat=payload.user_lat,
        user_lng=payload.user_lng,
        booking_id=payload.booking_id,
        history=history_dicts,
    )
    return result
