class PriceGuardDomainException(Exception):
    """Base domain exception for PriceGuard application."""
    pass


class InvalidUrlError(PriceGuardDomainException):
    """Raised when a URL provided for tracking is invalid or unsupported."""
    pass


class ProductNotFoundError(PriceGuardDomainException):
    """Raised when a requested product does not exist in the system."""
    pass


class DuplicateTrackerError(PriceGuardDomainException):
    """Raised when a user attempts to track a product they are already tracking."""
    pass


class NotificationDeliveryFailed(PriceGuardDomainException):
    """Raised when an alert email/notification fails to deliver."""
    pass
