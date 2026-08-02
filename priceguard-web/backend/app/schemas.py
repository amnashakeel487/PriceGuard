from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    url: str = Field(..., description="Product page URL to track")
    target_price: float = Field(..., gt=0, description="Alert when price drops below this")


class ProductUpdate(BaseModel):
    target_price: Optional[float] = Field(None, gt=0)


class ProductOut(BaseModel):
    url: str
    name: str
    site: str
    target_price: float
    last_price: float
    highest_price: float
    lowest_price: float
    last_checked: str
    alert_sent: bool
    below_target: bool
    drop_percentage: float


class HistoryPoint(BaseModel):
    timestamp: str
    price: float


class AlertOut(BaseModel):
    id: str
    timestamp: str
    product_name: str
    url: str
    message: str
    type: str
    success: bool
    read: bool = False


class StatsOut(BaseModel):
    total_products: int
    monitored_products: int
    alerts_sent: int
    money_saved: float
    website_distribution: dict
    top_discounts: List[dict]


class MonitorStatusOut(BaseModel):
    running: bool
    interval_seconds: int
    last_run: Optional[str]
    next_run: Optional[str]
    last_cycle_log: List[str]


class IntervalUpdate(BaseModel):
    interval_seconds: int = Field(..., ge=10)
