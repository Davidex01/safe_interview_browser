import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";

const DEMO_DURATION_SECONDS = 30 * 60; // 30 минут

// 3 кодовые + 2 теоретические задачи
const DEMO_TASKS = [
  {
    id: "demo1",
    type: "code",
    level: "easy",
    title: "Найти дубликаты в массиве",
    statement:
      "Напишите функцию, которая по массиву целых чисел возвращает все элементы, встречающиеся более одного раза.",
    samples: [
      { input: "[1, 2, 3, 2, 4, 1]", output: "[1, 2]" },
      { input: "[5, 5, 5]", output: "[5]" },
    ],
  },
  {
    id: "demo2",
    type: "code",
    level: "medium",
    title: "Развернуть строку",
    statement:
      "Напишите функцию, которая разворачивает строку задом наперёд без использования встроенных методов reverse.",
    samples: [{ input: '"hello"', output: '"olleh"' }],
  },
  {
    id: "demo3",
    type: "code",
    level: "medium",
    title: "Найти сумму от 1 до n",
    statement:
      "Напишите функцию, которая по целому числу n возвращает сумму чисел от 1 до n включительно.",
    samples: [
      { input: "3", output: "6" },
      { input: "10", output: "55" },
    ],
  },
  {
    id: "demo4",
    type: "text",
    level: "easy",
    title: "Профильная задача: дизайн API",
    statement:
      "Представьте, что вы проектируете внутреннее API для сервиса отправки уведомлений (email + push). Кратко опишите:\n1) Какие конечные точки (эндпоинты) вы бы сделали.\n2) Какие основные поля были бы в запросе.\n3) Как бы вы заложили масштабирование (очереди, ретраи, логирование ошибок).",
  },
  {
    id: "demo5",
    type: "text",
    level: "hard",
    title: "Профильная задача: обработка нагрузки",
    statement:
      "У вас есть сервис, который принимает большое количество запросов в пиковое время (например, распродажа). Кратко опишите, какие подходы вы бы использовали, чтобы:\n1) Система не падала под нагрузкой.\n2) Пользователь всё равно получал предсказуемый опыт.\n3) Команда могла проанализировать инциденты постфактум.",
  },
];

function DemoInterviewPage() {
  const navigate = useNavigate();

  const [remainingSeconds, setRemainingSeconds] =
    useState(DEMO_DURATION_SECONDS);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [codeAnswers, setCodeAnswers] = useState(
    new Array(DEMO_TASKS.length).fill("")
  );
  const [textAnswers, setTextAnswers] = useState(
    new Array(DEMO_TASKS.length).fill("")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTask = DEMO_TASKS[currentTaskIndex];
  const isFirstTask = currentTaskIndex === 0;
  const isLastTask = currentTaskIndex === DEMO_TASKS.length - 1;
  const isTextTask = currentTask.type === "text";

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

  const formatTime = (totalSeconds) => {
    const safe = Math.max(0, totalSeconds);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

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

  const handleSubmitSolution = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (!isLastTask) {
        goToNextTask();
      } else {
        navigate("/demo/report", { replace: true });
      }
    }, 600);
  };

  const currentCode = !isTextTask
    ? codeAnswers[currentTaskIndex] || "# Ваш код здесь\n"
    : "";
  const currentText = isTextTask
    ? textAnswers[currentTaskIndex] || ""
    : "";

  return (
    <section className="demo-interview">
      <div className="demo-interview__inner">
        <AssistantCard
          message={
            isFirstTask
              ? "ПРИВЕТ! ЭТО ДЕМО-ИНТЕРВЬЮ. ЗДЕСЬ МОЖНО ПОПРОБОВАТЬ РЕШИТЬ НЕСКОЛЬКО ЗАДАЧ И УВИДЕТЬ, КАК ВЫГЛЯДИТ ИНТЕРФЕЙС."
              : "ПЕРЕЙДЁМ К СЛЕДУЮЩЕЙ ДЕМО-ЗАДАЧЕ."
          }
        />

        <SessionTopBar
          currentIndex={currentTaskIndex}
          total={DEMO_TASKS.length}
          title={currentTask.title}
          remainingTime={formatTime(remainingSeconds)}
          isTimeOver={remainingSeconds <= 0}
        />

        <div className="session-interview__body session-interview__body--split">
          {/* Левая колонка: условие + навигация */}
          <div className="session-interview__left">
            <TaskStatement
              task={currentTask}
              onPrev={goToPrevTask}
              onNext={goToNextTask}
              isFirst={isFirstTask}
              isLast={isLastTask}
              isDemo
            />
          </div>

          {/* Правая колонка: редактор кода или текстовый ответ */}
          <div className="session-interview__right">
            {isTextTask ? (
              <TextAnswerPane
                answer={currentText}
                onChangeAnswer={handleTextChange}
                onSubmitSolution={handleSubmitSolution}
                isSubmitting={isSubmitting}
                isLastTask={isLastTask}
              />
            ) : (
              <CodeEditorPane
                code={currentCode}
                onChangeCode={handleCodeChange}
                onSubmitSolution={handleSubmitSolution}
                isSubmitting={isSubmitting}
                isLastTask={isLastTask}
              />
            )}
          </div>
        </div>

        <div className="demo-interview__footer">
          <p className="demo-interview__footer-text">
            Закончили демо-интервью? Можно вернуться на главную страницу и
            продолжить работу с платформой.
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate("/")}
          >
            Вернуться на главную
          </Button>
        </div>
      </div>
    </section>
  );
}

function AssistantCard({ message }) {
  return (
    <div className="session-interview__assistant-card">
      <div className="session-interview__assistant-icon">📱</div>
      <div>
        <div className="session-interview__assistant-message">
          {message}
        </div>
        <div className="session-interview__assistant-label">Ассистент</div>
      </div>
    </div>
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
        <span className="session-interview__task-label">Демо‑задача</span>
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

function TaskStatement({ task, onPrev, onNext, isFirst, isLast, isDemo }) {
  const levelLabel = task.level ? `(${task.level})` : "";
  const description = task.statement || task.question || "";
  const samples = task.samples || [];

  return (
    <div className="session-interview__pane session-interview__pane--statement">
      <h2>{task.title} {levelLabel}</h2>

      {isDemo && (
        <p className="session-interview__limits">
          Это демо‑режим: решения и результаты не сохраняются, интерфейс
          повторяет реальное интервью.
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
    </div>
  );
}

function CodeEditorPane({
  code,
  onChangeCode,
  onSubmitSolution,
  isSubmitting,
  isLastTask,
}) {
  return (
    <div className="session-interview__pane session-interview__pane--editor">
      <div className="session-interview__editor-header">
        <div className="session-interview__editor-meta">
          <span className="session-interview__file-name">demo.py</span>
          <span className="session-interview__language-badge">Python</span>
        </div>
        <div className="session-interview__editor-actions">
          <Button
            variant="primary"
            onClick={onSubmitSolution}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Отправка..."
              : isLastTask
              ? "Отправить и завершить демо"
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

function TextAnswerPane({
  answer,
  onChangeAnswer,
  onSubmitSolution,
  isSubmitting,
  isLastTask,
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
            disabled={isSubmitting || !answer.trim()}
          >
            {isSubmitting
              ? "Отправка..."
              : isLastTask
              ? "Отправить и завершить демо"
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
        />
      </div>
    </div>
  );
}

export default DemoInterviewPage;