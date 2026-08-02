"""
AlertManager: sends Email (SMTP via Brevo) notifications.

Brevo SMTP credentials are read from environment variables:
  SMTP_SERVER   = smtp-relay.brevo.com
  SMTP_PORT     = 587
  EMAIL_SENDER  = your sending address
  EMAIL_PASSWORD= your Brevo SMTP key
  BREVO_LOGIN   = your Brevo account email (used as SMTP username)
"""

from __future__ import annotations

import os
import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional, Tuple

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from .exceptions import AlertError
from .product import Product

try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False


class AlertManager:
    def __init__(self) -> None:
        self.smtp_server   = os.getenv("SMTP_SERVER",   "smtp-relay.brevo.com")
        self.smtp_port     = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email  = os.getenv("EMAIL_SENDER")
        self.sender_password = os.getenv("EMAIL_PASSWORD")
        # Brevo uses your account email as the SMTP *login* username.
        # Set BREVO_LOGIN to your Brevo account email if it differs from EMAIL_SENDER.
        self.smtp_login    = os.getenv("BREVO_LOGIN", self.sender_email)
        self.receiver_email = os.getenv("EMAIL_RECEIVER", self.sender_email)

        self.twilio_sid         = os.getenv("TWILIO_SID")
        self.twilio_auth_token  = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_from_number = os.getenv("TWILIO_FROM_NUMBER")
        self.twilio_to_number   = os.getenv("TWILIO_TO_NUMBER")

    # ------------------------------------------------------------------ #
    # Internal SMTP helper — used by both email methods below
    # ------------------------------------------------------------------ #
    def _send_smtp(self, message: MIMEMultipart) -> None:
        """Connect to SMTP, authenticate with Brevo credentials, send message."""
        if not self.sender_email or not self.sender_password:
            raise AlertError(
                "EMAIL_SENDER / EMAIL_PASSWORD are not set in environment variables."
            )
        login = self.smtp_login or self.sender_email
        try:
            if self.smtp_port == 465:
                with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port, timeout=15) as s:
                    s.login(login, self.sender_password)
                    s.send_message(message)
            else:
                with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=15) as s:
                    s.ehlo()
                    s.starttls()
                    s.ehlo()
                    s.login(login, self.sender_password)
                    s.send_message(message)
        except smtplib.SMTPException as exc:
            raise AlertError(f"SMTP error: {exc}") from exc

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    @staticmethod
    def calculate_drop_percentage(reference_price: float, current_price: float) -> float:
        if reference_price <= 0:
            return 0.0
        return round((reference_price - current_price) / reference_price * 100, 2)

    @staticmethod
    def generate_price_graph(product: Product, history: List[Tuple[str, float]]) -> Optional[str]:
        if len(history) < 2:
            return None
        timestamps = [row[0] for row in history]
        prices     = [row[1] for row in history]
        fig, ax = plt.subplots(figsize=(7, 3.5), dpi=150)
        ax.plot(timestamps, prices, marker="o", linewidth=2, color="#4F46E5")
        ax.axhline(product.target_price, color="#10B981", linestyle="--", label="Target price")
        ax.set_title(f"Price history — {product.name[:40]}", fontsize=11)
        ax.set_ylabel("Price")
        ax.legend()
        ax.tick_params(axis="x", rotation=45, labelsize=7)
        fig.tight_layout()
        os.makedirs("data/history", exist_ok=True)
        output_path = os.path.join("data", "history", "_last_alert_graph.png")
        fig.savefig(output_path)
        plt.close(fig)
        return output_path

    # ------------------------------------------------------------------ #
    # 1. OTP verification email  (sent on register / resend-otp)
    # ------------------------------------------------------------------ #
    def send_verification_email(self, email: str, otp: str) -> None:
        msg = MIMEMultipart()
        msg["From"]    = self.sender_email
        msg["To"]      = email
        msg["Subject"] = "🔐 PriceGuard - Your Verification Code"
        body = (
            f"Welcome to PriceGuard!\n\n"
            f"Your email verification code is:\n\n"
            f"    {otp}\n\n"
            f"This code expires in 15 minutes.\n\n"
            f"If you didn't register for PriceGuard, you can safely ignore this email.\n\n"
            f"— The PriceGuard Team"
        )
        msg.attach(MIMEText(body, "plain"))
        self._send_smtp(msg)

    # ------------------------------------------------------------------ #
    # 2. Price-drop alert email  (sent when product hits target price)
    # ------------------------------------------------------------------ #
    def send_price_alert(
        self,
        product: Product,
        history: Optional[List[Tuple[str, float]]] = None,
        receiver_email: Optional[str] = None,
    ) -> None:
        to_email = receiver_email or self.receiver_email or self.sender_email
        drop_pct = self.calculate_drop_percentage(product.highest_price, product.last_price)
        big_drop = drop_pct >= 10.0

        subject = (
            f"🚨 {drop_pct}% Price Drop! Buy now! — {product.name[:60]}"
            if big_drop
            else f"✅ Price Alert: {product.name[:60]} hit your target"
        )
        body = (
            f"Good news! The product you're tracking has dropped below your target price.\n\n"
            f"Product:        {product.name}\n"
            f"Current price:  Rs. {product.last_price:,.2f}\n"
            f"Target price:   Rs. {product.target_price:,.2f}\n"
            f"Price drop:     {drop_pct}% (from highest recorded Rs. {product.highest_price:,.2f})\n"
            f"Link:           {product.url}\n\n"
        )
        if big_drop:
            body += "🚨 This is a significant drop of over 10%. Buy now!\n\n"
        body += "— Sent automatically by PriceGuard"

        msg = MIMEMultipart()
        msg["From"]    = self.sender_email
        msg["To"]      = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        # Attach price-history graph if enough data
        if history:
            graph_path = self.generate_price_graph(product, history)
            if graph_path and os.path.exists(graph_path):
                with open(graph_path, "rb") as f:
                    img = MIMEImage(f.read())
                    img.add_header("Content-Disposition", "attachment", filename="price_history.png")
                    msg.attach(img)

        self._send_smtp(msg)

    # ------------------------------------------------------------------ #
    # 3. SMS via Twilio (optional)
    # ------------------------------------------------------------------ #
    def send_sms_alert(self, product: Product) -> None:
        if not TWILIO_AVAILABLE:
            raise AlertError("twilio package is not installed.")
        if not all([self.twilio_sid, self.twilio_auth_token, self.twilio_from_number, self.twilio_to_number]):
            raise AlertError("Twilio credentials are missing from .env.")
        drop_pct = self.calculate_drop_percentage(product.highest_price, product.last_price)
        text = (
            f"PriceGuard: {product.name[:40]} dropped {drop_pct}% to "
            f"Rs.{product.last_price:,.2f} (target Rs.{product.target_price:,.2f}). {product.url}"
        )
        try:
            client = TwilioClient(self.twilio_sid, self.twilio_auth_token)
            client.messages.create(body=text, from_=self.twilio_from_number, to=self.twilio_to_number)
        except Exception as exc:
            raise AlertError(f"Failed to send SMS: {exc}") from exc
