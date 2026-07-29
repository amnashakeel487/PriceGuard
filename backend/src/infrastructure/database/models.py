import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.config.database import Base
from src.domain.enums import MonitoringStatus, AlertStatus, WebsiteType


class BaseModel(Base):
    """Reusable base database model.
    
    Provides universal ID and timestamp trackers.
    """
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class Product(BaseModel):
    """Product model containing monitored items meta details and price limits."""
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), unique=True, index=True, nullable=False)
    website: Mapped[WebsiteType] = mapped_column(
        Enum(WebsiteType),
        default=WebsiteType.OTHER,
        nullable=False
    )
    target_price: Mapped[float] = mapped_column(Float, nullable=False)
    current_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    monitoring_status: Mapped[MonitoringStatus] = mapped_column(
        Enum(MonitoringStatus),
        default=MonitoringStatus.ACTIVE,
        nullable=False
    )
    last_checked: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_alert_sent: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    price_histories: Mapped[List["PriceHistory"]] = relationship(
        "PriceHistory",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="PriceHistory.checked_at.desc()"
    )
    alerts: Mapped[List["Alert"]] = relationship(
        "Alert",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="Alert.created_at.desc()"
    )


class PriceHistory(BaseModel):
    """Historical data capture logs tracking product price points."""
    __tablename__ = "price_histories"

    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    price: Mapped[float] = mapped_column(Float, nullable=False)
    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="price_histories")


class Alert(BaseModel):
    """System generated price check alert events sent to customers."""
    __tablename__ = "alerts"

    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(String(1000), nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus),
        default=AlertStatus.PENDING,
        nullable=False
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="alerts")

