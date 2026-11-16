"""
schemas/chat.py — Pydantic schemas for AI Chatbot interactions.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's query")
    city: Optional[str] = Field(None, description="Current city context")
    user_lat: Optional[float] = Field(None, description="User's latitude for proximity calculation")
    user_lng: Optional[float] = Field(None, description="User's longitude for proximity calculation")
    booking_id: Optional[int] = Field(None, description="Active booking ID if user is in an orchestration flow")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Recent conversation turns")


class ChatResponse(BaseModel):
    reply: str
    intent: str
    suggested_actions: List[str] = []
    relevant_items: List[Dict[str, Any]] = []
    engine_source: str = Field("local_grounded_engine", description="'gemini' or 'local_grounded_engine'")
