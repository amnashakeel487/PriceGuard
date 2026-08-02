from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, Query, Request

from ..deps import alert_log, user_manager
from ..routers.auth import SESSION_COOKIE
from ..schemas import AlertOut

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


def _require_user(request: Request):
    """Returns (email, user) or raises 401."""
    email = request.cookies.get(SESSION_COOKIE)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    user = user_manager.get_user(email)
    if not user or not user.verified:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return email, user


def _row_to_out(r: dict, prev_login_at: float = 0.0) -> AlertOut:
    """
    An alert is shown as unread if:
    - Its read flag is False, OR
    - Its timestamp is newer than prev_login_at (arrived since last session start).
    """
    flagged_read = str(r.get("read", "False")).lower() == "true"
    is_new_since_login = False
    if flagged_read and prev_login_at > 0:
        from datetime import datetime
        try:
            ts = datetime.strptime(r.get("timestamp", ""), "%Y-%m-%d %H:%M:%S").timestamp()
            if ts > prev_login_at:
                is_new_since_login = True
        except ValueError:
            pass
    effective_read = flagged_read and not is_new_since_login

    return AlertOut(
        id=r["id"],
        timestamp=r["timestamp"],
        product_name=r["product_name"],
        url=r["url"],
        message=r["message"],
        type=r["type"],
        success=str(r["success"]).lower() == "true",
        read=effective_read,
    )


@router.get("", response_model=List[AlertOut])
def list_alerts(request: Request, limit: int = Query(50, ge=1, le=500)):
    email, user = _require_user(request)
    rows = alert_log.list_alerts(limit=limit, user_email=email)
    return [_row_to_out(r, user.prev_login_at) for r in rows]


@router.get("/unread-count")
def unread_count(request: Request):
    email, user = _require_user(request)
    return {"count": alert_log.unread_count(email, prev_login_at=user.prev_login_at)}


@router.patch("/{alert_id}/read", response_model=AlertOut)
def mark_one_read(alert_id: str, request: Request):
    email, user = _require_user(request)
    found = alert_log.mark_read(alert_id, email)
    if not found:
        raise HTTPException(status_code=404, detail="Alert not found.")
    rows = alert_log.list_alerts(limit=10_000, user_email=email)
    row = next((r for r in rows if r["id"] == alert_id), None)
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return _row_to_out(row, user.prev_login_at)


@router.post("/mark-all-read")
def mark_all_read(request: Request):
    email, user = _require_user(request)
    count = alert_log.mark_all_read(email)
    return {"marked": count}
