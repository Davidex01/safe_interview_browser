from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, ValidationInfo, constr, field_validator
from contextlib import asynccontextmanager
import hashlib
import secrets
import sqlite3
from pathlib import Path
from typing import Dict, Any, List
import json
import subprocess
import sys
import tempfile

from generation import generate_interview_tasks
from domain_tasks_generator import generate_domain_tasks, grade_candidate_answer


# Простое in-memory хранилище интервью
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


def _parse_int_output(s: str) -> int:
    s = s.strip()
    return int(s)


def run_one_code_on_tests(code: str, tests: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Гоняем один питон-код по тестам.
    tests: [{"input": "...", "output": "..."}]
    """
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(code)
        tmp_path = f.name

    total = len(tests)
    passed = 0
    failed_test: int | None = None

    for i, t in enumerate(tests, start=1):
        test_input = t["input"]
        expected_raw = t["output"]

        try:
            proc = subprocess.run(
                [sys.executable, tmp_path],
                input=test_input.encode("utf-8"),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=3,
            )
        except subprocess.TimeoutExpired:
            failed_test = i
            break

        stdout = proc.stdout.decode("utf-8", errors="ignore")

        try:
            exp = _parse_int_output(expected_raw)
            got = _parse_int_output(stdout)
            ok = (exp == got)
        except Exception:
            ok = False

        if ok:
            passed += 1
        else:
            failed_test = i
            break

    solved = (failed_test is None) and (passed == total)

    return {
        "solved": solved,
        "failed_test": failed_test,
        "passed_count": passed,
        "total_count": total,
    }


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # можешь сузить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Схемы запросов ---


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


class CheckAllRequest(BaseModel):
    token: str
    coding_solutions: Dict[str, str]   # {"easy": "код", "medium": "код", "hard": "код"}
    theory_solutions: Dict[str, str]   # {"easy": "ответ", "hard": "ответ"}

class SubmitInterviewRequest(BaseModel):
    coding_solutions: Dict[str, str]   # {"easy": "код", "medium": "код", "hard": "код"}
    theory_solutions: Dict[str, str]   # {"easy": "ответ", "hard": "ответ"}


# --- Эндпоинты ---


@app.post("/api/generate-tasks")
def generate_tasks(req: VacancyRequest):
    try:
        # 1) Генерация алгоритмических задач
        raw_coding = generate_interview_tasks(req.vacancy)

        if isinstance(raw_coding, dict):
            coding_tasks = raw_coding.get("tasks", [])
        else:
            coding_tasks = raw_coding  # считаем, что это уже список задач

        # 2) Пытаемся сгенерировать 2 теоретические задачи: easy + hard
        theory_tasks: List[Dict[str, Any]] = []

        # easy
        try:
            raw_theory_easy = generate_domain_tasks(
                vacancy=req.vacancy,
                level="easy",
                target_count=1,
                min_score=65,
                max_attempts=50,
            )
        except Exception as e:
            print(
                "Ошибка генерации теоретической задачи уровня easy:",
                repr(e),
            )
            raw_theory_easy = []

        # hard
        try:
            raw_theory_hard = generate_domain_tasks(
                vacancy=req.vacancy,
                level="hard",
                target_count=1,
                min_score=65,
                max_attempts=50,
            )
        except Exception as e:
            print(
                "Ошибка генерации теоретической задачи уровня hard:",
                repr(e),
            )
            raw_theory_hard = []

        raw_theory_all = (raw_theory_easy or []) + (raw_theory_hard or [])

        theory_tasks = [
            {
                "vacancy": t.get("vacancy"),
                "level": t.get("level"),
                "question": t["question"],
                "reference_answer": t["reference_answer"],
            }
            for t in raw_theory_all
            if "question" in t and "reference_answer" in t
        ]

        # 3) Токен интервью
        token = req.token or "int_" + str(len(INTERVIEWS) + 1)

        # 4) Сохраняем интервью в памяти
        INTERVIEWS[token] = {
            "token": token,
            "vacancy": req.vacancy,
            "position": req.position,
            "complexity": req.complexity,
            "coding_tasks": coding_tasks,
            "theory_tasks": theory_tasks,  # может быть [] — это ОК
        }

        return INTERVIEWS[token]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/interview/{token}")
def get_interview(token: str):
    interview = INTERVIEWS.get(token)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

@app.post("/api/interview/{token}/submit")
def submit_interview(token: str, req: SubmitInterviewRequest):
    """
    Обёртка над /api/check-all, чтобы не трогать фронт.
    Фронт шлёт сюда ответы, мы внутри переиспользуем check_all().
    """
    check_req = CheckAllRequest(
        token=token,
        coding_solutions=req.coding_solutions,
        theory_solutions=req.theory_solutions,
    )
    return check_all(check_req)


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
        raise HTTPException(
            status_code=409,
            detail="Пользователь с таким email уже существует",
        )
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


@app.post("/api/check-all")
def check_all(req: CheckAllRequest):
    interview = INTERVIEWS.get(req.token)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    coding_tasks = interview.get("coding_tasks") or interview.get("tasks") or []
    theory_tasks = interview.get("theory_tasks") or []
    vacancy_text = interview.get("vacancy", "")

    # --- проверяем 3 кодинговые задачи ---
    coding_results: list[Dict[str, Any]] = []
    total_tests = 0
    total_passed = 0

    for task in coding_tasks:
        level = task.get("level")
        tests = task.get("tests") or []
        total_tests += len(tests)

        code = (req.coding_solutions.get(level) or "").strip()

        if not code or not tests:
            failed_test = 1 if tests else None
            coding_results.append(
                {
                    "level": level,
                    "solved": False,
                    "failed_test": failed_test,
                }
            )
            continue

        check = run_one_code_on_tests(code, tests)
        total_passed += check["passed_count"]

        if check["solved"]:
            coding_results.append(
                {
                    "level": level,
                    "solved": True,
                }
            )
        else:
            coding_results.append(
                {
                    "level": level,
                    "solved": False,
                    "failed_test": check["failed_test"],
                }
            )

    coding_percent = round(total_passed * 100 / total_tests) if total_tests else 0

    # --- проверяем 2 теоретические задачи нейросетью ---
    theory_results: list[Dict[str, Any]] = []
    passed_count = 0
    total_theory = len(theory_tasks)

    for t in theory_tasks:
        level = t.get("level")
        question = t["question"]
        ref_answer = t["reference_answer"]
        cand_answer = (req.theory_solutions.get(level) or "").strip()

        if not cand_answer:
            theory_results.append(
                {
                    "level": level,
                    "answered": False,
                    "passed": False,
                }
            )
            continue

        grade = grade_candidate_answer(
            vacancy_text,
            level,
            question,
            ref_answer,
            cand_answer,
        )

        # решаем, считать ответ "зачётным" или нет — но числа наружу не отдаём
        passed = grade["final_score"] >= 65
        if passed:
            passed_count += 1

        theory_results.append(
            {
                "level": level,
                "answered": True,
                "passed": passed,
            }
        )

    theory_percent = (
        round(passed_count * 100 / total_theory) if total_theory else 0
    )

    return {
        "token": req.token,
        "coding": {
            "tasks": coding_results,
            "passed_percent": coding_percent,
        },
        "theory": {
            "tasks": theory_results,
            "passed_percent": theory_percent,
        },
    }
