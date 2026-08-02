"""
Single shared instances of every core service, created once when the app
starts. FastAPI routers import these directly (simple, sufficient for a
single-process app — a bigger deployment would swap this for proper
dependency injection / a database-backed job queue).
"""

from __future__ import annotations

from .alert_log import AlertLogManager
from .core.alert_manager import AlertManager
from .core.data_manager import DataManager
from .core.scraper import Scraper
from .core.user_manager import UserManager
from .monitor import MonitorService

data_manager = DataManager(products_file="data/products.csv", history_dir="data/history")
scraper = Scraper()
alert_manager = AlertManager()
alert_log = AlertLogManager(path="data/alerts.csv")
monitor_service = MonitorService(data_manager, scraper, alert_manager, alert_log)
user_manager = UserManager(users_file="data/users.json")
