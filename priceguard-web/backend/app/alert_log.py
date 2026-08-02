"""
AlertLogManager: persists a running feed of alert *events* (not just the
current product state) so the frontend's Alerts page and Dashboard can show
"Recent Alerts" the same way products.csv lets it show "Recent Products".

Kept separate from AlertManager (which only knows how to *send* alerts) —
this class only knows how to *record* that one happened, and whether it
actually succeeded.
"""

from __future__ import annotations

import csv
import os
import uuid
from datetime import datetime
from typing import List

ALERT_FIELDNAMES = ["id", "timestamp", "product_name", "url", "message", "type", "success", "user_email", "read"]


class AlertLogManager:
    def __init__(self, path: str = "data/alerts.csv") -> None:
        self.path = path
        os.makedirs(os.path.dirname(self.path) or ".", exist_ok=True)
        if not os.path.exists(self.path):
            with open(self.path, "w", newline="", encoding="utf-8") as f:
                csv.DictWriter(f, fieldnames=ALERT_FIELDNAMES).writeheader()

    def log(self, product_name: str, url: str, message: str, alert_type: str, success: bool, user_email: str = "") -> dict:
        row = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "product_name": product_name,
            "url": url,
            "message": message,
            "type": alert_type,  # "drop" | "target" | "error"
            "success": success,
            "user_email": user_email,
            "read": False,
        }
        with open(self.path, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=ALERT_FIELDNAMES)
            writer.writerow(row)
        return row

    def list_alerts(self, limit: int = 100, user_email: str = "") -> List[dict]:
        if not os.path.exists(self.path):
            return []
        with open(self.path, "r", newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        if user_email:
            rows = [r for r in rows if r.get("user_email", "") == user_email]
        rows.reverse()  # newest first
        return rows[:limit]

    def mark_read(self, alert_id: str, user_email: str) -> bool:
        """Set read=True on a single alert row. Returns True if found & updated."""
        if not os.path.exists(self.path):
            return False
        with open(self.path, "r", newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        updated = False
        for row in rows:
            if row.get("id") == alert_id and row.get("user_email") == user_email:
                row["read"] = "True"
                updated = True
                break
        if updated:
            with open(self.path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=ALERT_FIELDNAMES)
                writer.writeheader()
                writer.writerows(rows)
        return updated

    def mark_all_read(self, user_email: str) -> int:
        """Mark every unread alert for this user as read. Returns count updated."""
        if not os.path.exists(self.path):
            return 0
        with open(self.path, "r", newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        count = 0
        for row in rows:
            if row.get("user_email") == user_email and str(row.get("read", "False")).lower() != "true":
                row["read"] = "True"
                count += 1
        if count:
            with open(self.path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=ALERT_FIELDNAMES)
                writer.writeheader()
                writer.writerows(rows)
        return count

    def unread_count(self, user_email: str, prev_login_at: float = 0.0) -> int:
        """Count alerts the user hasn't seen yet.
        
        An alert is 'unseen' if:
        - Its read flag is False, OR
        - Its timestamp is newer than prev_login_at (arrived since last session).
        """
        if not os.path.exists(self.path):
            return 0
        with open(self.path, "r", newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))

        count = 0
        for r in rows:
            if r.get("user_email") != user_email:
                continue
            already_read = str(r.get("read", "False")).lower() == "true"
            if not already_read:
                count += 1
                continue
            # Even if marked read, if it arrived after prev_login_at it's "new"
            if prev_login_at > 0:
                try:
                    ts = datetime.strptime(r.get("timestamp",""), "%Y-%m-%d %H:%M:%S").timestamp()
                    if ts > prev_login_at:
                        count += 1
                except ValueError:
                    pass
        return count
