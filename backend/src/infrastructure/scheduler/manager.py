from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from src.config.settings import settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

# Initialize background scheduler instance
scheduler = BackgroundScheduler()


def start_scheduler() -> None:
    """
    Start the background scheduling threads.
    Registers default periodic tasks from tasks.py.
    """
    if scheduler.running:
        logger.warning("Background scheduler is already running")
        return

    # Import tasks to ensure decorators register them, or register manually
    from src.infrastructure.scheduler.tasks import run_scraping_cycle

    # Add periodic scraping job
    scheduler.add_job(
        func=run_scraping_cycle,
        trigger=IntervalTrigger(hours=settings.SCRAPING_INTERVAL_HOURS),
        id="scheduled_scraping_job",
        name="Scheduled E-Commerce Scraper Loop",
        replace_existing=True
    )

    try:
        scheduler.start()
        logger.info(f"Background scheduler started successfully. Interval: {settings.SCRAPING_INTERVAL_HOURS} hours")
    except Exception as e:
        logger.error(f"Failed to start background scheduler. Error: {e}")


def shutdown_scheduler() -> None:
    """
    Shutdown the background scheduler threads cleanly.
    Wait for currently executing tasks to complete before killing thread pools.
    """
    if not scheduler.running:
        logger.warning("Background scheduler is not running")
        return

    try:
        scheduler.shutdown(wait=True)
        logger.info("Background scheduler shutdown completed successfully")
    except Exception as e:
        logger.error(f"Error during background scheduler shutdown: {e}")

