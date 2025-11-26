import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Container from "../../components/ui/Container.jsx";
import Button from "../../components/ui/Button.jsx";

function SessionReportPage() {
  const { token } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  // TODO: заменить на реальный запрос к бэку
  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setIsLoading(true);
      setError("");

      try {
        // пример реального запроса:
        // const res = await fetch(`/api/session/${token}/report`);
        // const data = await res.json();

        // пока моки:
        const mock = {
          status: "completed", // completed | time_over | aborted
          score: 78,
          verdict: "Хороший уровень для middle-позиции, требуется подтянуть оптимизацию.",
          metrics: {
            correctness: 85,
            optimality: 70,
            codeStyle: 75,
            honesty: 100,
          },
          tasks: [
            {
              id: "t1",
              title: "Найти дубликаты в массиве",
              status: "solved", // solved | partial | unsolved
              timeSpentSeconds: 900,
              attempts: 3,
              runs: 5,
              comment:
                "Задача решена корректно, с хорошей временной сложностью O(n).",
            },
            {
              id: "t2",
              title: "Подсчёт уникальных пользователей по логам",
              status: "partial",
              timeSpentSeconds: 1200,
              attempts: 2,
              runs: 4,
              comment:
                "Идея верная, но не все граничные случаи учтены. Часть тестов не пройдена.",
            },
          ],
          aiFeedback: {
            strengths: [
              "Чётко формулируете подход перед тем, как писать код.",
              "Хорошее понимание структур данных (множества, словари).",
            ],
            improvements: [
              "Более внимательно относиться к граничным случаям (пустые входы, большие данные).",
              "Чуть больше внимания к читаемости кода: названия переменных и разбиение на функции.",
            ],
          },
        };

        if (!cancelled) {
          setReport(mock);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Не удалось загрузить отчёт. Попробуйте обновить страницу.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (isLoading) {
    return (
      <section className="session-report">
        <Container className="session-report__inner">
          <p>Загружаем отчёт об интервью...</p>
        </Container>
      </section>
    );
  }

  if (error || !report) {
    return (
      <section className="session-report">
        <Container className="session-report__inner">
          <h1>Отчёт недоступен</h1>
          <p className="session-report__error">{error || "Не удалось получить данные отчёта."}</p>
        </Container>
      </section>
    );
  }

  const { status, score, verdict, metrics, tasks, aiFeedback } = report;

  const statusLabel =
    status === "completed"
      ? "Интервью завершено"
      : status === "time_over"
      ? "Время интервью истекло"
      : "Сессия прервана";

  return (
    <section className="session-report">
      <Container className="session-report__inner">
        {/* Общий итог */}
        <header className="session-report__header">
          <h1>Итог интервью</h1>
          <p className="session-report__status">{statusLabel}</p>
          <div className="session-report__score-block">
            <div className="session-report__score-circle">
              <span className="session-report__score-value">
                {score}
              </span>
              <span className="session-report__score-label">из 100</span>
            </div>
            <p className="session-report__verdict">{verdict}</p>
          </div>
        </header>

        {/* Метрики */}
        <section className="session-report__section">
          <h2>Ключевые метрики</h2>
          <div className="session-report__metrics-grid">
            <MetricCard label="Правильность" value={metrics.correctness} />
            <MetricCard label="Оптимальность" value={metrics.optimality} />
            <MetricCard label="Стиль кода" value={metrics.codeStyle} />
            <MetricCard label="Честность" value={metrics.honesty} />
          </div>
        </section>

        {/* Задачи */}
        <section className="session-report__section">
          <h2>Задачи в интервью</h2>
          <div className="session-report__tasks-list">
            {tasks.map((task) => (
              <TaskSummaryCard key={task.id} task={task} />
            ))}
          </div>
        </section>

        {/* Отзыв ИИ */}
        {aiFeedback && (
          <section className="session-report__section">
            <h2>Комментарий ИИ-интервьюера</h2>
            <div className="session-report__feedback-grid">
              <div className="session-report__feedback-block">
                <h3>Сильные стороны</h3>
                <ul>
                  {aiFeedback.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="session-report__feedback-block">
                <h3>Зоны роста</h3>
                <ul>
                  {aiFeedback.improvements.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        <footer className="session-report__footer">
          <Button
            as="a"
            href="/"
            variant="secondary"
          >
            На главную
          </Button>
        </footer>
      </Container>
    </section>
  );
}

function MetricCard({ label, value }) {
  const normalized = Math.max(0, Math.min(100, value ?? 0));

  return (
    <div className="session-report__metric-card">
      <div className="session-report__metric-header">
        <span className="session-report__metric-label">{label}</span>
        <span className="session-report__metric-value">{normalized}</span>
      </div>
      <div className="session-report__metric-bar">
        <div
          className="session-report__metric-bar-fill"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}

function TaskSummaryCard({ task }) {
  const timeMinutes = Math.round((task.timeSpentSeconds || 0) / 60);

  const statusLabel =
    task.status === "solved"
      ? "Решена"
      : task.status === "partial"
      ? "Частично решена"
      : "Не решена";

  const statusClass =
    task.status === "solved"
      ? "session-report__task-status--solved"
      : task.status === "partial"
      ? "session-report__task-status--partial"
      : "session-report__task-status--unsolved";

  return (
    <article className="session-report__task-card">
      <header className="session-report__task-header">
        <h3>{task.title}</h3>
        <span className={`session-report__task-status ${statusClass}`}>
          {statusLabel}
        </span>
      </header>
      <dl className="session-report__task-stats">
        <div>
          <dt>Время на задачу</dt>
          <dd>{timeMinutes} мин</dd>
        </div>
        <div>
          <dt>Попыток отправки</dt>
          <dd>{task.attempts}</dd>
        </div>
        <div>
          <dt>Запусков тестов</dt>
          <dd>{task.runs}</dd>
        </div>
      </dl>
      {task.comment && (
        <p className="session-report__task-comment">{task.comment}</p>
      )}
    </article>
  );
}

export default SessionReportPage;