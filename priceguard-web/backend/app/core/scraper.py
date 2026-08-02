"""
Scraper: fetches a product page and extracts (name, price).

Design notes
------------
- Uses a realistic User-Agent header so sites don't immediately 403 us.
- Detects the site (Amazon / Flipkart / generic) via regex on the URL,
  then dispatches to a site-specific parser. Each parser tries several
  known CSS selectors, because e-commerce sites frequently A/B test
  their markup — falling back gracefully instead of crashing is what
  makes this "industrial-level" rather than a toy script.
- A SeleniumScraper subclass is provided for JS-rendered pages. It is
  optional: if selenium/webdriver-manager aren't installed, importing
  this module still works fine — only instantiating SeleniumScraper
  would fail, with a clear error message.
"""

from __future__ import annotations

import os
import re
from typing import Optional, Tuple
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .exceptions import PriceNotFoundError, ScraperError

import json
import os
import re
from typing import Optional, Tuple
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .exceptions import PriceNotFoundError, ScraperError

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Connection": "keep-alive",
}

# Matches price strings across international currencies and formats
PRICE_PATTERN = re.compile(r"[\d]{1,3}(?:[,.\s]\d{2,3})*(?:\.\d{1,2})?")

# Domains whose entire purpose is to redirect somewhere else.
KNOWN_SHORTENERS = {"a.co", "amzn.to", "bit.ly", "tinyurl.com", "t.co", "goo.gl", "rebrand.ly"}


def _build_session(retries: int = 2) -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=retries,
        connect=retries,
        read=retries,
        backoff_factor=1.5,  # 0s, 1.5s, 3s between attempts
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


