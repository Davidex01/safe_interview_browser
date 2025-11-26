# domain_tasks_generator.py
import json
import textwrap
from typing import Dict, List

from openai import OpenAI

# -------------------------------
# НАСТРОЙКИ LLM
# -------------------------------

from tokenn import API_KEY
BASE_URL = "https://llm.t1v.scibox.tech/v1"

TEXT_MODEL = "qwen3-32b-awq"

client = OpenAI(
    base_url=BASE_URL,
    api_key=API_KEY,
)

# -------------------------------
# 1. ГЕНЕРАЦИЯ ВОПРОСА + ЭТАЛОНА
# -------------------------------

def generate_domain_question(vacancy: str, level: str) -> Dict:
    """
    Генерируем один вопрос по заданной вакансии и уровню сложности.
    Возвращаем dict: {question, reference_answer}.
    """
    prompt = f"""
Ты — опытный специалист и интервьюер для вакансии:

"{vacancy}"

Твоя задача — придумать ОДИН содержательный теоретический вопрос уровня {level}
для собеседования.

Требования:

1. Вопрос должен быть:
   - практический, связанный с реальной работой по этой вакансии;
   - не тривиальный (не "что такое переменная");
   - формулировка — чёткая и однозначная.

2. Под вопрос сразу дай развернутый правильный ответ:
   - можно 1–3 абзаца;
   - не эссе на полстраницы, но и не одно предложение.

3. Вопрос должен быть формата "объясни", "сравни", "обоснуй", "как бы ты сделал...":
   — чтобы было, что оценивать по качеству ответа.

Формат ответа СТРОГО в JSON, без текста вокруг:

{{
  "question": "<формулировка вопроса>",
  "reference_answer": "<развернутый правильный ответ>"
}}
"""

    resp = client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {
                "role": "system",
                "content": "/no_think Ты генерируешь сильные собеседовательные вопросы по вакансии.",
            },
            {"role": "user", "content": textwrap.dedent(prompt).strip()},
        ],
        temperature=0.7,
    )

    content = resp.choices[0].message.content.strip()

    # Парсим JSON
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError(f"Не удалось распарсить JSON вопроса: {content!r}")
        data = json.loads(content[start : end + 1])

    question = data["question"].strip()
    ref_answer = data["reference_answer"].strip()

    return {
        "question": question,
        "reference_answer": ref_answer,
    }


# -------------------------------
# 2. МОДЕЛЬ КАК КАНДИДАТ
# -------------------------------

def generate_candidate_answer(vacancy: str, question: str, level: str) -> str:
    """
    Вторая роль: модель отвечает на вопрос как кандидат.
    """
    prompt = f"""
Ты — кандидат на вакансию:

"{vacancy}"

Уровень кандидата: {level}.

Тебе задают вопрос на собеседовании:

Вопрос:
---
{question}
---

Ответь так, как бы ты ответил на реальном собеседовании:
- структурированно,
- по делу,
- без лишней "воды".

Не комментируй уровень вопроса и сам процесс собеседования.

Верни ТОЛЬКО ответ кандидата, без пояснений и префиксов.
"""

    resp = client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {
                "role": "system",
                "content": "/no_think Ты выступаешь как кандидат и даёшь честный, но аккуратный ответ.",
            },
            {"role": "user", "content": textwrap.dedent(prompt).strip()},
        ],
        temperature=0.8,
    )

    answer = resp.choices[0].message.content.strip()
    return answer


# -------------------------------
# 3. ОЦЕНКА: 1–100, ДВЕ МЕТРИКИ
# -------------------------------

def grade_candidate_answer(vacancy: str, level: str, question: str,
                           reference_answer: str, candidate_answer: str) -> Dict:
    """
    Третья роль: строгий ревьюер.
    Оценивает по двум метрикам 1–100:
      - correctness  (правильность)
      - optimality   (оптимальность/глубина/структура)
    Возвращаем dict: {correctness, optimality, final_score, comment}.
    """
    prompt = f"""
Ты — строгий интервьюер для вакансии:

"{vacancy}"

Уровень позиции: {level}.

Тебе дан собеседовательный вопрос, правильный развернутый ответ
и ответ кандидата. Нужно оценить КАЧЕСТВО ответа кандидата по двум осям.

Вопрос:
---
{question}
---

Правильный ответ (эталон):
---
{reference_answer}
---

Ответ кандидата:
---
{candidate_answer}
---

Оцени по двум шкалам от 1 до 100:

1) correctness (правильность):
   - 1–20   — почти всё неправильно;
   - 21–40  — много ошибок, частичное понимание;
   - 41–60  — базовое понимание, но заметные пробелы;
   - 61–80  — в целом правильно, есть недочёты;
   - 81–100 — очень корректно, близко к эталону.

2) optimality (оптимальность / полнота / структура):
   - оцени, насколько ответ полный, хорошо структурирован,
     покрывает важные аспекты, без лишней воды.

Финальный балл final_score = среднее арифметическое correctness и optimality.

Формат ответа СТРОГО в JSON, без текста вокруг, вида:

{{
  "correctness": <целое число 1..100>,
  "optimality": <целое число 1..100>,
  "comment": "<краткий комментарий, почему такие оценки>"
}}

НЕ добавляй никаких других полей.
"""

    resp = client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {
                "role": "system",
                "content": "/no_think Ты строго, но объективно оцениваешь ответы кандидатов.",
            },
            {"role": "user", "content": textwrap.dedent(prompt).strip()},
        ],
        temperature=0.3,
    )

    content = resp.choices[0].message.content.strip()

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError(f"Не удалось распарсить JSON оценки: {content!r}")
        data = json.loads(content[start : end + 1])

    correctness = int(data["correctness"])
    optimality = int(data["optimality"])
    comment = str(data.get("comment", "")).strip()

    # подстрахуемся по диапазону
    correctness = max(1, min(100, correctness))
    optimality = max(1, min(100, optimality))

    final_score = int(round((correctness + optimality) / 2))

    return {
        "correctness": correctness,
        "optimality": optimality,
        "final_score": final_score,
        "comment": comment,
    }


