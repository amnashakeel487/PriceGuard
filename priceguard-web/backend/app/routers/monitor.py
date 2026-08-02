from __future__ import annotations

from fastapi import APIRouter

from ..deps import monitor_service
from ..schemas import IntervalUpdate, MonitorStatusOut

router = APIRouter(prefix="/api/monitor", tags=["monitor"])


@router.get("/status", response_model=MonitorStatusOut)
def status():
    return monitor_service.status()


@router.post("/start", response_model=MonitorStatusOut)
def start():
    return monitor_service.start()


@router.post("/stop", response_model=MonitorStatusOut)
def stop():
    return monitor_service.stop()


@router.post("/interval", response_model=MonitorStatusOut)
def set_interval(payload: IntervalUpdate):
    monitor_service.set_interval(payload.interval_seconds)
    return monitor_service.status()


@router.post("/check-now", response_model=MonitorStatusOut)
def check_now():
    """Run one monitoring cycle across ALL products immediately (doesn't wait for the interval)."""
    monitor_service.check_all_once()
    return monitor_service.status()
