import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Container from "../../components/ui/Container.jsx";
import Button from "../../components/ui/Button.jsx";

function SessionReportPage() {
  const { token } = useParams();
  const location = useLocation();

  // результат, который мы передаём из SessionInterviewPage через navigate(..., { state })
  const submitResultFromState = location.state?.submitResult || null;

  const [report, setReport] = useState(submitResultFromState);
  const [error, setError] = useState("");

  useEffect(() => {
    // Пока у нас нет отдельного эндпоинта для получения отчёта,
    // используем только то, что пришло через state.
    if (submitResultFromState) return;

    // Здесь позже можно будет добавить загрузку отчёта с бэка:
    // fetch(`/api/interview/${token}/result`) и т.п.
    setError(
      "Результаты интервью недоступны. Попробуйте завершить интервью и перейти сюда ещё раз."
    );
  }, [submitResultFromState, token]);

  if (!report) {
    return (
      <section className="session-report">
        <Container className="session-report__inner">
          <h1>Отчёт недоступен</h1>
          <p className="session-report__error">{error}</p>
          <div className="session-report__footer">
            <Button as="a" href="/" variant="secondary">
              На главную
            </Button>
          </div>
        </Container>
      </section>
    );
  }

  const coding = report.coding || { tasks: [], passed_percent: 0 };
  const theory = report.theory || { tasks: [], passed_percent: 0 };

  return (
    <section className="session-report">
      <Container className="session-report__inner">
        <header className="session-report__header">
          <h1>Результаты интервью</h1>
          <p className="session-report__status">
            Токен сессии: <code>{report.token || token}</code>
          </p>
        </header>

        {/* Итоговые проценты в виде простых метрик */}
        <section className="session-report__section">
          <h2>Сводные показатели</h2>
          <div className="session-report__metrics-grid">
            <MetricCard
              label="Алгоритмические задачи"
              value={coding.passed_percent}
            />
            <MetricCard
              label="Теоретические вопросы"
              value={theory.passed_percent}
            />
          </div>
        </section>

        {/* Алгоритмические задачи */}
        <section className="session-report__section">
          <h2>Алгоритмические задачи</h2>
          <p className="session-report__verdict">
            Пройдено тестов: {coding.passed_percent}%
          </p>

          {coding.tasks.length === 0 ? (
            <p className="session-report__error">
              Для алгоритмических задач не найдено результатов проверки.
            </p>
          ) : (
            <div className="session-report__tasks-list">
              {coding.tasks.map((t, idx) => (
                <article key={idx} className="session-report__task-card">
                  <header className="session-report__task-header">
                    <h3>Уровень: {t.level || "—"}</h3>
                    <span
                      className={
                        "session-report__task-status " +
                        (t.solved
                          ? "session-report__task-status--solved"
                          : "session-report__task-status--unsolved")
                      }
                    >
                      {t.solved ? "Задача решена" : "Задача не решена"}
                    </span>
                  </header>
                  {!t.solved && t.failed_test && (
                    <p className="session-report__task-comment">
                      Ошибка на тесте №{t.failed_test}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Теоретические вопросы */}
        <section className="session-report__section">
          <h2>Теоретические вопросы</h2>
          <p className="session-report__verdict">
            Зачтено ответов: {theory.passed_percent}%
          </p>

          {theory.tasks.length === 0 ? (
            <p className="session-report__error">
              Для теоретических вопросов не найдено результатов проверки.
            </p>
          ) : (
            <div className="session-report__tasks-list">
              {theory.tasks.map((t, idx) => (
                <article key={idx} className="session-report__task-card">
                  <header className="session-report__task-header">
                    <h3>Уровень: {t.level || "—"}</h3>
                    <span
                      className={
                        "session-report__task-status " +
                        (!t.answered
                          ? "session-report__task-status--unsolved"
                          : t.passed
                          ? "session-report__task-status--solved"
                          : "session-report__task-status--unsolved")
                      }
                    >
                      {!t.answered
                        ? "Ответ отсутствует"
                        : t.passed
                        ? "Ответ засчитан"
                        : "Ответ не засчитан"}
                  </span>
                  </header>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="session-report__footer">
          <Button as="a" href="/" variant="secondary">
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
        <span className="session-report__metric-value">{normalized}%</span>
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

export default SessionReportPage;