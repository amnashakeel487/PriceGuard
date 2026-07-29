from abc import ABC, abstractmethod
from src.domain.models import User, Alert


class INotifier(ABC):
    """Interface for sending notifications to users."""

    @abstractmethod
    def send_price_alert(self, user: User, alert: Alert, current_price: float, chart_bytes: bytes) -> bool:
        """
        Sends price drop notification with embedded comparison details and inline Matplotlib trend chart.
        """
        pass
