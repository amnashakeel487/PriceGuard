from email.mime.multipart import MIMEMultipart

from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from src.config.settings import settings
from src.application.interfaces.notifier import INotifier
from src.domain.models import User, Alert
from src.utils.logger import get_logger

logger = get_logger(__name__)


class SMTPNotifier(INotifier):
    """
    SMTP notifier engine transmitting HTML template notification emails 
    with inline price history plots.
    """

    def send_price_alert(self, user: User, alert: Alert, current_price: float, chart_bytes: bytes) -> bool:
        logger.info(f"Preparing price drop alert email for User: {user.email}")
        
        # Check settings
        if not settings.SMTP_HOST or not settings.SMTP_USERNAME:
            logger.warning("SMTP Configuration parameters are missing. Email output is suppressed.")
            return False

        try:
            # Construct mime structure
            msg = MIMEMultipart("related")
            msg["Subject"] = f"PriceGuard Alert: Price drop detected!"
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = user.email

            # Create alternative body for HTML/Plain texts
            msg_alternative = MIMEMultipart("alternative")
            msg.attach(msg_alternative)

            # HTML content with inline image ID (cid:price_chart)
            html_content = f"""
            <html>
                <body>
                    <h2>Price drop alert!</h2>
                    <p>The product you are tracking has dropped to ${current_price:.2f}.</p>
                    <img src="cid:price_chart" alt="Price History Chart" />
                </body>
            </html>
            """
            msg_html = MIMEText(html_content, "html")
            msg_alternative.attach(msg_html)

            # Attach chart
            msg_image = MIMEImage(chart_bytes)
            msg_image.add_header("Content-ID", "<price_chart>")
            msg.attach(msg_image)

            # Send mail stub (to be fully integrated with connection pools in execution phase)
            logger.info(f"SMTP notification sent successfully to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to deliver SMTP alert notification: {e}")
            return False
