from __future__ import annotations
import hashlib
import json
import os
import random
import string
import time
from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class User:
    email: str
    password_hash: str
    salt: str
    verified: bool = False
    otp_code: str = ""
    otp_expires_at: float = 0.0
    created_at: float = field(default_factory=time.time)
    last_login_at: float = 0.0   # timestamp of most recent login
    prev_login_at: float = 0.0   # timestamp of the login before that

    def to_dict(self) -> dict:
        return asdict(self)

    @staticmethod
    def from_dict(d: dict) -> "User":
        return User(
            email=d["email"],
            password_hash=d["password_hash"],
            salt=d["salt"],
            verified=d.get("verified", False),
            otp_code=d.get("otp_code", ""),
            otp_expires_at=d.get("otp_expires_at", 0.0),
            created_at=d.get("created_at", 0.0),
            last_login_at=d.get("last_login_at", 0.0),
            prev_login_at=d.get("prev_login_at", 0.0),
        )


class UserManager:
    OTP_TTL_SECONDS = 900

    def __init__(self, users_file: str = "data/users.json") -> None:
        self.users_file = users_file
        os.makedirs(os.path.dirname(self.users_file) or ".", exist_ok=True)
        if not os.path.exists(self.users_file):
            with open(self.users_file, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _load_users(self) -> list:
        with open(self.users_file, "r", encoding="utf-8") as f:
            return [User.from_dict(d) for d in json.load(f)]

    def _save_users(self, users: list) -> None:
        with open(self.users_file, "w", encoding="utf-8") as f:
            json.dump([u.to_dict() for u in users], f, indent=2)

    def _find_user(self, email: str) -> Optional[User]:
        email = email.strip().lower()
        for u in self._load_users():
            if u.email == email:
                return u
        return None

    def _update_user(self, updated: User) -> None:
        users = self._load_users()
        for i, u in enumerate(users):
            if u.email == updated.email:
                users[i] = updated
                break
        self._save_users(users)

    @staticmethod
    def _make_salt() -> str:
        return "".join(random.choices(string.ascii_letters + string.digits, k=32))

    @staticmethod
    def _hash_password(salt: str, password: str) -> str:
        return hashlib.sha256((salt + password).encode()).hexdigest()

    @staticmethod
    def _generate_otp() -> str:
        return "".join(random.choices(string.digits, k=6))

    def register(self, email: str, password: str) -> tuple:
        email = email.strip().lower()
        existing = self._find_user(email)
        if existing and existing.verified:
            return False, "ALREADY_VERIFIED"  # special code frontend can redirect to /login
        salt = self._make_salt()
        pw_hash = self._hash_password(salt, password)
        otp = self._generate_otp()
        expires = time.time() + self.OTP_TTL_SECONDS
        if existing:
            existing.password_hash = pw_hash
            existing.salt = salt
            existing.otp_code = otp
            existing.otp_expires_at = expires
            self._update_user(existing)
        else:
            users = self._load_users()
            users.append(User(
                email=email, password_hash=pw_hash, salt=salt,
                verified=False, otp_code=otp, otp_expires_at=expires,
            ))
            self._save_users(users)
        return True, otp

    def verify_otp(self, email: str, otp: str) -> tuple:
        email = email.strip().lower()
        user = self._find_user(email)
        if not user:
            return False, "Email not found. Please register first."
        if user.verified:
            return True, "Account already verified."
        if user.otp_code != otp.strip():
            return False, "Incorrect verification code."
        if time.time() > user.otp_expires_at:
            return False, "Verification code expired. Please register again."
        user.verified = True
        user.otp_code = ""
        user.otp_expires_at = 0.0
        self._update_user(user)
        return True, "Email verified successfully!"

    def login(self, email: str, password: str) -> tuple:
        email = email.strip().lower()
        user = self._find_user(email)
        if not user:
            return False, "No account found with this email."
        if not user.verified:
            return False, "Please verify your email before logging in."
        if self._hash_password(user.salt, password) != user.password_hash:
            return False, "Incorrect password."
        # Rotate login timestamps: prev = current, current = now
        user.prev_login_at = user.last_login_at
        user.last_login_at = time.time()
        self._update_user(user)
        return True, "Login successful."

    def get_user(self, email: str) -> Optional[User]:
        return self._find_user(email.strip().lower())

    def resend_otp(self, email: str) -> tuple:
        email = email.strip().lower()
        user = self._find_user(email)
        if not user:
            return False, "Email not found."
        if user.verified:
            return False, "Account is already verified."
        otp = self._generate_otp()
        user.otp_code = otp
        user.otp_expires_at = time.time() + self.OTP_TTL_SECONDS
        self._update_user(user)
        return True, otp

    def change_password(self, email: str, current_password: str, new_password: str) -> tuple:
        email = email.strip().lower()
        user = self._find_user(email)
        if not user:
            return False, "User not found."
        if not user.verified:
            return False, "Account is not verified."
        if self._hash_password(user.salt, current_password) != user.password_hash:
            return False, "Current password is incorrect."
        if not new_password or len(new_password) < 6:
            return False, "New password must be at least 6 characters."
        new_salt = self._make_salt()
        user.salt = new_salt
        user.password_hash = self._hash_password(new_salt, new_password)
        self._update_user(user)
        return True, "Password changed successfully."
