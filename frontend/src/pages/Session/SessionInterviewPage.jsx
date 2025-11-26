import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { fetchInterviewByToken } from "../../api/interviewApi.js";

const INTERVIEW_DURATION_SECONDS = 45 * 60; // 45 минут

function SessionInterviewPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [remainingSeconds, setRemainingSeconds] = useState(
    INTERVIEW_DURATION_SECONDS
  );
  const [hasRedirectedOnTimeout, setHasRedirectedOnTimeout] =
    useState(false);

    const [code, setCode] = useState(
    `# Ваше решение здесь\n`
  );
  const [interview, setInterview] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isLoadingInterview, setIsLoadingInterview] = useState(true);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // --- Загрузка интервью по токену ---
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function load() {
      setIsLoadingInterview(true);
      setLoadError("");

      try {
        const data = await fetchInterviewByToken(token);
        if (!cancelled) {
          setInterview(data);
          setCurrentTaskIndex(0);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setLoadError(
            e.status === 404
              ? "Интервью по этому токену не найдено."
              : "Не удалось загрузить интервью. Попробуйте обновить страницу."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingInterview(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const tasks = interview?.tasks || [];
  const currentTask =
    tasks.length > 0
      ? tasks[Math.min(currentTaskIndex, tasks.length - 1)]
      : null;

  const isFirstTask = currentTaskIndex === 0;
  const isLastTask = tasks.length > 0 && currentTaskIndex === tasks.length - 1;

  // --- Восстановление старта по токену (таймер) ---
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

  // --- Тик таймера ---
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const id = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [remainingSeconds]);

  // --- Переход на отчёт по окончании времени ---
  useEffect(() => {
    if (remainingSeconds <= 0 && !hasRedirectedOnTimeout && token) {
      setHasRedirectedOnTimeout(true);
      navigate(`/session/${encodeURIComponent(token)}/report`, {
        replace: true,
      });
    }
  }, [remainingSeconds, hasRedirectedOnTimeout, navigate, token]);

  const handleRunVisibleTests = () => {
    // TODO: заменить на реальный вызов API запуска видимых тестов
    setIsRunningVisibleTests(true);
    setTimeout(() => setIsRunningVisibleTests(false), 1000);
  };

  const handleSubmitSolution = () => {
    // TODO: отправить решение на бэк, запустить скрытые тесты, зафиксировать попытку
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // Здесь можно добавить переход к следующей задаче, если она есть
      if (!isLastTask) {
        setCurrentTaskIndex((prev) => prev + 1);
      }
    }, 1500);
  };

  const [isRunningVisibleTests, setIsRunningVisibleTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToNextTask = () => {
    if (!isLastTask) {
      setCurrentTaskIndex((prev) => prev + 1);
    }
  };

  const goToPrevTask = () => {
    if (!isFirstTask) {
      setCurrentTaskIndex((prev) => prev - 1);
    }
  };

  const formatTime = (totalSeconds) => {
    const safe = Math.max(0, totalSeconds);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  // --- Состояния загрузки/ошибки ---
  if (isLoadingInterview) {
    return (
      <section className="demo-interview">
        <div className="demo-interview__inner">
          <p>Загружаем интервью...</p>
        </div>
      </section>
    );
  }

  if (loadError || !currentTask) {
    return (
      <section className="demo-interview">
        <div className="demo-interview__inner">
          <h1>Интервью недоступно</h1>
          <p className="session-report__error">
            {loadError || "Не удалось получить данные интервью."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="demo-interview">
      <div className="demo-interview__inner">
        <SessionTopBar
          currentIndex={currentTaskIndex}
          total={tasks.length}
          title={currentTask.title}
          remainingTime={formatTime(remainingSeconds)}
          isTimeOver={remainingSeconds <= 0}
        />

        <div className="session-interview__body session-interview__body--split">
          {/* Левая колонка: условие + тесты + навигация по задачам */}
          <div className="session-interview__left">
            <TaskStatement
            task={currentTask}
            onPrev={goToPrevTask}
            onNext={goToNextTask}
            isFirst={isFirstTask}
            isLast={isLastTask}
            />
            <TestsPane task={currentTask} />
          </div>

          {/* Правая колонка: редактор */}
          <div className="session-interview__right">
            <EditorPane
              code={code}
              onChangeCode={setCode}
              onRunVisibleTests={handleRunVisibleTests}
              onSubmitSolution={handleSubmitSolution}
              isRunningVisibleTests={isRunningVisibleTests}
              isSubmitting={isSubmitting}
              isLastTask={isLastTask}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SessionTopBar({
  currentIndex,
  total,
  title,
  remainingTime,
  isTimeOver,
}) {
  return (
    <div className="session-interview__topbar">
      <div className="session-interview__topbar-left">
        <span className="session-interview__task-label">Задача</span>
        <span className="session-interview__task-name">
          Задача {currentIndex + 1} из {total}: {title}
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

function TaskStatement({ task, onPrev, onNext, isFirst, isLast }) {
  const title =
    task.title ||
    `Задача (${task.level || "без уровня"})`;
  const description = task.description || task.statement || "";
  const examples = task.examples || task.samples || [];
  // constraints у тебя сейчас нет — можно оставить пустым массивом
  const constraints = task.constraints || [];

  return (
    <div className="session-interview__pane session-interview__pane--statement">
      <h2>{title}</h2>
      {description && (
        <p className="session-interview__task-text">{description}</p>
      )}

      {constraints.length > 0 && (
        <div className="session-interview__task-section">
          <h3>Ограничения</h3>
          <ul>
            {constraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {examples.length > 0 && (
        <div className="session-interview__task-section">
          <h3>Примеры</h3>
          {examples.map((ex, idx) => (
            <div key={idx} className="session-interview__example">
              {ex.input && (
                <div>
                  <span className="session-interview__example-label">
                    Ввод
                  </span>
                  <code>{ex.input}</code>
                </div>
              )}
              {ex.output && (
                <div>
                  <span className="session-interview__example-label">
                    Вывод
                  </span>
                  <code>{ex.output}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {onPrev && onNext && (
        <div className="demo-interview__task-nav">
          <Button
            variant="secondary"
            onClick={onPrev}
            disabled={isFirst}
          >
            Предыдущая задача
          </Button>
          <Button
            variant="secondary"
            onClick={onNext}
            disabled={isLast}
          >
            Следующая задача
          </Button>
        </div>
      )}
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
  isLastTask,
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
            {isSubmitting
              ? "Отправка..."
              : isLastTask
              ? "Отправить решение"
              : "Отправить и перейти дальше"}
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

function TestsPane({ task }) {
  const samples = task.samples || [];
  const hiddenTests = task.tests || [];

  return (
    <div className="session-interview__pane session-interview__pane--tests">
      <h2>Видимые примеры</h2>

      {samples.length === 0 ? (
        <p className="session-interview__task-text">
          Для этой задачи нет явных примеров (samples).
        </p>
      ) : (
        <div className="session-interview__tests-table-wrapper">
          <table className="session-interview__tests-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Ввод</th>
                <th>Ожидаемый вывод</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <code>{s.input}</code>
                  </td>
                  <td>
                    <code>{s.output}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="session-interview__hidden-tests">
        <h3>Скрытые тесты</h3>
        {hiddenTests.length === 0 ? (
          <p>
            Скрытые тесты для этой задачи не заданы. В реальном интервью сюда
            попадают дополнительные проверки граничных случаев и
            производительности.
          </p>
        ) : (
          <p>
            Количество скрытых тестов:{" "}
            <strong>{hiddenTests.length}</strong>. Их входные данные и
            ожидаемый вывод не раскрываются кандидату.
          </p>
        )}
      </div>
    </div>
  );
}

export default SessionInterviewPage;