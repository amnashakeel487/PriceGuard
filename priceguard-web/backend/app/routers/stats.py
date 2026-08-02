from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, HTTPException, Request

from ..core.alert_manager import AlertManager
from ..deps import alert_log, data_manager, user_manager
from ..routers.auth import SESSION_COOKIE
from ..schemas import StatsOut

router = APIRouter(prefix="/api/stats", tags=["stats"])


def _require_user(request: Request) -> str:
    email = request.cookies.get(SESSION_COOKIE)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    user = user_manager.get_user(email)
    if not user or not user.verified:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user.email


@router.get("", response_model=StatsOut)
def get_stats(request: Request):
    user_email = _require_user(request)

    # Only count this user's products
    all_products = data_manager.load_products()
    products = [p for p in all_products if p.user_email == user_email]

    alerts = alert_log.list_alerts(limit=10_000, user_email=user_email)
    alerts_sent = sum(1 for a in alerts if str(a.get("success")).lower() == "true" and a.get("type") != "error")

    monitored = [p for p in products if p.last_checked]

    money_saved = sum(
        max(0.0, p.highest_price - p.last_price)
        for p in products
        if p.highest_price and p.last_price
    )

    site_counts = Counter(p.site for p in products if p.site)

    discounts = []
    for p in products:
        if p.highest_price and p.last_price and p.highest_price > p.last_price:
            pct = AlertManager.calculate_drop_percentage(p.highest_price, p.last_price)
            if pct > 0:
                discounts.append({"name": p.name, "drop": pct})
    discounts.sort(key=lambda d: d["drop"], reverse=True)

    return StatsOut(
        total_products=len(products),
        monitored_products=len(monitored),
        alerts_sent=alerts_sent,
        money_saved=round(money_saved, 2),
        website_distribution=dict(site_counts),
        top_discounts=discounts[:5],
    )