# -------------------------------
# 4. ЦИКЛ: СБОР ХОРОШИХ ВОПРОСОВ
# -------------------------------

def generate_domain_tasks(
    vacancy: str,
    level: str,
    target_count: int = 2,
    min_score: int = 65,
    max_attempts: int = 50,
) -> List[Dict]:
    """
    Генерируем список задач по вакансии:
    - vacancy: строка с описанием вакансии;
    - level: "easy" / "medium" / "hard";
    - target_count: сколько задач хотим собрать для этого уровня;
    - min_score: порог по final_score (среднее correctness и optimality);
    - max_attempts: максимум общих попыток.

    Возвращаем список диктов, каждый из которых уже прошёл порог.
    """
    tasks: List[Dict] = []
    attempt = 0

    while len(tasks) < target_count and attempt < max_attempts:
        attempt += 1
        print(f"[{level}] Попытка генерации вопроса #{attempt}...")

        try:
            qa = generate_domain_question(vacancy, level)
        except Exception as e:
            print(f"[{level}] Ошибка при генерации вопроса: {e}")
            continue

        question = qa["question"]
        ref_answer = qa["reference_answer"]

        print(f"[{level}] Генерируем ответ кандидата...")
        try:
            cand_answer = generate_candidate_answer(vacancy, question, level)
        except Exception as e:
            print(f"[{level}] Ошибка при генерации ответа кандидата: {e}")
            continue

        print(f"[{level}] Оцениваем ответ...")
        try:
            grade = grade_candidate_answer(vacancy, level, question, ref_answer, cand_answer)
        except Exception as e:
            print(f"[{level}] Ошибка при оценке ответа: {e}")
            continue

        correctness = grade["correctness"]
        optimality = grade["optimality"]
        final_score = grade["final_score"]
        comment = grade["comment"]

        print(
            f"[{level}] Оценка: correctness={correctness}, "
            f"optimality={optimality}, final={final_score}"
        )
        print(f"[{level}] Комментарий: {comment}")

        if final_score >= min_score:
            print(f"[{level}] Вопрос прошёл порог ({final_score} ≥ {min_score}), добавляем.\n")
            tasks.append(
                {
                    "vacancy": vacancy,
                    "level": level,
                    "question": question,
                    "reference_answer": ref_answer,
                    "candidate_answer": cand_answer,
                    "correctness": correctness,
                    "optimality": optimality,
                    "final_score": final_score,
                    "review_comment": comment,
                }
            )
        else:
            print(f"[{level}] Вопрос не прошёл порог (final_score < {min_score}), выкидываем.\n")

    return tasks


# -------------------------------
# 5. ДЕМО-ЗАПУСК: 1 easy + 1 hard
# -------------------------------

if __name__ == "__main__":
    # вакансия, под которую генерим теоретические вопросы
    VACANCY = "Python-разработчик в команде аналитики заказов (e-commerce, FastAPI, Postgres, очереди)."

    LEVELS = ["easy", "hard"]   # только easy и hard
    PER_LEVEL_COUNT = 1         # по одной задаче на уровень
    MIN_SCORE = 65              # порог по среднему баллу (correctness/optimality)

    all_tasks: List[Dict] = []

    for lvl in LEVELS:
        print(f"\n=== Генерируем задачи уровня {lvl} ===")
        tasks = generate_domain_tasks(
            vacancy=VACANCY,
            level=lvl,
            target_count=PER_LEVEL_COUNT,
            min_score=MIN_SCORE,
            max_attempts=50,
        )
        all_tasks.extend(tasks)

    outfile = "domain_tasks.json"
    with open(outfile, "w", encoding="utf-8") as f:
        json.dump(all_tasks, f, ensure_ascii=False, indent=2)

    print(f"\nИтого задач сохранено: {len(all_tasks)}")
    print(f"JSON сохранён в файл {outfile}")
