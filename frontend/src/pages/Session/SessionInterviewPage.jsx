// src/pages/Session/SessionInterviewPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";

const TABS = {
  // оставим enum на будущее, но фактически вкладки больше не используем
  STATEMENT: "statement",
  EDITOR: "editor",
  TESTS: "tests",
};

function SessionInterviewPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const INTERVIEW_DURATION_SECONDS = 45 * 60;

  const [remainingSeconds, setRemainingSeconds] = useState(
    INTERVIEW_DURATION_SECONDS
  );
  const [hasRedirectedOnTimeout, setHasRedirectedOnTimeout] =
    useState(false);

  // Мок-данные задачи
  const task = {
    title: "Найти дубликаты в массиве",
    description:
      "Напишите функцию, которая по массиву целых чисел возвращает все элементы, встречающиеся более одного раза.",
    constraints: [
      "1 ≤ n ≤ 10^5",
      "Элементы массива — целые числа по модулю не более 10^9",
    ],
    examples: [
      {
        input: "[1, 2, 3, 2, 4, 1]",
        output: "[1, 2]",
        explanation: "1 и 2 встречаются по два раза",
      },
      {
        input: "[5, 5, 5]",
        output: "[5]",
        explanation: "5 встречается три раза",
      },
    ],
    timeLimit: "1 секунда",
    memoryLimit: "256 МБ",
  };

  const [code, setCode] = useState(
    `def find_duplicates(arr):\n    # Напишите ваше решение здесь\n    pass\n`
  );

  const [isRunningVisibleTests, setIsRunningVisibleTests] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== ВОССТАНОВЛЕНИЕ ВРЕМЕНИ (как раньше) =====
  useEffect(() => {
    if (!token) return;

    const storageKey = `safeInterview:session:${token}:startTime`;
    const stored = localStorage.getItem(storageKey);
    const now = Date.now();

    let startTime;

    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && parsed > 0) {
        startTime = parsed;
      }
    }

    if (!startTime) {
      startTime = now;
      try {
        localStorage.setItem(storageKey, String(startTime));
      } catch {
        // ignore
      }
    }

    const elapsedMs = now - startTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const remaining = INTERVIEW_DURATION_SECONDS - elapsedSeconds;

    setRemainingSeconds(remaining > 0 ? remaining : 0);
  }, [token]);

  // Тик таймера
  useEffect(() => {
    if (remainingSeconds <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [remainingSeconds]);

  // Автопереход на отчёт по окончании времени
  useEffect(() => {
    if (remainingSeconds <= 0 && !hasRedirectedOnTimeout && token) {
      setHasRedirectedOnTimeout(true);
      navigate(`/session/${token}/report`, { replace: true });
    }
  }, [remainingSeconds, hasRedirectedOnTimeout, navigate, token]);

  const handleRunVisibleTests = () => {
    setIsRunningVisibleTests(true);
    setTimeout(() => {
      setIsRunningVisibleTests(false);
    }, 1000);
  };

  const handleSubmitSolution = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // TODO: здесь отправка решения на бэк, смена задачи/состояния
    }, 1500);
  };

  const formatTime = (totalSeconds) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="session-interview">
      <InterviewTopBar
        remainingTime={formatTime(remainingSeconds)}
        isTimeOver={remainingSeconds <= 0}
      />

      <div className="session-interview__body session-interview__body--split">
        {/* ЛЕВАЯ КОЛОНКА: УСЛОВИЕ + ТЕСТЫ */}
        <div className="session-interview__left">
          <TaskStatement task={task} />
          <TestsPane />
        </div>

        {/* ПРАВАЯ КОЛОНКА: РЕДАКТОР */}
        <div className="session-interview__right">
          <EditorPane
            code={code}
            onChangeCode={setCode}
            onRunVisibleTests={handleRunVisibleTests}
            onSubmitSolution={handleSubmitSolution}
            isRunningVisibleTests={isRunningVisibleTests}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}

function InterviewTopBar({ remainingTime, isTimeOver }) {
  return (
    <div className="session-interview__topbar">
      <div className="session-interview__topbar-left">
        <span className="session-interview__task-label">Текущая задача</span>
        <span className="session-interview__task-name">
          Задача 1 (определение уровня)
        </span>
      </div>
      <div className="session-interview__topbar-right">
        <div className="session-interview__timer">
          Осталось:{" "}
          <strong className={isTimeOver ? "is-time-over" : ""}>
            {remainingTime}
          </strong>
        </div>
      </div>
    </div>
  );
}

