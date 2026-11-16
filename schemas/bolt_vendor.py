"""
schemas/bolt_vendor.py — Pydantic schemas for BoltVendor in-venue listings.
"""

from pydantic import BaseModel, Field
from typing import Optional


class BoltVendorCreate(BaseModel):
    name: str = Field(..., min_length=1)
    venue_id: int = Field(..., gt=0, description="Venue where this vendor operates (in-venue only)")
    vendor_type: Optional[str] = Field(None, description="food_stall | pop_up_kitchen | bar")
    menu_category: Optional[str] = Field(None, description="snacks | beverages | meals")
    stock_capacity: Optional[int] = Field(None, ge=0)
    avg_prep_time_mins: Optional[int] = Field(10, ge=0)
    is_active: bool = True
    bolt_delivery_fee: Optional[float] = Field(0.0, ge=0)
    instamart_economics_share: Optional[float] = Field(None, ge=0)

    model_config = {"json_schema_extra": {
        "example": {
            "name": "Stadium Bites by Haldirams",
            "venue_id": 2,
            "vendor_type": "food_stall",
            "menu_category": "snacks",
            "stock_capacity": 200,
            "avg_prep_time_mins": 8,
            "bolt_delivery_fee": 0.0,
        }
    }}


class BoltVendorRead(BoltVendorCreate):
    id: int

    model_config = {"from_attributes": True}
