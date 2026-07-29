import uuid
from typing import Generic, TypeVar, Type, List, Optional, Any, Dict
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import Session
from src.infrastructure.database.models import Product, PriceHistory, Alert

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """Generic repository mapping standard CRUD database queries."""

    def __init__(self, model: Type[ModelType], db: Session):
        """Initializes the repository.
        
        Args:
            model: The SQLAlchemy model class.
            db: The active database Session.
        """
        self.model = model
        self.db = db

    def get_by_id(self, id: uuid.UUID) -> Optional[ModelType]:
        """Fetch a single record by UUID.
        
        Args:
            id: Target UUID.
            
        Returns:
            Optional[ModelType]: The found model object or None.
        """
        return self.db.get(self.model, id)

    def get_all(
        self,
        skip: int = 0,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        search: Optional[str] = None,
        search_fields: Optional[List[str]] = None
    ) -> List[ModelType]:
        """Fetch all records matching filters, search criteria, and pagination.
        
        Args:
            skip: Number of rows to offset.
            limit: Maximum row count return limits.
            filters: Dictionary of equality field filters.
            search: String search query.
            search_fields: Table columns to execute search queries against.
            
        Returns:
            List[ModelType]: Query matches list.
        """
        query = select(self.model)

        # Apply equality filters
        if filters:
            for field, val in filters.items():
                if hasattr(self.model, field) and val is not None:
                    query = query.where(getattr(self.model, field) == val)

        # Apply text search queries
        if search and search_fields:
            search_clauses = []
            for field in search_fields:
                if hasattr(self.model, field):
                    search_clauses.append(getattr(self.model, field).ilike(f"%{search}%"))
            if search_clauses:
                query = query.where(or_(*search_clauses))

        # Apply pagination offset limits
        query = query.offset(skip).limit(limit)
        return list(self.db.scalars(query).all())

    def create(self, entity: ModelType) -> ModelType:
        """Saves a new record into the database.
        
        Args:
            entity: Model instance populate fields.
            
        Returns:
            ModelType: The saved database entry.
        """
        self.db.add(entity)
        self.db.flush()
        return entity

    def update(self, entity: ModelType) -> ModelType:
        """Saves modifications on an existing record.
        
        Args:
            entity: Modified model instance.
            
        Returns:
            ModelType: Saved database entry.
        """
        self.db.add(entity)
        self.db.flush()
        return entity

    def delete(self, entity: ModelType) -> None:
        """Removes a record from the database.
        
        Args:
            entity: Target model instance to remove.
        """
        self.db.delete(entity)
        self.db.flush()

    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count total records matching filters.
        
        Args:
            filters: Query filters dictionary.
            
        Returns:
            int: Match counts.
        """
        query = select(func.count()).select_from(self.model)
        if filters:
            for field, val in filters.items():
                if hasattr(self.model, field) and val is not None:
                    query = query.where(getattr(self.model, field) == val)
        return self.db.scalar(query) or 0


class ProductRepository(BaseRepository[Product]):
    """Repository handling custom queries for Product entities."""

    def __init__(self, db: Session):
        super().__init__(Product, db)

    def get_by_url(self, url: str) -> Optional[Product]:
        """Fetch product matching exact URL address.
        
        Args:
            url: Exact HTTP address.
            
        Returns:
            Optional[Product]: Matched product entry.
        """
        query = select(Product).where(Product.url == url)
        return self.db.scalar(query)

    def get_active_products(self) -> List[Product]:
        """Fetch all active tracking products.
        
        Returns:
            List[Product]: Active products list.
        """
        from src.domain.enums import MonitoringStatus
        query = select(Product).where(Product.monitoring_status == MonitoringStatus.ACTIVE)
        return list(self.db.scalars(query).all())


class PriceHistoryRepository(BaseRepository[PriceHistory]):
    """Repository handling custom queries for PriceHistory logs."""

    def __init__(self, db: Session):
        super().__init__(PriceHistory, db)

    def get_by_product_id(self, product_id: uuid.UUID, limit: int = 50) -> List[PriceHistory]:
        """Fetch historical prices logged for a single product UUID.
        
        Args:
            product_id: Target product UUID.
            limit: Max history lines to list.
            
        Returns:
            List[PriceHistory]: Date-ordered price history list.
        """
        query = (
            select(PriceHistory)
            .where(PriceHistory.product_id == product_id)
            .order_by(PriceHistory.checked_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(query).all())


class AlertRepository(BaseRepository[Alert]):
    """Repository handling custom query evaluations for Alert alerts."""

    def __init__(self, db: Session):
        super().__init__(Alert, db)

    def get_by_product_id(self, product_id: uuid.UUID) -> List[Alert]:
        """Fetch alert logs recorded for a target product.
        
        Args:
            product_id: Target product UUID.
            
        Returns:
            List[Alert]: Historical alerts list.
        """
        query = select(Alert).where(Alert.product_id == product_id).order_by(Alert.created_at.desc())
        return list(self.db.scalars(query).all())

    def get_pending_alerts(self) -> List[Alert]:
        """Fetch all alerts waiting dispatch schedules.
        
        Returns:
            List[Alert]: PENDING alerts.
        """
        from src.domain.enums import AlertStatus
        query = select(Alert).where(Alert.status == AlertStatus.PENDING)
        return list(self.db.scalars(query).all())
