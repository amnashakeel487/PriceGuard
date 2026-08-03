from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

from ..deps import alert_manager, user_manager

router = APIRouter(prefix="/api/auth", tags=["auth"])

SESSION_COOKIE = "pg_user"


def _set_session_cookie(response: Response, email: str) -> None:
    """Set the session cookie with cross-origin safe settings.
    
    SameSite=None + Secure=True is required when the frontend (Vercel)
    and backend (Railway) are on different domains.
    """
    response.set_cookie(
        key=SESSION_COOKIE,
        value=email,
        httponly=True,
        secure=True,        # HTTPS only — required for SameSite=None
        samesite="none",    # Allow cross-origin requests to send the cookie
        max_age=60 * 60 * 24 * 30,  # 30 days
    )


def _delete_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE,
        secure=True,
        samesite="none",
    )


class RegisterIn(BaseModel):
    email: str
    password: str


class VerifyIn(BaseModel):
    email: str
    otp: str


class LoginIn(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(payload: RegisterIn):
    ok, result = user_manager.register(payload.email, payload.password)
    if not ok:
        if result == "ALREADY_VERIFIED":
            raise HTTPException(status_code=409, detail="This email is already registered. Please sign in instead.")
        raise HTTPException(status_code=409, detail=result)
    try:
        alert_manager.send_verification_email(payload.email.strip().lower(), result)
    except Exception:
        return {"message": "Registered. Warning: could not send verification email. Check your email settings.", "email": payload.email.strip().lower()}
    return {"message": "Verification code sent to your email.", "email": payload.email.strip().lower()}


class ResendOtpIn(BaseModel):
    email: str


@router.post("/resend-otp")
def resend_otp(payload: ResendOtpIn):
    ok, otp = user_manager.resend_otp(payload.email)
    if not ok:
        raise HTTPException(status_code=400, detail=otp)
    try:
        alert_manager.send_verification_email(payload.email.strip().lower(), otp)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not send email: {exc}")
    return {"message": "New verification code sent."}


@router.post("/verify")
def verify(payload: VerifyIn, response: Response):
    ok, msg = user_manager.verify_otp(payload.email, payload.otp)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    _set_session_cookie(response, payload.email.strip().lower())
    return {"message": msg, "email": payload.email.strip().lower()}


@router.post("/login")
def login(payload: LoginIn, response: Response):
    ok, msg = user_manager.login(payload.email, payload.password)
    if not ok:
        raise HTTPException(status_code=401, detail=msg)
    email = payload.email.strip().lower()
    _set_session_cookie(response, email)
    return {"message": msg, "email": email}


@router.get("/me")
def me(request: Request):
    email = request.cookies.get(SESSION_COOKIE)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    user = user_manager.get_user(email)
    if not user or not user.verified:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return {
        "email": user.email,
        "verified": user.verified,
        "prev_login_at": user.prev_login_at,
    }


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(payload: ChangePasswordIn, request: Request):
    email = request.cookies.get(SESSION_COOKIE)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    ok, msg = user_manager.change_password(email, payload.current_password, payload.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}


@router.post("/logout")
def logout(response: Response):
    _delete_session_cookie(response)
    return {"message": "Logged out."}
