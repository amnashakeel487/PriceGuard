from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/", tags=["API v1"])
async def get_api_v1_root():
    """
    PriceGuard API v1 Root endpoint.
    """
    return {
        "message": "Welcome to PriceGuard API v1",
        "documentation": "/docs"
    }

# Sub-routers for auth, products, alerts, and analytics will be included here:
# Example:
# from src.presentation.api.v1.auth import router as auth_router
# api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
