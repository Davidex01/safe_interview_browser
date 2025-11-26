import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";

const DEMO_TASKS = [
  {
    id: "demo1",
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
    timeLimit: "1 секунда",
    memoryLimit: "256 МБ",
  },
  {
    id: "demo2",
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
    timeLimit: "1 секунда",
    memoryLimit: "256 МБ",
  },
  {
    id: "demo3",
    title: "Продуктовая задача",
    description:
      "Опишите, как бы вы спроектировали систему рекомендаций для новостной ленты, учитывая ограничения по времени ответа и нагрузке.",
    constraints: [],
    examples: [],
    timeLimit: "",
    memoryLimit: "",
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

  const [code, setCode] = useState("# Ваш код здесь \n");
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
    setIsRunningVisibleTests(true);
    setTimeout(() => setIsRunningVisibleTests(false), 800);
  };

  const goToNextTask = () => {
    if (!isLastTask) {
      setCurrentTaskIndex((prev) => prev + 1);
      // при желании можно сбрасывать код для новой задачи:
      // setCode("// Ваш код здесь");
    }
  };

  const goToPrevTask = () => {
    if (!isFirstTask) {
      setCurrentTaskIndex((prev) => prev - 1);
      // setCode("// Ваш код здесь");
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
          <DemoTestsPane />
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

      {/* НОВЫЙ БЛОК: кнопка просмотра итогового окна */}
      <div className="demo-interview__footer">
        <p className="demo-interview__footer-text">
          Готовы увидеть, каким будет финальный отчёт после интервью? Откройте демо‑версию итогового окна.
        </p>
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate("/demo/report")}
        >
        Открыть демо-отчёт
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

function TaskStatement({ task, isDemo = false, onPrev, onNext, isFirst, isLast }) {
  return (
    <div className="session-interview__pane session-interview__pane--statement">
      <h2>{task.title}</h2>
      <p className="session-interview__task-text">{task.description}</p>

      {isDemo && (
        <p className="session-interview__limits">
          Это демо-режим: решения и результаты не сохраняются, интерфейс
          повторяет реальное интервью.
        </p>
      )}

      {task.constraints && task.constraints.length > 0 && (
        <div className="session-interview__task-section">
          <h3>Ограничения</h3>
          <ul>
            {task.constraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {task.examples && task.examples.length > 0 && (
        <div className="session-interview__task-section">
          <h3>Примеры</h3>
          {task.examples.map((ex, idx) => (
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

      {/* Навигация по задачам */}
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
          <span className="session-interview__file-name">demo.py</span>
          <span className="session-interview__language-badge">
            Python
          </span>
        </div>
        <div className="session-interview__editor-actions">
          <Button
            variant="secondary"
            onClick={onRunVisibleTests}
            disabled={isRunningVisibleTests || isSubmitting}
          >
            {isRunningVisibleTests
              ? "Запуск тестов..."
              : "Запустить демо-тесты"}
          </Button>
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

function DemoTestsPane() {
  return (
    <div className="session-interview__pane session-interview__pane--tests">
      <h2>Демо-тесты</h2>
      <p className="session-interview__task-text">
        В демо-режиме тесты носят иллюстративный характер. В реальном интервью
        здесь отображаются результаты видимых примеров и агрегированная
        информация по скрытым тестам.
      </p>
    </div>
  );
}

export default DemoInterviewPage;