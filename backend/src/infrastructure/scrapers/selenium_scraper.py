from src.application.interfaces.scraper import IScraper, ScrapedProductData
from src.domain.exceptions import InvalidUrlError
from src.utils.logger import get_logger

logger = get_logger(__name__)


class SeleniumScraper(IScraper):
    """
    Scraper implementation using Selenium Headless Chromium 
    for parsing Single Page Applications (SPAs) and JS-heavy sites.
    """

    def scrape(self, url: str) -> ScrapedProductData:
        logger.info(f"SeleniumScraper executing browser runtime for: {url}")
        
        if not url.startswith("http"):
            raise InvalidUrlError("Provided URL protocol is not supported")

        # Mock browser parse result for scaffolding
        return ScrapedProductData(
            title="Mock JS Product",
            price=149.99,
            currency="USD",
            image_url="https://images.unsplash.com/photo-1546868871-7041f2a55e12",
            is_available=True
        )
