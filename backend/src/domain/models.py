from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class User:
    id: Optional[int]
    email: str
    password_hash: str
    is_active: bool
    created_at: datetime


@dataclass
class Product:
    id: Optional[int]
    url: str
    title: str
    image_url: str
    source_domain: str
    current_price: float
    currency: str
    last_scraped_at: datetime
    created_at: datetime


@dataclass
class PriceHistory:
    id: Optional[int]
    product_id: int
    price: float
    recorded_at: datetime


@dataclass
class Alert:
    id: Optional[int]
    user_id: int
    product_id: int
    condition_type: str  # "PRICE_DROP", "VALUE_BELOW"
    target_value: float
    is_triggered: bool
    last_triggered_at: Optional[datetime]
    created_at: datetime
