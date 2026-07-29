from abc import ABC, abstractmethod
from types import TracebackType
from typing import Optional, Type
from src.application.interfaces.repository import IUserRepository, IProductRepository, IAlertRepository


class IUnitOfWork(ABC):
    """
    Interface for transaction control. 
    Maintains repository instances and ensures database actions are committed or rolled back.
    """
    users: IUserRepository
    products: IProductRepository
    alerts: IAlertRepository

    @abstractmethod
    def __enter__(self) -> "IUnitOfWork":
        pass

    @abstractmethod
    def __exit__(self, exc_type: Optional[Type[BaseException]], exc_val: Optional[BaseException], exc_tb: Optional[TracebackType]) -> None:
        pass

    @abstractmethod
    def commit(self) -> None:
        pass

    @abstractmethod
    def rollback(self) -> None:
        pass