class Scraper:
    """Requests + BeautifulSoup based scraper with multi-site support."""

    def __init__(self, timeout: Optional[int] = None, retries: int = 2) -> None:
        self.timeout = timeout or int(os.getenv("SCRAPE_TIMEOUT_SECONDS", "15"))
        self.session = _build_session(retries=retries)

    @staticmethod
    def _normalize_url(url: str) -> str:
        url = url.strip()
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        return url

    # ------------------------------------------------------------------ #
    # Site detection (Bonus: Multi-URL support with Regex)
    # ------------------------------------------------------------------ #
    @staticmethod
    def detect_site(url: str) -> str:
        if re.search(r"amazon\.", url, re.IGNORECASE):
            return "amazon"
        if re.search(r"flipkart\.", url, re.IGNORECASE):
            return "flipkart"
        if re.search(r"daraz\.", url, re.IGNORECASE):
            return "daraz"
        return "generic"

    @staticmethod
    def _clean_product_name(name: Optional[str]) -> Optional[str]:
        if not name:
            return None
        cleaned = name.strip()
        cleaned = re.sub(
            r"\s*[-|:]\s*(Amazon(\.[a-z]+)?|Flipkart|Daraz(\.[a-z]+)?)\s*$",
            "",
            cleaned,
            flags=re.IGNORECASE
        ).strip()

        if not cleaned or len(cleaned) < 2:
            return None

        invalid_titles = {
            "amazon.com", "amazon.in", "amazon.co.uk", "amazon.ca", "amazon.de", "amazon",
            "flipkart.com", "flipkart", "daraz.pk", "daraz.lk", "daraz",
            "robot check", "captcha", "security check", "notice", "access denied",
            "404 not found", "page not found", "503 service unavailable", "system error",
            "online shopping site for mobiles, fashion, books, electronics, home appliances & more",
            "online shopping for electronics, apparel, computers, books, dvds & more",
            "shopping cart", "sign in", "log in", "check out"
        }

        lower_name = cleaned.lower()
        if lower_name in invalid_titles:
            return None

        for invalid in ["robot check", "captcha", "security check", "access denied", "page not found"]:
            if invalid in lower_name:
                return None

        if re.match(r"^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$", cleaned):
            return None

        return cleaned

    @staticmethod
    def _extract_name_from_url(url: str) -> Optional[str]:
        parsed = urlparse(url)
        path = parsed.path.strip("/")
        parts = path.split("/")

        for part in parts:
            part_clean = part.replace(".html", "").replace(".htm", "")
            if part_clean.lower() in ("dp", "product", "products", "p", "gp", "pd", "item", "buy"):
                continue
            if re.match(r"^[A-Z0-9]{10}$", part_clean, re.IGNORECASE) or re.match(r"^\d+$", part_clean):
                continue
            if ("-" in part_clean or "_" in part_clean) and len(part_clean) > 3:
                words = part_clean.replace("-", " ").replace("_", " ").split()
                filtered_words = [
                    w for w in words
                    if not (
                        re.match(r"^[a-f0-9]{12,}$", w, re.IGNORECASE) or
                        re.match(r"^itm[a-z0-9]+$", w, re.IGNORECASE) or
                        re.match(r"^i?\d+$", w, re.IGNORECASE)
                    )
                ]
                if filtered_words:
                    title_candidate = " ".join(filtered_words).title()
                    if len(title_candidate) > 3:
                        return title_candidate
        return None

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #
    def get_product_info(self, url: str) -> Tuple[str, float, str]:
        """
        Fetch `url` and return (product_name, price, detected_site).
        Raises ScraperError / PriceNotFoundError on failure — callers
        are expected to catch these and keep the monitoring loop alive.
        """
        normalized_url = self._normalize_url(url)
        try:
            response = self.session.get(normalized_url, headers=HEADERS, timeout=self.timeout, allow_redirects=True)
            response.raise_for_status()
        except requests.ConnectionError as exc:
            hostname = urlparse(normalized_url).hostname or ""
            if hostname in KNOWN_SHORTENERS:
                raise ScraperError(
                    f"Could not reach {hostname} after {self.session.adapters['https://'].max_retries.total + 1} "
                    f"attempts — this link-shortening service appears blocked or unreachable from your network "
                    f"(common with some firewalls/antivirus tools). Open the link in a browser, copy the "
                    f"expanded product URL after it redirects, and use that instead. Details: {exc}"
                ) from exc
            raise ScraperError(
                f"Could not connect to {normalized_url} — this is a network issue (DNS/firewall/offline), "
                f"not a parsing bug. Details: {exc}"
            ) from exc
        except requests.RequestException as exc:
            raise ScraperError(f"Request failed for {normalized_url}: {exc}") from exc

        # Detect the site from the FINAL URL (after following any redirects)
        site = self.detect_site(response.url)

        if not response.encoding or response.encoding.lower() == "iso-8859-1":
            response.encoding = response.apparent_encoding

        soup = BeautifulSoup(response.text, "lxml")

        parser = {
            "amazon": self._parse_amazon,
            "flipkart": self._parse_flipkart,
            "daraz": self._parse_daraz,
        }.get(site, self._parse_generic)

        name, price = parser(soup)
        name = self._clean_product_name(name)

        # Fall back to JSON-LD metadata if site parser missed name or price
        if not name or price is None:
            json_name, json_price = self._parse_json_ld(soup)
            name = name or self._clean_product_name(json_name)
            price = price if price is not None else json_price

        # Fall back to OpenGraph / Meta tags if still missing name or price
        if not name or price is None:
            meta_name, meta_price = self._parse_meta_tags(soup)
            name = name or self._clean_product_name(meta_name)
            price = price if price is not None else meta_price

        # Fall back to generic parser if still missing price
        if price is None:
            gen_name, gen_price = self._parse_generic(soup)
            name = name or self._clean_product_name(gen_name)
            price = gen_price

        # Fall back to URL slug extraction if name is missing or invalid
        if not name:
            name = self._extract_name_from_url(normalized_url)

        if price is None:
            raise PriceNotFoundError(f"Could not locate a price on {normalized_url}")

        return name or "Unknown product", price, site

    # ------------------------------------------------------------------ #
    # Structured Metadata Parsers
    # ------------------------------------------------------------------ #
    def _parse_json_ld(self, soup: BeautifulSoup) -> Tuple[Optional[str], Optional[float]]:
        name = None
        price = None
        for script in soup.find_all("script", type="application/ld+json"):
            if not script.string:
                continue
            try:
                data = json.loads(script.string.strip())
            except (json.JSONDecodeError, Exception):
                continue

            items = data if isinstance(data, list) else [data]
            if isinstance(data, dict) and "@graph" in data and isinstance(data["@graph"], list):
                items = data["@graph"]

            for item in items:
                if not isinstance(item, dict):
                    continue
                item_type = str(item.get("@type", ""))
                if any(t in item_type for t in ["Product", "IndividualProduct", "ProductModel"]):
                    if not name and "name" in item and isinstance(item["name"], str):
                        name = item["name"].strip()
                    offers = item.get("offers")
                    if offers:
                        offer_list = offers if isinstance(offers, list) else [offers]
                        for offer in offer_list:
                            if isinstance(offer, dict) and "price" in offer:
                                p = self._extract_price(str(offer["price"]))
                                if p is not None:
                                    price = p
                                    break
                if name and price is not None:
                    return name, price
        return name, price

    def _parse_meta_tags(self, soup: BeautifulSoup) -> Tuple[Optional[str], Optional[float]]:
        name = None
        price = None
        for meta in soup.find_all("meta"):
            prop = (meta.get("property") or meta.get("name") or "").lower()
            content = (meta.get("content") or "").strip()
            if not content:
                continue
            if not name and prop in ("og:title", "twitter:title", "title"):
                name = content
            if price is None and prop in ("og:price:amount", "product:price:amount", "twitter:data1"):
                price = self._extract_price(content)
        return name, price

    # ------------------------------------------------------------------ #
    # Site-specific parsers
    # ------------------------------------------------------------------ #
    def _parse_amazon(self, soup: BeautifulSoup) -> Tuple[Optional[str], Optional[float]]:
        name_el = (
            soup.select_one("#productTitle") or
            soup.select_one("#title") or
            soup.select_one("h1.a-size-large")
        )
        name = name_el.get_text(strip=True) if name_el else None

        price_selectors = [
            "#priceblock_ourprice",
            "#priceblock_dealprice",
            "#priceblock_saleprice",
            "span.a-price span.a-offscreen",
            "#corePrice_feature_div span.a-offscreen",
            "#corePriceDisplay_desktop_feature_div span.a-offscreen",
            "#corePrice_desktop span.a-offscreen",
            "#apex_desktop span.a-offscreen",
            ".apexPriceToPay span.a-offscreen",
            "span.a-color-price",
            "#price_inside_buybox",
            "span.priceToPay",
        ]
        price = self._first_matching_price(soup, price_selectors)
        return name, price

    def _parse_flipkart(self, soup: BeautifulSoup) -> Tuple[Optional[str], Optional[float]]:
        name_el = (
            soup.select_one("span.B_NuCI") or
            soup.select_one("h1._6ER2B8") or
            soup.select_one("span.VU-ZEz") or
            soup.select_one("h1 span") or
            soup.select_one("h1")
        )
        name = name_el.get_text(strip=True) if name_el else None

        price_selectors = [
            "div._30jeq3._16Jk6d",
            "div._30jeq3",
            "div._16Jk6d",
            "div.Nx9bqj._4b5WdS",
            "div.Nx9bqj",
            "div._25bWox",
        ]
        price = self._first_matching_price(soup, price_selectors)
        return name, price

    def _parse_daraz(self, soup: BeautifulSoup) -> Tuple[Optional[str], Optional[float]]:
        name_el = (
            soup.select_one("h1.pdp-mod-product-badge-title") or
            soup.select_one(".pdp-product-title") or
            soup.select_one("h1")
        )
        name = name_el.get_text(strip=True) if name_el else None

        price_selectors = [
            "span.pdp-price",
            "span.pdp-price_type_normal",
            ".pdp-product-price",
            ".pdp-mod-product-price",
        ]
        price = self._first_matching_price(soup, price_selectors)
        return name, price

    def _parse_generic(self, soup: BeautifulSoup) -> Tuple[Optional[str], Optional[float]]:
        """
        Best-effort fallback for arbitrary product pages: use the <title>
        tag as the name, and scan common price-ish CSS classes/ids, then
        finally the whole page text, for something that looks like a price.
        """
        title_el = soup.find("title")
        name = title_el.get_text(strip=True) if title_el else None

        candidates = soup.select(
            "[class*='price'], [id*='price'], [class*='Price'], [id*='Price']"
        )
        for el in candidates:
            price = self._extract_price(el.get_text())
            if price is not None:
                return name, price

        # last resort: search the raw page text
        return name, self._extract_price(soup.get_text())

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    def _first_matching_price(self, soup: BeautifulSoup, selectors: list) -> Optional[float]:
        for selector in selectors:
            el = soup.select_one(selector)
            if el:
                price = self._extract_price(el.get_text())
                if price is not None:
                    return price
        return None

    @staticmethod
    def _parse_number_string(s: str) -> Optional[float]:
        if not s:
            return None
        s = s.strip()
        # European style: 1.299,00 -> 1299.00
        if re.match(r"^\d{1,3}(?:\.\d{3})+,\d{2}$", s):
            s = s.replace(".", "").replace(",", ".")
        elif "," in s and "." in s:
            if s.rfind(".") > s.rfind(","):
                s = s.replace(",", "")
            else:
                s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
        try:
            val = float(s)
            return val if val > 0 else None
        except ValueError:
            return None

    @classmethod
    def _extract_price(cls, text: str) -> Optional[float]:
        if not text:
            return None

        cleaned = text.replace("\xa0", " ").replace("&nbsp;", " ")

        currency_patterns = [
            r"(?:[$₹€£]|Rs\.?|PKR|INR|USD|EUR|GBP)\s*([\d]{1,3}(?:[,.\s]\d{2,3})*(?:[.,]\d{1,2})?)",
            r"([\d]{1,3}(?:[,.\s]\d{2,3})*(?:[.,]\d{1,2})?)\s*(?:[$₹€£]|Rs\.?|PKR|INR|USD|EUR|GBP)",
        ]

        for pattern in currency_patterns:
            match = re.search(pattern, cleaned, re.IGNORECASE)
            if match:
                val = cls._parse_number_string(match.group(1))
                if val is not None:
                    return val

        number_patterns = [
            r"\b\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\b",
            r"\b\d+(?:\.\d{1,2})\b",
            r"\b\d{2,7}\b",
        ]

        for pattern in number_patterns:
            matches = re.findall(pattern, cleaned)
            for m in matches:
                val = cls._parse_number_string(m)
                if val is not None:
                    if val in (4.5, 5.0, 4.0) and "star" in cleaned.lower():
                        continue
                    return val

        return None



