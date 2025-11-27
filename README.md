# Safe Interview

Браузерная платформа для техсобесов.
Бэкенд — FastAPI (Python), фронтенд — React (Vite).

---

## 0. Что нужно до начала

Поставь:

* Python 3.10+
* Node.js 18+ (вместе с ним ставится npm)
* git

Проверь, что они есть:

python --version
node -v
npm -v

---

## 1. Клонирование проекта

git clone https://github.com/Davidex01/safe_interview_browser.git
cd safe_interview_browser

Дальше все команды выполняются из папки safe_interview_browser.

---

## 2. Настройка бэкенда

### 2.1. Переходим в папку бэка

cd backend

### 2.2. Создаём виртуальное окружение и ставим зависимости

python -m venv venv
pip install -r requirements.txt
pip install uvicorn
pip install email-validator

> email-validator нужен для проверки EmailStr в Pydantic, без него бэк падает.

### 2.3. Создаём файл с API-ключом

В папке backend создай файл `tokenn.py` (если его нет) со следующим содержимым:

API_KEY = "СЮДА_ВСТАВЬ_СВОЙ_API_КЛЮЧ"

API-ключ даёт админ/платформа LLM, с которой вы работаете.
Без этого ключа генерация задач не будет работать.

> В репозиторий этот файл лучше НЕ коммитить, чтобы ключ не утёк.

### 2.4. Запускаем бэкенд

uvicorn backend:app --reload --port 8000

Если всё ок, увидишь что-то вроде:

Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)

Проверка:
открой в браузере — [http://localhost:8000/docs](http://localhost:8000/docs)
Должна открыться swagger-страница FastAPI.

---

## 3. Настройка фронтенда

Открой новый терминал (бэкенд пусть продолжает работать).

### 3.1. Переходим в папку фронта

Из корня проекта:

cd safe_interview_browser/frontend

### 3.2. Ставим зависимости и запускаем dev-сервер

npm install
npm run dev

Если всё нормально, в консоли увидишь адрес вида:

  VITE vX.Y.Z  ready in N ms
  ➜  Local:   http://localhost:5173/

---

## 4. Как проверить, что всё работает

1. Бэкенд запущен на http://localhost:8000
2. Фронтенд запущен на http://localhost:5173

Дальше:

* открой в браузере http://localhost:5173/
* зарегистрируйся как HR
* создай интервью
* открой ссылку кандидата вида /session/<token>

Если:

* страница открывается,
* подтягиваются 3 алгоритмические и 2 теоретические задачи,
* отправка ответов не падает с ошибками,

значит установка прошла успешно.