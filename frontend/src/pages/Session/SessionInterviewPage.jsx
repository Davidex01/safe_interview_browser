import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import {
  fetchInterviewByToken,
  submitInterview,
} from "../../api/interviewApi.js";

const INTERVIEW_DURATION_SECONDS = 60 * 60; // 45 минут

function SessionInterviewPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  // Таймер
  const [remainingSeconds, setRemainingSeconds] = useState(
    INTERVIEW_DURATION_SECONDS
  );
  const [hasRedirectedOnTimeout, setHasRedirectedOnTimeout] =
    useState(false);

  // Данные интервью
  const [interview, setInterview] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isLoadingInterview, setIsLoadingInterview] = useState(true);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // Ответы по задачам
  const [codeAnswers, setCodeAnswers] = useState([]); // массив строк кода
  const [textAnswers, setTextAnswers] = useState([]); // массив текстовых ответов

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Античит
  const [cheatEvents, setCheatEvents] = useState([]);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [interviewStopped, setInterviewStopped] = useState(false);
  const [stopReason, setStopReason] = useState("");

  // ---------- ЗАГРУЗКА ИНТЕРВЬЮ ----------

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

  const codingTasks = interview?.coding_tasks || [];
  const theoryTasks = interview?.theory_tasks || [];
  const tasks = [...codingTasks, ...theoryTasks];

  const currentTask =
    tasks.length > 0
      ? tasks[Math.min(currentTaskIndex, tasks.length - 1)]
      : null;

  const isFirstTask = currentTaskIndex === 0;
  const isLastTask =
    tasks.length > 0 && currentTaskIndex === tasks.length - 1;

  const codingCount = codingTasks.length;
  const isTextTask =
    tasks.length > 0 && currentTaskIndex >= codingCount;

  // ---------- ИНИЦИАЛИЗАЦИЯ ОТВЕТОВ ----------

  useEffect(() => {
    if (!interview) return;

    const total =
      (interview.coding_tasks?.length || 0) +
      (interview.theory_tasks?.length || 0);

    setCodeAnswers((prev) => {
      const next = new Array(total).fill("");
      for (let i = 0; i < Math.min(prev.length, total); i += 1) {
        next[i] = prev[i];
      }
      return next;
    });

    setTextAnswers((prev) => {
      const next = new Array(total).fill("");
      for (let i = 0; i < Math.min(prev.length, total); i += 1) {
        next[i] = prev[i];
      }
      return next;
    });
  }, [interview]);

  const currentCode =
    !isTextTask && codeAnswers[currentTaskIndex] !== undefined
      ? codeAnswers[currentTaskIndex]
      : "# Напишите ваше решение здесь\n";

  const currentTextAnswer =
    isTextTask && textAnswers[currentTaskIndex] !== undefined
      ? textAnswers[currentTaskIndex]
      : "";

  const handleCodeChange = (value) => {
    setCodeAnswers((prev) => {
      const next = [...prev];
      next[currentTaskIndex] = value;
      return next;
    });
  };

  const handleTextChange = (value) => {
    setTextAnswers((prev) => {
      const next = [...prev];
      next[currentTaskIndex] = value;
      return next;
    });
  };

  // ---------- ТАЙМЕР ----------

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

  useEffect(() => {
    if (
      remainingSeconds <= 0 &&
      !hasRedirectedOnTimeout &&
      token &&
      !interviewStopped
    ) {
      setHasRedirectedOnTimeout(true);
      navigate(`/session/${encodeURIComponent(token)}/report`, {
        replace: true,
      });
    }
  }, [remainingSeconds, hasRedirectedOnTimeout, navigate, token, interviewStopped]);

  // ---------- НАВИГАЦИЯ ПО ЗАДАЧАМ ----------

  const goToNextTask = () => {
    if (!isLastTask && !interviewStopped) {
      setCurrentTaskIndex((prev) => prev + 1);
    }
  };

  const goToPrevTask = () => {
    if (!isFirstTask && !interviewStopped) {
      setCurrentTaskIndex((prev) => prev - 1);
    }
  };

  // ---------- АНТИЧИТ ----------

  useEffect(() => {
    if (!token) return;

    const addEvent = async (type) => {
      const time = new Date().toISOString();
      setCheatEvents((prev) => [...prev, { type, time }]);
      setShowCheatWarning(true);

      if (!interviewStopped) {
        setInterviewStopped(true);
        setStopReason(
          "Интервью остановлено из‑за нарушения правил (обнаружены подозрительные действия)."
        );

        try {
          await fetch(
            `/api/interview/${encodeURIComponent(token)}/cheat-event`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type, time }),
            }
          );
        } catch (e) {
          console.error("Ошибка логирования cheat-event:", e);
        }

        try {
          const emptyCoding = { easy: "", medium: "", hard: "" };
          const emptyTheory = { easy: "", hard: "" };

          const result = await submitInterview(token, {
            coding_solutions: emptyCoding,
            theory_solutions: emptyTheory,
          });

          navigate(`/session/${encodeURIComponent(token)}/report`, {
            replace: true,
            state: { submitResult: result },
          });
        } catch (e) {
          console.error("Ошибка submit после читерства:", e);
          navigate(`/session/${encodeURIComponent(token)}/report`, {
            replace: true,
          });
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addEvent("tab_hidden");
      }
    };

    const handleBlur = () => {
      addEvent("window_blur");
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      addEvent("context_menu");
    };

    const handleCopy = (e) => {
      e.preventDefault();
      addEvent("copy_attempt");
    };

    const handlePaste = (e) => {
      e.preventDefault();          // ЗАПРЕЩАЕМ вставку
      addEvent("paste_attempt");
    };

    const handleKeyDown = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i"))
      ) {
        e.preventDefault();
        addEvent("devtools_attempt");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);   // <‑‑ НОВОЕ
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste); // <‑‑ НОВОЕ
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [token, interviewStopped, navigate]);

  // ---------- ОТПРАВКА ИНТЕРВЬЮ ----------

  const handleSubmitSolution = async () => {
    if (!currentTask) return;

    // если интервью остановлено из-за читерства — не даём отправлять
    if (interviewStopped) return;

    setIsSubmitting(true);

    try {
      // если не последняя задача — просто переходим дальше
      if (!isLastTask) {
        setIsSubmitting(false);
        goToNextTask();
        return;
      }

      // последняя задача: собираем ВСЕ ответы
      const coding_solutions = { easy: "", medium: "", hard: "" };
      const theory_solutions = { easy: "", hard: "" };

      codingTasks.forEach((task, idx) => {
        const level = (task.level || "").toLowerCase();
        if (["easy", "medium", "hard"].includes(level)) {
          coding_solutions[level] = codeAnswers[idx] || "";
        }
      });

      theoryTasks.forEach((task, offset) => {
        const idx = codingCount + offset;
        const level = (task.level || "").toLowerCase();
        if (["easy", "hard"].includes(level)) {
          theory_solutions[level] = textAnswers[idx] || "";
        }
      });

      const payload = {
        coding_solutions,
        theory_solutions,
      };

      const result = await submitInterview(token, payload);

      navigate(`/session/${encodeURIComponent(token)}/report`, {
        replace: true,
        state: { submitResult: result },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
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

  // ---------- СОСТОЯНИЯ ЗАГРУЗКИ ----------

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

  // ---------- РЕНДЕР ----------

  return (
    <section className="demo-interview">
      <div className="demo-interview__inner">
        <SessionTopBar
          currentIndex={currentTaskIndex}
          total={tasks.length}
          title={currentTask.statement || currentTask.question || "Задача"}
          remainingTime={formatTime(remainingSeconds)}
          isTimeOver={remainingSeconds <= 0}
        />

        {interviewStopped && (
          <div className="session-interview__stopped">
            <p>{stopReason || "Интервью было остановлено."}</p>
          </div>
        )}

        {showCheatWarning && !interviewStopped && (
          <div className="session-interview__cheat-warning">
            <p>
              Обнаружены действия, которые могут нарушать правила
              проведения интервью (переключение вкладок, копирование,
              попытка открыть DevTools и т.п.). Пожалуйста,
              сосредоточьтесь на решении задач.
            </p>
            <button
              type="button"
              className="session-interview__cheat-warning-close"
              onClick={() => setShowCheatWarning(false)}
            >
              Закрыть
            </button>
          </div>
        )}

        <div className="session-interview__body session-interview__body--split">
          {/* Левая колонка: условие + навигация */}
          <div className="session-interview__left">
            <TaskStatement
              task={currentTask}
              onPrev={goToPrevTask}
              onNext={goToNextTask}
              isFirst={isFirstTask}
              isLast={isLastTask}
              disabled={interviewStopped}
            />
          </div>

          {/* Правая колонка: редактор кода или текстовый ответ */}
          <div className="session-interview__right">
            {isTextTask ? (
              <TextAnswerPane
                answer={currentTextAnswer}
                onChangeAnswer={handleTextChange}
                onSubmitSolution={handleSubmitSolution}
                isSubmitting={isSubmitting}
                isLastTask={isLastTask}
                disabled={interviewStopped}
              />
            ) : (
              <CodeEditorPane
                code={currentCode}
                onChangeCode={handleCodeChange}
                onSubmitSolution={handleSubmitSolution}
                isSubmitting={isSubmitting}
                isLastTask={isLastTask}
                disabled={interviewStopped}
              />
            )}
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
          Задача {currentIndex + 1} из {total}
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

function TaskStatement({
  task,
  onPrev,
  onNext,
  isFirst,
  isLast,
  disabled,
}) {
  const levelLabel = task.level ? `(${task.level})` : "";
  const description =
    task.statement || task.question || task.description || "";
  const samples = task.samples || [];

  return (
    <div className="session-interview__pane session-interview__pane--statement">
      <h2>Задача {levelLabel}</h2>

      {task.vacancy && (
        <p className="session-interview__limits">
          Вакансия: <strong>{task.vacancy}</strong>
        </p>
      )}

      {description && (
        <p className="session-interview__task-text">
          {description.split("\n").map((line, idx) => (
            <span key={idx}>
              {line}
              <br />
            </span>
          ))}
        </p>
      )}

      {samples.length > 0 && (
        <div className="session-interview__task-section">
          <h3>Примеры</h3>
          {samples.map((ex, idx) => (
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

      <div className="demo-interview__task-nav">
        <Button
          variant="secondary"
          onClick={onPrev}
          disabled={isFirst || disabled}
        >
          Предыдущая задача
        </Button>
        <Button
          variant="secondary"
          onClick={onNext}
          disabled={isLast || disabled}
        >
          Следующая задача
        </Button>
      </div>
    </div>
  );
}

function CodeEditorPane({
  code,
  onChangeCode,
  onSubmitSolution,
  isSubmitting,
  isLastTask,
  disabled,
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
            variant="primary"
            onClick={onSubmitSolution}
            disabled={isSubmitting || disabled}
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
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function TextAnswerPane({
  answer,
  onChangeAnswer,
  onSubmitSolution,
  isSubmitting,
  isLastTask,
  disabled,
}) {
  return (
    <div className="session-interview__pane session-interview__pane--editor">
      <div className="session-interview__editor-header">
        <div className="session-interview__editor-meta">
          <span className="session-interview__file-name">
            Текстовый ответ
          </span>
          <span className="session-interview__language-badge">
            Описание
          </span>
        </div>
        <div className="session-interview__editor-actions">
          <Button
            variant="primary"
            onClick={onSubmitSolution}
            disabled={isSubmitting || disabled || !answer.trim()}
          >
            {isSubmitting
              ? "Отправка..."
              : isLastTask
              ? "Отправить ответ"
              : "Отправить и перейти дальше"}
          </Button>
        </div>
      </div>

      <div className="session-interview__editor-body">
        <textarea
          className="session-interview__textarea"
          value={answer}
          onChange={(e) => onChangeAnswer(e.target.value)}
          spellCheck={false}
          placeholder="Опишите ваш подход и решение..."
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export default SessionInterviewPage;