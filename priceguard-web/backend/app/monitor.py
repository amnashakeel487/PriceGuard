"""
MonitorService: the web equivalent of main.py's `while True: ... time.sleep()`
loop from the CLI version, except now it runs in a background thread that
the API can start/stop/inspect, instead of blocking the terminal.

Same core logic as the CLI bot (same Product / Scraper / DataManager /
AlertManager classes), just wrapped so a FastAPI route can control it.
"""

from __future__ import annotations

import os
import threading
import time
from datetime import datetime
from typing import Optional

from .core.alert_manager import AlertManager
from .core.data_manager import DataManager
from .core.exceptions import AlertError, PriceGuardError, ScraperError
from .core.product import Product
from .core.scraper import Scraper
from .alert_log import AlertLogManager


class MonitorService:
    def __init__(
        self,
        data_manager: DataManager,
        scraper: Scraper,
        alert_manager: AlertManager,
        alert_log: AlertLogManager,
        interval_seconds: Optional[int] = None,
    ) -> None:
        self.data_manager = data_manager
        self.scraper = scraper
        self.alert_manager = alert_manager
        self.alert_log = alert_log

        self.interval_seconds = interval_seconds or int(os.getenv("CHECK_INTERVAL_SECONDS", "3600"))

        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()  # serializes check cycles (manual vs scheduled)
        self._running = False
        self.last_run: Optional[str] = None
        self.next_run: Optional[str] = None
        self.last_cycle_log: list[str] = []

    # ------------------------------------------------------------------ #
    # Public control API (used by routers/monitor.py)
    # ------------------------------------------------------------------ #
    def status(self) -> dict:
        return {
            "running": self._running,
            "interval_seconds": self.interval_seconds,
            "last_run": self.last_run,
            "next_run": self.next_run,
            "last_cycle_log": self.last_cycle_log[-20:],
        }

    def start(self) -> dict:
        if self._running:
            return self.status()
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._running = True
        self._thread.start()
        return self.status()

    def stop(self) -> dict:
        self._stop_event.set()
        self._running = False
        return self.status()

    def set_interval(self, seconds: int) -> dict:
        self.interval_seconds = max(10, int(seconds))  # sane floor so the UI can't zero-loop it
        return self.status()

    # ------------------------------------------------------------------ #
    # The loop itself
    # ------------------------------------------------------------------ #
    def _loop(self) -> None:
        while not self._stop_event.is_set():
            self.check_all_once()
            self.next_run = datetime.fromtimestamp(
                time.time() + self.interval_seconds
            ).strftime("%Y-%m-%d %H:%M:%S")
            # Sleep in small increments so `stop()` takes effect quickly
            # instead of blocking for the full interval.
            slept = 0
            while slept < self.interval_seconds and not self._stop_event.is_set():
                time.sleep(min(1, self.interval_seconds - slept))
                slept += 1
        self._running = False

    def check_all_once(self) -> list[dict]:
        """Run exactly one monitoring cycle across every tracked product."""
        with self._lock:
            results = []
            products = self.data_manager.load_products()
            for product in products:
                results.append(self._check_single_product(product))
            self.last_run = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            self.last_cycle_log = [r["message"] for r in results] or ["No products to check."]
            return results

    # ------------------------------------------------------------------ #
    # Same defensive per-product logic as the CLI bot's check_single_product
    # ------------------------------------------------------------------ #
    def _check_single_product(self, product: Product) -> dict:
        try:
            name, price, site = self.scraper.get_product_info(product.url)
            product.name = name or product.name
            product.site = site
            product.update_price(price)
            self.data_manager.append_history(product)

            message = f"{product.name[:40]} -> Rs. {price:,.2f}"

            if product.is_below_target() and not product.alert_sent:
                if not product.user_email:
                    # No recipient — record failure without attempting SMTP.
                    self.alert_log.log(product.name, product.url, "Alert skipped: product has no user_email", "error", False, user_email="")
                else:
                    history = self.data_manager.get_price_history(product)
                    try:
                        self.alert_manager.send_price_alert(product, history=history, receiver_email=product.user_email)
                        product.alert_sent = True
                        drop_pct = self.alert_manager.calculate_drop_percentage(
                            product.highest_price, product.last_price
                        )
                        alert_msg = f"Dropped to Rs. {price:,.2f} ({drop_pct}% off) — email sent"
                        self.alert_log.log(product.name, product.url, alert_msg, "drop", True, user_email=product.user_email)
                        message += " | ALERT SENT"
                    except AlertError as exc:
                        self.alert_log.log(product.name, product.url, str(exc), "error", False, user_email=product.user_email)
                        message += f" | alert failed: {exc}"

            self.data_manager.update_product(product)
            return {"url": product.url, "success": True, "message": message}

        except ScraperError as exc:
            msg = f"Scraping failed for {product.url}: {exc}"
            return {"url": product.url, "success": False, "message": msg}
        except PriceGuardError as exc:
            msg = f"Unexpected error for {product.url}: {exc}"
            return {"url": product.url, "success": False, "message": msg}
