from enum import Enum


class MonitoringStatus(str, Enum):
    """E-commerce product monitoring statuses."""
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    ERROR = "ERROR"


class AlertStatus(str, Enum):
    """Notification alerts delivery statuses."""
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"


class WebsiteType(str, Enum):
    """Recognized scraping domains."""
    AMAZON = "AMAZON"
    FLIPKART = "FLIPKART"
    DARAZ = "DARAZ"
    OTHER = "OTHER"
