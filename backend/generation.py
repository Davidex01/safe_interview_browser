# generator.py
import json
import subprocess
import tempfile
import textwrap
import re
from typing import List, Dict

from openai import OpenAI

# --------------------------------
# НАСТРОЙКИ LLM
# --------------------------------

from tokenn import API_KEY

BASE_URL = "https://llm.t1v.scibox.tech/v1"

CHAT_MODEL = "qwen3-32b-awq"
CODE_MODEL = "qwen3-coder-30b-a3b-instruct-fp8"

client = OpenAI(
    base_url=BASE_URL,
    api_key=API_KEY,
)


# --------------------------------
# ГЕНЕРАЦИЯ ЗАДАЧИ ИЗ ВАКАНСИИ
# --------------------------------

def generate_task_from_vacancy(vacancy_text: str, level_for_prompt: str) -> Dict:
    """
    Генерируем задачу под вакансию.

    Фиксированный формат ввода/вывода:

      Вход:
        - первая строка: целое число n (количество элементов);
        - вторая строка: n целых чисел, разделённых пробелами.
        - если по сути задача про одно число, используй n = 1 и одно число во второй строке.

      Выход:
        - одно целое число в отдельной строке.
    """
    prompt = f"""
Ты выступаешь как инженер по найму разработчиков.

Тебе даётся текст вакансии:

---
{vacancy_text}
---

Сгенерируй одну ЗАВЕРШЁННУЮ техническую задачу на Python уровня {level_for_prompt} для собеседования.

Свяжи задачу по смыслу с вакансией (домен, данные, бизнес-контекст), но по сути это
чистая алгоритмическая мини-задача.

ФОРМАТ ДАННЫХ (СОБЛЮДАЙ ЖЁСТКО):

Входные данные:
- в первой строке задано целое число n (1 ≤ n ≤ разумная константа, например 10^5);
- во второй строке заданы n целых чисел a_1, a_2, ..., a_n, разделённых пробелами.

Если по смыслу задачи тебе достаточно одного числа, просто используй n = 1 и одно число во второй строке.

Выходные данные:
- выведи ОДНО целое число в отдельной строке.
- НИКАКОГО дополнительного текста ("Ответ:", комментариев и т.п.) — только число.

ОФОРМЛЕНИЕ УСЛОВИЯ:

- Нормальное олимпиадное условие на русском с разделами:
  "Описание задачи", "Формат ввода", "Формат вывода", "Ограничения", "Пример".
- В разделе "Формат ввода" НЕДВУСМЫСЛЕННО напиши именно этот формат (n и n чисел).
- В разделе "Формат вывода" напиши, что нужно вывести одно целое число.

ФОРМАТ ОТВЕТА:

Верни строго JSON БЕЗ пояснений вокруг:

{{
  "statement": "<полный текст условия задачи со всеми разделами>",
  "samples": [
    {{"input": "<пример ввода: две строки (n и n чисел)>", "output": "<пример вывода: одно число и перевод строки>"}}
  ],
  "tests": [
    {{"input": "<ввод для теста: две строки (n и n чисел)>", "output": "<ожидаемый вывод: одно число и перевод строки>"}}
  ]
}}

Требования к samples и tests:
- во всех input:
  * первая строка — одно целое число n,
  * вторая строка — n целых чисел, разделённых пробелами,
  * в конце входа должен быть перевод строки;
- во всех output:
  * одно целое число (целочисленный ответ),
  * никаких вещественных чисел.
"""

    resp = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {
                "role": "system",
                "content": "/no_think Ты генерируешь чёткие и проверяемые задачи для собеседований.",
            },
            {"role": "user", "content": textwrap.dedent(prompt).strip()},
        ],
        temperature=0.5,
    )

    content = resp.choices[0].message.content.strip()

    # Парсим JSON из ответа
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError(f"Не удалось распарсить JSON задачи из ответа: {content!r}")
        snippet = content[start : end + 1]
        data = json.loads(snippet)

    statement = data["statement"]
    samples = data.get("samples") or []
    tests = data.get("tests") or []

    # --- нормализуем ТОЛЬКО output до целого числа ---
    def normalize_output_int(s: str) -> str:
        s = s.strip()
        # сначала целое
        if re.fullmatch(r"-?\d+", s):
            return s + "\n"
        # допускаем X.0 / X.00
        if "." in s:
            try:
                val = float(s)
            except ValueError:
                raise ValueError(f"Output не число: {s!r}")
            if val.is_integer():
                return f"{int(val)}\n"
            raise ValueError(f"Output с ненулевой дробной частью: {s!r}")
        raise ValueError(f"Output не похож на одно целое число: {s!r}")

    clean_tests = []
    for t in tests:
        inp_raw = t.get("input", "")
        out_raw = t.get("output", "")
        if not inp_raw or not out_raw:
            continue

        try:
            out = normalize_output_int(out_raw)
        except ValueError:
            continue

        # Вход просто доводим до корректного окончания, структуру не трогаем
        inp = inp_raw
        if not inp.endswith("\n"):
            inp = inp + "\n"

        clean_tests.append({"input": inp, "output": out})

    if not clean_tests:
        raise ValueError("Модель вернула задачу без пригодных целочисленных тестов")

    task = {
        "level": level_for_prompt,
        "statement": statement,
        "samples": samples,
        "tests": clean_tests,
    }
    return task




