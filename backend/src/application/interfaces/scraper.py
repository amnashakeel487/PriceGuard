from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class ScrapedProductData:
    title: str
    price: float
    currency: str
    image_url: Optional[str]
    is_available: bool


class IScraper(ABC):
    """Interface for web scraper engines."""

    @abstractmethod
    def scrape(self, url: str) -> ScrapedProductData:
        """
        Executes HTTP requests/browser rendering on target url 
        and returns clean product details.
        """
        pass
