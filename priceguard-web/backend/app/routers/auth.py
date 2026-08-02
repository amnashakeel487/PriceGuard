from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr

from ..deps import alert_manager, user_manager

router = APIRouter(prefix="/api/auth", tags=["auth"])

SESSION_COOKIE = "pg_user"


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
        raise HTTPException(status_code=409, detail=result)
    # Send OTP email
    try:
        alert_manager.send_verification_email(payload.email.strip().lower(), result)
    except Exception as exc:
        # Still return success but warn — user can resend
        return {"message": "Registered. Warning: could not send verification email. Check your .env email settings.", "email": payload.email.strip().lower()}
    return {"message": "Verification code sent to your email. Please check your inbox.", "email": payload.email.strip().lower()}


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
    response.set_cookie(SESSION_COOKIE, payload.email.strip().lower(), httponly=True, samesite="lax", max_age=60 * 60 * 24 * 30)
    return {"message": msg, "email": payload.email.strip().lower()}


@router.post("/login")
def login(payload: LoginIn, response: Response):
    ok, msg = user_manager.login(payload.email, payload.password)
    if not ok:
        raise HTTPException(status_code=401, detail=msg)
    email = payload.email.strip().lower()
    response.set_cookie(SESSION_COOKIE, email, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 30)
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
    response.delete_cookie(SESSION_COOKIE)
    return {"message": "Logged out."}
