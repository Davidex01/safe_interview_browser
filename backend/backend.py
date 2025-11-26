from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, ValidationInfo, constr, field_validator
from contextlib import asynccontextmanager
import hashlib
import secrets
import sqlite3
from pathlib import Path
from typing import Dict, Any
import json

from generation import generate_interview_tasks


# Простое in-memory хранилище интервью. Потом можно заменить на БД.
INTERVIEWS: Dict[str, Dict[str, Any]] = {}

DB_PATH = Path(__file__).with_name("hr_users.db")


def init_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    with conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS hr_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NULL,
                company TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
    conn.close()


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"{salt.hex()}${hashed.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, hash_hex = stored_hash.split("$", 1)
    except ValueError:
        return False
    salt = bytes.fromhex(salt_hex)
    expected = bytes.fromhex(hash_hex)
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return secrets.compare_digest(candidate, expected)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)


# --- CORS, чтобы фронт мог дергать бэк из браузера ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # можешь сузить до нужного домена
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Схема запроса ---
class VacancyRequest(BaseModel):
    vacancy: str
    token: str | None = None
    position: str | None = None
    complexity: str | None = None


class HRRegistrationRequest(BaseModel):
    email: EmailStr
    password: constr(min_length=8)
    confirm_password: str
    name: str | None = None
    company: str | None = None

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, value: str, info: ValidationInfo) -> str:
        password = info.data.get("password")
        if password and value != password:
            raise ValueError("Пароли не совпадают")
        return value


class HRLoginRequest(BaseModel):
    email: EmailStr
    password: str


# --- Эндпоинт /api/generate-tasks ---
@app.post("/api/generate-tasks")
def generate_tasks(req: VacancyRequest):
    try:
        # вызывем твой генератор задач (можно передавать vacancy как есть)
        tasks = generate_interview_tasks(req.vacancy)

        # выбираем токен: из запроса, либо генерим на бэке (если не пришёл)
        token = req.token or "int_" + str(len(INTERVIEWS) + 1)

        # сохраняем интервью в памяти
        raw = generate_interview_tasks(req.vacancy)
        tasks = raw.get("tasks", raw)  # если raw уже список, это тоже сработает

        INTERVIEWS[token] = {
            "token": token,
            "position": req.position,
            "complexity": req.complexity,
            "tasks": tasks,
        }

        # опционально можешь здесь сериализовать tasks, преобразовать форматы и т.п.

        return INTERVIEWS[token]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/interview/{token}")
def get_interview(token: str):
    interview = INTERVIEWS.get(token)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@app.post("/api/hr/register")
def register_hr_user(payload: HRRegistrationRequest):
    conn = get_db_connection()
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO hr_users (email, password_hash, name, company)
                VALUES (?, ?, ?, ?)
                """,
                (
                    payload.email,
                    hash_password(payload.password),
                    payload.name,
                    payload.company,
                ),
            )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже существует")
    finally:
        conn.close()

    return {
        "email": payload.email,
        "name": payload.name,
        "company": payload.company,
        "message": "Регистрация прошла успешно",
    }


@app.post("/api/hr/login")
def login_hr_user(payload: HRLoginRequest):
    conn = get_db_connection()
    try:
        user = conn.execute(
            "SELECT email, password_hash, name, company FROM hr_users WHERE email = ?",
            (payload.email,),
        ).fetchone()
    finally:
        conn.close()

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    return {
        "email": user["email"],
        "name": user["name"],
        "company": user["company"],
        "message": "Вход выполнен успешно",
    }
