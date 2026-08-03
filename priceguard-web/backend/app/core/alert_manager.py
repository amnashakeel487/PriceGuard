"""
AlertManager: sends email notifications via Brevo HTTPS API (no SMTP needed).

Required environment variables:
  BREVO_API_KEY  = your Brevo API key (xkeysib-...)
  EMAIL_SENDER   = the verified sender email in your Brevo account

Optional (falls back to EMAIL_SENDER if not set):
  EMAIL_RECEIVER = default recipient for price-drop alerts
"""

from __future__ import annotations

import json
import os
import urllib.request
import urllib.error
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
    BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

    def __init__(self) -> None:
        self.brevo_api_key   = os.getenv("BREVO_API_KEY", "")
        self.sender_email    = os.getenv("EMAIL_SENDER", "")
        self.sender_name     = os.getenv("EMAIL_SENDER_NAME", "PriceGuard")
        self.receiver_email  = os.getenv("EMAIL_RECEIVER", self.sender_email)

        self.twilio_sid         = os.getenv("TWILIO_SID")
        self.twilio_auth_token  = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_from_number = os.getenv("TWILIO_FROM_NUMBER")
        self.twilio_to_number   = os.getenv("TWILIO_TO_NUMBER")

    # ------------------------------------------------------------------ #
    # Internal: send via Brevo HTTPS API
    # ------------------------------------------------------------------ #
    def _send_brevo(self, to_email: str, subject: str, text_content: str) -> None:
        """Send email through Brevo REST API — works on all hosting platforms."""
        if not self.brevo_api_key:
            raise AlertError(
                "BREVO_API_KEY is not set. "
                "Get a free API key at https://app.brevo.com/settings/keys/api"
            )
        if not self.sender_email:
            raise AlertError("EMAIL_SENDER is not set.")

        payload = json.dumps({
            "sender":   {"name": self.sender_name, "email": self.sender_email},
            "to":       [{"email": to_email}],
            "subject":  subject,
            "textContent": text_content,
        }).encode("utf-8")

        req = urllib.request.Request(
            self.BREVO_API_URL,
            data=payload,
            headers={
                "accept":       "application/json",
                "api-key":      self.brevo_api_key,
                "content-type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status not in (200, 201):
                    raise AlertError(f"Brevo API returned status {resp.status}")
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise AlertError(f"Brevo API error {exc.code}: {body}") from exc
        except urllib.error.URLError as exc:
            raise AlertError(f"Network error sending email: {exc.reason}") from exc

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
    # 1. OTP verification email
    # ------------------------------------------------------------------ #
    def send_verification_email(self, email: str, otp: str) -> None:
        subject = "🔐 PriceGuard - Your Verification Code"
        body = (
            f"Welcome to PriceGuard!\n\n"
            f"Your email verification code is:\n\n"
            f"    {otp}\n\n"
            f"This code expires in 15 minutes.\n\n"
            f"If you didn't register for PriceGuard, you can safely ignore this email.\n\n"
            f"— The PriceGuard Team"
        )
        self._send_brevo(email, subject, body)

    # ------------------------------------------------------------------ #
    # 2. Price-drop alert email
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
            f"Good news! The product you're tracking dropped below your target price.\n\n"
            f"Product:        {product.name}\n"
            f"Current price:  Rs. {product.last_price:,.2f}\n"
            f"Target price:   Rs. {product.target_price:,.2f}\n"
            f"Price drop:     {drop_pct}% (from highest Rs. {product.highest_price:,.2f})\n"
            f"Link:           {product.url}\n\n"
        )
        if big_drop:
            body += "🚨 Significant drop of over 10%. Act fast!\n\n"
        body += "— Sent automatically by PriceGuard"

        self._send_brevo(to_email, subject, body)

    # ------------------------------------------------------------------ #
    # 3. SMS via Twilio (optional)
    # ------------------------------------------------------------------ #
    def send_sms_alert(self, product: Product) -> None:
        if not TWILIO_AVAILABLE:
            raise AlertError("twilio package is not installed.")
        if not all([self.twilio_sid, self.twilio_auth_token, self.twilio_from_number, self.twilio_to_number]):
            raise AlertError("Twilio credentials missing from .env.")
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
