from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, Request

from ..core.exceptions import PriceGuardError, ScraperError
from ..core.product import Product
from ..deps import alert_manager, alert_log, data_manager, monitor_service, scraper, user_manager
from ..schemas import HistoryPoint, ProductCreate, ProductOut, ProductUpdate
from ..routers.auth import SESSION_COOKIE

router = APIRouter(prefix="/api/products", tags=["products"])


def _require_user(request: Request) -> str:
    """Return the verified user's email from the session cookie, or raise 401."""
    email = request.cookies.get(SESSION_COOKIE)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    user = user_manager.get_user(email)
    if not user or not user.verified:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user.email


def _to_out(p: Product) -> ProductOut:
    drop_pct = alert_manager.calculate_drop_percentage(p.highest_price, p.last_price)
    return ProductOut(
        url=p.url,
        name=p.name,
        site=p.site,
        target_price=p.target_price,
        last_price=p.last_price,
        highest_price=p.highest_price,
        lowest_price=p.lowest_price,
        last_checked=p.last_checked,
        alert_sent=p.alert_sent,
        below_target=p.is_below_target(),
        drop_percentage=drop_pct,
    )


@router.get("", response_model=List[ProductOut])
def list_products(request: Request):
    user_email = _require_user(request)
    products = data_manager.load_products()
    return [_to_out(p) for p in products if p.user_email == user_email]


@router.post("", response_model=ProductOut, status_code=201)
def add_product(payload: ProductCreate, request: Request):
    """Scrape once immediately, attach the session user's email, then save."""
    user_email = _require_user(request)

    url = scraper._normalize_url(payload.url)
    all_products = data_manager.load_products()

    # Duplicate check scoped to this user
    if any(p.url == url and p.user_email == user_email for p in all_products):
        raise HTTPException(status_code=409, detail="This URL is already being tracked.")

    try:
        name, price, site = scraper.get_product_info(url)
    except ScraperError as exc:
        name, price, site = "Unknown product (will update on next scan)", 0.0, scraper.detect_site(url)
        alert_log.log(name, url, f"Initial scrape failed: {exc}", "error", False, user_email=user_email)

    product = Product(
        url=url, name=name, target_price=payload.target_price,
        site=site, user_email=user_email,
    )
    if price > 0:
        product.update_price(price)
        data_manager.append_history(product)

    data_manager.add_product(product)
    return _to_out(product)


@router.delete("", status_code=204)
def delete_product(url: str, request: Request):
    user_email = _require_user(request)
    products = data_manager.load_products()
    remaining = [p for p in products if not (p.url == url and p.user_email == user_email)]
    if len(remaining) == len(products):
        raise HTTPException(status_code=404, detail="Product not found.")
    data_manager.save_products(remaining)
    return None


@router.patch("", response_model=ProductOut)
def update_product(url: str, payload: ProductUpdate, request: Request):
    user_email = _require_user(request)
    products = data_manager.load_products()
    for p in products:
        if p.url == url and p.user_email == user_email:
            if payload.target_price is not None:
                p.target_price = payload.target_price
                p.alert_sent = False
            data_manager.save_products(products)
            return _to_out(p)
    raise HTTPException(status_code=404, detail="Product not found.")


@router.get("/history", response_model=List[HistoryPoint])
def product_history(url: str, request: Request):
    user_email = _require_user(request)
    products = data_manager.load_products()
    product = next((p for p in products if p.url == url and p.user_email == user_email), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    history = data_manager.get_price_history(product)
    return [HistoryPoint(timestamp=ts, price=price) for ts, price in history]


@router.post("/check", response_model=ProductOut)
def check_product_now(url: str, request: Request):
    """Force one monitoring cycle for a single product belonging to the session user."""
    user_email = _require_user(request)
    products = data_manager.load_products()
    product = next((p for p in products if p.url == url and p.user_email == user_email), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    try:
        monitor_service._check_single_product(product)
    except PriceGuardError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return _to_out(product)
