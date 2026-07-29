from urllib.parse import urlparse
from src.application.interfaces.scraper import IScraper
from src.infrastructure.scrapers.bs4_scraper import BS4Scraper
from src.infrastructure.scrapers.selenium_scraper import SeleniumScraper


class ScraperFactory:
    """
    Factory class determining the appropriate IScraper engine 
    based on the domain host signature of the target URL.
    """

    @staticmethod
    def get_scraper(url: str) -> IScraper:
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.lower()

        # Domains requiring active JS execution (example: Amazon, BestBuy)
        js_required_domains = [
            "amazon.com", "amazon.co.uk", "amazon.ca", "amazon.in",
            "bestbuy.com", "target.com"
        ]

        if any(d in domain for d in js_required_domains):
            return SeleniumScraper()
        
        # Standard static HTML parser for general web pages
        return BS4Scraper()