# --------------------------------
# РЕШЕНИЕ ЗАДАЧИ ЧЕРЕЗ CODE-МОДЕЛЬ
# --------------------------------

def solve_task_with_llm(task: Dict, attempt: int = 1) -> str:
    """
    Просим qwen-coder написать решение на Python.
    attempt — номер попытки (1, 2, 3...), чтобы немного менять промпт и ломать кэш.
    """
    statement = task["statement"]
    samples = task["samples"]

    samples_text = ""
    if samples:
        samples_text = "\nПримеры ввода и вывода:\n" + "\n".join(
            f"Ввод:\n{ s['input'] }\nВывод:\n{ s['output'] }\n" for s in samples
        )

    prompt = f"""
Тебе дана задача на собеседовании по программированию на Python.

Условие задачи:

---
{statement}
---

{samples_text}

Формат данных (важно для реализации):

- На первой строке входа подаётся целое число n — количество элементов.
- На второй строке подаётся n целых чисел, разделённых пробелами.
- Если в конкретных тестах n = 1, то во второй строке просто одно число.
- В выход нужно напечатать ОДНО целое число в отдельной строке.

Это попытка написать решение номер {attempt}.
Если предыдущий подход мог быть неправильным, попробуй сейчас другой способ,
но обязательно соблюдай формат ввода/вывода.

Напиши корректное, рабочее решение на Python.

ОЧЕНЬ ВАЖНО:

1. Строго соблюдай формат ввода и вывода:
   - читай n и массив именно так:
       n = int(input().strip())
       arr = list(map(int, input().split()))
   - напечатай только одно число: print(answer)
   Любое отклонение по формату считается неверным решением.

2. Используй примеры (samples) для самопроверки:
   - мысленно подставь примеры во вход;
   - убедись, что твой код даёт точно такой же вывод, как в примерах.

Требования к коду:

- Оформи решение как функцию solve().
- Функция solve() должна читать данные из stdin и печатать результат в stdout через print().
- Не печатай ничего лишнего (никаких "Введите n:", "Ответ:" и т.п.).
- Не возвращай значение из solve(), просто печатай результат.
- Не включай примеры ввода/вывода в код.
- Код должен быть самодостаточным: достаточно запустить файл, чтобы он прочитал stdin и напечатал ответ.

Верни ТОЛЬКО код, без пояснений, без ``` и без лишнего текста вокруг.
"""

    resp = client.chat.completions.create(
        model=CODE_MODEL,
        messages=[
            {
                "role": "system",
                "content": "/no_think Ты опытный Python-разработчик и пишешь корректные решения под строгие автотесты.",
            },
            {"role": "user", "content": textwrap.dedent(prompt).strip()},
        ],
        temperature=0.35,  # можно чуть выше, чтобы код различался
    )

    code = resp.choices[0].message.content.strip()

    if code.startswith("```"):
        code = code.strip("`")
        if code.lower().startswith("python"):
            code = code[len("python") :].lstrip()

    return code




# --------------------------------
# ЛОКАЛЬНАЯ ПРОВЕРКА РЕШЕНИЯ (ТОЛЬКО ЦЕЛЫЕ)
# --------------------------------

def _parse_int(s: str):
    m = re.search(r"-?\d+", s)
    if not m:
        return None
    return int(m.group(0))

