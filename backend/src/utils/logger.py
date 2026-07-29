import os
import logging
from logging.handlers import TimedRotatingFileHandler
from src.config.settings import settings

# Resolve logs directory path (at backend/logs/)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOG_DIR = os.path.join(BACKEND_DIR, "logs")

# Ensure logs directory exists
os.makedirs(LOG_DIR, exist_ok=True)

# Log file path
LOG_FILE = os.path.join(LOG_DIR, "priceguard.log")

# Setup formatter
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
formatter = logging.Formatter(LOG_FORMAT)

# Setup handlers
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)

file_handler = TimedRotatingFileHandler(
    LOG_FILE,
    when="midnight",
    interval=1,
    backupCount=30,
    encoding="utf-8"
)
file_handler.setFormatter(formatter)

# Root logger configuration
root_logger = logging.getLogger()
root_logger.setLevel(settings.LOG_LEVEL)

# Remove existing handlers to avoid duplicates (important when reloading in dev)
if root_logger.hasHandlers():
    root_logger.handlers.clear()

root_logger.addHandler(console_handler)
root_logger.addHandler(file_handler)

# Export function to get sub-loggers
def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
