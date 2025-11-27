// src/pages/Demo/DemoInterviewPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";

const DEMO_TASKS = [
  {
    id: "demo1",
    type: "code",
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
    ],
  },
  {
    id: "demo2",
    type: "code",
    title: "Развернуть строку",
    description:
      "Напишите функцию, которая разворачивает строку задом наперёд без использования встроенных методов reverse.",
    constraints: ["1 ≤ длина строки ≤ 10^5"],
    examples: [
      {
        input: '"hello"',
        output: '"olleh"',
      },
    ],
  },
  {
    id: "demo3",
    type: "code",
    title: "Найти сумму от 1 до n",
    description:
      "Напишите функцию, которая по целому числу n возвращает сумму чисел от 1 до n включительно.",
    constraints: ["0 ≤ n ≤ 10^7"],
    examples: [
      {
        input: "3",
        output: "6",
      },
      {
        input: "10",
        output: "55",
      },
    ],
  },
  {
    id: "demo4",
    type: "text",
    title: "Профильная задача: дизайн API",
    description:
      "Представьте, что вы проектируете внутреннее API для сервиса отправки уведомлений (email + push). К API обращаются разные внутренние сервисы. Кратко опишите:\n1) Какие конечные точки (эндпоинты) вы бы сделали.\n2) Какие основные поля были бы в запросе.\n3) Как бы вы заложили масштабирование (очереди, ретраи, логирование ошибок).",
  },
  {
    id: "demo5",
    type: "text",
    title: "Профильная задача: обработка нагрузки",
    description:
      "У вас есть сервис, который принимает большое количество запросов в пиковое время (например, распродажа). Кратко опишите, какие подходы вы бы использовали, чтобы:\n1) Система не падала под нагрузкой.\n2) Пользователь всё равно получал предсказуемый опыт.\n3) Команда могла проанализировать инциденты постфактум.",
  },
];

const DEMO_DURATION_SECONDS = 30 * 60; // 30 минут

function DemoInterviewPage() {
  const navigate = useNavigate();

  const [remainingSeconds, setRemainingSeconds] =
    useState(DEMO_DURATION_SECONDS);
  const [hasRedirected, setHasRedirected] = useState(false);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const currentTask = DEMO_TASKS[currentTaskIndex];

  // Код и текстовый ответ храним отдельно
  const [code, setCode] = useState("# Ваш код здесь\n");
  const [textAnswer, setTextAnswer] = useState("");

  const [isRunningVisibleTests, setIsRunningVisibleTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Таймер
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

  // Переход на отчёт по истечении времени
  useEffect(() => {
    if (remainingSeconds <= 0 && !hasRedirected) {
      setHasRedirected(true);
      navigate("/demo/report", { replace: true });
    }
  }, [remainingSeconds, hasRedirected, navigate]);

  const isFirstTask = currentTaskIndex === 0;
  const isLastTask = currentTaskIndex === DEMO_TASKS.length - 1;

  const handleRunVisibleTests = () => {
    if (currentTask.type !== "code") return;
    setIsRunningVisibleTests(true);
    setTimeout(() => setIsRunningVisibleTests(false), 800);
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
      if (isLastTask) {
        if (!hasRedirected) {
          setHasRedirected(true);
          navigate("/demo/report");
        }
      } else {
        goToNextTask();
      }
    }, 1000);
  };

  const formatTime = (totalSeconds) => {
    const safe = Math.max(0, totalSeconds);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <section className="demo-interview">
      <div className="demo-interview__inner">
        <DemoTopBar
          currentIndex={currentTaskIndex}
          total={DEMO_TASKS.length}
          title={currentTask.title}
          remainingTime={formatTime(remainingSeconds)}
          isTimeOver={remainingSeconds <= 0}
        />

        <div className="session-interview__body session-interview__body--split">
          {/* Левая колонка: условие + демо-тесты + навигация по задачам */}
          <div className="session-interview__left">
            <TaskStatement
              task={currentTask}
              isDemo
              onPrev={goToPrevTask}
              onNext={goToNextTask}
              isFirst={isFirstTask}
              isLast={isLastTask}
            />
          </div>

          {/* Правая колонка: редактор кода или текстовый ответ */}
          <div className="session-interview__right">
            {currentTask.type === "code" ? (
              <CodeEditorPane
                code={code}
                onChangeCode={setCode}
                onSubmitSolution={handleSubmitSolution}
                isSubmitting={isSubmitting}
                isLastTask={isLastTask}
              />
            ) : (
              <TextAnswerPane
                answer={textAnswer}
                onChangeAnswer={setTextAnswer}
                onSubmitSolution={handleSubmitSolution}
                isSubmitting={isSubmitting}
                isLastTask={isLastTask}
              />
            )}
          </div>
        </div>

        <div className="demo-interview__footer">
          <p className="demo-interview__footer-text">
            Закончили знакомство с демо‑интервью? Можно вернуться на главную
            страницу и продолжить работу с платформой.
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

function DemoTopBar({ currentIndex, total, title, remainingTime, isTimeOver }) {
  return (
    <div className="session-interview__topbar">
      <div className="session-interview__topbar-left">
        <span className="session-interview__task-label">Демо-задача</span>
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

function TaskStatement({
  task,
  isDemo = false,
  onPrev,
  onNext,
  isFirst,
  isLast,
}) {
  const constraints = task.constraints || [];
  const examples = task.examples || [];

  return (
    <div className="session-interview__pane session-interview__pane--statement">
      <h2>{task.title}</h2>
      {task.description && (
        <p className="session-interview__task-text">
          {task.description.split("\n").map((line, idx) => (
            <span key={idx}>
              {line}
              <br />
            </span>
          ))}
        </p>
      )}

      {isDemo && (
        <p className="session-interview__limits">
          Это демо-режим: решения и результаты не сохраняются, интерфейс
          повторяет реальное интервью.
        </p>
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
              {ex.explanation && (
                <p className="session-interview__example-note">
                  {ex.explanation}
                </p>
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
          <span className="session-interview__language-badge">
            Python
          </span>
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
              : "Отправить и перейти к следующей"}
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
              ? "Завершить демо"
              : "Отправить и перейти к следующей"}
          </Button>
        </div>
      </div>

      <div className="session-interview__editor-body">
        <textarea
          className="session-interview__textarea"
          value={answer}
          onChange={(e) => onChangeAnswer(e.target.value)}
          spellCheck={false}
          placeholder="Кратко опишите ваш подход..."
        />
      </div>
    </div>
  );
}


export default DemoInterviewPage;