def run_code_on_tests(code: str, tests: List[Dict], timeout: float = 3.0) -> bool:
    """
    Запускаем данный код на всех тестах.
    Ожидаем, что в коде есть функция solve(), которая читает stdin и пишет в stdout.
    Считаем, что формат: одно целое число -> одно целое число.
    """
    # Обёртка: если solve() что-то возвращает, напечатаем это
    full_code = code + """
if __name__ == "__main__":
    _res = solve()
    if _res is not None:
        print(_res)
"""

    with tempfile.TemporaryDirectory() as tmpdir:
        path = tempfile.NamedTemporaryFile(dir=tmpdir, suffix=".py", delete=False).name
        with open(path, "w", encoding="utf-8") as f:
            f.write(full_code)

        for i, test in enumerate(tests, start=1):
            inp = test["input"]
            expected = test["output"]

            try:
                proc = subprocess.run(
                    ["python", path],
                    input=inp.encode("utf-8"),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=timeout,
                )
            except subprocess.TimeoutExpired:
                print(f"Тест {i}: превышено время выполнения")
                return False

            out = proc.stdout.decode("utf-8")
            err = proc.stderr.decode("utf-8")

            expected_num = _parse_int(expected)
            got_num = _parse_int(out)

            if expected_num is None or got_num is None:
                print(f"Тест {i}: не удалось разобрать целое число")
                print("  Ввод:      ", repr(inp))
                print("  Ожидали:   ", repr(expected))
                print("  Получили:  ", repr(out))
                if err:
                    print("  stderr:", err)
                return False

            if expected_num != got_num:
                print(f"Тест {i}: ОШИБКА")
                print("  Ввод:        ", repr(inp))
                print("  Ожидали (int)", expected_num)
                print("  Получили (int)", got_num)
                print("  Сырой вывод: ", repr(out))
                if err:
                    print("  stderr:", err)
                return False

        return True


# --------------------------------
# ГЕНЕРАЦИЯ ПРОВЕРЕННОЙ ЗАДАЧИ
# --------------------------------

def generate_verified_task(
    vacancy_text: str,
    level_for_prompt: str,
    max_task_attempts: int = 10,
    max_code_attempts: int = 3,
) -> Dict:
    """
    Пытаемся сгенерировать задачу нужного уровня (для промпта)
    и проверить её через qwen-coder + локальные тесты.

    max_task_attempts  – сколько разных задач пробуем сгенерировать.
    max_code_attempts  – сколько раз даём code-модели шанс решить одну и ту же задачу.
    """
    for task_attempt in range(1, max_task_attempts + 1):
        print(f"[{level_for_prompt}] Попытка генерации задачи #{task_attempt}...")
        try:
            task = generate_task_from_vacancy(vacancy_text, level_for_prompt)
        except Exception as e:
            print(f"[{level_for_prompt}] Ошибка при генерации задачи: {e}")
            continue

        # Несколько попыток написать решение для ОДНОЙ задачи
        for code_attempt in range(1, max_code_attempts + 1):
            print(
                f"[{level_for_prompt}] Пытаемся решить с помощью code-модели "
                f"(попытка кода #{code_attempt})..."
            )
            try:
                code = solve_task_with_llm(task, attempt=code_attempt)
            except Exception as e:
                print(f"[{level_for_prompt}] Ошибка при генерации кода: {e}")
                continue

            ok = run_code_on_tests(code, task["tests"])
            if ok:
                print(f"[{level_for_prompt}] Успешно: задача прошла все тесты.")
                return task
            else:
                print(
                    f"[{level_for_prompt}] Этот вариант решения не прошёл тесты, "
                    f"пробуем другой код для той же задачи..."
                )

        print(
            f"[{level_for_prompt}] Ни одно из решений не прошло тесты, "
            f"генерируем новую задачу..."
        )

    raise RuntimeError(
        f"Не удалось получить рабочую задачу уровня {level_for_prompt} "
        f"за {max_task_attempts} попыток"
    )



# --------------------------------
# ГЕНЕРАЦИЯ 3 ЗАДАЧ ПОД ВАКАНСИЮ
# --------------------------------

def generate_interview_tasks(vacancy_text: str) -> Dict:
    label_levels = ["easy", "medium", "hard"]
    tasks = []

    for label in label_levels:
        task = generate_verified_task(
            vacancy_text,
            level_for_prompt=label,   # ← вот так
            max_task_attempts=20,
        )
        task["level"] = label
        tasks.append(task)

    return {
        "vacancy": vacancy_text,
        "tasks": tasks,
    }



# --------------------------------
# ДЕМО-ЗАПУСК
# --------------------------------

if __name__ == "__main__":
    import sys
    import os

    vacancy_path = os.path.join(os.path.dirname(__file__), "vacancy.txt")

    try:
        with open(vacancy_path, "r", encoding="utf-8") as f:
            vacancy_text = f.read().strip()
    except FileNotFoundError:
        print(f"Файл vacancy.txt не найден по пути: {vacancy_path}")
        sys.exit(1)

    if not vacancy_text:
        print("Файл vacancy.txt пустой – добавь туда текст вакансии.")
        sys.exit(1)

    data = generate_interview_tasks(vacancy_text)

    # 1) печатаем в консоль
    print(json.dumps(data, ensure_ascii=False, indent=2))

    # 2) сохраняем в файл рядом с проектом
    out_path = os.path.join(os.path.dirname(__file__), "generated_tasks.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nJSON сохранён в файл {out_path}")