function TaskStatement({ task }) {
  return (
    <div className="session-interview__pane session-interview__pane--statement">
      <h2>{task.title}</h2>
      <p className="session-interview__task-text">{task.description}</p>

      <div className="session-interview__task-section">
        <h3>Ограничения</h3>
        <ul>
          {task.constraints.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="session-interview__limits">
          Лимит времени: <strong>{task.timeLimit}</strong> · Лимит памяти:{" "}
          <strong>{task.memoryLimit}</strong>
        </p>
      </div>

      <div className="session-interview__task-section">
        <h3>Примеры</h3>
        {task.examples.map((ex, idx) => (
          <div key={idx} className="session-interview__example">
            <div>
              <span className="session-interview__example-label">Ввод</span>
              <code>{ex.input}</code>
            </div>
            <div>
              <span className="session-interview__example-label">Вывод</span>
              <code>{ex.output}</code>
            </div>
            {ex.explanation && (
              <p className="session-interview__example-note">
                {ex.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorPane({
  code,
  onChangeCode,
  onRunVisibleTests,
  onSubmitSolution,
  isRunningVisibleTests,
  isSubmitting,
}) {
  return (
    <div className="session-interview__pane session-interview__pane--editor">
      <div className="session-interview__editor-header">
        <div className="session-interview__editor-meta">
          <span className="session-interview__file-name">solution.py</span>
          <span className="session-interview__language-badge">Python</span>
        </div>
        <div className="session-interview__editor-actions">
          <Button
            variant="secondary"
            onClick={onRunVisibleTests}
            disabled={isRunningVisibleTests || isSubmitting}
          >
            {isRunningVisibleTests
              ? "Запуск тестов..."
              : "Запустить видимые тесты"}
          </Button>
          <Button
            variant="primary"
            onClick={onSubmitSolution}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Отправка..." : "Отправить решение"}
          </Button>
        </div>
      </div>

      <div className="session-interview__editor-body">
        <textarea
          className="session-interview__textarea"
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function TestsPane() {
  const visibleTests = [
    {
      id: 1,
      name: "Пример 1",
      input: "[1, 2, 3, 2, 4, 1]",
      expected: "[1, 2]",
      actual: "[1, 2]",
      status: "passed",
      time: "35 мс",
    },
    {
      id: 2,
      name: "Пример 2",
      input: "[5, 5, 5]",
      expected: "[5]",
      actual: "[5]",
      status: "passed",
      time: "22 мс",
    },
  ];

  const hiddenTestsSummary = {
    total: 5,
    passed: 3,
    failed: 2,
  };

  return (
    <div className="session-interview__pane session-interview__pane--tests">
      <h2>Результаты видимых тестов</h2>
      <div className="session-interview__tests-table-wrapper">
        <table className="session-interview__tests-table">
          <thead>
            <tr>
              <th>Тест</th>
              <th>Ввод</th>
              <th>Ожидаемый вывод</th>
              <th>Фактический вывод</th>
              <th>Статус</th>
              <th>Время</th>
            </tr>
          </thead>
          <tbody>
            {visibleTests.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>
                  <code>{t.input}</code>
                </td>
                <td>
                  <code>{t.expected}</code>
                </td>
                <td>
                  <code>{t.actual}</code>
                </td>
                <td>
                  <span
                    className={`session-interview__test-status session-interview__test-status--${t.status}`}
                  >
                    {t.status === "passed" ? "Пройден" : "Провален"}
                  </span>
                </td>
                <td>{t.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="session-interview__hidden-tests">
        <h3>Скрытые тесты</h3>
        <p>
          Скрытые тесты проверяют дополнительные граничные случаи и
          производительность. Детали входных данных не раскрываются.
        </p>
        <p>
          Пройдено{" "}
          <strong>
            {hiddenTestsSummary.passed} из {hiddenTestsSummary.total}
          </strong>{" "}
          скрытых тестов.
        </p>
      </div>
    </div>
  );
}

export default SessionInterviewPage;