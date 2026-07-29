from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional
from src.domain.models import User, Product, Alert

T = TypeVar("T")


class IRepository(ABC, Generic[T]):
    """Base generic repository interface."""
    
    @abstractmethod
    def get_by_id(self, id: int) -> Optional[T]:
        pass

    @abstractmethod
    def add(self, entity: T) -> T:
        pass

    @abstractmethod
    def delete(self, entity: T) -> None:
        pass


class IUserRepository(IRepository[User], ABC):
    """Interface for user data operations."""
    
    @abstractmethod
    def get_by_email(self, email: str) -> Optional[User]:
        pass


class IProductRepository(IRepository[Product], ABC):
    """Interface for product data operations."""
    
    @abstractmethod
    def get_by_url(self, url: str) -> Optional[Product]:
        pass

    @abstractmethod
    def get_all(self) -> List[Product]:
        pass


class IAlertRepository(IRepository[Alert], ABC):
    """Interface for alert rules operations."""
    
    @abstractmethod
    def get_active_by_product(self, product_id: int) -> List[Alert]:
        pass

    @abstractmethod
    def get_by_user(self, user_id: int) -> List[Alert]:
        pass
