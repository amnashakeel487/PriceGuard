import requests
from bs4 import BeautifulSoup
from src.application.interfaces.scraper import IScraper, ScrapedProductData
from src.infrastructure.scrapers.base import get_random_headers
from src.domain.exceptions import InvalidUrlError
from src.utils.logger import get_logger

logger = get_logger(__name__)


class BS4Scraper(IScraper):
    """
    Scraper implementation using requests and BeautifulSoup4 
    for parsing static HTML target documents.
    """

    def scrape(self, url: str) -> ScrapedProductData:
        logger.info(f"BS4Scraper executing request to: {url}")
        
        # In scaffolding, we implement a basic validation stub.
        if not url.startswith("http"):
            raise InvalidUrlError("Provided URL protocol is not supported")

        # Basic request stub (will be filled with CSS selector registry in implementation phase)
        try:
            # We mock the return value for the scaffold setup
            return ScrapedProductData(
                title="Mock E-Commerce Product",
                price=99.99,
                currency="USD",
                image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30",
                is_available=True
            )
        except Exception as e:
            logger.error(f"BS4Scraper parsing exception: {e}")
            raise e