class SeleniumScraper(Scraper):
    """
    Optional headless-browser scraper for JavaScript-rendered pages.

    Only imports selenium when actually instantiated, so the rest of the
    app works fine even if selenium / a chromedriver aren't installed.
    """

    def __init__(self, timeout: int = 15) -> None:
        super().__init__(timeout=timeout)
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
        except ImportError as exc:
            raise ScraperError(
                "SeleniumScraper requires 'selenium' to be installed "
                "(pip install selenium webdriver-manager)."
            ) from exc

        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument(f"user-agent={HEADERS['User-Agent']}")
        self._driver_cls = webdriver
        self._options = options

    def get_product_info(self, url: str) -> Tuple[str, float, str]:
        driver = self._driver_cls.Chrome(options=self._options)
        try:
            driver.set_page_load_timeout(self.timeout)
            driver.get(url)
            site = self.detect_site(driver.current_url)  # final URL after any redirects
            soup = BeautifulSoup(driver.page_source, "lxml")
        except Exception as exc:  # noqa: BLE001 - broad on purpose, see module docstring
            raise ScraperError(f"Selenium request failed for {url}: {exc}") from exc
        finally:
            driver.quit()

        parser = {
            "amazon": self._parse_amazon,
            "flipkart": self._parse_flipkart,
            "daraz": self._parse_daraz,
        }.get(site, self._parse_generic)

        name, price = parser(soup)
        if price is None:
            raise PriceNotFoundError(f"Could not locate a price on {url}")
        return name or "Unknown product", price, site
